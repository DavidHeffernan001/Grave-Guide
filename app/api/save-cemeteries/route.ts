import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

type RemakeCemetery = {
  id?: string;
  slug?: string;
  name?: string;
  town?: string;
  county?: string;
  country?: string;
  map?: {
    centre?: {
      latitude?: number;
      longitude?: number;
    };
  };
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

  const data = (await request.json()) as { activeCemeteryId?: string; cemeteries?: RemakeCemetery[] };

  if (!data || !Array.isArray(data.cemeteries)) {
    return NextResponse.json({ ok: false, error: "Expected cemeteries data" }, { status: 400 });
  }

  try {
    const supabase = createSupabaseServiceClient();
    const rows = data.cemeteries
      .filter((cemetery) => cemetery.name && (cemetery.slug || cemetery.id))
      .map((cemetery) => ({
        slug: cemetery.slug || cemetery.id,
        name: cemetery.name,
        town: cemetery.town || null,
        county: cemetery.county || null,
        country: cemetery.country || "Ireland",
        latitude: cemetery.map?.centre?.latitude ?? null,
        longitude: cemetery.map?.centre?.longitude ?? null,
        status: "published"
      }));

    const { error } = await supabase.from("cemeteries").upsert(rows, { onConflict: "slug" });

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
