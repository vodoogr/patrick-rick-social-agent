import { test } from "node:test";
import assert from "node:assert/strict";
import { videoProductionSchema } from "../services/videoProduction";

const draft = { artist: "Patrick Rick", song: "Golden Dust", version: "Electro", title: "Granada", shots: [{ number: 1, description: "Alhambra iluminada", status: "planned" }], assets: [] };

test("validates a production and rejects duplicate shot numbers", () => {
  assert.equal(videoProductionSchema.safeParse(draft).success, true);
  assert.equal(videoProductionSchema.safeParse({ ...draft, shots: [draft.shots[0], draft.shots[0]] }).success, false);
  assert.equal(videoProductionSchema.safeParse({ ...draft, shots: [{ ...draft.shots[0], status: "published" }] }).success, false);
});

