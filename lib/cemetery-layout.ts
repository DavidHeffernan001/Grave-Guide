import { prototypeBlocks, prototypeEntrances, type PrototypeBlock, type PrototypeEntrance } from "@/lib/prototype-data";

export type BlockType = "rectangle" | "polygon";

export type CemeteryRow = {
  id: string;
  rowNumber: number;
  maximumPlotCount: number;
};

export type CemeteryStrip = {
  id: string;
  stripNumber: number;
  rows: CemeteryRow[];
};

export type PolygonPoint = {
  x: number;
  y: number;
};

type CemeteryBlockBase = Pick<PrototypeBlock, "id" | "name" | "x" | "y" | "width" | "height" | "rotate"> &
  Partial<Omit<PrototypeBlock, "id" | "name" | "x" | "y" | "width" | "height" | "rotate">>;

export type CemeteryBlock = CemeteryBlockBase & {
  type: BlockType;
  polygonPoints: PolygonPoint[];
  strips: CemeteryStrip[];
};

export type CemeteryEntrance = PrototypeEntrance & {
  qrCode: string;
  linkedBlockId?: string | null;
};

export type PlotAssignment = {
  id?: string;
  blockCode: string;
  stripNumber: number;
  rowNumber: number;
  startingPlotNumber: number;
  plotSpan: number;
};

export function createDefaultRows(count: number, maximumPlotCount = 32): CemeteryRow[] {
  return Array.from({ length: Math.max(1, Math.min(20, count)) }, (_, index) => ({
    id: `row-${index + 1}`,
    rowNumber: index + 1,
    maximumPlotCount
  }));
}

export function createDefaultStrips(count = 1, rowsPerStrip = 2): CemeteryStrip[] {
  return Array.from({ length: Math.max(1, Math.min(20, count)) }, (_, index) => ({
    id: `strip-${index + 1}`,
    stripNumber: index + 1,
    rows: createDefaultRows(rowsPerStrip)
  }));
}

export function rectangleToPolygonPoints(block: CemeteryBlockBase): PolygonPoint[] {
  return [
    { x: block.x - 25, y: block.y + 5 },
    { x: block.x - 25 + block.width, y: block.y + 5 },
    { x: block.x - 25 + block.width, y: block.y + 5 + block.height },
    { x: block.x - 25, y: block.y + 5 + block.height }
  ];
}

export function normalizeBlock(block: Partial<CemeteryBlock> & CemeteryBlockBase): CemeteryBlock {
  const type = block.type ?? "rectangle";

  return {
    ...block,
    type,
    polygonPoints:
      Array.isArray(block.polygonPoints) && block.polygonPoints.length >= 3
        ? block.polygonPoints.map((point) => ({ x: Number(point.x), y: Number(point.y) }))
        : rectangleToPolygonPoints(block),
    strips:
      Array.isArray(block.strips) && block.strips.length > 0
        ? block.strips.map((strip, stripIndex) => ({
            id: strip.id ?? `strip-${stripIndex + 1}`,
            stripNumber: Number(strip.stripNumber) || stripIndex + 1,
            rows:
              Array.isArray(strip.rows) && strip.rows.length > 0
                ? strip.rows.map((row, rowIndex) => ({
                    id: row.id ?? `row-${rowIndex + 1}`,
                    rowNumber: Number(row.rowNumber) || rowIndex + 1,
                    maximumPlotCount: Number(row.maximumPlotCount) || 32
                  }))
                : createDefaultRows(2)
          }))
        : createDefaultStrips(1, 2)
  };
}

export function normalizeBlocks(blocks?: Array<Partial<CemeteryBlock> & CemeteryBlockBase> | null): CemeteryBlock[] {
  const source = Array.isArray(blocks) && blocks.length > 0 ? blocks : prototypeBlocks;

  return source.map(normalizeBlock);
}

export function normalizeEntrances(entrances?: Partial<CemeteryEntrance>[] | null): CemeteryEntrance[] {
  const source: Partial<CemeteryEntrance>[] =
    Array.isArray(entrances) && entrances.length > 0 ? entrances : prototypeEntrances;

  return source.map((entrance, index) => ({
    id: entrance.id ?? `entrance-${index + 1}`,
    name: entrance.name ?? `Entrance ${index + 1}`,
    x: Number(entrance.x) || 50,
    y: Number(entrance.y) || 50,
    qrCode: entrance.qrCode ?? `graveguide-entrance-${index + 1}`,
    linkedBlockId: entrance.linkedBlockId ?? null
  }));
}

export function occupiedPlotNumbers(assignment: PlotAssignment) {
  return Array.from({ length: assignment.plotSpan }, (_, index) => assignment.startingPlotNumber + index);
}

export function nextAvailablePlot(assignments: PlotAssignment[], maximumPlotCount: number, plotSpan = 1) {
  const occupied = new Set(assignments.flatMap(occupiedPlotNumbers));

  for (let plot = 1; plot <= maximumPlotCount; plot += 1) {
    const range = Array.from({ length: plotSpan }, (_, index) => plot + index);
    const rangeFits = range[range.length - 1] <= maximumPlotCount;
    const rangeClear = range.every((plotNumber) => !occupied.has(plotNumber));

    if (rangeFits && rangeClear) {
      return plot;
    }
  }

  return null;
}

export function validatePlotRange(assignments: PlotAssignment[], maximumPlotCount: number, startingPlotNumber: number, plotSpan: number) {
  if (startingPlotNumber < 1 || plotSpan < 1) {
    return "Starting plot and plot span must be at least 1.";
  }

  const lastPlot = startingPlotNumber + plotSpan - 1;

  if (lastPlot > maximumPlotCount) {
    return `This grave would use plots ${startingPlotNumber}-${lastPlot}, but this row only has ${maximumPlotCount} plots.`;
  }

  const occupied = new Set(assignments.flatMap(occupiedPlotNumbers));
  const overlap = Array.from({ length: plotSpan }, (_, index) => startingPlotNumber + index).find((plotNumber) =>
    occupied.has(plotNumber)
  );

  if (overlap) {
    return `Plot ${overlap} is already occupied.`;
  }

  return null;
}
