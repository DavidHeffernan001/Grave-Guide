export type PrototypeBlockCalibration = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: number;
  cutout: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  polygon?: Array<{ x: number; y: number }>;
};

export type PrototypeBlockRowRule = {
  rows: [number, number];
  plotsPerRow: number;
};

export type PrototypeBlock = {
  id: string;
  cemeteryId: string;
  name: string;
  shape?: "rectangle" | "polygon";
  physicalStrips: number;
  rowsPerStrip: number;
  stripRowCounts: Record<string, number>;
  blockTemplate: string;
  logicalRows: number;
  rowPlotCounts: Record<string, number>;
  rowRules: PrototypeBlockRowRule[];
  calibration: PrototypeBlockCalibration;
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: number;
};

export type PrototypeEntrance = {
  id: string;
  name: string;
  x: number;
  y: number;
};

export type PrototypeRecord = {
  id: string;
  fullName: string;
  dates: string;
  plotId: string;
  blockId: string;
  x: number;
  y: number;
};

function rangeRecord(count: number, value: number) {
  return Object.fromEntries(Array.from({ length: count }, (_, index) => [String(index + 1), value]));
}

function blockAPlotCounts() {
  return Object.fromEntries(Array.from({ length: 18 }, (_, index) => [String(index + 1), index < 2 ? 26 : 32]));
}

function withMapGeometry(
  block: Omit<PrototypeBlock, "x" | "y" | "width" | "height" | "rotate">,
  geometry: Pick<PrototypeBlock, "width" | "height">
): PrototypeBlock {
  return {
    ...block,
    x: block.calibration.x,
    y: block.calibration.y,
    width: geometry.width,
    height: geometry.height,
    rotate: block.calibration.rotate
  };
}

export const prototypeBlocks: PrototypeBlock[] = [
  withMapGeometry(
    {
      id: "A",
      cemeteryId: "sligo-town-cemetery",
      name: "Block A",
      physicalStrips: 9,
      rowsPerStrip: 2,
      stripRowCounts: rangeRecord(9, 2),
      blockTemplate: "standard-2",
      logicalRows: 18,
      rowPlotCounts: blockAPlotCounts(),
      rowRules: [
        { rows: [1, 2], plotsPerRow: 26 },
        { rows: [3, 18], plotsPerRow: 32 }
      ],
      calibration: {
        x: 75.8,
        y: 22.2,
        width: 97,
        height: 121,
        rotate: 39,
        cutout: { x: -2, y: -1, width: 10, height: 15 }
      }
    },
    { width: 22, height: 30 }
  ),
  withMapGeometry(
    {
      id: "B",
      cemeteryId: "sligo-town-cemetery",
      name: "Block B",
      physicalStrips: 10,
      rowsPerStrip: 2,
      stripRowCounts: rangeRecord(10, 2),
      blockTemplate: "standard-2",
      logicalRows: 20,
      rowPlotCounts: rangeRecord(20, 18),
      rowRules: [{ rows: [1, 20], plotsPerRow: 18 }],
      calibration: {
        x: 91.1,
        y: 31.7,
        width: 109,
        height: 60,
        rotate: 39,
        cutout: { x: 0, y: 0, width: 0, height: 0 }
      }
    },
    { width: 24, height: 15 }
  ),
  withMapGeometry(
    {
      id: "C",
      cemeteryId: "sligo-town-cemetery",
      name: "Block C",
      physicalStrips: 1,
      rowsPerStrip: 2,
      stripRowCounts: { "1": 2 },
      blockTemplate: "standard-2",
      logicalRows: 2,
      rowPlotCounts: { "1": 32, "2": 32 },
      rowRules: [{ rows: [1, 2], plotsPerRow: 32 }],
      calibration: {
        x: 100.3,
        y: 26.4,
        width: 111,
        height: 63,
        rotate: 39,
        cutout: { x: 0, y: 0, width: 0, height: 0 }
      }
    },
    { width: 24, height: 16 }
  )
];

export function getDefaultRowPlotCounts(rowCount: number, blockId: string) {
  return Object.fromEntries(
    Array.from({ length: rowCount }, (_, index) => {
      const row = index + 1;
      return [String(row), blockId === "A" && row <= 2 ? 26 : 32];
    })
  );
}

export function normalizeStripRowCounts(block: Partial<PrototypeBlock>) {
  const physicalStrips = Math.min(40, Math.max(1, Number(block.physicalStrips) || 1));
  const rowsPerStrip = Math.min(5, Math.max(1, Number(block.rowsPerStrip) || 2));
  const existing = block.stripRowCounts ?? {};

  return Object.fromEntries(
    Array.from({ length: physicalStrips }, (_, index) => {
      const strip = String(index + 1);
      return [strip, Math.min(5, Math.max(1, Number(existing[strip]) || rowsPerStrip))];
    })
  );
}

export function getLogicalRowsFromStrips(block: Partial<PrototypeBlock>) {
  return Object.values(normalizeStripRowCounts(block)).reduce((total, count) => total + Number(count || 0), 0);
}

export function normalizeRowPlotCounts(block: PrototypeBlock, nextRowCount = block.logicalRows || 2): PrototypeBlock {
  const rowsPerStrip = Math.min(5, Math.max(1, Number(block.rowsPerStrip) || 2));
  const physicalStrips = Math.min(40, Math.max(1, Number(block.physicalStrips) || Math.ceil(nextRowCount / rowsPerStrip)));
  const stripRowCounts = normalizeStripRowCounts({ ...block, physicalStrips, rowsPerStrip });
  const logicalRows = Math.min(160, Math.max(1, Number(nextRowCount) || getLogicalRowsFromStrips({ ...block, stripRowCounts })));
  const defaults = getDefaultRowPlotCounts(logicalRows, block.id);
  const rowPlotCounts = Object.fromEntries(
    Array.from({ length: logicalRows }, (_, index) => {
      const row = String(index + 1);
      return [row, Math.min(200, Math.max(1, Number(block.rowPlotCounts?.[row]) || defaults[row]))];
    })
  );

  return {
    ...block,
    rowsPerStrip,
    physicalStrips,
    stripRowCounts,
    logicalRows,
    rowPlotCounts,
    rowRules: block.rowRules?.length ? block.rowRules : [{ rows: [1, logicalRows], plotsPerRow: 32 }],
    calibration: {
      ...block.calibration,
      cutout: block.calibration.cutout ?? { x: 0, y: 0, width: 0, height: 0 }
    },
    shape: block.shape === "polygon" ? "polygon" : "rectangle",
    x: Number(block.x) || block.calibration.x,
    y: Number(block.y) || block.calibration.y,
    width: Number(block.width) || 20,
    height: Number(block.height) || 18,
    rotate: Number(block.rotate) || block.calibration.rotate
  };
}

export function getBlockPlotTotal(block: PrototypeBlock) {
  return Object.values(block.rowPlotCounts).reduce((total, count) => total + Number(count || 0), 0);
}

export function createPrototypeBlock(id: string, existingCount = 0): PrototypeBlock {
  return normalizeRowPlotCounts({
    id,
    cemeteryId: "sligo-town-cemetery",
    name: `Block ${id}`,
    physicalStrips: 1,
    rowsPerStrip: 2,
    stripRowCounts: { "1": 2 },
    blockTemplate: "standard-2",
    logicalRows: 2,
    rowPlotCounts: getDefaultRowPlotCounts(2, id),
    rowRules: [{ rows: [1, 2], plotsPerRow: 32 }],
    calibration: {
      x: Math.min(115, Math.max(-15, 75.8 + existingCount * 5)),
      y: Math.min(115, Math.max(-15, 22.2 + existingCount * 5)),
      width: 90,
      height: 70,
      rotate: 39,
      cutout: { x: 0, y: 0, width: 0, height: 0 }
    },
    x: Math.min(115, Math.max(-15, 75.8 + existingCount * 5)),
    y: Math.min(115, Math.max(-15, 22.2 + existingCount * 5)),
    width: 20,
    height: 18,
    rotate: 39
  });
}

export const prototypeEntrances: PrototypeEntrance[] = [
  { id: "sligo-main-entrance", name: "Main Entrance", x: 76.3, y: 13.5 },
  { id: "sligo-cemetery-road-gate", name: "Cemetery Road Gate", x: 42.4, y: 33.4 }
];

export const prototypeRecords: PrototypeRecord[] = [
  { id: "burial-001", fullName: "Andrew Hosie", dates: "1848-1917", plotId: "A-01-001", blockId: "A", x: 34, y: 32 },
  { id: "burial-002", fullName: "Margaret Keane", dates: "1861-1934", plotId: "A-01-002", blockId: "A", x: 37, y: 34 },
  { id: "burial-003", fullName: "Patrick Walsh", dates: "1874-1942", plotId: "A-01-003", blockId: "A", x: 31, y: 36 },
  { id: "burial-004", fullName: "Mary Jane Robertson", dates: "1880-1956", plotId: "A-02-001", blockId: "A", x: 33, y: 39 },
  { id: "burial-005", fullName: "Thomas Gallagher", dates: "1893-1967", plotId: "A-02-002", blockId: "A", x: 36, y: 41 },
  { id: "burial-006", fullName: "Ellen Poe", dates: "1901-1979", plotId: "A-03-004", blockId: "A", x: 41, y: 43 },
  { id: "burial-007", fullName: "Bridget McLoughlin", dates: "1912-1988", plotId: "A-04-006", blockId: "A", x: 47, y: 48 },
  { id: "burial-008", fullName: "John Brennan", dates: "1920-1994", plotId: "A-05-010", blockId: "A", x: 55, y: 53 },
  { id: "burial-009", fullName: "Kathleen O'Connor", dates: "1931-2008", plotId: "A-07-003", blockId: "A", x: 42, y: 61 },
  { id: "burial-010", fullName: "Michael Scanlon", dates: "1944-2019", plotId: "A-09-014", blockId: "A", x: 60, y: 70 },
  { id: "burial-011", fullName: "Nora Connolly", dates: "1938-2022", plotId: "A-10-009", blockId: "A", x: 51, y: 67 },
  { id: "burial-012", fullName: "Seamus Doyle", dates: "1941-2011", plotId: "A-04-021", blockId: "A", x: 49, y: 39 },
  { id: "burial-013", fullName: "Anne Morrison", dates: "1952-2020", plotId: "A-08-006", blockId: "A", x: 43, y: 52 },
  { id: "burial-014", fullName: "Liam Kelly", dates: "1936-2005", plotId: "A-12-028", blockId: "A", x: 58, y: 59 },
  { id: "burial-015", fullName: "Rose Flanagan", dates: "1928-1999", plotId: "A-15-013", blockId: "A", x: 48, y: 63 },
  { id: "burial-016", fullName: "Teresa Henry", dates: "1949-2017", plotId: "A-17-030", blockId: "A", x: 61, y: 72 },
  { id: "burial-017", fullName: "Noel Brennan", dates: "1947-2016", plotId: "A-09-001", blockId: "A", x: 50, y: 31 },
  { id: "burial-018", fullName: "Aaron Moran", dates: "1955-2021", plotId: "A-05-032", blockId: "A", x: 44, y: 73 },
  { id: "burial-019", fullName: "Eileen Ward", dates: "1939-2012", plotId: "B-01-001", blockId: "B", x: 70, y: 38 },
  { id: "burial-020", fullName: "Martin Sweeney", dates: "1946-2018", plotId: "B-08-012", blockId: "B", x: 78, y: 45 },
  { id: "burial-021", fullName: "Grace Nolan", dates: "1951-2020", plotId: "B-14-024", blockId: "B", x: 84, y: 51 },
  { id: "burial-022", fullName: "Peter Burns", dates: "1934-2007", plotId: "B-20-032", blockId: "B", x: 91, y: 58 }
];

export function searchPrototypeRecords(query: string) {
  const normalized = query.trim().toLowerCase();

  if (normalized.length < 2) {
    return [];
  }

  return prototypeRecords
    .filter((record) =>
      [record.fullName, record.plotId, record.blockId].some((value) => value.toLowerCase().includes(normalized))
    )
    .slice(0, 10);
}
