const jobs = (count: number): string => `${count} ${count === 1 ? "job" : "jobs"}`;
const matches = (count: number): string => `${count} strong ${count === 1 ? "match" : "matches"}`;

type Counts = {
  found: number;
  newCount: number;
  strongMatches: number;
};

/** The banner under the search card, e.g. "Found 8 jobs (5 new) and saved 4 strong matches." */
export function buildFindMessage(counts: Counts, jobTitle: string, location: string): string {
  if (counts.found === 0) {
    const where = location ? ` in ${location}` : "";
    return `No IT jobs found for "${jobTitle}"${where}. Try a different title or location.`;
  }
  const repeats = counts.newCount < counts.found ? ` (${counts.newCount} new)` : "";
  return `Found ${jobs(counts.found)}${repeats} and saved ${matches(counts.strongMatches)}.`;
}
