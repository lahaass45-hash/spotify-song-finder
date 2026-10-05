import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = Number(process.env.PORT || 3001);
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const MARKET = process.env.SPOTIFY_MARKET || "DE";

app.use(express.json({ limit: "100kb" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let token = null;
let tokenExpiresAt = 0;

async function getToken() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("SPOTIFY_CLIENT_ID oder SPOTIFY_CLIENT_SECRET fehlt in .env");
  }
  if (token && Date.now() < tokenExpiresAt) return token;

  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({ grant_type: "client_credentials" })
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || data.error || "Spotify-Authentifizierung fehlgeschlagen.");
  }

  token = data.access_token;
  tokenExpiresAt = Date.now() + Math.max(60, data.expires_in - 60) * 1000;
  return token;
}

function spotifyQuery(input) {
  const parts = input.split(/\s+[–—-]\s+/);
  if (parts.length === 2) {
    return `track:${parts[0].trim()} artist:${parts[1].trim()}`;
  }
  return input.trim();
}

async function searchTrack(input) {
  const accessToken = await getToken();
  const params = new URLSearchParams({
    q: spotifyQuery(input),
    type: "track",
    market: MARKET,
    limit: "5"
  });

  const response = await fetch(`https://api.spotify.com/v1/search?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      token = null;
      tokenExpiresAt = 0;
    }
    throw new Error(data.error?.message || "Spotify-Suche fehlgeschlagen.");
  }

  return (data.tracks?.items || []).map(track => ({
    id: track.id,
    title: track.name,
    artist: track.artists?.map(a => a.name).join(", ") || "Unbekannter Künstler",
    album: track.album?.name || "",
    image: track.album?.images?.[0]?.url || null,
    url: track.external_urls?.spotify || `https://open.spotify.com/track/${track.id}`
  }));
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, configured: Boolean(CLIENT_ID && CLIENT_SECRET) });
});

app.post("/api/search", async (req, res) => {
  try {
    const queries = [...new Set(
      (Array.isArray(req.body?.queries) ? req.body.queries : [])
        .filter(x => typeof x === "string")
        .map(x => x.trim())
        .filter(Boolean)
    )].slice(0, 50);

    if (!queries.length) return res.status(400).json({ error: "Bitte mindestens einen Song eingeben." });

    const results = await Promise.all(queries.map(async query => {
      try {
        const matches = await searchTrack(query);
        return { query, result: matches[0] || null, alternatives: matches.slice(1) };
      } catch (error) {
        return { query, result: null, alternatives: [], error: error.message };
      }
    }));

    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(distPath, "index.html"), (error) => {
    if (error) next(error);
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Spotify-Backend läuft auf http://127.0.0.1:${PORT}`);
});
