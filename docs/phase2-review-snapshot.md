# Phase 2: screenshot-based catalog review

The three `review_*` MCP tools query the explicitly pinned SHA-256 snapshot in
`catalog.review_album_snapshots` and `catalog.review_catalog_metadata`. These
tables are additive and separate from the historical `catalog.albums` and
`catalog.songs` data. The snapshot is a review aid, not an assertion that the
same title identifies the same composition, recording, or external release.

The isolated Neon branch `phase2/catalog-validation` has 34 album entries and
543 positions for the pinned snapshot. It also records Unplugged II as in
development with no final tracklist. Sources, truncated titles, suggested Drive
matches, and the user's correction to Your Side are retained in the JSON rows.

`database/catalog_review_snapshot.sql` creates the two tables but does not seed
them. The import must be prepared from the approved consolidated JSON, checked
against its SHA-256, and applied only to a verified target branch. Do not assume
that a different Preview or Production database contains this snapshot. The
tools fail if it is absent. The summary also checks the expected 34/543 counts.
All three review tools additionally check both the Neon project and branch ID
before reading data; they fail closed outside the isolated validation branch.

These tools do not replace the historical `catalog_*` tools. Before activation,
test authenticated MCP calls end to end on a Preview deployment explicitly
bound to the validation database. Check that wrong/no credentials are rejected,
that incomplete titles are labelled, and that the two catalog sources cannot be
mistaken for duplicate releases. Promotion is a separate reviewed step.

## Local validation, 2026-11-14

The production build was started locally with temporary test-only secrets and
the isolated Neon validation database. `tests/review-catalog-e2e.cjs` verified
that missing credentials are rejected, the three tools are discoverable, the
34/543 summary is returned, Only at Night has 15 positions, the Your Side
correction appears with an unknown duration, and Unplugged II has no final list.
Invalid album identifiers were rejected. The test uses a temporary static bearer
token and does not prove the OAuth flow or an actual Vercel Preview deployment.
No credentials are saved by the test.

The Vercel integration can identify the project and its protected Preview but
receives HTTP 403 when listing environment variables. The owner reported that
the Preview DATABASE_URL contains the endpoint identifier of the validation
branch and configured OAuth for the Phase 2 Git branch. This was not verified
through the Vercel API; authenticate and verify the new Preview before use.

