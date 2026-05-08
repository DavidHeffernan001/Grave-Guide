"use client";

import { RotateCcw, Save, SlidersHorizontal, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  blockPolygonToLatLngs,
  cemeteryPathPercentLines,
  defaultMapCalibration,
  normalizeCalibration,
  percentToLatLng,
  type CalibrationApiRow,
  type MapCalibration
} from "@/lib/map-geometry";
import { prototypeBlocks, prototypeEntrances, prototypeRecords, type PrototypeBlock } from "@/lib/prototype-data";

const storageKey = "graveguide-admin-blocks-v1";
const adminTokenKey = "graveguide-admin-token";
type LeafletModule = typeof import("leaflet");
type CalibrationPayload = { calibration?: CalibrationApiRow | null };

function cloneBlocks() {
  return prototypeBlocks.map((block) => ({ ...block }));
}

export function AdminWorkspace() {
  const [blocks, setBlocks] = useState<PrototypeBlock[]>(cloneBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState(prototypeBlocks[0]?.id ?? "A");
  const [status, setStatus] = useState("Unsaved local workspace");
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

  useEffect(() => {
    setAdminToken(window.localStorage.getItem(adminTokenKey) ?? "");

    async function loadRemoteLayout() {
      try {
        const response = await fetch("/api/block-layouts?cemetery=sligo-town-cemetery");
        const payload = (await response.json()) as { blocks?: PrototypeBlock[] | null; source?: string };

        if (Array.isArray(payload.blocks) && payload.blocks.length > 0) {
          setBlocks(payload.blocks);
          setSelectedBlockId(payload.blocks[0].id);
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

      const stored = window.localStorage.getItem(storageKey);

      if (!stored) return;

      try {
        const parsed = JSON.parse(stored) as PrototypeBlock[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBlocks(parsed);
          setSelectedBlockId(parsed[0].id);
          setStatus("Loaded saved browser layout");
        }
      } catch {
        setStatus("Saved layout could not be loaded");
      }
    });
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

  const selectedBlock = useMemo(
    () => blocks.find((block) => block.id === selectedBlockId) ?? blocks[0],
    [blocks, selectedBlockId]
  );

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

    if (!mapReady || !L || !map || !layer) {
      return;
    }

    layer.clearLayers();
    map.setView([calibration.centerLatitude, calibration.centerLongitude], calibration.defaultZoom);

    cemeteryPathPercentLines.forEach((line) => {
      L.polyline(
        line.map((point) => percentToLatLng(point.x, point.y, calibration)),
        { color: "#d4a47d", interactive: false, opacity: 0.7, weight: 9 }
      ).addTo(layer);
    });

    blocks.forEach((block) => {
      const isSelected = block.id === selectedBlock.id;

      L.polygon(blockPolygonToLatLngs(block, calibration, 25), {
        color: isSelected ? "#b46b34" : "#587b70",
        fillColor: isSelected ? "#b46b34" : "#2f6f58",
        fillOpacity: isSelected ? 0.18 : 0.13,
        weight: isSelected ? 2 : 1
      })
        .bindTooltip(block.name, { direction: "center", permanent: true })
        .on("click", () => setSelectedBlockId(block.id))
        .addTo(layer);
    });

    prototypeEntrances.forEach((entrance) => {
      L.circleMarker(percentToLatLng(entrance.x, entrance.y, calibration), {
        color: "#fffdf8",
        fillColor: "#b46b34",
        fillOpacity: 1,
        radius: 6,
        weight: 2
      })
        .bindTooltip(entrance.name)
        .addTo(layer);
    });
  }, [blocks, calibration, mapReady, selectedBlock.id]);

  function updateSelectedBlock(field: keyof Pick<PrototypeBlock, "x" | "y" | "width" | "height" | "rotate">, value: number) {
    setBlocks((currentBlocks) =>
      currentBlocks.map((block) => (block.id === selectedBlock.id ? { ...block, [field]: value } : block))
    );
    setStatus("Layout changed");
  }

  function updateCalibration(field: keyof MapCalibration, value: number) {
    setCalibration((current) => ({
      ...current,
      [field]: value
    }));
    setCalibrationStatus("Calibration changed");
  }

  function updateRecordForm(field: keyof typeof recordForm, value: string) {
    setRecordForm((current) => ({
      ...current,
      [field]: value
    }));
    setRecordStatus("Record form changed");
  }

  async function saveLayout() {
    window.localStorage.setItem(storageKey, JSON.stringify(blocks));
    setStatus("Saved to this browser");

    try {
      const response = await fetch("/api/block-layouts", {
        body: JSON.stringify({
          cemeterySlug: "sligo-town-cemetery",
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
    window.localStorage.removeItem(storageKey);
    setStatus("Reset to prototype defaults");
  }

  function addBlock() {
    const nextLetter = String.fromCharCode(65 + blocks.length);
    const newBlock: PrototypeBlock = {
      id: nextLetter,
      name: `Block ${nextLetter}`,
      x: 58,
      y: 42,
      width: 20,
      height: 18,
      rotate: 39
    };

    setBlocks((currentBlocks) => [...currentBlocks, newBlock]);
    setSelectedBlockId(newBlock.id);
    setStatus(`Added ${newBlock.name}`);
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

  return (
    <section className="admin-layout">
      <aside className="admin-sidebar">
        <h1>Sligo Town Cemetery</h1>
        <p>Configuration workspace rebuilt from the original prototype. Changes save locally for now.</p>
        <label className="admin-token-field">
          Admin token
          <input
            onChange={(event) => setAdminToken(event.target.value)}
            placeholder="Optional save token"
            type="password"
            value={adminToken}
          />
        </label>
        <div className="calibration-editor">
          <strong>Real map calibration</strong>
          <span>{calibrationStatus}</span>
          <label>
            Centre latitude
            <input
              onChange={(event) => updateCalibration("centerLatitude", Number(event.target.value))}
              step="0.00001"
              type="number"
              value={calibration.centerLatitude}
            />
          </label>
          <label>
            Centre longitude
            <input
              onChange={(event) => updateCalibration("centerLongitude", Number(event.target.value))}
              step="0.00001"
              type="number"
              value={calibration.centerLongitude}
            />
          </label>
          <label>
            Overlay width metres
            <input
              onChange={(event) => updateCalibration("overlayWidthMeters", Number(event.target.value))}
              step="1"
              type="number"
              value={calibration.overlayWidthMeters}
            />
          </label>
          <label>
            Overlay height metres
            <input
              onChange={(event) => updateCalibration("overlayHeightMeters", Number(event.target.value))}
              step="1"
              type="number"
              value={calibration.overlayHeightMeters}
            />
          </label>
          <button onClick={() => void saveCalibration()} type="button">
            Save map calibration
          </button>
        </div>
        <div className="admin-stat">
          <strong>{blocks.length}</strong>
          <span>Blocks</span>
        </div>
        <div className="admin-stat">
          <strong>{prototypeRecords.length}</strong>
          <span>Demo records</span>
        </div>
        <div className="admin-stat">
          <strong>{prototypeEntrances.length}</strong>
          <span>QR entrances</span>
        </div>
        <div className="record-editor">
          <strong>Add grave record</strong>
          <span>{recordStatus}</span>
          <div className="record-editor-grid">
            <label>
              First names
              <input
                onChange={(event) => updateRecordForm("givenNames", event.target.value)}
                placeholder="Andrew"
                value={recordForm.givenNames}
              />
            </label>
            <label>
              Family name
              <input
                onChange={(event) => updateRecordForm("familyName", event.target.value)}
                placeholder="Hosie"
                value={recordForm.familyName}
              />
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
              <input
                onChange={(event) => updateRecordForm("plotReference", event.target.value)}
                placeholder="A-01-001"
                value={recordForm.plotReference}
              />
            </label>
            <label>
              Block
              <input onChange={(event) => updateRecordForm("blockCode", event.target.value)} placeholder="A" value={recordForm.blockCode} />
            </label>
          </div>
          <label>
            Notes
            <textarea
              onChange={(event) => updateRecordForm("biography", event.target.value)}
              placeholder="Short public note"
              value={recordForm.biography}
            />
          </label>
          <button onClick={() => void saveRecord()} type="button">
            Save grave record
          </button>
        </div>
      </aside>

      <section className="admin-board">
        <div className="admin-toolbar">
          <button onClick={() => void saveLayout()} type="button">
            <Save size={16} aria-hidden="true" />
            Save layout
          </button>
          <button onClick={addBlock} type="button">
            <SlidersHorizontal size={16} aria-hidden="true" />
            Add block
          </button>
          <button onClick={resetLayout} type="button">
            <RotateCcw size={16} aria-hidden="true" />
            Reset
          </button>
          <button onClick={deleteSelectedBlock} type="button">
            <Trash2 size={16} aria-hidden="true" />
            Delete selected
          </button>
          <span className="admin-save-status">{status}</span>
        </div>

        <div className="admin-workspace-grid">
          <div className="admin-map">
            <div className="admin-leaflet-map" ref={mapContainerRef} aria-label="Admin Leaflet layout map" />
          </div>

          <aside className="block-editor">
            <h2>{selectedBlock.name}</h2>
            <p>Adjust the selected block overlay.</p>
            <label>
              X position
              <input
                max="110"
                min="0"
                onChange={(event) => updateSelectedBlock("x", Number(event.target.value))}
                type="range"
                value={selectedBlock.x}
              />
              <span>{selectedBlock.x.toFixed(1)}%</span>
            </label>
            <label>
              Y position
              <input
                max="100"
                min="0"
                onChange={(event) => updateSelectedBlock("y", Number(event.target.value))}
                type="range"
                value={selectedBlock.y}
              />
              <span>{selectedBlock.y.toFixed(1)}%</span>
            </label>
            <label>
              Width
              <input
                max="40"
                min="8"
                onChange={(event) => updateSelectedBlock("width", Number(event.target.value))}
                type="range"
                value={selectedBlock.width}
              />
              <span>{selectedBlock.width}%</span>
            </label>
            <label>
              Height
              <input
                max="42"
                min="8"
                onChange={(event) => updateSelectedBlock("height", Number(event.target.value))}
                type="range"
                value={selectedBlock.height}
              />
              <span>{selectedBlock.height}%</span>
            </label>
            <label>
              Rotation
              <input
                max="90"
                min="-90"
                onChange={(event) => updateSelectedBlock("rotate", Number(event.target.value))}
                type="range"
                value={selectedBlock.rotate}
              />
              <span>{selectedBlock.rotate}deg</span>
            </label>
          </aside>
        </div>

        <div className="admin-panels">
          {blocks.map((block) => (
            <button
              className={block.id === selectedBlock.id ? "admin-panel selected" : "admin-panel"}
              key={block.id}
              onClick={() => setSelectedBlockId(block.id)}
              type="button"
            >
              <span className="admin-panel-dot" />
              <div>
                <strong>{block.name}</strong>
                <span>
                  x {block.x.toFixed(1)} / y {block.y.toFixed(1)} / {block.rotate}deg
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </section>
  );
}
