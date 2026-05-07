"use client";

import { LocateFixed, MapPin, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { prototypeBlocks, prototypeEntrances, prototypeRecords, searchPrototypeRecords, type PrototypeBlock } from "@/lib/prototype-data";

type LeafletModule = typeof import("leaflet");

type MapRecord = {
  id: string;
  fullName: string;
  dates: string;
  plotId: string;
  blockId: string;
  x: number | null;
  y: number | null;
  source: "supabase" | "prototype";
  cemeteryName?: string;
};

type RecordsPayload = {
  records?: Array<Omit<MapRecord, "source">>;
};

type CalibrationPayload = {
  calibration?: {
    center_latitude: number;
    center_longitude: number;
    default_zoom: number;
    calibration_notes: string | null;
  } | null;
  source?: string;
};

function rotatePoint(x: number, y: number, centerX: number, centerY: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const translatedX = x - centerX;
  const translatedY = y - centerY;

  return [centerY + translatedX * sin + translatedY * cos, centerX + translatedX * cos - translatedY * sin] as [number, number];
}

function prototypeRecord(record: (typeof prototypeRecords)[number]): MapRecord {
  return {
    ...record,
    source: "prototype"
  };
}

export function CemeteryMapClient() {
  const [query, setQuery] = useState("Andrew");
  const [blocks, setBlocks] = useState<PrototypeBlock[]>(prototypeBlocks);
  const [databaseRecords, setDatabaseRecords] = useState<MapRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const [status, setStatus] = useState("Loading map");
  const [calibrationStatus, setCalibrationStatus] = useState("Checking map calibration");
  const [mapReady, setMapReady] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);

  const prototypeMatches = useMemo(() => searchPrototypeRecords(query).map(prototypeRecord), [query]);
  const databasePlotIds = new Set(databaseRecords.map((record) => record.plotId));
  const matches = [...databaseRecords, ...prototypeMatches.filter((record) => !databasePlotIds.has(record.plotId))];
  const selectedRecord =
    matches.find((record) => record.id === selectedRecordId) ??
    matches[0] ??
    prototypeRecords.map(prototypeRecord).find((record) => record.plotId === "A-01-001") ??
    prototypeRecord(prototypeRecords[0]);

  useEffect(() => {
    async function loadLayout() {
      try {
        const response = await fetch("/api/block-layouts?cemetery=sligo-town-cemetery");
        const payload = (await response.json()) as { blocks?: PrototypeBlock[] | null; source?: string };

        if (Array.isArray(payload.blocks) && payload.blocks.length > 0) {
          setBlocks(payload.blocks);
          setStatus(payload.source === "supabase" ? "Loaded Supabase layout" : "Loaded map fallback");
        }
      } catch {
        setStatus("Using prototype layout");
      }
    }

    void loadLayout();
  }, []);

  useEffect(() => {
    async function loadCalibration() {
      try {
        const response = await fetch("/api/map-calibration?cemetery=sligo-town-cemetery");
        const payload = (await response.json()) as CalibrationPayload;

        if (payload.calibration) {
          setCalibrationStatus(
            `Calibration ready: ${payload.calibration.center_latitude}, ${payload.calibration.center_longitude}`
          );
        } else {
          setCalibrationStatus("Calibration not saved yet");
        }
      } catch {
        setCalibrationStatus("Calibration unavailable");
      }
    }

    void loadCalibration();
  }, []);

  useEffect(() => {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) {
      setDatabaseRecords([]);
      return;
    }

    const controller = new AbortController();

    async function loadRecords() {
      try {
        const response = await fetch(`/api/records?q=${encodeURIComponent(normalizedQuery)}`, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const payload = (await response.json()) as RecordsPayload;
        const records = (payload.records ?? []).map((record) => ({
          ...record,
          source: "supabase" as const
        }));

        setDatabaseRecords(records);

        if (records.length > 0) {
          setSelectedRecordId(records[0].id);
          setStatus("Using Supabase records");
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setDatabaseRecords([]);
        setStatus("Using demo fallback records");
      }
    }

    const timeoutId = window.setTimeout(() => {
      void loadRecords();
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

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
        attributionControl: false,
        crs: L.CRS.Simple,
        maxBounds: [
          [-12, -12],
          [112, 112]
        ],
        maxBoundsViscosity: 0.75,
        maxZoom: 4,
        minZoom: -1
      });

      map.fitBounds([
        [0, 0],
        [100, 100]
      ]);
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
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;

    if (!mapReady || !L || !map || !layer) {
      return;
    }

    layer.clearLayers();

    L.rectangle(
      [
        [0, 0],
        [100, 100]
      ],
      {
        color: "#d9d2c7",
        fillColor: "#e5dccf",
        fillOpacity: 1,
        interactive: false,
        weight: 1
      }
    ).addTo(layer);

    for (let line = 0; line <= 100; line += 5) {
      L.polyline(
        [
          [line, 0],
          [line, 100]
        ],
        { color: "#cfc7ba", interactive: false, opacity: 0.65, weight: 1 }
      ).addTo(layer);
      L.polyline(
        [
          [0, line],
          [100, line]
        ],
        { color: "#cfc7ba", interactive: false, opacity: 0.65, weight: 1 }
      ).addTo(layer);
    }

    L.polyline(
      [
        [35, -15],
        [48, 45],
        [62, 115]
      ],
      { color: "#d4a47d", interactive: false, opacity: 0.6, weight: 9 }
    ).addTo(layer);
    L.polyline(
      [
        [88, 28],
        [56, 82],
        [32, 118]
      ],
      { color: "#d4a47d", interactive: false, opacity: 0.6, weight: 9 }
    ).addTo(layer);

    blocks.forEach((block) => {
      const left = block.x - 26;
      const top = block.y + 5;
      const centerX = left + block.width / 2;
      const centerY = top + block.height / 2;
      const points = [
        rotatePoint(left, top, centerX, centerY, block.rotate),
        rotatePoint(left + block.width, top, centerX, centerY, block.rotate),
        rotatePoint(left + block.width, top + block.height, centerX, centerY, block.rotate),
        rotatePoint(left, top + block.height, centerX, centerY, block.rotate)
      ];

      L.polygon(points, {
        color: "#587b70",
        fillColor: "#2f6f58",
        fillOpacity: 0.13,
        interactive: false,
        weight: 1
      })
        .bindTooltip(`Block ${block.id}`, { direction: "center", permanent: true })
        .addTo(layer);
    });

    prototypeEntrances.forEach((entrance) => {
      L.circleMarker([entrance.y, entrance.x], {
        color: "#fffdf8",
        fillColor: "#b46b34",
        fillOpacity: 1,
        radius: 7,
        weight: 2
      })
        .bindTooltip(entrance.name)
        .addTo(layer);
    });

    prototypeRecords.forEach((record) => {
      const isSelected = record.plotId === selectedRecord.plotId;

      L.circleMarker([record.y, record.x], {
        color: isSelected ? "#fffdf8" : "#83918a",
        fillColor: isSelected ? "#b46b34" : "#fffdf8",
        fillOpacity: 1,
        radius: isSelected ? 8 : 5,
        weight: isSelected ? 2 : 1
      })
        .bindTooltip(`${record.fullName} / ${record.plotId}`)
        .on("click", () => setSelectedRecordId(matches.find((match) => match.plotId === record.plotId)?.id ?? record.id))
        .addTo(layer);
    });

    L.polyline(
      [
        [60, 42],
        [51, 52],
        [40, 63]
      ],
      { color: "#2f6f58", dashArray: "5 7", interactive: false, opacity: 0.8, weight: 4 }
    ).addTo(layer);
  }, [blocks, mapReady, matches, selectedRecord.plotId]);

  function focusSelectedRecord() {
    const map = mapRef.current;
    const prototype = prototypeRecords.find((record) => record.plotId === selectedRecord.plotId);

    if (!map || !prototype) {
      return;
    }

    map.flyTo([prototype.y, prototype.x], 2, { duration: 0.8 });
  }

  return (
    <section className="map-workspace">
      <aside className="map-sidebar">
        <h1>Cemetery map</h1>
        <p>Search a record, select a grave, and preview the visitor route on a full Leaflet map.</p>
        <label className="map-search">
          <Search size={16} aria-hidden="true" />
          <input
            aria-label="Search map records"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name or plot"
            value={query}
          />
        </label>
        <div className="layout-status">{status}</div>
        <div className="layout-status">{calibrationStatus}</div>

        <div className="map-result-list">
          {matches.slice(0, 8).map((record) => (
            <button
              className={record.id === selectedRecord.id ? "map-result active" : "map-result"}
              key={record.id}
              onClick={() => setSelectedRecordId(record.id)}
              type="button"
            >
              <strong>{record.fullName}</strong>
              <span>
                {record.plotId} / {record.source === "supabase" ? "live" : "demo"}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <section className="map-stage">
        <div className="large-leaflet-map" ref={mapContainerRef} aria-label="Full cemetery Leaflet map" />
        <aside className="map-floating-card">
          <span>Selected grave</span>
          <strong>{selectedRecord.fullName}</strong>
          <p>
            {selectedRecord.plotId} / Block {selectedRecord.blockId}
          </p>
          <div className="map-floating-actions">
            <button onClick={focusSelectedRecord} type="button">
              <LocateFixed size={16} aria-hidden="true" />
              Focus
            </button>
            <a href={`/plots/${encodeURIComponent(selectedRecord.plotId)}`}>
              <MapPin size={16} aria-hidden="true" />
              Details
            </a>
          </div>
        </aside>
      </section>
    </section>
  );
}
