import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

type RemakeEntrance = {
  cemeteryId?: string;
};

function canWrite(request: NextRequest) {
  const configuredToken = process.env.GRAVEGUIDE_ADMIN_TOKEN;

  if (!configuredToken) {
    return false;
  }

  return request.headers.get("x-graveguide-admin-token") === configuredToken;
}

export async function POST(request: NextRequest) {
  if (!canWrite(request)) {
    return NextResponse.json({ ok: false, error: "Admin save key required." }, { status: 403 });
  }

  const entrances = (await request.json()) as RemakeEntrance[];

  if (!Array.isArray(entrances)) {
    return NextResponse.json({ ok: false, error: "Expected an array of entrances" }, { status: 400 });
  }

  try {
    const supabase = createSupabaseServiceClient();
    const grouped = new Map<string, RemakeEntrance[]>();

    entrances.forEach((entrance) => {
      const cemeterySlug = entrance.cemeteryId || "sligo-town-cemetery";
      grouped.set(cemeterySlug, [...(grouped.get(cemeterySlug) || []), entrance]);
    });

    const rows = [...grouped.entries()].map(([cemetery_slug, cemeteryEntrances]) => ({
      cemetery_slug,
      entrances: cemeteryEntrances,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase.from("cemetery_entrance_layouts").upsert(rows, { onConflict: "cemetery_slug" });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, source: "supabase" });
  } catch (error) {
    return NextResponse.json({
      ok: true,
      source: "browser-fallback",
      warning: error instanceof Error ? error.message : "Supabase save unavailable"
    });
  }
}
