import { strict as assert } from "node:assert";
import { test } from "node:test";
import { assessPublication } from "../services/publicationEvidence";

const base = { platform: "instagram" as const, scheduled_at: "2026-12-01T18:00:00+01:00", observed_at: "2026-12-02T18:00:00+01:00", song: "Quiet Heat", still_scheduled: false };
test("missing after due stays unconfirmed, even with a plausible published candidate", () => {
  const result = assessPublication({ ...base, published_candidates: [{ platform: "instagram", published_at: "2026-12-01T18:01:00+01:00", url: "https://www.instagram.com/reel/example/", caption: "QUIET HEAT" }] });
  assert.equal(result.state, "unconfirmed_after_due");
  assert.equal(result.candidates.length, 1);
});
test("requires matching network, valid domain, caption and time", () => {
  const result = assessPublication({ ...base, published_candidates: [{ platform: "instagram", published_at: "2026-12-01T18:01:00+01:00", url: "https://instagram.com.evil.example/reel/x", caption: "QUIET HEAT" }] });
  assert.equal(result.candidates.length, 0);
  assert.equal(assessPublication({ ...base, still_scheduled: true, published_candidates: [] }).state, "scheduled_observed");
});
