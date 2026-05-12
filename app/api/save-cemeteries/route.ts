import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const data = (await request.json()) as { cemeteries?: unknown };

  if (!data || !Array.isArray(data.cemeteries)) {
    return NextResponse.json({ ok: false, error: "Expected cemeteries data" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    source: "prototype",
    note: "Accepted by the Vercel prototype endpoint. Persistent Supabase save will be wired in the next pass."
  });
}
