const URL_ALBUMS = "https://xlxvyvqiuqbtjljtzwzt.supabase.co/rest/v1/albums";
const URL_SONGS = "https://xlxvyvqiuqbtjljtzwzt.supabase.co/rest/v1/songs";
const URL_PROFILES = "https://xlxvyvqiuqbtjljtzwzt.supabase.co/rest/v1/profiles";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhseHZ5dnFpdXFidGpsanR6d3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3ODQ1NjIsImV4cCI6MjA4OTM2MDU2Mn0.e5R_0DXkJqqPX14qrgQg81FppwNUFJWk3D205U5n2UQ";

async function seed() {
  const headers = {
    "apikey": KEY,
    "Authorization": "Bearer " + KEY,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
  };

  try {
    // 1. Get profile id
    const pRes = await fetch(URL_PROFILES + "?select=id&limit=1", { headers });
    const profiles = await pRes.json();
    if (!profiles?.[0]) throw new Error("No profile found");
    const ownerId = profiles[0].id;

    // 2. Create Album
    const albumData = {
      owner_id: ownerId,
      title: "The Sin Collection",
      slug: "the-sin-collection",
      era: "RED",
      release_year: 2024,
      description: "A collection of tracks exploring human desire and red-era intensity.",
      creative_dna: {
        narrative_summary: "The exploration of heat, pulse, and impulse.",
        canonical_phrase: "Some fires are softer when they know your name."
      }
    };
    const aRes = await fetch(URL_ALBUMS, {
      method: "POST",
      headers,
      body: JSON.stringify(albumData)
    });
    const albums = await aRes.json();
    if (!albums?.[0]) throw new Error("Failed to create album: " + JSON.stringify(albums));
    const albumId = albums[0].id;
    console.log("✅ Created Album:", albums[0].title);

    // 3. Link Song
    const sRes = await fetch(URL_SONGS + "?title=ilike.*Warmth of Sin*", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ album_id: albumId, track_number: 1 })
    });
    console.log("✅ Linked song. Status:", sRes.status);

  } catch (err) {
    console.error("Seed Error:", err);
  }
}

seed();
