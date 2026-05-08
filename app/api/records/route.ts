import { NextResponse } from "next/server";
import { prototypeRecords } from "@/lib/prototype-data";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

type RelatedValue<T> = T | T[] | null;

type PersonRow = {
  id: string;
  display_name: string | null;
  given_names: string | null;
  family_name: string | null;
  date_of_birth: string | null;
  date_of_death: string | null;
  biography: string | null;
};

type BurialRow = {
  id: string;
  person_id: string;
  burial_date: string | null;
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

function personName(person: PersonRow) {
  return person.display_name || [person.given_names, person.family_name].filter(Boolean).join(" ") || "Unnamed record";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();

  if (query.length < 2) {
    return NextResponse.json({ records: [], source: "empty" });
  }

  const pattern = `%${query}%`;

  try {
    const supabase = createSupabaseServiceClient();

    const [peopleResult, burialsResult] = await Promise.all([
      supabase
        .from("people")
        .select("id, display_name, given_names, family_name, date_of_birth, date_of_death, biography")
        .or(`display_name.ilike.${pattern},given_names.ilike.${pattern},family_name.ilike.${pattern},biography.ilike.${pattern}`)
        .eq("status", "published")
        .limit(12),
      supabase
        .from("burials")
        .select(
          `
            id,
            person_id,
            burial_date,
            grave_plots(
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
        .limit(200)
    ]);

    if (peopleResult.error) {
      throw peopleResult.error;
    }

    if (burialsResult.error) {
      throw burialsResult.error;
    }

    const burialsByPersonId = new Map(
      ((burialsResult.data ?? []) as BurialRow[]).map((burial) => [burial.person_id, burial])
    );

    const records = ((peopleResult.data ?? []) as PersonRow[]).map((person) => {
      const burial = burialsByPersonId.get(person.id) ?? null;
      const plot = single(burial?.grave_plots ?? null);
      const block = single(plot?.cemetery_blocks ?? null);
      const cemetery = single(plot?.cemeteries ?? null);
      const fullName = personName(person);
      const prototypeMatch =
        prototypeRecords.find((record) => record.plotId === plot?.plot_reference) ??
        prototypeRecords.find((record) => record.fullName.toLowerCase() === fullName.toLowerCase());

      return {
        id: burial?.id ?? person.id,
        personId: person.id,
        plotUuid: plot?.id ?? null,
        fullName,
        dates: [year(person.date_of_birth), year(person.date_of_death)].filter(Boolean).join("-") || "Dates unknown",
        plotId: plot?.plot_reference ?? prototypeMatch?.plotId ?? "Plot not linked yet",
        blockId: block?.code ?? prototypeMatch?.blockId ?? "",
        cemeteryName: cemetery?.name ?? "Sligo Town Cemetery",
        cemeterySlug: cemetery?.slug ?? "sligo-town-cemetery",
        town: cemetery?.town ?? null,
        county: cemetery?.county ?? null,
        biography: person.biography,
        x: prototypeMatch?.x ?? null,
        y: prototypeMatch?.y ?? null,
        mapRecordId: prototypeMatch?.id ?? null
      };
    });

    return NextResponse.json({ records, source: "supabase" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to search records.";

    return NextResponse.json({ records: [], source: "error", message }, { status: 500 });
  }
}
