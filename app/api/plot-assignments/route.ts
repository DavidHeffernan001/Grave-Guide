import { NextResponse, type NextRequest } from "next/server";
import { type PlotAssignment } from "@/lib/cemetery-layout";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

const defaultCemeterySlug = "sligo-town-cemetery";

type AssignmentRow = {
  id: string;
  block_code: string;
  strip_number: number;
  row_number: number;
  starting_plot_number: number;
  plot_span: number;
};

export async function GET(request: NextRequest) {
  const cemeterySlug = request.nextUrl.searchParams.get("cemetery") ?? defaultCemeterySlug;
  const blockCode = request.nextUrl.searchParams.get("block");
  const stripNumber = Number(request.nextUrl.searchParams.get("strip"));
  const rowNumber = Number(request.nextUrl.searchParams.get("row"));

  try {
    const supabase = createSupabaseServiceClient();
    let query = supabase
      .from("grave_plot_assignments")
      .select("id, block_code, strip_number, row_number, starting_plot_number, plot_span")
      .eq("cemetery_slug", cemeterySlug);

    if (blockCode) query = query.eq("block_code", blockCode);
    if (Number.isFinite(stripNumber) && stripNumber > 0) query = query.eq("strip_number", stripNumber);
    if (Number.isFinite(rowNumber) && rowNumber > 0) query = query.eq("row_number", rowNumber);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ assignments: [], source: "fallback", error: error.message }, { status: 200 });
    }

    const assignments: PlotAssignment[] = ((data ?? []) as AssignmentRow[]).map((assignment) => ({
      id: assignment.id,
      blockCode: assignment.block_code,
      stripNumber: assignment.strip_number,
      rowNumber: assignment.row_number,
      startingPlotNumber: assignment.starting_plot_number,
      plotSpan: assignment.plot_span
    }));

    return NextResponse.json({ assignments, source: "supabase" });
  } catch (error) {
    return NextResponse.json(
      { assignments: [], source: "fallback", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 200 }
    );
  }
}
