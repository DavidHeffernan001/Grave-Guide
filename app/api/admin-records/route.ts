import { NextResponse, type NextRequest } from "next/server";
import { normalizeBlocks, occupiedPlotNumbers, validatePlotRange, type PlotAssignment } from "@/lib/cemetery-layout";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

type AddRecordPayload = {
  cemeterySlug?: string;
  givenNames?: string;
  familyName?: string;
  dateOfBirth?: string;
  dateOfDeath?: string;
  plotReference?: string;
  blockCode?: string;
  stripNumber?: number;
  rowNumber?: number;
  startingPlotNumber?: number;
  plotSpan?: number;
  biography?: string;
  inscription?: string;
};

const defaultCemeterySlug = "sligo-town-cemetery";

function canWrite(request: NextRequest) {
  const configuredToken = process.env.GRAVEGUIDE_ADMIN_TOKEN;

  if (!configuredToken) {
    return false;
  }

  return request.headers.get("x-graveguide-admin-token") === configuredToken;
}

function clean(value?: string) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

export async function POST(request: NextRequest) {
  if (!canWrite(request)) {
    return NextResponse.json(
      { error: "Admin record save is not enabled. Use the same GRAVEGUIDE_ADMIN_TOKEN as the Admin layout save." },
      { status: 403 }
    );
  }

  const payload = (await request.json()) as AddRecordPayload;
  const givenNames = clean(payload.givenNames);
  const familyName = clean(payload.familyName);
  const plotReference = clean(payload.plotReference)?.toUpperCase();
  const blockCode = clean(payload.blockCode)?.toUpperCase() ?? plotReference?.split("-")[0] ?? null;
  const stripNumber = Number(payload.stripNumber) || 1;
  const rowNumber = Number(payload.rowNumber) || 1;
  const startingPlotNumber = Number(payload.startingPlotNumber) || Number(plotReference?.split("-")[2]) || 1;
  const plotSpan = Number(payload.plotSpan) || 1;

  if (!givenNames || !familyName || !plotReference || !blockCode || !stripNumber || !rowNumber || !startingPlotNumber) {
    return NextResponse.json(
      { error: "Name, family name, plot reference, block, strip, row, and starting plot are required." },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServiceClient();
  const cemeterySlug = payload.cemeterySlug ?? defaultCemeterySlug;

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
  const blocks = normalizeBlocks(layout?.blocks ?? null);
  const selectedBlock = blocks.find((block) => block.id.toUpperCase() === blockCode);
  const selectedStrip = selectedBlock?.strips.find((strip) => strip.stripNumber === stripNumber);
  const selectedRow = selectedStrip?.rows.find((row) => row.rowNumber === rowNumber);
  const maximumPlotCount = selectedRow?.maximumPlotCount ?? 32;

  const { data: existingAssignments, error: assignmentsError } = await supabase
    .from("grave_plot_assignments")
    .select("id, block_code, strip_number, row_number, starting_plot_number, plot_span")
    .eq("cemetery_slug", cemeterySlug)
    .eq("block_code", blockCode)
    .eq("strip_number", stripNumber)
    .eq("row_number", rowNumber);

  if (assignmentsError) {
    return NextResponse.json({ error: assignmentsError.message }, { status: 500 });
  }

  const assignments: PlotAssignment[] = ((existingAssignments ?? []) as Array<{
    id: string;
    block_code: string;
    strip_number: number;
    row_number: number;
    starting_plot_number: number;
    plot_span: number;
  }>).map((assignment) => ({
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

  const { data: block, error: blockError } = await supabase
    .from("cemetery_blocks")
    .upsert(
      {
        cemetery_id: cemetery.id,
        code: blockCode,
        name: `Block ${blockCode}`
      },
      { onConflict: "cemetery_id,code" }
    )
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
        row_label: plotReference.split("-")[1] ?? null,
        plot_number: plotReference.split("-")[2] ?? null,
        status: "published"
      },
      { onConflict: "cemetery_id,plot_reference" }
    )
    .select("id")
    .single();

  if (plotError || !plot) {
    return NextResponse.json({ error: plotError?.message ?? "Plot could not be saved." }, { status: 500 });
  }

  const { data: person, error: personError } = await supabase
    .from("people")
    .insert({
      given_names: givenNames,
      family_name: familyName,
      date_of_birth: clean(payload.dateOfBirth),
      date_of_death: clean(payload.dateOfDeath),
      biography: clean(payload.biography) ?? "Added from the GraveGuide admin workspace.",
      status: "published"
    })
    .select("id")
    .single();

  if (personError || !person) {
    return NextResponse.json({ error: personError?.message ?? "Person could not be saved." }, { status: 500 });
  }

  const { data: burial, error: burialError } = await supabase
    .from("burials")
    .insert({
      person_id: person.id,
      plot_id: plot.id,
      burial_date: clean(payload.dateOfDeath),
      inscription: clean(payload.inscription),
      source_notes: "Added from the GraveGuide admin workspace.",
      status: "published"
    })
    .select("id")
    .single();

  if (burialError) {
    return NextResponse.json({ error: burialError.message }, { status: 500 });
  }

  const newAssignment: PlotAssignment = {
    blockCode,
    stripNumber,
    rowNumber,
    startingPlotNumber,
    plotSpan
  };

  const { error: assignmentError } = await supabase.from("grave_plot_assignments").insert({
    cemetery_slug: cemeterySlug,
    burial_id: burial?.id ?? null,
    person_id: person.id,
    plot_id: plot.id,
    block_code: blockCode,
    strip_number: stripNumber,
    row_number: rowNumber,
    starting_plot_number: startingPlotNumber,
    plot_span: plotSpan,
    occupied_plot_numbers: occupiedPlotNumbers(newAssignment)
  });

  if (assignmentError) {
    return NextResponse.json({ error: assignmentError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, personId: person.id, plotId: plot.id, plotReference });
}
