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
  const knownBounds: Record<string, { bbox: number[]; centre: { longitude: number; latitude: number } }> = {
    "sligo-town-cemetery": {
      bbox: [-8.4666, 54.2587, -8.4598, 54.2604],
      centre: { longitude: -8.4647, latitude: 54.25955 }
    },
    "strandhill-rd-cemetery": {
      bbox: [-8.555937, 54.272407, -8.550537, 54.274807],
      centre: { longitude: -8.553237, latitude: 54.273607 }
    }
  };
  const knownMap = knownBounds[row.slug];

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
    map: {
      provider: "openstreetmap",
      layer: "humanitarian",
      bbox:
        knownMap?.bbox ??
        (row.latitude && row.longitude
          ? [row.longitude - 0.0027, row.latitude - 0.0012, row.longitude + 0.0027, row.latitude + 0.0012]
          : [-8.4666, 54.2587, -8.4598, 54.2604]),
      centre:
        knownMap?.centre ??
        (row.latitude && row.longitude
          ? {
              longitude: row.longitude,
              latitude: row.latitude
            }
          : {
              longitude: -8.4647,
              latitude: 54.25955
            })
    }
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
    const cemeteryIds = new Set(cemeteries.map((cemetery) => cemetery.id));

    if (!cemeteryIds.has("strandhill-rd-cemetery")) {
      cemeteries.push(
        cemeteryFromRow({
          slug: "strandhill-rd-cemetery",
          name: "Strandhill Rd Cemetery",
          town: "",
          county: "",
          country: "Ireland",
          latitude: 54.273607,
          longitude: -8.553237
        })
      );
    }

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
