import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

type CemeteryRow = {
  slug: string;
  name: string;
  town: string | null;
  county: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
};

type BlockLayoutRow = {
  cemetery_slug: string;
  blocks: unknown;
};

type EntranceLayoutRow = {
  cemetery_slug: string;
  entrances: unknown;
};

function cemeteryFromRow(row: CemeteryRow) {
  return {
    id: row.slug,
    slug: row.slug,
    name: row.name,
    town: row.town ?? "",
    county: row.county ?? "",
    country: row.country ?? "Ireland",
    managingOrganisation: {
      id: "sligo-county-council",
      name: "Sligo County Council",
      type: "council"
    },
    map:
      row.latitude && row.longitude
        ? {
            provider: "openstreetmap",
            layer: "humanitarian",
            bbox: [row.longitude - 0.0027, row.latitude - 0.0012, row.longitude + 0.0027, row.latitude + 0.0012],
            centre: {
              longitude: row.longitude,
              latitude: row.latitude
            }
          }
        : null
  };
}

export async function GET() {
  try {
    const supabase = createSupabaseServiceClient();
    const [cemeteriesResult, blockLayoutsResult, entranceLayoutsResult] = await Promise.all([
      supabase
        .from("cemeteries")
        .select("slug, name, town, county, country, latitude, longitude")
        .eq("status", "published")
        .order("name"),
      supabase.from("cemetery_block_layouts").select("cemetery_slug, blocks"),
      supabase.from("cemetery_entrance_layouts").select("cemetery_slug, entrances")
    ]);

    if (cemeteriesResult.error) throw cemeteriesResult.error;
    if (blockLayoutsResult.error) throw blockLayoutsResult.error;
    if (entranceLayoutsResult.error) throw entranceLayoutsResult.error;

    const cemeteries = ((cemeteriesResult.data ?? []) as CemeteryRow[]).map(cemeteryFromRow);
    const blocks = ((blockLayoutsResult.data ?? []) as BlockLayoutRow[]).flatMap((row) =>
      Array.isArray(row.blocks) ? row.blocks : []
    );
    const entrances = ((entranceLayoutsResult.data ?? []) as EntranceLayoutRow[]).flatMap((row) =>
      Array.isArray(row.entrances) ? row.entrances : []
    );

    return NextResponse.json({
      source: "supabase",
      cemeteriesConfig: {
        activeCemeteryId: cemeteries[0]?.id ?? "sligo-town-cemetery",
        cemeteries
      },
      blocks,
      entrances
    });
  } catch (error) {
    return NextResponse.json(
      {
        source: "fallback",
        error: error instanceof Error ? error.message : "Supabase remake data unavailable"
      },
      { status: 200 }
    );
  }
}
