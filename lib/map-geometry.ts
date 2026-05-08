export type MapCalibration = {
  centerLatitude: number;
  centerLongitude: number;
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
  rotationDegrees: number;
  overlayWidthMeters: number;
  overlayHeightMeters: number;
};

export const defaultMapCalibration: MapCalibration = {
  centerLatitude: 54.2766,
  centerLongitude: -8.4761,
  defaultZoom: 19,
  minZoom: 17,
  maxZoom: 22,
  rotationDegrees: 0,
  overlayWidthMeters: 150,
  overlayHeightMeters: 120
};

export type CalibrationApiRow = {
  center_latitude: number | string;
  center_longitude: number | string;
  default_zoom: number | string;
  min_zoom: number | string;
  max_zoom: number | string;
  rotation_degrees: number | string;
  overlay_width_meters?: number | string | null;
  overlay_height_meters?: number | string | null;
};

export function normalizeCalibration(row?: CalibrationApiRow | null): MapCalibration {
  if (!row) {
    return defaultMapCalibration;
  }

  return {
    centerLatitude: Number(row.center_latitude) || defaultMapCalibration.centerLatitude,
    centerLongitude: Number(row.center_longitude) || defaultMapCalibration.centerLongitude,
    defaultZoom: Number(row.default_zoom) || defaultMapCalibration.defaultZoom,
    minZoom: Number(row.min_zoom) || defaultMapCalibration.minZoom,
    maxZoom: Number(row.max_zoom) || defaultMapCalibration.maxZoom,
    rotationDegrees: Number(row.rotation_degrees) || defaultMapCalibration.rotationDegrees,
    overlayWidthMeters: Number(row.overlay_width_meters) || defaultMapCalibration.overlayWidthMeters,
    overlayHeightMeters: Number(row.overlay_height_meters) || defaultMapCalibration.overlayHeightMeters
  };
}

export function rotatePercentPoint(x: number, y: number, centerX: number, centerY: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const translatedX = x - centerX;
  const translatedY = y - centerY;

  return {
    x: centerX + translatedX * cos - translatedY * sin,
    y: centerY + translatedX * sin + translatedY * cos
  };
}

export function percentToLatLng(x: number, y: number, calibration: MapCalibration): [number, number] {
  const metersPerDegreeLatitude = 111_320;
  const metersPerDegreeLongitude = metersPerDegreeLatitude * Math.cos((calibration.centerLatitude * Math.PI) / 180);
  const xMeters = ((x - 50) / 100) * calibration.overlayWidthMeters;
  const yMeters = ((50 - y) / 100) * calibration.overlayHeightMeters;
  const radians = (calibration.rotationDegrees * Math.PI) / 180;
  const rotatedX = xMeters * Math.cos(radians) - yMeters * Math.sin(radians);
  const rotatedY = xMeters * Math.sin(radians) + yMeters * Math.cos(radians);

  return [
    calibration.centerLatitude + rotatedY / metersPerDegreeLatitude,
    calibration.centerLongitude + rotatedX / metersPerDegreeLongitude
  ];
}

export function blockPolygonToLatLngs(
  block: { x: number; y: number; width: number; height: number; rotate: number },
  calibration: MapCalibration,
  offsetX: number
) {
  const left = block.x - offsetX;
  const top = block.y + 5;
  const centerX = left + block.width / 2;
  const centerY = top + block.height / 2;
  const corners = [
    rotatePercentPoint(left, top, centerX, centerY, block.rotate),
    rotatePercentPoint(left + block.width, top, centerX, centerY, block.rotate),
    rotatePercentPoint(left + block.width, top + block.height, centerX, centerY, block.rotate),
    rotatePercentPoint(left, top + block.height, centerX, centerY, block.rotate)
  ];

  return corners.map((point) => percentToLatLng(point.x, point.y, calibration));
}

export const cemeteryPathPercentLines = [
  [
    { x: -15, y: 65 },
    { x: 45, y: 52 },
    { x: 115, y: 38 }
  ],
  [
    { x: 28, y: 12 },
    { x: 82, y: 44 },
    { x: 118, y: 68 }
  ]
];

export const routePercentLine = [
  { x: 42, y: 40 },
  { x: 52, y: 49 },
  { x: 63, y: 60 }
];
