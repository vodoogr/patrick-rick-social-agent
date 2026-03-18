const URL = "https://xlxvyvqiuqbtjljtzwzt.supabase.co/rest/v1/albums";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhseHZ5dnFpdXFidGpsanR6d3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3ODQ1NjIsImV4cCI6MjA4OTM2MDU2Mn0.e5R_0DXkJqqPX14qrgQg81FppwNUFJWk3D205U5n2UQ";

async function check() {
  try {
    const res = await fetch(URL + "?select=*", {
      headers: {
        "apikey": KEY,
        "Authorization": "Bearer " + KEY
      }
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Data:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

check();
