import { ArrowLeft, CalendarDays, MapPin, Route } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prototypeRecords } from "@/lib/prototype-data";

export function generateStaticParams() {
  return prototypeRecords.map((record) => ({
    plotId: record.plotId
  }));
}

export default async function PlotPage({
  params
}: {
  params: Promise<{ plotId: string }>;
}) {
  const { plotId } = await params;
  const record = prototypeRecords.find((item) => item.plotId === decodeURIComponent(plotId));

  if (!record) {
    notFound();
  }

  return (
    <main className="detail-page">
      <header className="demo-topbar">
        <Link href={`/?q=${encodeURIComponent(record.fullName)}&selected=${record.id}#map`} className="icon-link" aria-label="Back to search">
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <div>
          <strong>{record.fullName}</strong>
          <span>{record.plotId} / Block {record.blockId}</span>
        </div>
        <Link href="/visitor" className="text-link">
          Route
        </Link>
      </header>

      <section className="detail-layout">
        <article className="detail-card">
          <p className="eyebrow">Grave record</p>
          <h1>{record.fullName}</h1>
          <div className="detail-meta">
            <span>
              <CalendarDays size={16} aria-hidden="true" />
              {record.dates}
            </span>
            <span>
              <MapPin size={16} aria-hidden="true" />
              {record.plotId} / Block {record.blockId}
            </span>
          </div>
          <p>
            Prototype record from the Sligo Town Cemetery demo data. This page is ready to become a
            Supabase-backed public memorial or plot detail page when verified records are imported.
          </p>
          <div className="detail-actions">
            <Link href={`/?q=${encodeURIComponent(record.fullName)}&selected=${record.id}#map`}>
              <MapPin size={17} aria-hidden="true" />
              View on map
            </Link>
            <Link href="/visitor">
              <Route size={17} aria-hidden="true" />
              Start visitor route
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
