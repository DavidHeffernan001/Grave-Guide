import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { VisitorPrototype } from "./visitor-prototype";

export default async function VisitorPage({
  searchParams
}: {
  searchParams?: Promise<{ entrance?: string }>;
}) {
  const params = await searchParams;

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

      <VisitorPrototype entranceCode={params?.entrance ?? null} />
    </main>
  );
}
