"use client";

import { MapPin, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  cemeteryPathPercentLines,
  defaultMapCalibration,
  layoutBlockToLatLngs,
  normalizeCalibration,
  percentToLatLng,
  type CalibrationApiRow,
  type MapCalibration
} from "@/lib/map-geometry";
import {
  createDefaultRows,
  createDefaultStrips,
  nextAvailablePlot,
  normalizeBlocks,
  normalizeEntrances,
  rectangleToPolygonPoints,
  type BlockType,
  type CemeteryBlock,
  type CemeteryEntrance,
  type PlotAssignment,
  type PolygonPoint
} from "@/lib/cemetery-layout";
import { prototypeEntrances } from "@/lib/prototype-data";

const storageKey = "graveguide-admin-blocks-v2";
const adminTokenKey = "graveguide-admin-token";

type LeafletModule = typeof import("leaflet");
type CalibrationPayload = { calibration?: CalibrationApiRow | null };
type AssignmentPayload = { assignments?: PlotAssignment[] };
type PlacementMode = "none" | "polygon" | "entrance";
type ResidentResult = {
  id: string;
  display_name: string | null;
  given_names: string | null;
  family_name: string | null;
  date_of_birth: string | null;
  date_of_death: string | null;
  biography: string | null;
  burials?: Array<{
    id: string;
    inscription: string | null;
    grave_plots?: { plot_reference: string | null } | Array<{ plot_reference: string | null }> | null;
    plotAssignment?: PlotAssignment | null;
  }>;
};

function newBlockId(blocks: CemeteryBlock[]) {
  let index = blocks.length;
  let id = String.fromCharCode(65 + index);

  while (blocks.some((block) => block.id === id)) {
    index += 1;
    id = String.fromCharCode(65 + index);
  }

  return id;
}

function entranceQrCode(entrance: CemeteryEntrance, siteOrigin: string) {
  return `${siteOrigin || ""}/visitor?entrance=${encodeURIComponent(entrance.qrCode)}`;
}

function clampPoint(point: PolygonPoint): PolygonPoint {
  return {
    x: Math.max(0, Math.min(120, point.x)),
    y: Math.max(0, Math.min(120, point.y))
  };
}

export function AdminWorkspace() {
  const [blocks, setBlocks] = useState<CemeteryBlock[]>(() => normalizeBlocks(null));
  const [entrances, setEntrances] = useState<CemeteryEntrance[]>(() => normalizeEntrances(prototypeEntrances));
  const [selectedBlockId, setSelectedBlockId] = useState("A");
  const [selectedEntranceId, setSelectedEntranceId] = useState("sligo-main-entrance");
  const [placementMode, setPlacementMode] = useState<PlacementMode>("none");
  const [status, setStatus] = useState("Loading admin workspace");
  const [entranceStatus, setEntranceStatus] = useState("Entrance editor ready");
  const [adminToken, setAdminToken] = useState("");
  const [calibration, setCalibration] = useState<MapCalibration>(defaultMapCalibration);
  const [calibrationStatus, setCalibrationStatus] = useState("Map calibration not saved this session");
  const [plotAssignments, setPlotAssignments] = useState<PlotAssignment[]>([]);
  const [recordStatus, setRecordStatus] = useState("Record form ready");
  const [recordForm, setRecordForm] = useState({
    givenNames: "",
    familyName: "",
    dateOfBirth: "",
    dateOfDeath: "",
    blockCode: "A",
    stripNumber: 1,
    rowNumber: 1,
    startingPlotNumber: 1,
    plotSpan: 1,
    biography: "",
    inscription: ""
  });
  const [residentQuery, setResidentQuery] = useState("");
  const [residentResults, setResidentResults] = useState<ResidentResult[]>([]);
  const [residentStatus, setResidentStatus] = useState("Search residents by name, date, or note");
  const [residentForm, setResidentForm] = useState({
    personId: "",
    burialId: "",
    givenNames: "",
    familyName: "",
    dateOfBirth: "",
    dateOfDeath: "",
    biography: "",
    inscription: "",
    blockCode: "A",
    stripNumber: 1,
    rowNumber: 1,
    startingPlotNumber: 1,
    plotSpan: 1
  });
  const [siteOrigin, setSiteOrigin] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const placementModeRef = useRef<PlacementMode>("none");
  const selectedBlockRef = useRef<CemeteryBlock | null>(null);
  const selectedEntranceRef = useRef<CemeteryEntrance | null>(null);

  const selectedBlock = useMemo(
    () => blocks.find((block) => block.id === selectedBlockId) ?? blocks[0] ?? normalizeBlocks(null)[0],
    [blocks, selectedBlockId]
  );
  const selectedEntrance = useMemo(
    () => entrances.find((entrance) => entrance.id === selectedEntranceId) ?? entrances[0] ?? normalizeEntrances(null)[0],
    [entrances, selectedEntranceId]
  );
  const recordBlock = blocks.find((block) => block.id === recordForm.blockCode) ?? selectedBlock;
  const selectedStrip = recordBlock?.strips.find((strip) => strip.stripNumber === recordForm.stripNumber) ?? recordBlock?.strips[0];
  const selectedRow = selectedStrip?.rows.find((row) => row.rowNumber === recordForm.rowNumber) ?? selectedStrip?.rows[0];
  const suggestedPlot = nextAvailablePlot(plotAssignments, selectedRow?.maximumPlotCount ?? 32, recordForm.plotSpan);

  useEffect(() => {
    setSiteOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    placementModeRef.current = placementMode;
    selectedBlockRef.current = selectedBlock;
    selectedEntranceRef.current = selectedEntrance;
  }, [placementMode, selectedBlock, selectedEntrance]);

  useEffect(() => {
    setAdminToken(window.localStorage.getItem(adminTokenKey) ?? "");

    async function loadAdminData() {
      try {
        const [layoutResponse, entranceResponse] = await Promise.all([
          fetch("/api/block-layouts?cemetery=sligo-town-cemetery"),
          fetch("/api/entrances?cemetery=sligo-town-cemetery")
        ]);
        const layoutPayload = (await layoutResponse.json()) as { blocks?: CemeteryBlock[] | null; source?: string };
        const entrancePayload = (await entranceResponse.json()) as { entrances?: CemeteryEntrance[] | null; source?: string };
        const nextBlocks = normalizeBlocks(layoutPayload.blocks ?? null);
        const nextEntrances = normalizeEntrances(entrancePayload.entrances ?? null);

        setBlocks(nextBlocks);
        setEntrances(nextEntrances);
        setSelectedBlockId(nextBlocks[0]?.id ?? "A");
        setSelectedEntranceId(nextEntrances[0]?.id ?? "entrance-1");
        setStatus(layoutPayload.source === "supabase" ? "Loaded Supabase block layout" : "Loaded fallback block layout");
        setEntranceStatus(entrancePayload.source === "supabase" ? "Loaded Supabase entrances" : "Loaded fallback entrances");
        return;
      } catch {
        setStatus("Remote layout unavailable");
      }

      const stored = window.localStorage.getItem(storageKey);

      if (!stored) return;

      try {
        const parsed = JSON.parse(stored) as CemeteryBlock[];
        const nextBlocks = normalizeBlocks(parsed);
        setBlocks(nextBlocks);
        setSelectedBlockId(nextBlocks[0]?.id ?? "A");
        setStatus("Loaded saved browser layout");
      } catch {
        setStatus("Saved layout could not be loaded");
      }
    }

    void loadAdminData();
  }, []);

  useEffect(() => {
    if (adminToken) {
      window.localStorage.setItem(adminTokenKey, adminToken);
    } else {
      window.localStorage.removeItem(adminTokenKey);
    }
  }, [adminToken]);

  useEffect(() => {
    async function loadCalibration() {
      try {
        const response = await fetch("/api/map-calibration?cemetery=sligo-town-cemetery");
        const payload = (await response.json()) as CalibrationPayload;
        setCalibration(normalizeCalibration(payload.calibration));
        setCalibrationStatus(payload.calibration ? "Loaded Supabase map calibration" : "Using default map calibration");
      } catch {
        setCalibration(defaultMapCalibration);
        setCalibrationStatus("Map calibration unavailable");
      }
    }

    void loadCalibration();
  }, []);

  useEffect(() => {
    async function loadAssignments() {
      if (!recordForm.blockCode || !recordForm.stripNumber || !recordForm.rowNumber) return;

      try {
        const response = await fetch(
          `/api/plot-assignments?cemetery=sligo-town-cemetery&block=${encodeURIComponent(recordForm.blockCode)}&strip=${recordForm.stripNumber}&row=${recordForm.rowNumber}`
        );
        const payload = (await response.json()) as AssignmentPayload;
        setPlotAssignments(payload.assignments ?? []);
      } catch {
        setPlotAssignments([]);
      }
    }

    void loadAssignments();
  }, [recordForm.blockCode, recordForm.rowNumber, recordForm.stripNumber]);

  useEffect(() => {
    if (suggestedPlot) {
      setRecordForm((current) => ({ ...current, startingPlotNumber: suggestedPlot }));
    }
  }, [suggestedPlot, recordForm.blockCode, recordForm.rowNumber, recordForm.stripNumber]);

  useEffect(() => {
    let cancelled = false;

    async function loadLeafletMap() {
      if (!mapContainerRef.current || mapRef.current) return;

      const L = await import("leaflet");

      if (cancelled || !mapContainerRef.current) return;

      leafletRef.current = L;
      const map = L.map(mapContainerRef.current, {
        attributionControl: true,
        maxZoom: calibration.maxZoom,
        minZoom: calibration.minZoom
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: calibration.maxZoom
      }).addTo(map);
      map.setView([calibration.centerLatitude, calibration.centerLongitude], calibration.defaultZoom);
      map.on("click", (event) => {
        const point = latLngToPercent(event.latlng.lat, event.latlng.lng, calibration);
        const currentMode = placementModeRef.current;
        const currentBlock = selectedBlockRef.current;
        const currentEntrance = selectedEntranceRef.current;

        if (currentMode === "polygon" && currentBlock) {
          updateBlock(currentBlock.id, { polygonPoints: [...currentBlock.polygonPoints, clampPoint(point)] });
        }

        if (currentMode === "entrance" && currentEntrance) {
          updateEntrance(currentEntrance.id, { x: point.x, y: point.y });
          setEntranceStatus(`Placed ${currentEntrance.name}`);
        }
      });
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      setMapReady(true);
    }

    void loadLeafletMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, [calibration.centerLatitude, calibration.centerLongitude, calibration.defaultZoom, calibration.maxZoom, calibration.minZoom]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;

    if (!mapReady || !L || !map || !layer || !selectedBlock) return;

    layer.clearLayers();
    map.setView([calibration.centerLatitude, calibration.centerLongitude], calibration.defaultZoom);

    cemeteryPathPercentLines.forEach((line) => {
      L.polyline(
        line.map((point) => percentToLatLng(point.x, point.y, calibration)),
        { color: "#d4a47d", interactive: false, opacity: 0.65, weight: 8 }
      ).addTo(layer);
    });

    blocks.forEach((block) => {
      const isSelected = block.id === selectedBlock.id;
      const polygon =
        block.type === "polygon"
          ? block.polygonPoints.map((point) => percentToLatLng(point.x, point.y, calibration))
          : layoutBlockToLatLngs(block, calibration, 25);

      L.polygon(polygon, {
        color: isSelected ? "#b46b34" : "#587b70",
        fillColor: isSelected ? "#b46b34" : "#2f6f58",
        fillOpacity: isSelected ? 0.2 : 0.13,
        weight: isSelected ? 2 : 1
      })
        .bindTooltip(block.name, { direction: "center", permanent: true })
        .on("click", () => setSelectedBlockId(block.id))
        .addTo(layer);

      if (isSelected) {
        const center = percentToLatLng(block.x, block.y, calibration);
        const resize = percentToLatLng(block.x - 25 + block.width, block.y + 5 + block.height, calibration);

        L.marker(center, { draggable: true, icon: L.divIcon({ className: "map-edit-handle", html: "" }) })
          .on("dragend", (event) => {
            const marker = event.target as import("leaflet").Marker;
            const point = latLngToPercent(marker.getLatLng().lat, marker.getLatLng().lng, calibration);
            updateSelectedBlock("x", point.x);
            updateSelectedBlock("y", point.y);
          })
          .addTo(layer);

        if (block.type === "rectangle") {
          L.marker(resize, { draggable: true, icon: L.divIcon({ className: "map-resize-handle", html: "" }) })
            .on("dragend", (event) => {
              const marker = event.target as import("leaflet").Marker;
              const point = latLngToPercent(marker.getLatLng().lat, marker.getLatLng().lng, calibration);
              updateSelectedBlock("width", Math.max(5, point.x - (block.x - 25)));
              updateSelectedBlock("height", Math.max(5, point.y - (block.y + 5)));
            })
            .addTo(layer);
        }

        if (block.type === "polygon") {
          block.polygonPoints.forEach((point, pointIndex) => {
            L.marker(percentToLatLng(point.x, point.y, calibration), {
              draggable: true,
              icon: L.divIcon({ className: "map-polygon-handle", html: "" })
            })
              .on("dragend", (event) => {
                const marker = event.target as import("leaflet").Marker;
                const nextPoint = latLngToPercent(marker.getLatLng().lat, marker.getLatLng().lng, calibration);
                updatePolygonPoint(pointIndex, clampPoint(nextPoint));
              })
              .addTo(layer);
          });
        }
      }
    });

    entrances.forEach((entrance) => {
      L.circleMarker(percentToLatLng(entrance.x, entrance.y, calibration), {
        color: entrance.id === selectedEntrance?.id ? "#204b3d" : "#fffdf8",
        fillColor: "#b46b34",
        fillOpacity: 1,
        radius: entrance.id === selectedEntrance?.id ? 8 : 6,
        weight: 2
      })
        .bindTooltip(entrance.name)
        .on("click", () => setSelectedEntranceId(entrance.id))
        .addTo(layer);
    });
  }, [blocks, calibration, entrances, mapReady, selectedBlock, selectedEntrance]);

  function latLngToPercent(latitude: number, longitude: number, currentCalibration: MapCalibration): PolygonPoint {
    const metersPerDegreeLatitude = 111_320;
    const metersPerDegreeLongitude = metersPerDegreeLatitude * Math.cos((currentCalibration.centerLatitude * Math.PI) / 180);
    const xMeters = (longitude - currentCalibration.centerLongitude) * metersPerDegreeLongitude;
    const yMeters = (latitude - currentCalibration.centerLatitude) * metersPerDegreeLatitude;

    return {
      x: 50 + (xMeters / currentCalibration.overlayWidthMeters) * 100,
      y: 50 - (yMeters / currentCalibration.overlayHeightMeters) * 100
    };
  }

  function updateSelectedBlock<K extends keyof CemeteryBlock>(field: K, value: CemeteryBlock[K]) {
    updateBlock(selectedBlock.id, { [field]: value } as Partial<CemeteryBlock>);
  }

  function updateBlock(blockId: string, updates: Partial<CemeteryBlock>) {
    setBlocks((currentBlocks) =>
      currentBlocks.map((block) => (block.id === blockId ? { ...block, ...updates } : block))
    );
    setStatus("Layout changed");
  }

  function updatePolygonPoint(index: number, point: PolygonPoint) {
    updateSelectedBlock(
      "polygonPoints",
      selectedBlock.polygonPoints.map((existingPoint, pointIndex) => (pointIndex === index ? point : existingPoint))
    );
  }

  function updateBlockType(type: BlockType) {
    updateSelectedBlock("type", type);

    if (type === "polygon" && selectedBlock.polygonPoints.length < 3) {
      updateSelectedBlock("polygonPoints", rectangleToPolygonPoints(selectedBlock));
    }
  }

  function updateStripCount(count: number) {
    const nextCount = Math.max(1, Math.min(20, count));
    const current = selectedBlock.strips;
    const strips =
      nextCount > current.length
        ? [...current, ...createDefaultStrips(nextCount - current.length).map((strip, index) => ({ ...strip, stripNumber: current.length + index + 1 }))]
        : current.slice(0, nextCount);

    updateSelectedBlock("strips", strips);
  }

  function updateStripRows(stripNumber: number, rowCount: number) {
    updateSelectedBlock(
      "strips",
      selectedBlock.strips.map((strip) =>
        strip.stripNumber === stripNumber
          ? {
              ...strip,
              rows:
                rowCount > strip.rows.length
                  ? [
                      ...strip.rows,
                      ...createDefaultRows(rowCount - strip.rows.length).map((row, index) => ({
                        ...row,
                        rowNumber: strip.rows.length + index + 1
                      }))
                    ]
                  : strip.rows.slice(0, Math.max(1, rowCount))
            }
          : strip
      )
    );
  }

  function updateRowMaximum(stripNumber: number, rowNumber: number, maximumPlotCount: number) {
    updateSelectedBlock(
      "strips",
      selectedBlock.strips.map((strip) =>
        strip.stripNumber === stripNumber
          ? {
              ...strip,
              rows: strip.rows.map((row) => (row.rowNumber === rowNumber ? { ...row, maximumPlotCount } : row))
            }
          : strip
      )
    );
  }

  function updateEntrance(entranceId: string, updates: Partial<CemeteryEntrance>) {
    setEntrances((current) => current.map((entrance) => (entrance.id === entranceId ? { ...entrance, ...updates } : entrance)));
  }

  function updateCalibration(field: keyof MapCalibration, value: number) {
    setCalibration((current) => ({ ...current, [field]: value }));
    setCalibrationStatus("Calibration changed");
  }

  function updateRecordForm(field: keyof typeof recordForm, value: string | number) {
    setRecordForm((current) => ({ ...current, [field]: value }));
    setRecordStatus("Record form changed");
  }

  function updateRecordBlock(blockCode: string) {
    const block = blocks.find((item) => item.id === blockCode);
    const firstStrip = block?.strips[0];
    const firstRow = firstStrip?.rows[0];

    setRecordForm((current) => ({
      ...current,
      blockCode,
      stripNumber: firstStrip?.stripNumber ?? 1,
      rowNumber: firstRow?.rowNumber ?? 1
    }));
    setRecordStatus("Record block changed");
  }

  function updateRecordStrip(stripNumber: number) {
    const strip = recordBlock.strips.find((item) => item.stripNumber === stripNumber);
    const firstRow = strip?.rows[0];

    setRecordForm((current) => ({
      ...current,
      stripNumber,
      rowNumber: firstRow?.rowNumber ?? 1
    }));
    setRecordStatus("Record strip changed");
  }

  async function saveLayout() {
    window.localStorage.setItem(storageKey, JSON.stringify(blocks));
    setStatus("Saved to this browser");

    try {
      const response = await fetch("/api/block-layouts", {
        body: JSON.stringify({ cemeterySlug: "sligo-town-cemetery", blocks }),
        headers: { "content-type": "application/json", "x-graveguide-admin-token": adminToken },
        method: "POST"
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setStatus(payload.error ?? "Saved locally; Supabase save unavailable");
        return;
      }

      setStatus("Saved blocks to Supabase");
    } catch {
      setStatus("Saved locally; Supabase save unavailable");
    }
  }

  async function saveEntrances() {
    setEntranceStatus("Saving entrances");

    try {
      const response = await fetch("/api/entrances", {
        body: JSON.stringify({ cemeterySlug: "sligo-town-cemetery", entrances }),
        headers: { "content-type": "application/json", "x-graveguide-admin-token": adminToken },
        method: "POST"
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setEntranceStatus(payload.error ?? "Entrance save failed");
        return;
      }

      setEntranceStatus("Saved entrances to Supabase");
    } catch {
      setEntranceStatus("Entrance save unavailable");
    }
  }

  async function saveCalibration() {
    setCalibrationStatus("Saving map calibration");

    try {
      const response = await fetch("/api/map-calibration", {
        body: JSON.stringify({
          cemeterySlug: "sligo-town-cemetery",
          centerLatitude: calibration.centerLatitude,
          centerLongitude: calibration.centerLongitude,
          defaultZoom: calibration.defaultZoom,
          minZoom: calibration.minZoom,
          maxZoom: calibration.maxZoom,
          rotationDegrees: calibration.rotationDegrees,
          overlayWidthMeters: calibration.overlayWidthMeters,
          overlayHeightMeters: calibration.overlayHeightMeters,
          calibrationNotes: "Saved from GraveGuide admin workspace."
        }),
        headers: { "content-type": "application/json", "x-graveguide-admin-token": adminToken },
        method: "POST"
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setCalibrationStatus(payload.error ?? "Calibration save failed");
        return;
      }

      setCalibrationStatus("Saved map calibration to Supabase");
    } catch {
      setCalibrationStatus("Calibration save unavailable");
    }
  }

  async function saveRecord() {
    setRecordStatus("Saving record");

    try {
      const plotReference = `${recordForm.blockCode}-${String(recordForm.stripNumber).padStart(2, "0")}-${String(recordForm.startingPlotNumber).padStart(3, "0")}`;
      const response = await fetch("/api/admin-records", {
        body: JSON.stringify({ cemeterySlug: "sligo-town-cemetery", ...recordForm, plotReference }),
        headers: { "content-type": "application/json", "x-graveguide-admin-token": adminToken },
        method: "POST"
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setRecordStatus(payload.error ?? "Record save failed");
        return;
      }

      setRecordStatus("Saved record to Supabase");
      setPlotAssignments((current) => [
        ...current,
        {
          blockCode: recordForm.blockCode,
          stripNumber: recordForm.stripNumber,
          rowNumber: recordForm.rowNumber,
          startingPlotNumber: recordForm.startingPlotNumber,
          plotSpan: recordForm.plotSpan
        }
      ]);
    } catch {
      setRecordStatus("Record save unavailable");
    }
  }

  async function searchResidents() {
    if (residentQuery.trim().length < 2) {
      setResidentResults([]);
      setResidentStatus("Type at least 2 characters");
      return;
    }

    setResidentStatus("Searching residents");

    try {
      const response = await fetch(`/api/admin-residents?q=${encodeURIComponent(residentQuery.trim())}`);
      const payload = (await response.json()) as { residents?: ResidentResult[]; error?: string };
      setResidentResults(payload.residents ?? []);
      setResidentStatus(payload.error ?? `${payload.residents?.length ?? 0} resident matches`);
    } catch {
      setResidentStatus("Resident search unavailable");
    }
  }

  function selectResident(resident: ResidentResult) {
    const burial = resident.burials?.[0];
    const plot = Array.isArray(burial?.grave_plots) ? burial?.grave_plots[0] : burial?.grave_plots;
    const referenceParts = plot?.plot_reference?.split("-") ?? [];
    const assignment = burial?.plotAssignment;

    setResidentForm({
      personId: resident.id,
      burialId: burial?.id ?? "",
      givenNames: resident.given_names ?? "",
      familyName: resident.family_name ?? "",
      dateOfBirth: resident.date_of_birth ?? "",
      dateOfDeath: resident.date_of_death ?? "",
      biography: resident.biography ?? "",
      inscription: burial?.inscription ?? "",
      blockCode: assignment?.blockCode ?? referenceParts[0] ?? "A",
      stripNumber: assignment?.stripNumber ?? (Number(referenceParts[1]) || 1),
      rowNumber: assignment?.rowNumber ?? 1,
      startingPlotNumber: assignment?.startingPlotNumber ?? (Number(referenceParts[2]) || 1),
      plotSpan: assignment?.plotSpan ?? 1
    });
    setResidentStatus(`Editing ${resident.display_name ?? resident.given_names ?? "resident"}`);
  }

  function updateResidentForm(field: keyof typeof residentForm, value: string | number) {
    setResidentForm((current) => ({ ...current, [field]: value }));
    setResidentStatus("Resident changed");
  }

  async function saveResident() {
    if (!residentForm.personId) {
      setResidentStatus("Select a resident first");
      return;
    }

    setResidentStatus("Saving resident");

    try {
      const response = await fetch("/api/admin-residents", {
        body: JSON.stringify(residentForm),
        headers: { "content-type": "application/json", "x-graveguide-admin-token": adminToken },
        method: "PATCH"
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setResidentStatus(payload.error ?? "Resident save failed");
        return;
      }

      setResidentStatus("Saved resident changes");
      void searchResidents();
    } catch {
      setResidentStatus("Resident save unavailable");
    }
  }

  function addBlock(type: BlockType = "rectangle") {
    const id = newBlockId(blocks);
    const block: CemeteryBlock = {
      id,
      name: `Block ${id}`,
      type,
      x: 58,
      y: 42,
      width: 20,
      height: 18,
      rotate: 0,
      polygonPoints: [
        { x: 44, y: 38 },
        { x: 62, y: 36 },
        { x: 66, y: 54 },
        { x: 46, y: 58 }
      ],
      strips: createDefaultStrips(1, 2)
    };

    setBlocks((current) => [...current, block]);
    setSelectedBlockId(block.id);
    setStatus(`Added ${block.name}`);
  }

  function deleteSelectedBlock() {
    if (blocks.length <= 1) {
      setStatus("Keep at least one block");
      return;
    }

    const nextBlocks = blocks.filter((block) => block.id !== selectedBlock.id);
    setBlocks(nextBlocks);
    setSelectedBlockId(nextBlocks[0].id);
    setStatus(`Deleted ${selectedBlock.name}`);
  }

  function addEntrance() {
    const id = `entrance-${Date.now()}`;
    const entrance: CemeteryEntrance = {
      id,
      name: `Entrance ${entrances.length + 1}`,
      x: 50,
      y: 50,
      qrCode: `graveguide-${id}`,
      linkedBlockId: null
    };

    setEntrances((current) => [...current, entrance]);
    setSelectedEntranceId(id);
    setPlacementMode("entrance");
    setEntranceStatus("Click the map to place the new entrance");
  }

  function deleteSelectedEntrance() {
    if (entrances.length <= 1) {
      setEntranceStatus("Keep at least one entrance");
      return;
    }

    const nextEntrances = entrances.filter((entrance) => entrance.id !== selectedEntrance.id);
    setEntrances(nextEntrances);
    setSelectedEntranceId(nextEntrances[0].id);
    setEntranceStatus("Deleted entrance");
  }

  if (!selectedBlock || !selectedEntrance) {
    return null;
  }

  return (
    <section className="admin-layout admin-layout-wide">
      <aside className="admin-sidebar admin-sidebar-scroll">
        <h1>Sligo Town Cemetery</h1>
        <p>Admin workspace for blocks, strips, rows, plots, entrances, QR links, calibration, and resident records.</p>
        <label className="admin-token-field">
          Admin token
          <input onChange={(event) => setAdminToken(event.target.value)} placeholder="Save token" type="password" value={adminToken} />
        </label>

        <div className="admin-section">
          <strong>Block management</strong>
          <span>{status}</span>
          <div className="admin-button-row">
            <button onClick={() => addBlock("rectangle")} type="button">
              <Plus size={15} /> Rectangle
            </button>
            <button onClick={() => addBlock("polygon")} type="button">
              <Plus size={15} /> Polygon
            </button>
          </div>
          <label>
            Block name
            <input onChange={(event) => updateSelectedBlock("name", event.target.value)} value={selectedBlock.name} />
          </label>
          <label>
            Block type
            <select onChange={(event) => updateBlockType(event.target.value as BlockType)} value={selectedBlock.type}>
              <option value="rectangle">Adjustable Rectangle</option>
              <option value="polygon">Adjustable Polygon</option>
            </select>
          </label>
          {selectedBlock.type === "polygon" ? (
            <button className="plain-admin-button" onClick={() => setPlacementMode(placementMode === "polygon" ? "none" : "polygon")} type="button">
              {placementMode === "polygon" ? "Stop adding polygon points" : "Click map to add polygon points"}
            </button>
          ) : null}
          <button className="plain-admin-button danger" onClick={deleteSelectedBlock} type="button">
            <Trash2 size={15} /> Delete selected block
          </button>
          <button className="plain-admin-button" onClick={() => void saveLayout()} type="button">
            <Save size={15} /> Save blocks
          </button>
        </div>

        <div className="admin-section">
          <strong>Strips and rows</strong>
          <label>
            Number of strips
            <input max="20" min="1" onChange={(event) => updateStripCount(Number(event.target.value))} type="number" value={selectedBlock.strips.length} />
          </label>
          {selectedBlock.strips.map((strip) => (
            <div className="strip-editor" key={strip.id}>
              <strong>Strip {strip.stripNumber}</strong>
              <label>
                Rows
                <input
                  max="20"
                  min="1"
                  onChange={(event) => updateStripRows(strip.stripNumber, Number(event.target.value))}
                  type="number"
                  value={strip.rows.length}
                />
              </label>
              {strip.rows.map((row) => (
                <label key={row.id}>
                  Row {row.rowNumber} max plots
                  <input
                    min="1"
                    onChange={(event) => updateRowMaximum(strip.stripNumber, row.rowNumber, Number(event.target.value))}
                    type="number"
                    value={row.maximumPlotCount}
                  />
                </label>
              ))}
            </div>
          ))}
        </div>

        <div className="admin-section">
          <strong>Entrances and QR</strong>
          <span>{entranceStatus}</span>
          <div className="admin-button-row">
            <button onClick={addEntrance} type="button">Add entrance</button>
            <button onClick={deleteSelectedEntrance} type="button">Delete</button>
          </div>
          <label>
            Entrance
            <select onChange={(event) => setSelectedEntranceId(event.target.value)} value={selectedEntrance.id}>
              {entrances.map((entrance) => (
                <option key={entrance.id} value={entrance.id}>{entrance.name}</option>
              ))}
            </select>
          </label>
          <label>
            Entrance name
            <input onChange={(event) => updateEntrance(selectedEntrance.id, { name: event.target.value })} value={selectedEntrance.name} />
          </label>
          <button className="plain-admin-button" onClick={() => setPlacementMode(placementMode === "entrance" ? "none" : "entrance")} type="button">
            <MapPin size={15} /> {placementMode === "entrance" ? "Stop placing entrance" : "Click map to set entrance"}
          </button>
          <code className="qr-code-value">{selectedEntrance.qrCode}</code>
          <a className="qr-code-link" href={entranceQrCode(selectedEntrance, siteOrigin)}>{entranceQrCode(selectedEntrance, siteOrigin)}</a>
          <button className="plain-admin-button" onClick={() => void saveEntrances()} type="button">
            <Save size={15} /> Save entrances
          </button>
        </div>
      </aside>

      <section className="admin-board">
        <div className="admin-toolbar">
          <button onClick={() => void saveLayout()} type="button"><Save size={16} /> Save blocks</button>
          <button onClick={() => void saveEntrances()} type="button"><Save size={16} /> Save entrances</button>
          <button onClick={() => setPlacementMode("none")} type="button"><RotateCcw size={16} /> Stop map tool</button>
          <span className="admin-save-status">{placementMode === "none" ? status : `Map tool: ${placementMode}`}</span>
        </div>

        <div className="admin-workspace-grid admin-workspace-grid-wide">
          <div className="admin-map admin-map-tall">
            <div className="admin-leaflet-map" ref={mapContainerRef} aria-label="Admin Leaflet layout map" />
          </div>

          <aside className="block-editor">
            <h2>{selectedBlock.name}</h2>
            <p>Select a block or entrance on the map. Rectangle blocks have a drag handle and resize handle. Polygon points are draggable.</p>
            <div className="admin-panels compact-panels">
              {blocks.map((block) => (
                <button className={block.id === selectedBlock.id ? "admin-panel selected" : "admin-panel"} key={block.id} onClick={() => setSelectedBlockId(block.id)} type="button">
                  <span className="admin-panel-dot" />
                  <div>
                    <strong>{block.name}</strong>
                    <span>{block.type} / {block.strips.length} strips</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="calibration-editor">
              <strong>Real map calibration</strong>
              <span>{calibrationStatus}</span>
              <label>Centre latitude<input onChange={(event) => updateCalibration("centerLatitude", Number(event.target.value))} step="0.00001" type="number" value={calibration.centerLatitude} /></label>
              <label>Centre longitude<input onChange={(event) => updateCalibration("centerLongitude", Number(event.target.value))} step="0.00001" type="number" value={calibration.centerLongitude} /></label>
              <label>Overlay width metres<input onChange={(event) => updateCalibration("overlayWidthMeters", Number(event.target.value))} step="1" type="number" value={calibration.overlayWidthMeters} /></label>
              <label>Overlay height metres<input onChange={(event) => updateCalibration("overlayHeightMeters", Number(event.target.value))} step="1" type="number" value={calibration.overlayHeightMeters} /></label>
              <button onClick={() => void saveCalibration()} type="button">Save map calibration</button>
            </div>
          </aside>
        </div>

        <div className="record-editor record-editor-wide">
          <strong>Add resident / grave record</strong>
          <span>{recordStatus}</span>
          <div className="record-editor-grid record-editor-grid-wide">
            <label>First names<input onChange={(event) => updateRecordForm("givenNames", event.target.value)} value={recordForm.givenNames} /></label>
            <label>Family name<input onChange={(event) => updateRecordForm("familyName", event.target.value)} value={recordForm.familyName} /></label>
            <label>Born<input onChange={(event) => updateRecordForm("dateOfBirth", event.target.value)} type="date" value={recordForm.dateOfBirth} /></label>
            <label>Died<input onChange={(event) => updateRecordForm("dateOfDeath", event.target.value)} type="date" value={recordForm.dateOfDeath} /></label>
            <label>Block<select onChange={(event) => updateRecordBlock(event.target.value)} value={recordForm.blockCode}>{blocks.map((block) => <option key={block.id} value={block.id}>{block.id}</option>)}</select></label>
            <label>Strip<select onChange={(event) => updateRecordStrip(Number(event.target.value))} value={recordForm.stripNumber}>{recordBlock.strips.map((strip) => <option key={strip.id} value={strip.stripNumber}>Strip {strip.stripNumber}</option>)}</select></label>
            <label>Row<select onChange={(event) => updateRecordForm("rowNumber", Number(event.target.value))} value={recordForm.rowNumber}>{selectedStrip?.rows.map((row) => <option key={row.id} value={row.rowNumber}>Row {row.rowNumber}</option>)}</select></label>
            <label>Starting plot<input min="1" onChange={(event) => updateRecordForm("startingPlotNumber", Number(event.target.value))} type="number" value={recordForm.startingPlotNumber} /></label>
            <label>Plot span<input min="1" onChange={(event) => updateRecordForm("plotSpan", Number(event.target.value))} type="number" value={recordForm.plotSpan} /></label>
          </div>
          <p className="admin-hint">
            Suggested next plot: {suggestedPlot ?? "No free range"} / Row maximum: {selectedRow?.maximumPlotCount ?? 32} / Occupied ranges:{" "}
            {plotAssignments.length ? plotAssignments.map((assignment) => `${assignment.startingPlotNumber}-${assignment.startingPlotNumber + assignment.plotSpan - 1}`).join(", ") : "none"}
          </p>
          <label>Notes<textarea onChange={(event) => updateRecordForm("biography", event.target.value)} value={recordForm.biography} /></label>
          <button onClick={() => void saveRecord()} type="button">Save resident record</button>
        </div>

        <div className="record-editor record-editor-wide">
          <strong>Search and edit residents</strong>
          <span>{residentStatus}</span>
          <div className="resident-search-row">
            <input
              onChange={(event) => setResidentQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void searchResidents();
              }}
              placeholder="Search first name, last name, DOB, DOD, note"
              value={residentQuery}
            />
            <button onClick={() => void searchResidents()} type="button">Search</button>
          </div>
          <div className="resident-results">
            {residentResults.map((resident) => (
              <button key={resident.id} onClick={() => selectResident(resident)} type="button">
                <strong>{resident.display_name ?? [resident.given_names, resident.family_name].filter(Boolean).join(" ")}</strong>
                <span>{[resident.date_of_birth, resident.date_of_death].filter(Boolean).join(" - ") || "Dates unknown"}</span>
              </button>
            ))}
          </div>
          {residentForm.personId ? (
            <>
              <div className="record-editor-grid record-editor-grid-wide">
                <label>First names<input onChange={(event) => updateResidentForm("givenNames", event.target.value)} value={residentForm.givenNames} /></label>
                <label>Family name<input onChange={(event) => updateResidentForm("familyName", event.target.value)} value={residentForm.familyName} /></label>
                <label>Born<input onChange={(event) => updateResidentForm("dateOfBirth", event.target.value)} type="date" value={residentForm.dateOfBirth} /></label>
                <label>Died<input onChange={(event) => updateResidentForm("dateOfDeath", event.target.value)} type="date" value={residentForm.dateOfDeath} /></label>
                <label>Block<select onChange={(event) => updateResidentForm("blockCode", event.target.value)} value={residentForm.blockCode}>{blocks.map((block) => <option key={block.id} value={block.id}>{block.id}</option>)}</select></label>
                <label>Strip<input min="1" onChange={(event) => updateResidentForm("stripNumber", Number(event.target.value))} type="number" value={residentForm.stripNumber} /></label>
                <label>Row<input min="1" onChange={(event) => updateResidentForm("rowNumber", Number(event.target.value))} type="number" value={residentForm.rowNumber} /></label>
                <label>Starting plot<input min="1" onChange={(event) => updateResidentForm("startingPlotNumber", Number(event.target.value))} type="number" value={residentForm.startingPlotNumber} /></label>
                <label>Plot span<input min="1" onChange={(event) => updateResidentForm("plotSpan", Number(event.target.value))} type="number" value={residentForm.plotSpan} /></label>
              </div>
              <label>Resident notes<textarea onChange={(event) => updateResidentForm("biography", event.target.value)} value={residentForm.biography} /></label>
              <label>Inscription<textarea onChange={(event) => updateResidentForm("inscription", event.target.value)} value={residentForm.inscription} /></label>
              <button onClick={() => void saveResident()} type="button">Save resident changes</button>
            </>
          ) : null}
        </div>
      </section>
    </section>
  );
}
