"use client";

import { LocateFixed, MapPin, Route, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { prototypeBlocks, prototypeEntrances, prototypeRecords, searchPrototypeRecords, type PrototypeBlock } from "@/lib/prototype-data";

const flowSteps = ["Entrance scan", "Allow location", "Show map", "Search records", "Select grave", "Start guidance"];

type VisitorRecord = {
  id: string;
  fullName: string;
  dates: string;
  plotId: string;
  blockId: string;
  x: number | null;
  y: number | null;
  source: "supabase" | "prototype";
  cemeteryName?: string;
  town?: string | null;
  county?: string | null;
};

type RecordsPayload = {
  records?: Array<Omit<VisitorRecord, "source">>;
  source?: string;
  message?: string;
};

type LeafletModule = typeof import("leaflet");

function toPrototypeRecord(record: (typeof prototypeRecords)[number]): VisitorRecord {
  return {
    ...record,
    source: "prototype"
  };
}

function rotatePoint(x: number, y: number, centerX: number, centerY: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const translatedX = x - centerX;
  const translatedY = y - centerY;

  return [centerY + translatedX * sin + translatedY * cos, centerX + translatedX * cos - translatedY * sin] as [number, number];
}

export function VisitorPrototype() {
  const [query, setQuery] = useState("Andrew Hosie");
  const [selectedRecordId, setSelectedRecordId] = useState(prototypeRecords[0]?.id ?? "");
  const [activeStep, setActiveStep] = useState(4);
  const [blocks, setBlocks] = useState<PrototypeBlock[]>(prototypeBlocks);
  const [layoutStatus, setLayoutStatus] = useState("Using prototype layout");
  const [databaseRecords, setDatabaseRecords] = useState<VisitorRecord[]>([]);
  const [recordStatus, setRecordStatus] = useState("Searching Supabase records");
  const [mapReady, setMapReady] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);

  const prototypeMatches = useMemo(() => searchPrototypeRecords(query).map(toPrototypeRecord), [query]);
  const databasePlotIds = new Set(databaseRecords.map((record) => record.plotId));
  const fallbackMatches = prototypeMatches.filter((record) => !databasePlotIds.has(record.plotId));
  const matches = [...databaseRecords, ...fallbackMatches];
  const selectedRecord =
    matches.find((record) => record.id === selectedRecordId) ??
    prototypeRecords.map(toPrototypeRecord).find((record) => record.id === selectedRecordId) ??
    matches[0] ??
    toPrototypeRecord(prototypeRecords[0]);

  useEffect(() => {
    async function loadLayout() {
      try {
        const response = await fetch("/api/block-layouts?cemetery=sligo-town-cemetery");
        const payload = (await response.json()) as { blocks?: PrototypeBlock[] | null };

        if (Array.isArray(payload.blocks) && payload.blocks.length > 0) {
          setBlocks(payload.blocks);
          setLayoutStatus("Using saved Supabase layout");
        }
      } catch {
        setBlocks(prototypeBlocks);
        setLayoutStatus("Using prototype layout");
      }
    }

    void loadLayout();
  }, []);

  useEffect(() => {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) {
      setDatabaseRecords([]);
      setRecordStatus("Type at least 2 letters");
      return;
    }

    const controller = new AbortController();

    async function loadRecords() {
      setRecordStatus("Searching Supabase records");

      try {
        const response = await fetch(`/api/records?q=${encodeURIComponent(normalizedQuery)}`, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error("Record search failed");
        }

        const payload = (await response.json()) as RecordsPayload;
        const records = (payload.records ?? []).map((record) => ({
          ...record,
          source: "supabase" as const
        }));

        setDatabaseRecords(records);
        setRecordStatus(records.length > 0 ? "Using Supabase records" : "No Supabase records found");

        if (records.length > 0) {
          setSelectedRecordId(records[0].id);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setDatabaseRecords([]);
        setRecordStatus("Using demo fallback records");
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
          [-10, -10],
          [110, 110]
        ],
        maxBoundsViscosity: 0.8,
        maxZoom: 3,
        minZoom: 0,
        zoomControl: false
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

    for (let line = 0; line <= 100; line += 8) {
      L.polyline(
        [
          [line, 0],
          [line, 100]
        ],
        { color: "#cfc7ba", interactive: false, opacity: 0.7, weight: 1 }
      ).addTo(layer);
      L.polyline(
        [
          [0, line],
          [100, line]
        ],
        { color: "#cfc7ba", interactive: false, opacity: 0.7, weight: 1 }
      ).addTo(layer);
    }

    L.polyline(
      [
        [35, -15],
        [48, 45],
        [62, 115]
      ],
      { color: "#d4a47d", interactive: false, opacity: 0.6, weight: 7 }
    ).addTo(layer);
    L.polyline(
      [
        [88, 28],
        [56, 82],
        [32, 118]
      ],
      { color: "#d4a47d", interactive: false, opacity: 0.6, weight: 7 }
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
        radius: 6,
        weight: 2
      })
        .bindTooltip(entrance.name)
        .on("click", () => setActiveStep(0))
        .addTo(layer);
    });

    prototypeRecords.slice(0, 18).forEach((record) => {
      const isSelected = record.plotId === selectedRecord.plotId;

      L.circleMarker([record.y, record.x], {
        color: isSelected ? "#fffdf8" : "#83918a",
        fillColor: isSelected ? "#b46b34" : "#fffdf8",
        fillOpacity: 1,
        radius: isSelected ? 7 : 4,
        weight: isSelected ? 2 : 1
      })
        .bindTooltip(`${record.fullName} / ${record.plotId}`)
        .on("click", () => selectRecord(matches.find((match) => match.plotId === record.plotId)?.id ?? record.id))
        .addTo(layer);
    });

    L.polyline(
      [
        [60, 42],
        [51, 52],
        [40, 63]
      ],
      { color: "#2f6f58", dashArray: "5 6", interactive: false, opacity: 0.7, weight: 3 }
    ).addTo(layer);
  }, [blocks, mapReady, matches, selectedRecord.plotId]);

  function selectRecord(recordId: string) {
    setSelectedRecordId(recordId);
    setActiveStep(4);
  }

  return (
    <section className="visitor-shell">
      <aside className="flow-panel">
        <h1>Map-first visitor flow</h1>
        <p>Entrance scan, location permission, grave search, selected record, and route guidance.</p>
        <div className="layout-status">{layoutStatus}</div>
        <div className="layout-status">{recordStatus}</div>
        {flowSteps.map((step, index) => (
          <button
            className={index === activeStep ? "flow-step active" : "flow-step"}
            key={step}
            onClick={() => setActiveStep(index)}
            type="button"
          >
            <span>{index + 1}</span>
            <strong>{step}</strong>
          </button>
        ))}
      </aside>

      <section className="phone-frame" aria-label="Visitor phone prototype">
        <div className="phone-map">
          <label className="phone-search">
            <Search size={15} aria-hidden="true" />
            <input
              aria-label="Search prototype records"
              onChange={(event) => {
                const value = event.target.value;
                setQuery(value);
                setActiveStep(value.length > 0 ? 3 : 2);
              }}
              placeholder="Search by name or plot"
              value={query}
            />
          </label>
          <button className="phone-locate" onClick={() => setActiveStep(2)} type="button" aria-label="Locate me">
            <LocateFixed size={18} aria-hidden="true" />
          </button>

          <div className="leaflet-phone-map" ref={mapContainerRef} aria-label="Interactive Leaflet cemetery map" />

          {query.trim().length > 1 && matches.length > 0 ? (
            <section className="phone-results" aria-label="Search results">
              {matches.slice(0, 4).map((record) => (
                <button
                  className={record.id === selectedRecord.id ? "phone-result active" : "phone-result"}
                  key={record.id}
                  onClick={() => selectRecord(record.id)}
                  type="button"
                >
                  <strong>{record.fullName}</strong>
                  <span>
                    {record.plotId}
                    {record.source === "supabase" ? " / live" : " / demo"}
                  </span>
                </button>
              ))}
            </section>
          ) : null}

          <section className="phone-sheet">
            <div className="sheet-handle" />
            <div className="grave-summary">
              <div>
                <span>Selected grave</span>
                <strong>{selectedRecord.fullName}</strong>
                <p>
                  {selectedRecord.plotId} / Block {selectedRecord.blockId}
                </p>
                {selectedRecord.cemeteryName ? <small>{selectedRecord.cemeteryName}</small> : null}
              </div>
              <b>{activeStep >= 5 ? "Active" : "6 min"}</b>
            </div>
            <div className="route-steps">
              <p>
                <Route size={14} aria-hidden="true" />
                Continue along main path
              </p>
              <p>
                <MapPin size={14} aria-hidden="true" />
                Grave is on your right
              </p>
            </div>
            <button className="start-route-button" onClick={() => setActiveStep(5)} type="button">
              Start guidance
            </button>
            {selectedRecord.plotId !== "Plot not linked yet" ? (
              <a className="phone-detail-link" href={`/plots/${encodeURIComponent(selectedRecord.plotId)}`}>
                View grave details
              </a>
            ) : null}
          </section>
        </div>
      </section>
    </section>
  );
}
