import { strict as assert } from "node:assert";
import { test } from "node:test";
import { reconcileMetricool, type MetricoolObservation } from "../services/metricoolReconciliation";

const draft = { id: "a", platform: "instagram", title: "Reel" };
const post: MetricoolObservation = { draft_id: "a", metricool_post_id: "123", metricool_brand_id: "456", platform: "instagram", publication_date: "2026-12-01T18:00:00+01:00", status: "PENDING", auto_publish: true, has_media: true };

test("retains a supplied pending observation without treating it as published", () => {
  const [item] = reconcileMetricool([draft], [post], "456");
  assert.equal(item.status, "PENDING");
  assert.equal(item.draft_title, "Reel");
});
test("rejects wrong brand, platform, draft and duplicate mappings", () => {
  assert.throws(() => reconcileMetricool([draft], [post], "other"), /brand/);
  assert.throws(() => reconcileMetricool([draft], [{ ...post, platform: "tiktok" }], "456"), /Platform/);
  assert.throws(() => reconcileMetricool([], [post], "456"), /Draft/);
  assert.throws(() => reconcileMetricool([draft], [post, post], "456"), /more than once/);
});
