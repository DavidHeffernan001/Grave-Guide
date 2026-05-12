import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const entrances = (await request.json()) as unknown;

  if (!Array.isArray(entrances)) {
    return NextResponse.json({ ok: false, error: "Expected an array of entrances" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    source: "prototype",
    note: "Accepted by the Vercel prototype endpoint. Persistent Supabase save will be wired in the next pass."
  });
}
