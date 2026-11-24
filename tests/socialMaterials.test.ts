import { test } from "node:test";
import assert from "node:assert/strict";
import { socialMaterialSchema, summarizeMaterials } from "../services/socialMaterials";

const base = {
  draft_id: "00000000-0000-4000-8000-000000000001",
  kind: "audio" as const,
  label: "Fragmento principal",
  reference: "suno:track-123",
  state: "provided" as const,
};

test("audio excerpts require an ordered start and end", () => {
  assert.equal(socialMaterialSchema.safeParse({ ...base, start_seconds: 0, end_seconds: 15.5 }).success, true);
  assert.equal(socialMaterialSchema.safeParse({ ...base, start_seconds: 10 }).success, false);
  assert.equal(socialMaterialSchema.safeParse({ ...base, start_seconds: 10, end_seconds: 10 }).success, false);
  assert.equal(socialMaterialSchema.safeParse({ ...base, kind: "image", start_seconds: 1, end_seconds: 3 }).success, false);
});

test("listening links require HTTPS and proposed assets stay pending", () => {
  assert.equal(socialMaterialSchema.safeParse({ ...base, kind: "listening_link", reference: "http://example.com" }).success, false);
  assert.equal(socialMaterialSchema.safeParse({ ...base, kind: "listening_link", reference: "https://example.com/track" }).success, true);
  const result = summarizeMaterials([
    { kind: "audio", state: "provided" },
    { kind: "video", state: "proposed" },
    { kind: "listening_link", state: "provided" },
  ]);
  assert.equal(result.audio, true);
  assert.equal(result.song, false);
  assert.equal(result.visual, false);
  assert.equal(result.listening_link, true);
  assert.equal(summarizeMaterials([{ kind: "cover", state: "provided" }]).visual, true);
});
