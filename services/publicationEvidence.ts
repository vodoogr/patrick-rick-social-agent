type Network = "instagram" | "tiktok";
export type PublishedCandidate = { platform: Network; published_at: string; url: string; caption: string };

function hostMatches(platform: Network, rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase();
    const base = platform === "instagram" ? "instagram.com" : "tiktok.com";
    return url.protocol === "https:" && (host === base || host.endsWith(`.${base}`));
  } catch { return false; }
}

// A match is only a candidate: dates and repeated captions do not prove identity.
export function assessPublication(input: {
  platform: Network; scheduled_at: string; song: string; still_scheduled: boolean;
  observed_at: string; published_candidates: PublishedCandidate[];
}) {
  const scheduled = Date.parse(input.scheduled_at);
  const observed = Date.parse(input.observed_at);
  if (!Number.isFinite(scheduled) || !Number.isFinite(observed)) throw new Error("Invalid date.");
  const song = input.song.trim().toLocaleLowerCase();
  if (!song) throw new Error("Song is required.");
  const candidates = input.published_candidates.filter((x) => {
    const published = Date.parse(x.published_at);
    return x.platform === input.platform && Number.isFinite(published) &&
      published >= scheduled - 3600_000 && published <= scheduled + 86400_000 &&
      x.caption.toLocaleLowerCase().includes(song) && hostMatches(x.platform, x.url);
  });
  const state = input.still_scheduled ? "scheduled_observed" : observed < scheduled ? "missing_before_due" : "unconfirmed_after_due";
  return { state, candidates, note: "Candidates require human or authoritative ID confirmation. Absence is not evidence of publication or failure." };
}
