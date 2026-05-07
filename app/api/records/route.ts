import { NextResponse } from "next/server";
import { prototypeRecords } from "@/lib/prototype-data";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

type RelatedValue<T> = T | T[] | null;

type RawRecord = {
  id: string;
  burial_date: string | null;
  people: RelatedValue<{
    id: string;
    display_name: string | null;
    given_names: string | null;
    family_name: string | null;
    date_of_birth: string | null;
    date_of_death: string | null;
    biography: string | null;
  }>;
  grave_plots: RelatedValue<{
    id: string;
    plot_reference: string;
    row_label: string | null;
    plot_number: string | null;
    cemetery_blocks: RelatedValue<{
      code: string;
      name: string | null;
    }>;
    cemeteries: RelatedValue<{
      slug: string;
      name: string;
      town: string | null;
      county: string | null;
    }>;
  }>;
};

function single<T>(value: RelatedValue<T>): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function year(value: string | null) {
  return value ? value.slice(0, 4) : "";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();

  if (query.length < 2) {
    return NextResponse.json({ records: [], source: "empty" });
  }

  const normalizedQuery = query.toLowerCase();

  try {
    const supabase = createSupabaseServiceClient();

    const { data, error } = await supabase
      .from("burials")
      .select(
        `
          id,
          burial_date,
          people!inner(
            id,
            display_name,
            given_names,
            family_name,
            date_of_birth,
            date_of_death,
            biography
          ),
          grave_plots!inner(
            id,
            plot_reference,
            row_label,
            plot_number,
            cemetery_blocks(code, name),
            cemeteries(slug, name, town, county)
          )
        `
      )
      .eq("status", "published")
      .limit(100);

    if (error) {
      throw error;
    }

    const records = ((data ?? []) as RawRecord[]).flatMap((burial) => {
      const person = single(burial.people);
      const plot = single(burial.grave_plots);
      const block = single(plot?.cemetery_blocks ?? null);
      const cemetery = single(plot?.cemeteries ?? null);

      if (!person || !plot) {
        return [];
      }

      const prototypeMatch = prototypeRecords.find((record) => record.plotId === plot.plot_reference);
      const fullName =
        person.display_name || [person.given_names, person.family_name].filter(Boolean).join(" ") || "Unnamed record";
      const searchableText = [fullName, plot.plot_reference, block?.code, block?.name, cemetery?.name, cemetery?.town, cemetery?.county]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!searchableText.includes(normalizedQuery)) {
        return [];
      }

      return [
        {
          id: burial.id,
          personId: person.id,
          plotUuid: plot.id,
          fullName,
          dates: [year(person.date_of_birth), year(person.date_of_death)].filter(Boolean).join("-") || "Dates unknown",
          plotId: plot.plot_reference,
          blockId: block?.code ?? plot.plot_reference.split("-")[0],
          cemeteryName: cemetery?.name ?? "Cemetery",
          cemeterySlug: cemetery?.slug ?? "",
          town: cemetery?.town ?? null,
          county: cemetery?.county ?? null,
          biography: person.biography,
          x: prototypeMatch?.x ?? null,
          y: prototypeMatch?.y ?? null,
          mapRecordId: prototypeMatch?.id ?? null
        }
      ];
    }).slice(0, 12);

    return NextResponse.json({ records, source: "supabase" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to search records.";

    return NextResponse.json({ records: [], source: "error", message }, { status: 500 });
  }
}
