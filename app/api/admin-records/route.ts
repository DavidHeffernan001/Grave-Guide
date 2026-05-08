import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

type AddRecordPayload = {
  cemeterySlug?: string;
  givenNames?: string;
  familyName?: string;
  dateOfBirth?: string;
  dateOfDeath?: string;
  plotReference?: string;
  blockCode?: string;
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

  if (!givenNames || !familyName || !plotReference || !blockCode) {
    return NextResponse.json({ error: "Name, family name, plot reference, and block are required." }, { status: 400 });
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

  const { error: burialError } = await supabase.from("burials").insert({
    person_id: person.id,
    plot_id: plot.id,
    burial_date: clean(payload.dateOfDeath),
    inscription: clean(payload.inscription),
    source_notes: "Added from the GraveGuide admin workspace.",
    status: "published"
  });

  if (burialError) {
    return NextResponse.json({ error: burialError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, personId: person.id, plotId: plot.id, plotReference });
}
