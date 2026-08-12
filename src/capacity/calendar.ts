// W227: the calendar is data with a source, and seasonality is never inferred.
//
// Q18 forecasts how many slots fill. The obvious next move is to make it seasonal — fewer in
// January, fewer the week of a public holiday — and there are two ways to get there. One of them
// is a trap this tree has walked past before.
//
// THE TRAP: LEARNING SEASONALITY FROM THE PRACTICE'S OWN HISTORY. The arithmetic is available and
// respectable — group the recorded weeks by month, compare the means, apply the ratio. What it
// actually produces is a number that says "Januaries are quiet here" from four Januaries, three of
// which had a public holiday the forecaster does not know about and one of which the clinician was
// on leave. The seasonal factor then travels as a property of the practice rather than as an
// artefact of four data points, and it is indistinguishable from a measurement — the same failure
// W215 refused for counterfactuals and W219 refused for per-kind effects, arriving a third time in
// a different costume.
//
// So there is NO FUNCTION HERE THAT READS A RECORDED WEEK. This module takes dates and returns
// what a declared calendar says about them. It imports nothing from `./model`, and a test asserts
// that: the guarantee is that seasonality cannot be inferred here because the history is not in
// scope, not that somebody remembered not to.
//
// THE CALENDAR IS W56'S SHAPE, INCLUDING THE EMPTINESS. Every entry carries provenance — the
// gazette that declared the day, when it was published, when it was read — and `SHIPPED_HOLIDAYS`
// is EMPTY, pinned by its own test.
//
// The emptiness deserves its own sentence, because the reasoning differs from W56's. Intervals
// ship empty because clinical content needs G5. A public holiday is not clinical content and no
// gate covers it. It ships empty because **this loop cannot verify a gazette**, and a holiday
// calendar is exactly the kind of data that is worse wrong than absent: a practice told the
// Monday is a holiday opens no slots, and a practice told it is not opens slots nobody attends.
// Writing plausible dates with plausible citations would be manufacturing a source, which is a
// different and worse failure than having none. So the container enforces provenance, the
// validator refuses a row without it, and the day somebody with the gazette in front of them
// fills it, every row says where it came from.
//
// A HOLIDAY IS A FACT ABOUT A JURISDICTION, NOT ABOUT A PRACTICE. The jurisdiction is on the row,
// because "the Queen's Birthday" is four different dates in Australia and a calendar that did not
// say which state it meant would be wrong in five of eight of them.

/** Where a calendar entry came from. W56's provenance, deliberately the same four fields. */
export interface CalendarProvenance {
  /** Human-readable citation, e.g. the gazette or the department that declared the day. */
  citation: string;
  url: string;
  /** ISO date the cited source was published. */
  publishedOn: string;
  /** ISO date the source was read when the row was written. */
  retrievedOn: string;
}

export interface PublicHoliday {
  dateIso: string;
  name: string;
  /** The state or territory that declared it. A holiday is a fact about a jurisdiction. */
  jurisdiction: string;
  provenance: CalendarProvenance;
}

export type CalendarRejection =
  | "date_missing_or_unreadable"
  | "name_missing"
  | "jurisdiction_missing"
  | "provenance_missing"
  | "provenance_url_missing"
  | "provenance_dates_missing_or_unreadable"
  | "retrieved_before_published";

export const CALENDAR_REJECTION_COPY: Record<CalendarRejection, string> = {
  date_missing_or_unreadable: "A calendar entry with no readable date cannot be matched to a session.",
  name_missing: "An unnamed day cannot be checked against a gazette by anybody reading this.",
  jurisdiction_missing:
    "A public holiday is declared by a state or territory, and several share a name on different dates. Without the jurisdiction the row is wrong somewhere.",
  provenance_missing: "An entry with no source is a date somebody typed. W56's rule, applied to a calendar.",
  provenance_url_missing: "A citation nobody can follow is a citation nobody can check.",
  provenance_dates_missing_or_unreadable:
    "A row needs both the publication date and the date the source was read: a gazette entry amended later is a different fact from the one somebody read.",
  retrieved_before_published:
    "The source was recorded as read before it was published, so one of the two dates is wrong and neither can be trusted.",
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate one entry, returning every reason it is refused.
 *
 * The loader enforces the gate rather than the values doing it — W56's shape, and the reason the
 * empty catalogue below is safe to fill later by somebody who has the gazette open.
 */
export function rejectionsFor(holiday: PublicHoliday): CalendarRejection[] {
  const out: CalendarRejection[] = [];
  if (!ISO_DATE.test(holiday.dateIso)) out.push("date_missing_or_unreadable");
  if (holiday.name.trim() === "") out.push("name_missing");
  if (holiday.jurisdiction.trim() === "") out.push("jurisdiction_missing");

  const p = holiday.provenance as CalendarProvenance | undefined;
  if (!p || p.citation.trim() === "") {
    out.push("provenance_missing");
    return out;
  }
  if (p.url.trim() === "") out.push("provenance_url_missing");
  const datesReadable = ISO_DATE.test(p.publishedOn) && ISO_DATE.test(p.retrievedOn);
  if (!datesReadable) out.push("provenance_dates_missing_or_unreadable");
  else if (p.retrievedOn < p.publishedOn) out.push("retrieved_before_published");
  return out;
}

/**
 * The shipped calendar. EMPTY, and pinned empty by its own test.
 *
 * Not a gate — no founder gate covers a public holiday. It is empty because this loop cannot
 * verify a gazette, and a calendar is worse wrong than absent: told the Monday is a holiday a
 * practice opens nothing, told it is not it opens slots nobody attends. Plausible dates with
 * plausible citations would be a manufactured source, which is worse than no source at all.
 */
export const SHIPPED_HOLIDAYS: readonly PublicHoliday[] = [];

export type HolidayReading =
  /** The declared calendar says this date is a public holiday in that jurisdiction. */
  | { known: true; holiday: PublicHoliday }
  /** The calendar has entries for this jurisdiction and this date is not one of them. */
  | { known: true; holiday: null }
  /**
   * The calendar says NOTHING about this jurisdiction.
   *
   * The third value, and the reason this is not a boolean. "Not a holiday" and "we have no
   * calendar for your state" are opposite facts for a practice deciding whether to open a
   * session, and a `false` would render them identically — W170's rule about `not_recorded`,
   * arriving in a place that looks too simple to need it.
   */
  | { known: false };

/**
 * What the declared calendar says about one date.
 *
 * Takes a calendar explicitly rather than reading the shipped one, so a caller cannot get an
 * answer without saying which calendar it came from.
 */
export function holidayOn(
  calendar: readonly PublicHoliday[],
  jurisdiction: string,
  dateIso: string,
): HolidayReading {
  const forJurisdiction = calendar.filter((h) => h.jurisdiction === jurisdiction);
  if (forJurisdiction.length === 0) return { known: false };
  const match = forJurisdiction.find((h) => h.dateIso === dateIso);
  return { known: true, holiday: match ?? null };
}

/**
 * Seasonal adjustments this module refuses to derive, with the reason each is refused.
 *
 * Data rather than a comment — W196's `REFUSED_FIGURES` shape — so a later unit has to delete a
 * stated refusal rather than quietly add a function.
 */
export const REFUSED_SEASONALITY: Readonly<Record<string, string>> = {
  monthly_factor_from_history:
    "A per-month multiplier learned from the practice's own recorded weeks. Four Januaries is not a season; it is four numbers, three of which may share a public holiday this module does not know about and one of which may be a clinician on leave. The factor would travel as a property of the practice and be indistinguishable from a measurement.",
  school_term_effect:
    "Term dates are declared data like a holiday, and inferring their effect from fill rates has the same defect as inferring a monthly factor. If it is wanted, it is a calendar with a source, not a regression.",
  weather_or_flu_season:
    "Both are claims about why people did or did not attend, and neither is recorded anywhere in this tree. A capacity tool that reasoned about flu season would be reasoning clinically about a population.",
  trend_extrapolation:
    "Fitting a line through the recorded weeks and continuing it. W223 refuses to be more precise than the record, and a trend is precision about weeks that have not happened.",
};
