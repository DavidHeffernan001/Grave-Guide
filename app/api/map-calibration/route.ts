import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

const defaultCemeterySlug = "sligo-town-cemetery";

export async function GET(request: NextRequest) {
  const cemeterySlug = request.nextUrl.searchParams.get("cemetery") ?? defaultCemeterySlug;

  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("cemetery_map_calibrations")
      .select(
        "cemetery_slug, center_latitude, center_longitude, default_zoom, min_zoom, max_zoom, rotation_degrees, calibration_notes, updated_at"
      )
      .eq("cemetery_slug", cemeterySlug)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ calibration: null, source: "fallback", error: error.message }, { status: 200 });
    }

    return NextResponse.json({ calibration: data ?? null, source: data ? "supabase" : "fallback" });
  } catch (error) {
    return NextResponse.json(
      { calibration: null, source: "fallback", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 200 }
    );
  }
}
