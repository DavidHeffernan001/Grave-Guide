import { NextResponse, type NextRequest } from "next/server";
import { normalizeEntrances, type CemeteryEntrance } from "@/lib/cemetery-layout";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

type EntrancesPayload = {
  cemeterySlug?: string;
  entrances?: CemeteryEntrance[];
};

const defaultCemeterySlug = "sligo-town-cemetery";

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
      .from("cemetery_entrance_layouts")
      .select("entrances, updated_at")
      .eq("cemetery_slug", cemeterySlug)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ entrances: normalizeEntrances(null), source: "fallback", error: error.message }, { status: 200 });
    }

    return NextResponse.json({
      entrances: normalizeEntrances(data?.entrances ?? null),
      updatedAt: data?.updated_at ?? null,
      source: data ? "supabase" : "fallback"
    });
  } catch (error) {
    return NextResponse.json(
      {
        entrances: normalizeEntrances(null),
        source: "fallback",
        error: error instanceof Error ? error.message : "Unknown error"
      },
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

  const payload = (await request.json()) as EntrancesPayload;
  const entrances = normalizeEntrances(payload.entrances ?? null);

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from("cemetery_entrance_layouts").upsert({
    cemetery_slug: payload.cemeterySlug ?? defaultCemeterySlug,
    entrances,
    updated_at: new Date().toISOString()
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, entrances });
}
