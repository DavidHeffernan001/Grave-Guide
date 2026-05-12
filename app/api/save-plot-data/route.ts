import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

type RemakePlotData = {
  cemetery?: {
    id?: string;
  };
  plots?: unknown[];
  burials?: unknown[];
};

export async function POST(request: Request) {
  const data = (await request.json()) as RemakePlotData;

  if (!data || !Array.isArray(data.plots) || !Array.isArray(data.burials)) {
    return NextResponse.json({ ok: false, error: "Expected plots and burials arrays" }, { status: 400 });
  }

  try {
    const supabase = createSupabaseServiceClient();
    const cemetery_slug = data.cemetery?.id || "sligo-town-cemetery";
    const { error } = await supabase.from("cemetery_prototype_data").upsert(
      {
        cemetery_slug,
        plots: data.plots,
        burials: data.burials,
        updated_at: new Date().toISOString()
      },
      { onConflict: "cemetery_slug" }
    );

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
