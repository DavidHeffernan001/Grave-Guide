import { createClient } from "@supabase/supabase-js";
import { CalendarDays, Landmark, MapPin, Route, Search, ShieldCheck, UserRound } from "lucide-react";
import { prototypeBlocks, prototypeEntrances, prototypeRecords, searchPrototypeRecords } from "@/lib/prototype-data";
import { getSupabaseBrowserConfig } from "@/lib/supabase/config";

type SearchParams = {
  q?: string;
  selected?: string;
};

type CemeteryResult = {
  id: string;
  slug: string;
  name: string;
  town: string | null;
  county: string | null;
  description: string | null;
};

type PlotResult = {
  id: string;
  plot_reference: string;
  row_label: string | null;
  plot_number: string | null;
  cemeteries: {
    name: string;
    town: string | null;
    county: string | null;
  } | null;
};

type RawPlotResult = Omit<PlotResult, "cemeteries"> & {
  cemeteries:
    | {
        name: string;
        town: string | null;
        county: string | null;
      }
    | {
        name: string;
        town: string | null;
        county: string | null;
      }[]
    | null;
};

type PersonResult = {
  id: string;
  display_name: string | null;
  given_names: string | null;
  family_name: string | null;
  date_of_birth: string | null;
  date_of_death: string | null;
  biography: string | null;
};

type SearchResults = {
  cemeteries: CemeteryResult[];
  plots: PlotResult[];
  people: PersonResult[];
};

export const dynamic = "force-dynamic";

async function searchGraveGuide(query: string): Promise<SearchResults> {
  const { url, anonKey } = getSupabaseBrowserConfig();

  if (!url || !anonKey || query.length < 2) {
    return { cemeteries: [], plots: [], people: [] };
  }

  const supabase = createClient(url, anonKey, {
    auth: {
      persistSession: false
    }
  });

  const pattern = `%${query}%`;

  const [cemeteries, plots, people] = await Promise.all([
    supabase
      .from("cemeteries")
      .select("id, slug, name, town, county, description")
      .or(`name.ilike.${pattern},town.ilike.${pattern},county.ilike.${pattern},description.ilike.${pattern}`)
      .eq("status", "published")
      .limit(8),
    supabase
      .from("grave_plots")
      .select("id, plot_reference, row_label, plot_number, cemeteries(name, town, county)")
      .or(`plot_reference.ilike.${pattern},row_label.ilike.${pattern},plot_number.ilike.${pattern}`)
      .eq("status", "published")
      .limit(8),
    supabase
      .from("people")
      .select("id, display_name, given_names, family_name, date_of_birth, date_of_death, biography")
      .or(`display_name.ilike.${pattern},given_names.ilike.${pattern},family_name.ilike.${pattern},biography.ilike.${pattern}`)
      .eq("status", "published")
      .limit(8)
  ]);

  const plotResults = ((plots.data ?? []) as RawPlotResult[]).map((plot) => ({
    ...plot,
    cemeteries: Array.isArray(plot.cemeteries) ? (plot.cemeteries[0] ?? null) : plot.cemeteries
  }));

  return {
    cemeteries: (cemeteries.data ?? []) as CemeteryResult[],
    plots: plotResults,
    people: (people.data ?? []) as PersonResult[]
  };
}

function hasResults(results: SearchResults) {
  return results.cemeteries.length > 0 || results.plots.length > 0 || results.people.length > 0;
}

export default async function Home({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const supabaseConfig = getSupabaseBrowserConfig();
  const isConnected = Boolean(supabaseConfig.url && supabaseConfig.anonKey);
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const results = await searchGraveGuide(query);
  const prototypeMatches = searchPrototypeRecords(query);
  const databasePersonNames = new Set(
    results.people
      .map((person) => (person.display_name || [person.given_names, person.family_name].filter(Boolean).join(" ")).toLowerCase())
      .filter(Boolean)
  );
  const fallbackPrototypeMatches = prototypeMatches.filter((record) => !databasePersonNames.has(record.fullName.toLowerCase()));
  const searched = query.length > 0;
  const selectedRecord =
    prototypeRecords.find((record) => record.id === params?.selected) ??
    fallbackPrototypeMatches[0] ??
    prototypeRecords.find((record) => query && record.fullName.toLowerCase().includes(query.toLowerCase())) ??
    null;
  const highlightedPlotIds = new Set(fallbackPrototypeMatches.map((record) => record.plotId));

  if (selectedRecord) {
    highlightedPlotIds.add(selectedRecord.plotId);
  }

  return (
    <main className="page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <Landmark size={19} aria-hidden="true" />
          </span>
          <span>GraveGuide</span>
        </div>
        <nav className="nav" aria-label="Primary">
          <a href="#search">Search</a>
          <a href="/map">Map</a>
          <a href="/visitor">Visitor</a>
          <a href="/admin">Admin</a>
        </nav>
      </header>

      <section className="hero" id="search">
        <div className="hero-copy">
          <p className="eyebrow">Irish cemetery records, mapped carefully</p>
          <h1>Find a grave, trace a family, walk the route.</h1>
          <p className="lede">Search records, preview grave locations, and follow a map-first visitor flow.</p>

          <form className="search-band" action="/">
            <div className="search-row">
              <input
                aria-label="Search grave records"
                defaultValue={query}
                name="q"
                placeholder="Search name, plot, cemetery, or town"
              />
              <button className="primary-button" type="submit">
                <Search size={18} aria-hidden="true" />
                Search
              </button>
            </div>
            <a className="secondary-button" href="/?q=Sligo">
              <MapPin size={18} aria-hidden="true" />
              Browse Sligo Town Cemetery
            </a>
          </form>

          <section className="results-panel" aria-live="polite">
            {!searched ? (
              <div className="empty-state">
                <strong>Try a search to begin.</strong>
                <span>Sligo, Block A, and A-001 are seeded already.</span>
              </div>
            ) : hasResults(results) || fallbackPrototypeMatches.length > 0 ? (
              <>
                <div className="results-heading">
                  <strong>Results for &quot;{query}&quot;</strong>
                  <span>
                    {results.cemeteries.length + results.plots.length + results.people.length + fallbackPrototypeMatches.length} matches
                  </span>
                </div>

                {results.cemeteries.map((cemetery) => (
                  <article className="result-card" key={cemetery.id}>
                    <MapPin size={18} aria-hidden="true" />
                    <div>
                      <strong>{cemetery.name}</strong>
                      <span>
                        {[cemetery.town, cemetery.county].filter(Boolean).join(", ") || "Cemetery"}
                      </span>
                      {cemetery.description ? <p>{cemetery.description}</p> : null}
                    </div>
                  </article>
                ))}

                {results.plots.map((plot) => (
                  <a className="result-card" href={`/plots/${encodeURIComponent(plot.plot_reference)}`} key={plot.id}>
                    <Landmark size={18} aria-hidden="true" />
                    <div>
                      <strong>Plot {plot.plot_reference}</strong>
                      <span>{plot.cemeteries?.name ?? "Cemetery plot"}</span>
                      <p>
                        {[plot.row_label ? `Row ${plot.row_label}` : null, plot.plot_number ? `No. ${plot.plot_number}` : null]
                          .filter(Boolean)
                          .join(" / ")}
                        </p>
                    </div>
                  </a>
                ))}

                {results.people.map((person) => (
                  <article className="result-card" key={person.id}>
                    <UserRound size={18} aria-hidden="true" />
                    <div>
                      <strong>{person.display_name || [person.given_names, person.family_name].filter(Boolean).join(" ")}</strong>
                      <span>
                        <CalendarDays size={14} aria-hidden="true" />
                        {[person.date_of_birth, person.date_of_death].filter(Boolean).join(" - ") || "Dates unknown"}
                      </span>
                      {person.biography ? <p>{person.biography}</p> : null}
                    </div>
                  </article>
                ))}

                {fallbackPrototypeMatches.map((record) => (
                  <a className="result-card" href={`/?q=${encodeURIComponent(query)}&selected=${record.id}#map`} key={record.id}>
                    <Route size={18} aria-hidden="true" />
                    <div>
                      <strong>{record.fullName}</strong>
                      <span>
                        {record.plotId} / Block {record.blockId}
                      </span>
                      <p>Prototype map record from the Sligo Town Cemetery demo data. Dates: {record.dates}.</p>
                    </div>
                  </a>
                ))}
              </>
            ) : (
              <div className="empty-state">
                <strong>No matching records yet.</strong>
                <span>The database is connected, but that record has not been added or published.</span>
              </div>
            )}
          </section>
        </div>

        <div className="map-preview" id="map" aria-label="Sligo Town Cemetery map preview">
          <div className="map-path main" />
          <div className="map-path diagonal" />

          {prototypeBlocks.map((block) => (
            <div
              className="cemetery-block"
              key={block.id}
              style={{
                left: `${block.x - 25}%`,
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
            <div className="entrance-pin" key={entrance.id} style={{ left: `${entrance.x}%`, top: `${entrance.y}%` }}>
              <span>{entrance.name}</span>
            </div>
          ))}

          {prototypeRecords.map((record) => (
            <a
              aria-label={`${record.fullName}, ${record.plotId}`}
              className={highlightedPlotIds.has(record.plotId) ? "grave-dot highlighted" : "grave-dot"}
              href={`/?q=${encodeURIComponent(record.fullName)}`}
              key={record.id}
              style={{ left: `${record.x}%`, top: `${record.y}%` }}
              title={`${record.fullName} - ${record.plotId}`}
            />
          ))}

          <div className="route-preview-line" />

          <div className="map-label">
            <strong>Sligo Town Cemetery</strong>
            <span>{prototypeRecords.length} demo records / Blocks A-C</span>
          </div>

          {selectedRecord ? (
            <aside className="grave-focus-card" aria-label="Selected grave">
              <span>Selected grave</span>
              <strong>{selectedRecord.fullName}</strong>
              <p>{selectedRecord.plotId} / Block {selectedRecord.blockId}</p>
              <small>{selectedRecord.dates}</small>
              <a href={`/plots/${encodeURIComponent(selectedRecord.plotId)}`}>View plot details</a>
              <a href="/visitor">Open visitor route</a>
            </aside>
          ) : null}
        </div>
      </section>

      <section className="status-band" id="status" aria-label="Project status">
        <div className="stat">
          <strong>{isConnected ? "Ready" : "Pending"}</strong>
          <span>Supabase environment</span>
        </div>
        <div className="stat">
          <strong>RLS</strong>
          <span>Policies drafted</span>
        </div>
        <div className="stat">
          <strong>Vercel</strong>
          <span>Deployment prepared</span>
        </div>
        <div className="stat">
          <strong>
            <ShieldCheck size={24} aria-label="Moderation" />
          </strong>
          <span>Contribution approval model</span>
        </div>
      </section>
    </main>
  );
}
