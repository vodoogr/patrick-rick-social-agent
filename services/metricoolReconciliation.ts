export type MetricoolObservation = {
  draft_id: string;
  metricool_post_id: string;
  metricool_brand_id: string;
  platform: "instagram" | "tiktok";
  publication_date: string;
  status: "PENDING" | "PUBLISHING" | "PUBLISHED" | "ERROR" | "AWAITING_CONFIRMATION";
  auto_publish: boolean;
  has_media: boolean;
};

// This records a comparison of caller-supplied observations, not a live Metricool query.
export function reconcileMetricool(
  drafts: Array<{ id: string; platform: string; title: string }>,
  observations: MetricoolObservation[],
  expectedBrand: string,
) {
  const postIds = new Set<string>();
  const draftIds = new Set<string>();
  const byId = new Map(drafts.map((draft) => [draft.id.toLowerCase(), draft]));
  return observations.map((observation) => {
    const key = observation.draft_id.toLowerCase();
    const draft = byId.get(key);
    if (!draft) throw new Error("Draft not found in the selected proposal.");
    if (observation.metricool_brand_id !== expectedBrand) throw new Error("Metricool brand does not match the requested brand.");
    if (draft.platform !== observation.platform) throw new Error("Platform does not match the draft.");
    if (postIds.has(observation.metricool_post_id) || draftIds.has(key)) throw new Error("A post or draft was mapped more than once.");
    postIds.add(observation.metricool_post_id);
    draftIds.add(key);
    return { ...observation, draft_title: draft.title };
  });
}
