import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

type BlockLayoutPayload = {
  cemeterySlug?: string;
  blockVisualMode?: "strips" | "rows" | "headstones";
  blocks?: Array<Record<string, unknown>>;
};

const defaultCemeterySlug = "sligo-town-cemetery";

function isValidBlockPayload(payload: BlockLayoutPayload) {
  return (
    Array.isArray(payload.blocks) &&
    payload.blocks.length > 0 &&
    payload.blocks.every(
      (block) =>
        typeof block.id === "string" &&
        typeof block.name === "string" &&
        Number.isFinite(block.x) &&
        Number.isFinite(block.y) &&
        Number.isFinite(block.width) &&
        Number.isFinite(block.height) &&
        Number.isFinite(block.rotate) &&
        typeof block.calibration === "object" &&
        block.calibration !== null &&
        Number.isFinite((block.calibration as { width?: unknown }).width) &&
        Number.isFinite((block.calibration as { height?: unknown }).height) &&
        Number.isFinite((block.calibration as { rotate?: unknown }).rotate) &&
        Number.isFinite(block.physicalStrips) &&
        Number.isFinite(block.logicalRows)
    )
  );
}

function canWrite(request: NextRequest) {
  const configuredToken = process.env.GRAVEGUIDE_ADMIN_TOKEN;

  if (!configuredToken) {
    return false;
  }

  return request.headers.get("x-graveguide-admin-token") === configuredToken;
}

export async function GET(request: NextRequest) {
  const cemeterySlug = request.nextUrl.searchParams.get("cemetery") ?? defaultCemeterySlug;

  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("cemetery_block_layouts")
      .select("blocks, updated_at")
      .eq("cemetery_slug", cemeterySlug)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ blocks: null, source: "fallback", error: error.message }, { status: 200 });
    }

    return NextResponse.json({ blocks: data?.blocks ?? null, updatedAt: data?.updated_at ?? null, source: "supabase" });
  } catch (error) {
    return NextResponse.json(
      { blocks: null, source: "fallback", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!canWrite(request)) {
    return NextResponse.json(
      { error: "Admin save is not enabled. Add GRAVEGUIDE_ADMIN_TOKEN in Vercel and send the same token from Admin." },
      { status: 403 }
    );
  }

  const payload = (await request.json()) as BlockLayoutPayload;

  if (!isValidBlockPayload(payload)) {
    return NextResponse.json({ error: "Invalid block layout payload." }, { status: 400 });
  }

  const cemeterySlug = payload.cemeterySlug ?? defaultCemeterySlug;
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from("cemetery_block_layouts").upsert({
    cemetery_slug: cemeterySlug,
    blocks: payload.blocks,
    updated_at: new Date().toISOString()
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
