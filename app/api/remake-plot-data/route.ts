import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

type PrototypeDataRow = {
  cemetery_slug: string;
  plots: unknown;
  burials: unknown;
};

export async function GET(request: NextRequest) {
  const cemeterySlug = request.nextUrl.searchParams.get("cemetery") || "sligo-town-cemetery";

  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("cemetery_prototype_data")
      .select("cemetery_slug, plots, burials")
      .eq("cemetery_slug", cemeterySlug)
      .maybeSingle();

    if (error) throw error;

    const row = data as PrototypeDataRow | null;
    return NextResponse.json({
      source: row ? "supabase" : "empty",
      cemetery: { id: cemeterySlug },
      plots: Array.isArray(row?.plots) ? row.plots : [],
      burials: Array.isArray(row?.burials) ? row.burials : []
    });
  } catch (error) {
    return NextResponse.json(
      {
        source: "fallback",
        error: error instanceof Error ? error.message : "Supabase plot data unavailable"
      },
      { status: 200 }
    );
  }
}
