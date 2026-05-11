import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

const defaultCemeterySlug = "sligo-town-cemetery";

type CalibrationPayload = {
  cemeterySlug?: string;
  centerLatitude?: number;
  centerLongitude?: number;
  defaultZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  rotationDegrees?: number;
  overlayWidthMeters?: number;
  overlayHeightMeters?: number;
  calibrationNotes?: string;
};

function canWrite(request: NextRequest) {
  const configuredToken = process.env.GRAVEGUIDE_ADMIN_TOKEN;

  if (!configuredToken) {
    return false;
  }

  return request.headers.get("x-graveguide-admin-token") === configuredToken;
}

function isNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value);
}

function isMissingCalibrationColumn(error: { message?: string; code?: string } | null) {
  if (!error?.message) {
    return false;
  }

  return (
    error.code === "PGRST204" ||
    error.message.includes("schema cache") ||
    error.message.includes("overlay_width_meters") ||
    error.message.includes("overlay_height_meters")
  );
}

export async function GET(request: NextRequest) {
  const cemeterySlug = request.nextUrl.searchParams.get("cemetery") ?? defaultCemeterySlug;

  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("cemetery_map_calibrations")
      .select(
        "cemetery_slug, center_latitude, center_longitude, default_zoom, min_zoom, max_zoom, rotation_degrees, overlay_width_meters, overlay_height_meters, calibration_notes, updated_at"
      )
      .eq("cemetery_slug", cemeterySlug)
      .maybeSingle();

    if (error) {
      if (isMissingCalibrationColumn(error)) {
        const fallback = await supabase
          .from("cemetery_map_calibrations")
          .select("cemetery_slug, center_latitude, center_longitude, default_zoom, min_zoom, max_zoom, rotation_degrees, calibration_notes, updated_at")
          .eq("cemetery_slug", cemeterySlug)
          .maybeSingle();

        return NextResponse.json({
          calibration: fallback.data ?? null,
          source: fallback.data ? "supabase" : "fallback",
          needsMigration: true,
          error: fallback.error?.message ?? error.message
        });
      }

      return NextResponse.json({ calibration: null, source: "fallback", error: error.message }, { status: 200 });
    }

    return NextResponse.json({ calibration: data ?? null, source: data ? "supabase" : "fallback" });
  } catch (error) {
    return NextResponse.json(
      { calibration: null, source: "fallback", error: error instanceof Error ? error.message : "Unknown error" },
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

  const payload = (await request.json()) as CalibrationPayload;

  if (
    !isNumber(payload.centerLatitude) ||
    !isNumber(payload.centerLongitude) ||
    !isNumber(payload.defaultZoom) ||
    !isNumber(payload.minZoom) ||
    !isNumber(payload.maxZoom) ||
    !isNumber(payload.rotationDegrees) ||
    !isNumber(payload.overlayWidthMeters) ||
    !isNumber(payload.overlayHeightMeters)
  ) {
    return NextResponse.json({ error: "Invalid map calibration payload." }, { status: 400 });
  }

  const cemeterySlug = payload.cemeterySlug ?? defaultCemeterySlug;
  const supabase = createSupabaseServiceClient();
  const fullCalibrationRow = {
    cemetery_slug: cemeterySlug,
    center_latitude: payload.centerLatitude,
    center_longitude: payload.centerLongitude,
    default_zoom: payload.defaultZoom,
    min_zoom: payload.minZoom,
    max_zoom: payload.maxZoom,
    rotation_degrees: payload.rotationDegrees,
    overlay_width_meters: payload.overlayWidthMeters,
    overlay_height_meters: payload.overlayHeightMeters,
    calibration_notes: payload.calibrationNotes ?? null,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from("cemetery_map_calibrations").upsert(fullCalibrationRow);

  if (error) {
    if (isMissingCalibrationColumn(error)) {
      const { overlay_width_meters, overlay_height_meters, ...basicCalibrationRow } = fullCalibrationRow;
      const fallback = await supabase.from("cemetery_map_calibrations").upsert(basicCalibrationRow);

      if (!fallback.error) {
        return NextResponse.json({ ok: true, needsMigration: true });
      }
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
