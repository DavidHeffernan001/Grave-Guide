import { ArrowLeft, CalendarDays, FileText, Landmark, MapPin, Route, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prototypeRecords } from "@/lib/prototype-data";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

type RelatedValue<T> = T | T[] | null;

type PersonDetailRow = {
  id: string;
  display_name: string | null;
  given_names: string | null;
  family_name: string | null;
  date_of_birth: string | null;
  date_of_death: string | null;
  biography: string | null;
};

type RawPlotDetail = {
  id: string;
  plot_reference: string;
  row_label: string | null;
  plot_number: string | null;
  notes: string | null;
  cemetery_blocks: RelatedValue<{
    code: string;
    name: string | null;
  }>;
  cemeteries: RelatedValue<{
    slug: string;
    name: string;
    town: string | null;
    county: string | null;
    country: string | null;
    description: string | null;
  }>;
  burials: RelatedValue<{
    id: string;
    burial_date: string | null;
    inscription: string | null;
    source_notes: string | null;
    status: string | null;
    people: RelatedValue<PersonDetailRow>;
  }>;
};

type PlotDetail = {
  plotId: string;
  blockId: string;
  cemeteryName: string;
  cemeteryLocation: string;
  personName: string;
  dates: string;
  biography: string | null;
  notes: string | null;
  inscription: string | null;
  source: "supabase" | "prototype";
  prototypeId?: string;
};

export const dynamic = "force-dynamic";

function single<T>(value: RelatedValue<T>): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function list<T>(value: RelatedValue<T>): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function year(value: string | null) {
  return value ? value.slice(0, 4) : "";
}

function personName(person: PersonDetailRow) {
  return person.display_name || [person.given_names, person.family_name].filter(Boolean).join(" ") || "Unnamed record";
}

function prototypeDetail(plotId: string): PlotDetail | null {
  const record = prototypeRecords.find((item) => item.plotId === plotId);

  if (!record) {
    return null;
  }

  return {
    plotId: record.plotId,
    blockId: record.blockId,
    cemeteryName: "Sligo Town Cemetery",
    cemeteryLocation: "Sligo, Ireland",
    personName: record.fullName,
    dates: record.dates,
    biography: null,
    notes: "Prototype record from the Sligo Town Cemetery demo data.",
    inscription: null,
    source: "prototype",
    prototypeId: record.id
  };
}

async function loadPlotDetail(plotId: string): Promise<PlotDetail | null> {
  try {
    const supabase = createSupabaseServiceClient();

    const { data, error } = await supabase
      .from("grave_plots")
      .select(
        `
          id,
          plot_reference,
          row_label,
          plot_number,
          notes,
          cemetery_blocks(code, name),
          cemeteries(slug, name, town, county, country, description),
          burials(
            id,
            burial_date,
            inscription,
            source_notes,
            status,
            people(
              id,
              display_name,
              given_names,
              family_name,
              date_of_birth,
              date_of_death,
              biography
            )
          )
        `
      )
      .eq("plot_reference", plotId)
      .eq("status", "published")
      .maybeSingle();

    if (error || !data) {
      return prototypeDetail(plotId);
    }

    const plot = data as RawPlotDetail;
    const cemetery = single(plot.cemeteries);
    const block = single(plot.cemetery_blocks);
    const burial = list(plot.burials).find((item) => item.status === "published") ?? null;
    const person = single(burial?.people ?? null);
    const prototype = prototypeRecords.find((record) => record.plotId === plot.plot_reference);
    const displayName = person ? personName(person) : prototype?.fullName ?? "Plot record";
    const dates =
      person ? [year(person.date_of_birth), year(person.date_of_death)].filter(Boolean).join("-") || "Dates unknown" : prototype?.dates ?? "Dates unknown";

    return {
      plotId: plot.plot_reference,
      blockId: block?.code ?? prototype?.blockId ?? plot.plot_reference.split("-")[0],
      cemeteryName: cemetery?.name ?? "Cemetery",
      cemeteryLocation: [cemetery?.town, cemetery?.county, cemetery?.country].filter(Boolean).join(", "),
      personName: displayName,
      dates,
      biography: person?.biography ?? null,
      notes: plot.notes ?? burial?.source_notes ?? null,
      inscription: burial?.inscription ?? null,
      source: "supabase",
      prototypeId: prototype?.id
    };
  } catch {
    return prototypeDetail(plotId);
  }
}

export default async function PlotPage({
  params
}: {
  params: Promise<{ plotId: string }>;
}) {
  const { plotId: rawPlotId } = await params;
  const plotId = decodeURIComponent(rawPlotId);
  const detail = await loadPlotDetail(plotId);

  if (!detail) {
    notFound();
  }

  const searchHref = detail.prototypeId
    ? `/?q=${encodeURIComponent(detail.personName)}&selected=${detail.prototypeId}#map`
    : `/?q=${encodeURIComponent(detail.personName)}#search`;

  return (
    <main className="detail-page">
      <header className="demo-topbar">
        <Link href={searchHref} className="icon-link" aria-label="Back to search">
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <div>
          <strong>{detail.personName}</strong>
          <span>{detail.plotId} / Block {detail.blockId}</span>
        </div>
        <Link href="/visitor" className="text-link">
          Route
        </Link>
      </header>

      <section className="detail-layout">
        <article className="detail-card">
          <p className="eyebrow">{detail.source === "supabase" ? "Verified database record" : "Prototype grave record"}</p>
          <h1>{detail.personName}</h1>

          <div className="detail-meta">
            <span>
              <CalendarDays size={16} aria-hidden="true" />
              {detail.dates}
            </span>
            <span>
              <MapPin size={16} aria-hidden="true" />
              {detail.plotId} / Block {detail.blockId}
            </span>
            <span>
              <Landmark size={16} aria-hidden="true" />
              {detail.cemeteryName}
            </span>
          </div>

          <div className="detail-sections">
            <section>
              <h2>
                <UserRound size={18} aria-hidden="true" />
                Person
              </h2>
              <p>{detail.biography ?? "Published GraveGuide cemetery record."}</p>
            </section>
            <section>
              <h2>
                <FileText size={18} aria-hidden="true" />
                Plot notes
              </h2>
              <p>{detail.inscription ?? detail.notes ?? "No inscription or plot note has been added yet."}</p>
            </section>
          </div>

          <p>
            {detail.cemeteryLocation || detail.cemeteryName}. This page now reads from Supabase when the plot exists there, with a demo
            fallback for early prototype records.
          </p>

          <div className="detail-actions">
            <Link href={searchHref}>
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
