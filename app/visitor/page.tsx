import { ArrowLeft, LocateFixed, MapPin, Route, Search } from "lucide-react";
import Link from "next/link";
import { prototypeBlocks, prototypeEntrances, prototypeRecords } from "@/lib/prototype-data";

const featuredRecord = prototypeRecords[0];

export default function VisitorPage() {
  return (
    <main className="demo-page">
      <header className="demo-topbar">
        <Link href="/" className="icon-link" aria-label="Back to GraveGuide home">
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <div>
          <strong>Visitor Flow</strong>
          <span>Sligo Town Cemetery QR entry</span>
        </div>
        <Link href="/admin" className="text-link">
          Admin
        </Link>
      </header>

      <section className="visitor-shell">
        <aside className="flow-panel">
          <h1>Map-first visitor flow</h1>
          <p>Entrance scan, location permission, grave search, selected record, and route guidance.</p>
          {["Entrance scan", "Allow location", "Show map", "Search records", "Select grave", "Start guidance"].map(
            (step, index) => (
              <div className={index === 4 ? "flow-step active" : "flow-step"} key={step}>
                <span>{index + 1}</span>
                <strong>{step}</strong>
              </div>
            )
          )}
        </aside>

        <section className="phone-frame" aria-label="Visitor phone prototype">
          <div className="phone-map">
            <div className="phone-search">
              <Search size={15} aria-hidden="true" />
              <span>Andrew Hosie</span>
            </div>
            <button className="phone-locate" aria-label="Locate me">
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
              <div className="phone-entrance" key={entrance.id} style={{ left: `${entrance.x}%`, top: `${entrance.y}%` }} />
            ))}

            {prototypeRecords.slice(0, 18).map((record) => (
              <div
                className={record.id === featuredRecord.id ? "phone-grave active" : "phone-grave"}
                key={record.id}
                style={{ left: `${record.x}%`, top: `${record.y}%` }}
              />
            ))}

            <div className="phone-route" />

            <section className="phone-sheet">
              <div className="sheet-handle" />
              <div className="grave-summary">
                <div>
                  <span>Selected grave</span>
                  <strong>{featuredRecord.fullName}</strong>
                  <p>{featuredRecord.plotId} / Block {featuredRecord.blockId}</p>
                </div>
                <b>6 min</b>
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
            </section>
          </div>
        </section>
      </section>
    </main>
  );
}
