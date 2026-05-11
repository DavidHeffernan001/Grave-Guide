import { NextResponse, type NextRequest } from "next/server";
import { normalizeBlocks, occupiedPlotNumbers, validatePlotRange, type PlotAssignment } from "@/lib/cemetery-layout";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

type ResidentPatchPayload = {
  personId?: string;
  burialId?: string | null;
  givenNames?: string;
  familyName?: string;
  dateOfBirth?: string | null;
  dateOfDeath?: string | null;
  biography?: string | null;
  inscription?: string | null;
  cemeterySlug?: string;
  blockCode?: string;
  stripNumber?: number;
  rowNumber?: number;
  startingPlotNumber?: number;
  plotSpan?: number;
};

const defaultCemeterySlug = "sligo-town-cemetery";

function canWrite(request: NextRequest) {
  const configuredToken = process.env.GRAVEGUIDE_ADMIN_TOKEN;

  if (!configuredToken) {
    return false;
  }

  return request.headers.get("x-graveguide-admin-token") === configuredToken;
}

function clean(value?: string | null) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim();

  if (query.length < 2) {
    return NextResponse.json({ residents: [] });
  }

  const normalizedQuery = query.toLowerCase();
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("people")
    .select(
      `
        id,
        display_name,
        given_names,
        family_name,
        date_of_birth,
        date_of_death,
        biography,
        burials(
          id,
          inscription,
          grave_plots(plot_reference)
        )
      `
    )
    .limit(200);

  if (error) {
    return NextResponse.json({ residents: [], error: error.message }, { status: 200 });
  }

  const filteredResidents = (data ?? []).filter((resident) =>
    [
      resident.display_name,
      resident.given_names,
      resident.family_name,
      resident.date_of_birth,
      resident.date_of_death,
      resident.biography,
      ...(resident.burials ?? []).map((burial) => {
        const plot = Array.isArray(burial.grave_plots) ? burial.grave_plots[0] : burial.grave_plots;

        return plot?.plot_reference;
      })
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery)
  );
  const burialIds = filteredResidents
    .flatMap((resident) => (resident.burials ?? []).map((burial) => burial.id))
    .filter(Boolean);
  const { data: assignments } =
    burialIds.length > 0
      ? await supabase
          .from("grave_plot_assignments")
          .select("id, burial_id, block_code, strip_number, row_number, starting_plot_number, plot_span")
          .in("burial_id", burialIds)
      : { data: [] };
  const assignmentByBurialId = new Map(
    ((assignments ?? []) as Array<{
      id: string;
      burial_id: string;
      block_code: string;
      strip_number: number;
      row_number: number;
      starting_plot_number: number;
      plot_span: number;
    }>).map((assignment) => [
      assignment.burial_id,
      {
        id: assignment.id,
        blockCode: assignment.block_code,
        stripNumber: assignment.strip_number,
        rowNumber: assignment.row_number,
        startingPlotNumber: assignment.starting_plot_number,
        plotSpan: assignment.plot_span
      }
    ])
  );
  const residents = filteredResidents.map((resident) => ({
    ...resident,
    burials: (resident.burials ?? []).map((burial) => ({
      ...burial,
      plotAssignment: assignmentByBurialId.get(burial.id) ?? null
    }))
  }));

  return NextResponse.json({ residents: residents.slice(0, 20) });
}

export async function PATCH(request: NextRequest) {
  if (!canWrite(request)) {
    return NextResponse.json({ error: "Admin token required." }, { status: 403 });
  }

  const payload = (await request.json()) as ResidentPatchPayload;

  if (!payload.personId) {
    return NextResponse.json({ error: "Person id is required." }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  const { error: personError } = await supabase
    .from("people")
    .update({
      given_names: clean(payload.givenNames),
      family_name: clean(payload.familyName),
      date_of_birth: clean(payload.dateOfBirth),
      date_of_death: clean(payload.dateOfDeath),
      biography: clean(payload.biography)
    })
    .eq("id", payload.personId);

  if (personError) {
    return NextResponse.json({ error: personError.message }, { status: 500 });
  }

  if (payload.burialId) {
    const burialUpdate: Record<string, string | null> = {
      burial_date: clean(payload.dateOfDeath),
      inscription: clean(payload.inscription)
    };

    if (payload.blockCode && payload.stripNumber && payload.rowNumber && payload.startingPlotNumber && payload.plotSpan) {
      const cemeterySlug = payload.cemeterySlug ?? defaultCemeterySlug;
      const blockCode = clean(payload.blockCode)?.toUpperCase();
      const stripNumber = Number(payload.stripNumber);
      const rowNumber = Number(payload.rowNumber);
      const startingPlotNumber = Number(payload.startingPlotNumber);
      const plotSpan = Number(payload.plotSpan);

      if (!blockCode) {
        return NextResponse.json({ error: "Block is required." }, { status: 400 });
      }

      const { data: cemetery, error: cemeteryError } = await supabase
        .from("cemeteries")
        .select("id")
        .eq("slug", cemeterySlug)
        .maybeSingle();

      if (cemeteryError || !cemetery) {
        return NextResponse.json({ error: cemeteryError?.message ?? "Cemetery not found." }, { status: 404 });
      }

      const { data: layout } = await supabase
        .from("cemetery_block_layouts")
        .select("blocks")
        .eq("cemetery_slug", cemeterySlug)
        .maybeSingle();
      const selectedBlock = normalizeBlocks(layout?.blocks ?? null).find((block) => block.id.toUpperCase() === blockCode);
      const selectedStrip = selectedBlock?.strips.find((strip) => strip.stripNumber === stripNumber);
      const selectedRow = selectedStrip?.rows.find((row) => row.rowNumber === rowNumber);
      const maximumPlotCount = selectedRow?.maximumPlotCount ?? 32;
      const { data: existingAssignments, error: assignmentsError } = await supabase
        .from("grave_plot_assignments")
        .select("id, burial_id, block_code, strip_number, row_number, starting_plot_number, plot_span")
        .eq("cemetery_slug", cemeterySlug)
        .eq("block_code", blockCode)
        .eq("strip_number", stripNumber)
        .eq("row_number", rowNumber);

      if (assignmentsError) {
        return NextResponse.json({ error: assignmentsError.message }, { status: 500 });
      }

      const assignments: PlotAssignment[] = ((existingAssignments ?? []) as Array<{
        id: string;
        burial_id: string | null;
        block_code: string;
        strip_number: number;
        row_number: number;
        starting_plot_number: number;
        plot_span: number;
      }>)
        .filter((assignment) => assignment.burial_id !== payload.burialId)
        .map((assignment) => ({
          id: assignment.id,
          blockCode: assignment.block_code,
          stripNumber: assignment.strip_number,
          rowNumber: assignment.row_number,
          startingPlotNumber: assignment.starting_plot_number,
          plotSpan: assignment.plot_span
        }));
      const validationError = validatePlotRange(assignments, maximumPlotCount, startingPlotNumber, plotSpan);

      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 409 });
      }

      const plotReference = `${blockCode}-${String(stripNumber).padStart(2, "0")}-${String(startingPlotNumber).padStart(3, "0")}`;
      const { data: block, error: blockError } = await supabase
        .from("cemetery_blocks")
        .upsert({ cemetery_id: cemetery.id, code: blockCode, name: `Block ${blockCode}` }, { onConflict: "cemetery_id,code" })
        .select("id")
        .single();

      if (blockError || !block) {
        return NextResponse.json({ error: blockError?.message ?? "Block could not be saved." }, { status: 500 });
      }

      const { data: plot, error: plotError } = await supabase
        .from("grave_plots")
        .upsert(
          {
            cemetery_id: cemetery.id,
            block_id: block.id,
            plot_reference: plotReference,
            row_label: String(stripNumber).padStart(2, "0"),
            plot_number: String(startingPlotNumber).padStart(3, "0"),
            status: "published"
          },
          { onConflict: "cemetery_id,plot_reference" }
        )
        .select("id")
        .single();

      if (plotError || !plot) {
        return NextResponse.json({ error: plotError?.message ?? "Plot could not be saved." }, { status: 500 });
      }

      burialUpdate.plot_id = plot.id;
      const newAssignment = { blockCode, stripNumber, rowNumber, startingPlotNumber, plotSpan };
      const { error: assignmentError } = await supabase.from("grave_plot_assignments").upsert(
        {
          cemetery_slug: cemeterySlug,
          burial_id: payload.burialId,
          person_id: payload.personId,
          plot_id: plot.id,
          block_code: blockCode,
          strip_number: stripNumber,
          row_number: rowNumber,
          starting_plot_number: startingPlotNumber,
          plot_span: plotSpan,
          occupied_plot_numbers: occupiedPlotNumbers(newAssignment)
        },
        { onConflict: "burial_id" }
      );

      if (assignmentError) {
        return NextResponse.json({ error: assignmentError.message }, { status: 500 });
      }
    }

    const { error: burialError } = await supabase.from("burials").update(burialUpdate).eq("id", payload.burialId);

    if (burialError) {
      return NextResponse.json({ error: burialError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
