import { Landmark, MapPin, Search, ShieldCheck } from "lucide-react";
import { getSupabaseBrowserConfig } from "@/lib/supabase/config";

export default function Home() {
  const supabaseConfig = getSupabaseBrowserConfig();
  const isConnected = Boolean(supabaseConfig.url && supabaseConfig.anonKey);

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
          <p className="lede">
            GraveGuide is being set up as a searchable cemetery record and plot mapping platform,
            starting with a Supabase-backed data model and Vercel deployment.
          </p>

          <form className="search-band">
            <div className="search-row">
              <input aria-label="Search grave records" placeholder="Search name, plot, cemetery, or town" />
              <button className="primary-button" type="submit">
                <Search size={18} aria-hidden="true" />
                Search
              </button>
            </div>
            <button className="secondary-button" type="button">
              <MapPin size={18} aria-hidden="true" />
              Browse Sligo Town Cemetery
            </button>
          </form>
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
