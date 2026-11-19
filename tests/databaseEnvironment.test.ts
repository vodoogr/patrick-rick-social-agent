import { test } from "node:test";
import assert from "node:assert/strict";
import { databaseConnection } from "../lib/databaseEnvironment";

const production = "postgresql://production.example.invalid/patrick_rick_db";
const preview = "postgresql://preview.example.invalid/patrick_rick_db?sslmode=require";
const env = {
  VERCEL: "1",
  VERCEL_ENV: "preview",
  PATRICK_DATABASE_HOST: "preview.example.invalid",
  DATABASE_URL: production,
  PATRICK_PREVIEW_DATABASE_URL: preview,
};

test("Preview resolves only its explicitly bound database", () => {
  assert.equal(databaseConnection(env), preview);
  assert.equal(databaseConnection({ ...env, PATRICK_PREVIEW_DATABASE_URL: undefined }), undefined);
  assert.equal(databaseConnection({ ...env, PATRICK_PREVIEW_DATABASE_URL: production }), undefined);
  assert.equal(databaseConnection({ ...env, PATRICK_DATABASE_HOST: undefined }), undefined);
});

test("Hosted connection rejects misleading endpoints and alternate database names", () => {
  for (const url of [
    preview.replace("patrick_rick_db", "neondb"),
    preview + "&host=production.example.invalid",
    preview + "&dbname=neondb",
    "malformed",
  ]) {
    assert.equal(databaseConnection({ ...env, PATRICK_PREVIEW_DATABASE_URL: url }), undefined);
  }
});

test("Production ignores Preview credentials and unknown hosted environments fail closed", () => {
  assert.equal(databaseConnection({
    ...env, VERCEL_ENV: "production", PATRICK_DATABASE_HOST: "production.example.invalid",
  }), production);
  assert.equal(databaseConnection({ ...env, VERCEL_ENV: undefined }), undefined);
  assert.equal(databaseConnection({ ...env, VERCEL_ENV: "development" }), undefined);
});
