"use client";

import { LocateFixed, MapPin, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  cemeteryPathPercentLines,
  defaultMapCalibration,
  layoutBlockToLatLngs,
  normalizeCalibration,
  percentToLatLng,
  routePercentLine,
  type CalibrationApiRow,
  type MapCalibration
} from "@/lib/map-geometry";
import { normalizeBlocks, normalizeEntrances, type CemeteryBlock, type CemeteryEntrance } from "@/lib/cemetery-layout";
import { prototypeRecords, searchPrototypeRecords } from "@/lib/prototype-data";

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
  calibration?: CalibrationApiRow | null;
  source?: string;
};

function prototypeRecord(record: (typeof prototypeRecords)[number]): MapRecord {
  return {
    ...record,
    source: "prototype"
  };
}

export function CemeteryMapClient() {
  const [query, setQuery] = useState("Andrew");
  const [blocks, setBlocks] = useState<CemeteryBlock[]>(() => normalizeBlocks(null));
  const [entrances, setEntrances] = useState<CemeteryEntrance[]>(() => normalizeEntrances(null));
  const [databaseRecords, setDatabaseRecords] = useState<MapRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const [status, setStatus] = useState("Loading map");
  const [calibrationStatus, setCalibrationStatus] = useState("Checking map calibration");
  const [calibration, setCalibration] = useState<MapCalibration>(defaultMapCalibration);
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
        const [layoutResponse, entranceResponse] = await Promise.all([
          fetch("/api/block-layouts?cemetery=sligo-town-cemetery"),
          fetch("/api/entrances?cemetery=sligo-town-cemetery")
        ]);
        const payload = (await layoutResponse.json()) as { blocks?: CemeteryBlock[] | null; source?: string };
        const entrancePayload = (await entranceResponse.json()) as { entrances?: CemeteryEntrance[] | null };

        if (Array.isArray(payload.blocks) && payload.blocks.length > 0) {
          setBlocks(normalizeBlocks(payload.blocks));
          setStatus(payload.source === "supabase" ? "Loaded Supabase layout" : "Loaded map fallback");
        }

        setEntrances(normalizeEntrances(entrancePayload.entrances ?? null));
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
          const nextCalibration = normalizeCalibration(payload.calibration);
          setCalibration(nextCalibration);
          setCalibrationStatus(
            `Real map ready: ${nextCalibration.centerLatitude.toFixed(5)}, ${nextCalibration.centerLongitude.toFixed(5)}`
          );
        } else {
          setCalibration(defaultMapCalibration);
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
  }, [calibration.defaultZoom, calibration.centerLatitude, calibration.centerLongitude, calibration.maxZoom, calibration.minZoom]);

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
      L.polygon(layoutBlockToLatLngs(block, calibration, 26), {
        color: "#587b70",
        fillColor: "#2f6f58",
        fillOpacity: 0.13,
        interactive: false,
        weight: 1
      })
        .bindTooltip(`Block ${block.id}`, { direction: "center", permanent: true })
        .addTo(layer);
    });

    entrances.forEach((entrance) => {
      L.circleMarker(percentToLatLng(entrance.x, entrance.y, calibration), {
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

      L.circleMarker(percentToLatLng(record.x, record.y, calibration), {
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
      routePercentLine.map((point) => percentToLatLng(point.x, point.y, calibration)),
      { color: "#2f6f58", dashArray: "5 7", interactive: false, opacity: 0.8, weight: 4 }
    ).addTo(layer);
  }, [blocks, calibration, entrances, mapReady, matches, selectedRecord.plotId]);

  function focusSelectedRecord() {
    const map = mapRef.current;
    const prototype = prototypeRecords.find((record) => record.plotId === selectedRecord.plotId);

    if (!map || !prototype) {
      return;
    }

    map.flyTo(percentToLatLng(prototype.x, prototype.y, calibration), calibration.defaultZoom + 1, { duration: 0.8 });
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
