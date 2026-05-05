export type PrototypeBlock = {
  id: string;
  name: string;
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

export const prototypeBlocks: PrototypeBlock[] = [
  { id: "A", name: "Block A", x: 75.8, y: 22.2, width: 22, height: 30, rotate: 39 },
  { id: "B", name: "Block B", x: 91.1, y: 31.7, width: 24, height: 15, rotate: 39 },
  { id: "C", name: "Block C", x: 100.3, y: 26.4, width: 24, height: 16, rotate: 39 }
];

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
