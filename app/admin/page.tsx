import { ArrowLeft, CheckCircle2, Rows3, Save, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { prototypeBlocks, prototypeEntrances, prototypeRecords } from "@/lib/prototype-data";

export default function AdminPage() {
  return (
    <main className="demo-page">
      <header className="demo-topbar">
        <Link href="/" className="icon-link" aria-label="Back to GraveGuide home">
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <div>
          <strong>Admin Workspace</strong>
          <span>Block layout, plot records, entrances, and calibration</span>
        </div>
        <Link href="/visitor" className="text-link">
          Visitor
        </Link>
      </header>

      <section className="admin-layout">
        <aside className="admin-sidebar">
          <h1>Sligo Town Cemetery</h1>
          <p>Configuration workspace rebuilt from the original prototype.</p>
          <div className="admin-stat">
            <strong>{prototypeBlocks.length}</strong>
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
        </aside>

        <section className="admin-board">
          <div className="admin-toolbar">
            <button>
              <Save size={16} aria-hidden="true" />
              Save layout
            </button>
            <button>
              <SlidersHorizontal size={16} aria-hidden="true" />
              Start calibration
            </button>
            <button>
              <Rows3 size={16} aria-hidden="true" />
              Edit rows
            </button>
          </div>

          <div className="admin-map">
            <div className="phone-path main" />
            <div className="phone-path diagonal" />
            {prototypeBlocks.map((block) => (
              <div
                className="admin-block"
                key={block.id}
                style={{
                  left: `${block.x - 25}%`,
                  top: `${block.y + 5}%`,
                  width: `${block.width}%`,
                  height: `${block.height}%`,
                  transform: `rotate(${block.rotate}deg)`
                }}
              >
                <strong>{block.name}</strong>
                <span>{block.width} x {block.height} / {block.rotate}deg</span>
              </div>
            ))}
          </div>

          <div className="admin-panels">
            {prototypeBlocks.map((block) => (
              <article className="admin-panel" key={block.id}>
                <CheckCircle2 size={17} aria-hidden="true" />
                <div>
                  <strong>{block.name}</strong>
                  <span>Calibrated overlay / visible on visitor map</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
