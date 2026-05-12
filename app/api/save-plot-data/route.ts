import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const data = (await request.json()) as { plots?: unknown; burials?: unknown };

  if (!data || !Array.isArray(data.plots) || !Array.isArray(data.burials)) {
    return NextResponse.json({ ok: false, error: "Expected plots and burials arrays" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    source: "prototype",
    note: "Accepted by the Vercel prototype endpoint. Persistent Supabase save will be wired in the next pass."
  });
}
