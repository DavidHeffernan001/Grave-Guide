"use client";

import { LocateFixed, MapPin, Route, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { prototypeBlocks, prototypeEntrances, prototypeRecords, searchPrototypeRecords } from "@/lib/prototype-data";

const flowSteps = ["Entrance scan", "Allow location", "Show map", "Search records", "Select grave", "Start guidance"];

export function VisitorPrototype() {
  const [query, setQuery] = useState("Andrew Hosie");
  const [selectedRecordId, setSelectedRecordId] = useState(prototypeRecords[0]?.id ?? "");
  const [activeStep, setActiveStep] = useState(4);

  const matches = useMemo(() => searchPrototypeRecords(query), [query]);
  const selectedRecord = prototypeRecords.find((record) => record.id === selectedRecordId) ?? matches[0] ?? prototypeRecords[0];

  function selectRecord(recordId: string) {
    setSelectedRecordId(recordId);
    setActiveStep(4);
  }

  return (
    <section className="visitor-shell">
      <aside className="flow-panel">
        <h1>Map-first visitor flow</h1>
        <p>Entrance scan, location permission, grave search, selected record, and route guidance.</p>
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

          <div className="phone-path main" />
          <div className="phone-path diagonal" />

          {prototypeBlocks.map((block) => (
            <div
              className="phone-block"
              key={block.id}
              style={{
                left: `${block.x - 26}%`,
                top: `${block.y + 5}%`,
                width: `${block.width}%`,
                height: `${block.height}%`,
                transform: `rotate(${block.rotate}deg)`
              }}
            >
              <span>{block.id}</span>
            </div>
          ))}

          {prototypeEntrances.map((entrance) => (
            <button
              aria-label={entrance.name}
              className="phone-entrance"
              key={entrance.id}
              onClick={() => setActiveStep(0)}
              style={{ left: `${entrance.x}%`, top: `${entrance.y}%` }}
              type="button"
            />
          ))}

          {prototypeRecords.slice(0, 18).map((record) => (
            <button
              aria-label={`${record.fullName}, ${record.plotId}`}
              className={record.id === selectedRecord.id ? "phone-grave active" : "phone-grave"}
              key={record.id}
              onClick={() => selectRecord(record.id)}
              style={{ left: `${record.x}%`, top: `${record.y}%` }}
              type="button"
            />
          ))}

          <div className="phone-route" />

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
                  <span>{record.plotId}</span>
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
          </section>
        </div>
      </section>
    </section>
  );
}
