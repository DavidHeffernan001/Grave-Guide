import { createClient } from "@supabase/supabase-js";
import { CalendarDays, Landmark, MapPin, Search, ShieldCheck, UserRound } from "lucide-react";
import { getSupabaseBrowserConfig } from "@/lib/supabase/config";

type SearchParams = {
  q?: string;
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

  return {
    cemeteries: (cemeteries.data ?? []) as CemeteryResult[],
    plots: (plots.data ?? []) as PlotResult[],
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
  const searched = query.length > 0;

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
          <a href="#map">Map</a>
          <a href="#status">Setup</a>
        </nav>
      </header>

      <section className="hero" id="search">
        <div className="hero-copy">
          <p className="eyebrow">Irish cemetery records, mapped carefully</p>
          <h1>Find a grave, trace a family, walk the route.</h1>
          <p className="lede">Search cemetery records, plot references, and mapped locations.</p>

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
            ) : hasResults(results) ? (
              <>
                <div className="results-heading">
                  <strong>Results for &quot;{query}&quot;</strong>
                  <span>
                    {results.cemeteries.length + results.plots.length + results.people.length} matches
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
                  <article className="result-card" key={plot.id}>
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
                  </article>
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
              </>
            ) : (
              <div className="empty-state">
                <strong>No matching records yet.</strong>
                <span>The database is connected, but that record has not been added or published.</span>
              </div>
            )}
          </section>
        </div>

        <div className="map-preview" id="map" aria-label="Cemetery map preview">
          <div className="path" />
          <div className="plot one" />
          <div className="plot two" />
          <div className="plot three" />
          <div className="plot four" />
          <div className="map-label">
            <strong>Plot mapping ready</strong>
            <span>Blocks, plots, burials, routes</span>
          </div>
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
