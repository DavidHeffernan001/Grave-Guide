import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AdminWorkspace } from "./admin-workspace";

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

      <AdminWorkspace />
    </main>
  );
}
