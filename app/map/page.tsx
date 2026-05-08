import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CemeteryMapClient } from "./map-client";

export default function MapPage() {
  return (
    <main className="demo-page">
      <header className="demo-topbar">
        <Link href="/" className="icon-link" aria-label="Back to search">
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <div>
          <strong>Sligo Town Cemetery Map</strong>
          <span>Leaflet map, Supabase layout, searchable grave records</span>
        </div>
        <Link href="/visitor" className="text-link">
          Visitor
        </Link>
      </header>

      <CemeteryMapClient />
    </main>
  );
}
