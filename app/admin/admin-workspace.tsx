"use client";

import { MapPin, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  blockGuideLineLatLngs,
  defaultMapCalibration,
  normalizeCalibration,
  percentToLatLng,
  rotatePercentPoint,
  type CalibrationApiRow,
  type MapCalibration
} from "@/lib/map-geometry";
import { normalizeEntrances, type CemeteryEntrance } from "@/lib/cemetery-layout";
import {
  createPrototypeBlock,
  getBlockPlotTotal,
  getLogicalRowsFromStrips,
  normalizeRowPlotCounts,
  normalizeStripRowCounts,
  prototypeBlocks,
  prototypeEntrances,
  prototypeRecords,
  type PrototypeBlock,
  type PrototypeBlockRowRule
} from "@/lib/prototype-data";

const storageKey = "graveguide-admin-blocks-v1";
const legacyStorageKey = "graveguide-sligo-block-layout";
const adminTokenKey = "graveguide-admin-token";
type LeafletModule = typeof import("leaflet");
type CalibrationPayload = { calibration?: CalibrationApiRow | null };
type VisualMode = "strips" | "rows" | "headstones";

function getBlockShape(block: PrototypeBlock) {
  return block.shape === "polygon" ? "polygon" : "rectangle";
}

function getBlockMapPoints(block: PrototypeBlock) {
  const left = block.x - 25;
  const top = block.y + 5;
  const centerX = left + block.width / 2;
  const centerY = top + block.height / 2;
  const localPoints =
    getBlockShape(block) === "polygon" && block.calibration.polygon?.length
      ? block.calibration.polygon.map((point) => ({
          x: left + (point.x / 100) * block.width,
          y: top + (point.y / 100) * block.height
        }))
      : [
          { x: left, y: top },
          { x: left + block.width, y: top },
          { x: left + block.width, y: top + block.height },
          { x: left, y: top + block.height }
        ];

  return localPoints.map((point) => rotatePercentPoint(point.x, point.y, centerX, centerY, block.rotate));
}

function blockToLatLngs(block: PrototypeBlock, calibration: MapCalibration) {
  return getBlockMapPoints(block).map((point) => percentToLatLng(point.x, point.y, calibration));
}

function cloneBlocks() {
  return prototypeBlocks.map((block) => normalizeRowPlotCounts(JSON.parse(JSON.stringify(block)) as PrototypeBlock));
}

function getNextBlockId(blocks: PrototypeBlock[]) {
  const used = new Set(blocks.map((block) => block.id));
  return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").find((letter) => !used.has(letter)) ?? `B${blocks.length + 1}`;
}

function normaliseLoadedBlocks(blocks: PrototypeBlock[]) {
  return blocks.map((block, index) => {
    const fallback = createPrototypeBlock(block.id ?? `B${index + 1}`, index);
    const merged = {
      ...fallback,
      ...block,
      calibration: {
        ...fallback.calibration,
        ...block.calibration,
        cutout: block.calibration?.cutout ?? fallback.calibration.cutout
      }
    } as PrototypeBlock;

    return normalizeRowPlotCounts(merged, merged.logicalRows);
  });
}

export function AdminWorkspace() {
  const [blocks, setBlocks] = useState<PrototypeBlock[]>(cloneBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState(prototypeBlocks[0]?.id ?? "A");
  const [blockVisualMode, setBlockVisualMode] = useState<VisualMode>("strips");
  const [entrances, setEntrances] = useState<CemeteryEntrance[]>(() => normalizeEntrances(prototypeEntrances));
  const [selectedEntranceId, setSelectedEntranceId] = useState(prototypeEntrances[0]?.id ?? "sligo-main-entrance");
  const [placingEntrance, setPlacingEntrance] = useState(false);
  const [status, setStatus] = useState("Unsaved local workspace");
  const [entranceStatus, setEntranceStatus] = useState("Entrance points ready");
  const [adminToken, setAdminToken] = useState("");
  const [calibration, setCalibration] = useState<MapCalibration>(defaultMapCalibration);
  const [calibrationStatus, setCalibrationStatus] = useState("Map calibration not saved this session");
  const [recordStatus, setRecordStatus] = useState("Record form ready");
  const [recordForm, setRecordForm] = useState({
    givenNames: "",
    familyName: "",
    dateOfBirth: "",
    dateOfDeath: "",
    plotReference: "",
    blockCode: "A",
    biography: "",
    inscription: ""
  });
  const [mapReady, setMapReady] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const placingEntranceRef = useRef(false);
  const selectedEntranceRef = useRef<CemeteryEntrance | null>(null);

  const selectedBlock = useMemo(
    () => blocks.find((block) => block.id === selectedBlockId) ?? blocks[0],
    [blocks, selectedBlockId]
  );
  const selectedEntrance = useMemo(
    () => entrances.find((entrance) => entrance.id === selectedEntranceId) ?? entrances[0],
    [entrances, selectedEntranceId]
  );

  useEffect(() => {
    placingEntranceRef.current = placingEntrance;
    selectedEntranceRef.current = selectedEntrance ?? null;
  }, [placingEntrance, selectedEntrance]);

  useEffect(() => {
    setAdminToken(window.localStorage.getItem(adminTokenKey) ?? "");

    async function loadRemoteLayout() {
      try {
        const response = await fetch("/api/block-layouts?cemetery=sligo-town-cemetery");
        const payload = (await response.json()) as { blocks?: PrototypeBlock[] | null; blockVisualMode?: VisualMode; source?: string };

        if (Array.isArray(payload.blocks) && payload.blocks.length > 0) {
          const loadedBlocks = normaliseLoadedBlocks(payload.blocks);
          setBlocks(loadedBlocks);
          setSelectedBlockId(loadedBlocks[0].id);
          setBlockVisualMode(payload.blockVisualMode ?? "strips");
          setStatus(payload.source === "supabase" ? "Loaded Supabase layout" : "Loaded fallback layout");
          return true;
        }
      } catch {
        setStatus("Remote layout unavailable");
      }

      return false;
    }

    loadRemoteLayout().then((loadedRemote) => {
      if (loadedRemote) return;

      const stored = window.localStorage.getItem(storageKey) ?? window.localStorage.getItem(legacyStorageKey);
      if (!stored) return;

      try {
        const parsed = JSON.parse(stored) as PrototypeBlock[] | { selectedBlockId?: string; blockVisualMode?: VisualMode; blocks?: PrototypeBlock[] };
        const parsedBlocks = Array.isArray(parsed) ? parsed : parsed.blocks;
        if (Array.isArray(parsedBlocks) && parsedBlocks.length > 0) {
          const loadedBlocks = normaliseLoadedBlocks(parsedBlocks);
          setBlocks(loadedBlocks);
          setSelectedBlockId(Array.isArray(parsed) ? loadedBlocks[0].id : parsed.selectedBlockId ?? loadedBlocks[0].id);
          setBlockVisualMode(Array.isArray(parsed) ? "strips" : parsed.blockVisualMode ?? "strips");
          setStatus("Loaded saved browser layout");
        }
      } catch {
        setStatus("Saved layout could not be loaded");
      }
    });
  }, []);

  useEffect(() => {
    async function loadEntrances() {
      try {
        const response = await fetch("/api/entrances?cemetery=sligo-town-cemetery");
        const payload = (await response.json()) as { entrances?: CemeteryEntrance[] | null; source?: string };
        const nextEntrances = normalizeEntrances(payload.entrances ?? null);
        setEntrances(nextEntrances);
        setSelectedEntranceId(nextEntrances[0]?.id ?? "sligo-main-entrance");
        setEntranceStatus(payload.source === "supabase" ? "Loaded saved entrances" : "Using starter entrances");
      } catch {
        setEntrances(normalizeEntrances(prototypeEntrances));
        setEntranceStatus("Using starter entrances");
      }
    }

    void loadEntrances();
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
        const nextCalibration = normalizeCalibration(payload.calibration);
        setCalibration(nextCalibration);
        setCalibrationStatus(payload.calibration ? "Loaded Supabase map calibration" : "Using default map calibration");
      } catch {
        setCalibration(defaultMapCalibration);
        setCalibrationStatus("Map calibration unavailable");
      }
    }

    void loadCalibration();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadLeafletMap() {
      if (!mapContainerRef.current || mapRef.current) {
        return;
      }

      const L = await import("leaflet");

      if (cancelled || !mapContainerRef.current) {
        return;
      }

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
        if (!placingEntranceRef.current || !selectedEntranceRef.current) return;

        const point = latLngToPercent(event.latlng.lat, event.latlng.lng, calibration);
        updateEntrance(selectedEntranceRef.current.id, { x: point.x, y: point.y });
        setEntranceStatus(`Placed ${selectedEntranceRef.current.name}`);
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

    if (!mapReady || !L || !map || !layer || !selectedBlock) {
      return;
    }

    layer.clearLayers();
    map.setView([calibration.centerLatitude, calibration.centerLongitude], calibration.defaultZoom);

    blocks.forEach((block) => {
      const isSelected = block.id === selectedBlock.id;

      L.polygon(blockToLatLngs(block, calibration), {
        className: isSelected ? "admin-map-block selected" : "admin-map-block",
        color: isSelected ? "#6b2bb2" : "#587b70",
        fillColor: isSelected ? "#8d3fd1" : "#2f6f58",
        fillOpacity: isSelected ? 0.18 : 0.13,
        weight: isSelected ? 2 : 1
      })
        .bindTooltip(block.name, { direction: "center", permanent: true })
        .on("click", () => setSelectedBlockId(block.id))
        .on("mousedown", (event) => {
          L.DomEvent.stop(event);
          setSelectedBlockId(block.id);
          map.dragging.disable();

          const start = latLngToPercent(event.latlng.lat, event.latlng.lng, calibration);
          const initial = { x: block.x, y: block.y };

          const handleMove = (moveEvent: import("leaflet").LeafletMouseEvent) => {
            const current = latLngToPercent(moveEvent.latlng.lat, moveEvent.latlng.lng, calibration);
            const nextX = Math.min(115, Math.max(-15, initial.x + current.x - start.x));
            const nextY = Math.min(115, Math.max(-15, initial.y + current.y - start.y));

            updateBlock({
              ...block,
              x: nextX,
              y: nextY,
              calibration: { ...block.calibration, x: nextX, y: nextY }
            });
          };

          const handleUp = () => {
            map.off("mousemove", handleMove);
            map.dragging.enable();
            setStatus(`Moved ${block.name}`);
          };

          map.on("mousemove", handleMove);
          map.once("mouseup", handleUp);
        })
        .addTo(layer);

      if (isSelected) {
        blockGuideLineLatLngs(block, calibration, 25, blockVisualMode).forEach((line) => {
          L.polyline(line, {
            color: "#6b2bb2",
            dashArray: blockVisualMode === "headstones" ? "2 5" : undefined,
            interactive: false,
            opacity: 0.45,
            weight: 1
          }).addTo(layer);
        });
      }
    });

    entrances.forEach((entrance) => {
      const isSelected = entrance.id === selectedEntrance?.id;

      L.marker(percentToLatLng(entrance.x, entrance.y, calibration), {
        draggable: true,
        icon: L.divIcon({
          className: isSelected ? "entrance-edit-handle selected" : "entrance-edit-handle",
          html: "<span>Entrance</span>"
        })
      })
        .bindTooltip(entrance.name)
        .on("click", () => setSelectedEntranceId(entrance.id))
        .on("dragend", (event) => {
          const marker = event.target as import("leaflet").Marker;
          const point = latLngToPercent(marker.getLatLng().lat, marker.getLatLng().lng, calibration);
          updateEntrance(entrance.id, { x: point.x, y: point.y });
          setSelectedEntranceId(entrance.id);
          setEntranceStatus(`Moved ${entrance.name}`);
        })
        .addTo(layer);
    });
  }, [blocks, blockVisualMode, calibration, entrances, mapReady, selectedBlock, selectedEntrance]);

  function updateBlock(nextBlock: PrototypeBlock) {
    setBlocks((currentBlocks) => currentBlocks.map((block) => (block.id === nextBlock.id ? normalizeRowPlotCounts(nextBlock) : block)));
    setStatus("Layout changed");
  }

  function latLngToPercent(latitude: number, longitude: number, currentCalibration: MapCalibration) {
    const metersPerDegreeLatitude = 111_320;
    const metersPerDegreeLongitude = metersPerDegreeLatitude * Math.cos((currentCalibration.centerLatitude * Math.PI) / 180);
    const xMeters = (longitude - currentCalibration.centerLongitude) * metersPerDegreeLongitude;
    const yMeters = (latitude - currentCalibration.centerLatitude) * metersPerDegreeLatitude;

    return {
      x: 50 + (xMeters / currentCalibration.overlayWidthMeters) * 100,
      y: 50 - (yMeters / currentCalibration.overlayHeightMeters) * 100
    };
  }

  function updateBlockCalibration(field: "width" | "height" | "rotate", value: number) {
    updateBlock({
      ...selectedBlock,
      calibration: { ...selectedBlock.calibration, [field]: value },
      rotate: field === "rotate" ? value : selectedBlock.rotate
    });
  }

  function updateBlockPosition(field: "x" | "y", value: number) {
    updateBlock({
      ...selectedBlock,
      [field]: value,
      calibration: { ...selectedBlock.calibration, [field]: value }
    });
  }

  function updateBlockMapSize(field: "width" | "height", value: number) {
    updateBlock({ ...selectedBlock, [field]: value });
  }

  function updateBlockCutout(field: keyof PrototypeBlock["calibration"]["cutout"], value: number) {
    updateBlock({
      ...selectedBlock,
      calibration: {
        ...selectedBlock.calibration,
        cutout: { ...selectedBlock.calibration.cutout, [field]: value }
      }
    });
  }

  function updateBlockTemplate(value: string) {
    const rowsPerStrip = value === "irregular" ? Math.max(2, selectedBlock.rowsPerStrip || 2) : Number(value);
    const stripRowCounts = Object.fromEntries(Array.from({ length: selectedBlock.physicalStrips }, (_, index) => [String(index + 1), rowsPerStrip]));
    const nextBlock = {
      ...selectedBlock,
      blockTemplate: value === "irregular" ? "irregular" : `standard-${rowsPerStrip}`,
      rowsPerStrip,
      stripRowCounts,
      calibration: {
        ...selectedBlock.calibration,
        polygon:
          value === "irregular" && !selectedBlock.calibration.polygon
            ? [
                { x: 0, y: 0 },
                { x: 100, y: 8 },
                { x: 92, y: 100 },
                { x: 4, y: 86 }
              ]
            : selectedBlock.calibration.polygon
      }
    };
    updateBlock(normalizeRowPlotCounts(nextBlock, getLogicalRowsFromStrips(nextBlock)));
  }

  function updateBlockShape(shape: "rectangle" | "polygon") {
    updateBlock({
      ...selectedBlock,
      shape,
      calibration: {
        ...selectedBlock.calibration,
        polygon:
          shape === "polygon"
            ? selectedBlock.calibration.polygon ?? [
                { x: 6, y: 8 },
                { x: 92, y: 0 },
                { x: 100, y: 84 },
                { x: 14, y: 100 }
              ]
            : selectedBlock.calibration.polygon
      }
    });
  }

  function updatePhysicalStrips(value: number) {
    const physicalStrips = Math.min(40, Math.max(1, value || 1));
    const nextBlock = {
      ...selectedBlock,
      physicalStrips,
      stripRowCounts: normalizeStripRowCounts({ ...selectedBlock, physicalStrips })
    };
    updateBlock(normalizeRowPlotCounts(nextBlock, getLogicalRowsFromStrips(nextBlock)));
  }

  function updateLogicalRows(value: number) {
    updateBlock(normalizeRowPlotCounts(selectedBlock, Math.min(160, Math.max(1, value || 1))));
  }

  function updateStripRowCount(strip: string, value: number) {
    const nextBlock = {
      ...selectedBlock,
      stripRowCounts: {
        ...selectedBlock.stripRowCounts,
        [strip]: Math.min(5, Math.max(1, value || 1))
      },
      blockTemplate: "irregular"
    };
    updateBlock(normalizeRowPlotCounts(nextBlock, getLogicalRowsFromStrips(nextBlock)));
  }

  function updateRowPlotCount(row: string, value: number) {
    updateBlock({
      ...selectedBlock,
      rowPlotCounts: {
        ...selectedBlock.rowPlotCounts,
        [row]: Math.min(200, Math.max(1, value || 1))
      }
    });
  }

  function updateRowRule(index: number, field: "start" | "end" | "plotsPerRow", value: number) {
    const rowRules = selectedBlock.rowRules.map((rule, ruleIndex) => {
      if (ruleIndex !== index) return rule;
      const rows: [number, number] = [...rule.rows];
      if (field === "start") rows[0] = Math.min(selectedBlock.logicalRows, Math.max(1, value || 1));
      if (field === "end") rows[1] = Math.min(selectedBlock.logicalRows, Math.max(rows[0], value || rows[0]));
      return {
        rows,
        plotsPerRow: field === "plotsPerRow" ? Math.min(200, Math.max(1, value || 1)) : rule.plotsPerRow
      };
    });
    const rowPlotCounts = { ...selectedBlock.rowPlotCounts };
    rowRules.forEach((rule) => {
      for (let row = rule.rows[0]; row <= rule.rows[1]; row += 1) {
        rowPlotCounts[String(row)] = rule.plotsPerRow;
      }
    });
    updateBlock({ ...selectedBlock, rowRules, rowPlotCounts });
  }

  function addRowRule() {
    const newRule: PrototypeBlockRowRule = { rows: [1, selectedBlock.logicalRows], plotsPerRow: 32 };
    updateBlock({ ...selectedBlock, rowRules: [...selectedBlock.rowRules, newRule] });
  }

  function deleteRowRule(index: number) {
    const rowRules = selectedBlock.rowRules.filter((_, ruleIndex) => ruleIndex !== index);
    updateBlock({ ...selectedBlock, rowRules: rowRules.length ? rowRules : [{ rows: [1, selectedBlock.logicalRows], plotsPerRow: 32 }] });
  }

  function updateCalibration(field: keyof MapCalibration, value: number) {
    setCalibration((current) => ({ ...current, [field]: value }));
    setCalibrationStatus("Calibration changed");
  }

  function updateEntrance(entranceId: string, updates: Partial<CemeteryEntrance>) {
    setEntrances((current) => current.map((entrance) => (entrance.id === entranceId ? { ...entrance, ...updates } : entrance)));
  }

  function addEntrance() {
    const entrance: CemeteryEntrance = {
      id: `entrance-${Date.now()}`,
      name: `Entrance ${entrances.length + 1}`,
      x: 50,
      y: 50,
      qrCode: `graveguide-entrance-${entrances.length + 1}`,
      linkedBlockId: null
    };

    setEntrances((current) => [...current, entrance]);
    setSelectedEntranceId(entrance.id);
    setPlacingEntrance(true);
    setEntranceStatus("Click the map or drag the pin to place this entrance");
  }

  function deleteEntrance() {
    if (!selectedEntrance || entrances.length <= 1) {
      setEntranceStatus("Keep at least one entrance");
      return;
    }

    const nextEntrances = entrances.filter((entrance) => entrance.id !== selectedEntrance.id);
    setEntrances(nextEntrances);
    setSelectedEntranceId(nextEntrances[0].id);
    setEntranceStatus(`Deleted ${selectedEntrance.name}`);
  }

  async function saveEntrances() {
    setEntranceStatus("Saving entrances");

    try {
      const response = await fetch("/api/entrances", {
        body: JSON.stringify({ cemeterySlug: "sligo-town-cemetery", entrances }),
        headers: {
          "content-type": "application/json",
          "x-graveguide-admin-token": adminToken
        },
        method: "POST"
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setEntranceStatus(payload.error ?? "Entrance save failed");
        return;
      }

      setEntranceStatus("Saved entrances");
    } catch {
      setEntranceStatus("Entrance save unavailable");
    }
  }

  function useCurrentMapViewAsStart() {
    const map = mapRef.current;

    if (!map) {
      setCalibrationStatus("Map is still loading");
      return;
    }

    const center = map.getCenter();
    setCalibration((current) => ({
      ...current,
      centerLatitude: Number(center.lat.toFixed(7)),
      centerLongitude: Number(center.lng.toFixed(7)),
      defaultZoom: map.getZoom()
    }));
    setCalibrationStatus("Saved centre copied from current map view");
  }

  function updateRecordForm(field: keyof typeof recordForm, value: string) {
    setRecordForm((current) => ({ ...current, [field]: value }));
    setRecordStatus("Record form changed");
  }

  async function saveLayout() {
    window.localStorage.setItem(storageKey, JSON.stringify(blocks));
    window.localStorage.setItem(legacyStorageKey, JSON.stringify({ selectedBlockId, blockVisualMode, blocks }));
    setStatus("Saved to this browser");

    try {
      const response = await fetch("/api/block-layouts", {
        body: JSON.stringify({
          cemeterySlug: "sligo-town-cemetery",
          blockVisualMode,
          blocks
        }),
        headers: {
          "content-type": "application/json",
          "x-graveguide-admin-token": adminToken
        },
        method: "POST"
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setStatus(payload.error ?? "Saved locally; Supabase save unavailable");
        return;
      }

      setStatus("Saved to Supabase and this browser");
    } catch {
      setStatus("Saved locally; Supabase save unavailable");
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
        headers: {
          "content-type": "application/json",
          "x-graveguide-admin-token": adminToken
        },
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
      const response = await fetch("/api/admin-records", {
        body: JSON.stringify({
          cemeterySlug: "sligo-town-cemetery",
          ...recordForm
        }),
        headers: {
          "content-type": "application/json",
          "x-graveguide-admin-token": adminToken
        },
        method: "POST"
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setRecordStatus(payload.error ?? "Record save failed");
        return;
      }

      setRecordStatus("Saved record to Supabase");
      setRecordForm({
        givenNames: "",
        familyName: "",
        dateOfBirth: "",
        dateOfDeath: "",
        plotReference: "",
        blockCode: "A",
        biography: "",
        inscription: ""
      });
    } catch {
      setRecordStatus("Record save unavailable");
    }
  }

  function resetLayout() {
    const defaults = cloneBlocks();
    setBlocks(defaults);
    setSelectedBlockId(defaults[0].id);
    setBlockVisualMode("strips");
    window.localStorage.removeItem(storageKey);
    window.localStorage.removeItem(legacyStorageKey);
    setStatus("Reset to prototype defaults");
  }

  function addBlock() {
    const nextId = getNextBlockId(blocks);
    const newBlock = createPrototypeBlock(nextId, blocks.length);
    setBlocks((currentBlocks) => [...currentBlocks, newBlock]);
    setSelectedBlockId(newBlock.id);
    setStatus(`Added ${newBlock.name}`);
  }

  function deleteSelectedBlock() {
    if (blocks.length <= 1 || selectedBlock.id === "A") {
      setStatus("Keep Block A and at least one block");
      return;
    }

    const nextBlocks = blocks.filter((block) => block.id !== selectedBlock.id);
    setBlocks(nextBlocks);
    setSelectedBlockId(nextBlocks[0].id);
    setStatus(`Deleted ${selectedBlock.name}`);
  }

  const templateValue = selectedBlock.blockTemplate === "irregular" ? "irregular" : String(selectedBlock.rowsPerStrip);
  const stripEntries = Object.entries(selectedBlock.stripRowCounts);
  const rowEntries = Object.entries(selectedBlock.rowPlotCounts);

  return (
    <section className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-title">
          <span>Admin workspace</span>
          <h1>Map calibration</h1>
        </div>
        <p>Original prototype block rules restored: physical strips, row templates, irregular strip rows, cut-outs, and plot counts.</p>
        <label className="admin-token-field">
          Admin token
          <input onChange={(event) => setAdminToken(event.target.value)} placeholder="Optional save token" type="password" value={adminToken} />
        </label>
        <div className="calibration-editor">
          <strong>Map start position</strong>
          <span>{calibrationStatus}</span>
          <p>Move the map until the cemetery is centred, then click the button below. The number fields are tucked away because you should rarely need them.</p>
          <button onClick={useCurrentMapViewAsStart} type="button">
            Use current map view
          </button>
          <details>
            <summary>Advanced map numbers</summary>
            <label>
              Centre latitude
              <input onChange={(event) => updateCalibration("centerLatitude", Number(event.target.value))} step="0.00001" type="number" value={calibration.centerLatitude} />
            </label>
            <label>
              Centre longitude
              <input onChange={(event) => updateCalibration("centerLongitude", Number(event.target.value))} step="0.00001" type="number" value={calibration.centerLongitude} />
            </label>
            <label>
              Overlay width metres
              <input onChange={(event) => updateCalibration("overlayWidthMeters", Number(event.target.value))} step="1" type="number" value={calibration.overlayWidthMeters} />
            </label>
            <label>
              Overlay height metres
              <input onChange={(event) => updateCalibration("overlayHeightMeters", Number(event.target.value))} step="1" type="number" value={calibration.overlayHeightMeters} />
            </label>
          </details>
          <button onClick={() => void saveCalibration()} type="button">
            Save map start position
          </button>
        </div>
        <div className="record-editor">
          <strong>Add grave record</strong>
          <span>{recordStatus}</span>
          <div className="record-editor-grid">
            <label>
              First names
              <input onChange={(event) => updateRecordForm("givenNames", event.target.value)} placeholder="Andrew" value={recordForm.givenNames} />
            </label>
            <label>
              Family name
              <input onChange={(event) => updateRecordForm("familyName", event.target.value)} placeholder="Hosie" value={recordForm.familyName} />
            </label>
            <label>
              Born
              <input onChange={(event) => updateRecordForm("dateOfBirth", event.target.value)} type="date" value={recordForm.dateOfBirth} />
            </label>
            <label>
              Died
              <input onChange={(event) => updateRecordForm("dateOfDeath", event.target.value)} type="date" value={recordForm.dateOfDeath} />
            </label>
            <label>
              Plot
              <input onChange={(event) => updateRecordForm("plotReference", event.target.value)} placeholder="A-01-001" value={recordForm.plotReference} />
            </label>
            <label>
              Block
              <input onChange={(event) => updateRecordForm("blockCode", event.target.value)} placeholder="A" value={recordForm.blockCode} />
            </label>
          </div>
          <label>
            Notes
            <textarea onChange={(event) => updateRecordForm("biography", event.target.value)} placeholder="Short public note" value={recordForm.biography} />
          </label>
          <button onClick={() => void saveRecord()} type="button">
            Save grave record
          </button>
        </div>
      </aside>

      <section className="admin-board">
        <div className="admin-board-head">
          <div className="admin-sidebar-title">
            <span>Admin tools active</span>
            <h2>Sligo Town Cemetery</h2>
          </div>
          <div className="admin-toolbar">
            <button onClick={() => void saveLayout()} type="button">
              <Save size={16} aria-hidden="true" />
              Save layout
            </button>
            <button onClick={resetLayout} type="button">
              <RotateCcw size={16} aria-hidden="true" />
              Reset
            </button>
            <button onClick={deleteSelectedBlock} type="button">
              <Trash2 size={16} aria-hidden="true" />
              Delete selected
            </button>
          </div>
        </div>

        <div className="admin-summary">
          <div>
            <strong>1 cemetery</strong>
            <span>Sligo Town Cemetery</span>
          </div>
          <div>
            <strong>{entrances.length} entrances</strong>
            <span>Main QR points</span>
          </div>
          <div>
            <strong>{prototypeRecords.length} records</strong>
            <span>Test burial data</span>
          </div>
        </div>

        <div className="admin-workspace-grid">
          <div className="admin-map">
            <div className="admin-leaflet-map" ref={mapContainerRef} aria-label="Admin Leaflet layout map" />
            <span className="admin-save-status">{status}</span>
          </div>

          <aside className="block-editor">
            <section className="block-manager">
              <h3>Blocks</h3>
              <label>
                Active block
                <select onChange={(event) => setSelectedBlockId(event.target.value)} value={selectedBlock.id}>
                  {blocks.map((block) => (
                    <option key={block.id} value={block.id}>
                      {block.name}
                    </option>
                  ))}
                </select>
              </label>
              <button className="pill-action" onClick={addBlock} type="button">
                <Plus size={17} aria-hidden="true" />
                Add block
              </button>
              <div className="editing-pill">Editing {selectedBlock.name}</div>
            </section>

            <section className="editor-section entrance-editor">
              <div className="section-title-row">
                <strong>Entrances</strong>
                <button onClick={() => void saveEntrances()} type="button">Save</button>
              </div>
              <span>{entranceStatus}</span>
              <label>
                Active entrance
                <select onChange={(event) => setSelectedEntranceId(event.target.value)} value={selectedEntrance?.id ?? ""}>
                  {entrances.map((entrance) => (
                    <option key={entrance.id} value={entrance.id}>
                      {entrance.name}
                    </option>
                  ))}
                </select>
              </label>
              {selectedEntrance ? (
                <>
                  <label>
                    Entrance name
                    <input onChange={(event) => updateEntrance(selectedEntrance.id, { name: event.target.value })} value={selectedEntrance.name} />
                  </label>
                  <div className="entrance-code">
                    <span>QR code</span>
                    <code>{selectedEntrance.qrCode}</code>
                  </div>
                </>
              ) : null}
              <div className="entrance-action-row">
                <button onClick={addEntrance} type="button">Add entrance</button>
                <button onClick={deleteEntrance} type="button">Delete</button>
              </div>
              <button className={placingEntrance ? "pill-action active" : "pill-action"} onClick={() => setPlacingEntrance((current) => !current)} type="button">
                <MapPin size={16} aria-hidden="true" />
                {placingEntrance ? "Stop placing" : "Place on map"}
              </button>
            </section>

            <section className="editor-section">
              <div className="block-editor-head">
                <div>
                  <span>Block editor</span>
                  <h2>{selectedBlock.name}</h2>
                </div>
                <strong>{getBlockPlotTotal(selectedBlock)} plots</strong>
              </div>
              <div className="block-config-summary">
                <span>{selectedBlock.physicalStrips} strips</span>
                <span>{selectedBlock.logicalRows} rows</span>
                <span>{getBlockShape(selectedBlock)}</span>
              </div>
              <label>
                Block shape
                <select onChange={(event) => updateBlockShape(event.target.value as "rectangle" | "polygon")} value={getBlockShape(selectedBlock)}>
                  <option value="rectangle">Rectangle</option>
                  <option value="polygon">Polygon</option>
                </select>
              </label>
              <label>
                Visual mode
                <select onChange={(event) => setBlockVisualMode(event.target.value as VisualMode)} value={blockVisualMode}>
                  <option value="strips">Strips</option>
                  <option value="rows">Rows</option>
                  <option value="headstones">Headstones</option>
                </select>
              </label>
            </section>

            <section className="editor-section">
              <strong>Prototype calibration</strong>
              <label>
                Width
                <input max="180" min="20" onChange={(event) => updateBlockCalibration("width", Number(event.target.value))} type="range" value={selectedBlock.calibration.width} />
                <span>{Math.round(selectedBlock.calibration.width)} px</span>
              </label>
              <label>
                Height
                <input max="180" min="20" onChange={(event) => updateBlockCalibration("height", Number(event.target.value))} type="range" value={selectedBlock.calibration.height} />
                <span>{Math.round(selectedBlock.calibration.height)} px</span>
              </label>
              <label>
                Rotate
                <input max="90" min="-90" onChange={(event) => updateBlockCalibration("rotate", Number(event.target.value))} type="range" value={selectedBlock.calibration.rotate} />
                <span>{Math.round(selectedBlock.calibration.rotate)} deg</span>
              </label>
              <div className="cutout-grid">
                {(["x", "y", "width", "height"] as const).map((field) => (
                  <label key={field}>
                    Cut-out {field}
                    <input
                      max={field === "width" || field === "height" ? 60 : 40}
                      min={field === "width" || field === "height" ? 0 : -40}
                      onChange={(event) => updateBlockCutout(field, Number(event.target.value))}
                      type="range"
                      value={selectedBlock.calibration.cutout[field]}
                    />
                    <span>{Math.round(selectedBlock.calibration.cutout[field])}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="editor-section">
              <strong>Map placement</strong>
              <label>
                X position
                <input max="115" min="-15" onChange={(event) => updateBlockPosition("x", Number(event.target.value))} type="range" value={selectedBlock.x} />
                <span>{selectedBlock.x.toFixed(1)}%</span>
              </label>
              <label>
                Y position
                <input max="115" min="-15" onChange={(event) => updateBlockPosition("y", Number(event.target.value))} type="range" value={selectedBlock.y} />
                <span>{selectedBlock.y.toFixed(1)}%</span>
              </label>
              <div className="block-structure-grid">
                <label>
                  Map width
                  <input max="44" min="8" onChange={(event) => updateBlockMapSize("width", Number(event.target.value))} type="number" value={selectedBlock.width} />
                </label>
                <label>
                  Map height
                  <input max="44" min="8" onChange={(event) => updateBlockMapSize("height", Number(event.target.value))} type="number" value={selectedBlock.height} />
                </label>
              </div>
            </section>

            <section className="editor-section">
              <strong>Block structure</strong>
              <div className="block-structure-grid">
                <label>
                  Template
                  <select onChange={(event) => updateBlockTemplate(event.target.value)} value={templateValue}>
                    <option value="1">1 row per strip</option>
                    <option value="2">2 rows per strip</option>
                    <option value="3">3 rows per strip</option>
                    <option value="4">4 rows per strip</option>
                    <option value="5">5 rows per strip</option>
                    <option value="irregular">Custom strip rows</option>
                  </select>
                </label>
                <label>
                  Strip count
                  <input max="40" min="1" onChange={(event) => updatePhysicalStrips(Number(event.target.value))} type="number" value={selectedBlock.physicalStrips} />
                </label>
                <label>
                  Row count
                  <input max="160" min="1" onChange={(event) => updateLogicalRows(Number(event.target.value))} type="number" value={selectedBlock.logicalRows} />
                </label>
              </div>
              <div className="strip-row-editor">
                {stripEntries.map(([strip, count]) => (
                  <label key={strip}>
                    Strip {strip}
                    <input max="5" min="1" onChange={(event) => updateStripRowCount(strip, Number(event.target.value))} type="number" value={count} />
                  </label>
                ))}
              </div>
            </section>

            <section className="editor-section">
              <div className="section-title-row">
                <strong>Row plot rules</strong>
                <button onClick={addRowRule} type="button">Add rule</button>
              </div>
              <div className="row-rule-list">
                {selectedBlock.rowRules.map((rule, index) => (
                  <div className="row-rule-item" key={`${rule.rows[0]}-${rule.rows[1]}-${index}`}>
                    <label>
                      From
                      <input max={selectedBlock.logicalRows} min="1" onChange={(event) => updateRowRule(index, "start", Number(event.target.value))} type="number" value={rule.rows[0]} />
                    </label>
                    <label>
                      To
                      <input max={selectedBlock.logicalRows} min="1" onChange={(event) => updateRowRule(index, "end", Number(event.target.value))} type="number" value={rule.rows[1]} />
                    </label>
                    <label>
                      Plots
                      <input max="200" min="1" onChange={(event) => updateRowRule(index, "plotsPerRow", Number(event.target.value))} type="number" value={rule.plotsPerRow} />
                    </label>
                    <button onClick={() => deleteRowRule(index)} type="button">Remove</button>
                  </div>
                ))}
              </div>
              <details className="row-count-editor">
                <summary>Individual row counts</summary>
                <div>
                  {rowEntries.map(([row, count]) => (
                    <label key={row}>
                      Row {row}
                      <input max="200" min="1" onChange={(event) => updateRowPlotCount(row, Number(event.target.value))} type="number" value={count} />
                    </label>
                  ))}
                </div>
              </details>
            </section>
          </aside>
        </div>
      </section>
    </section>
  );
}
