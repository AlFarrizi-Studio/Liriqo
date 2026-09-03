# LIRIQO — Lyrics API

Real-time lyrics resolver powered by YouTube Music InnerTube. Pull LRC-synced or plain lyrics from **LyricFind** and **Musixmatch**, identify any track in milliseconds, and serve a single JSON response from one stable URL.

> **Live endpoint:** `https://kkwehlfmisoenatxpank.supabase.co/functions/v1/lyrics`

---

## Features

- 🎵 **LRC-synced lyrics** with millisecond timestamps (`lyricLine` + `cueRange`)
- 📝 **Plain lyrics** with full metadata (title, artist, provider, trackId)
- 🌍 **Multi-provider resolution** — resolve any track by title/artist/album/duration/source (Spotify, Apple Music, etc.)
- ⚡ **Fast** — average ~170ms response time, parallel fetch from 3 YT Music clients
- 🔓 **No auth, CORS-enabled** — drop-in for any frontend or backend
- 📊 **Live stats** — request log, performance chart, provider breakdown
- 🛠️ **5 endpoints** — full lyrics, plain only, LRC only, search top 5, plus stats

---

## Endpoints

Base URL: `https://kkwehlfmisoenatxpank.supabase.co/functions/v1`

| Method | Path | Description |
|---|---|---|
| `GET` | `/lyrics?videoId=XXX` | Full lyrics (plain + LRC) by YT Music videoId |
| `GET` | `/lyrics?title=X&artist=Y&album=Z&duration=N&source=spotify` | Resolve any provider's track + get lyrics |
| `GET` | `/lyrics/plain?videoId=XXX` | Plain text only (JSON) |
| `GET` | `/lyrics/lrc?videoId=XXX` | LRC synced lyrics (text/plain) |
| `GET` | `/lyrics/search?q=XXX` | Search YT Music + return top 5 tracks with lyrics |
| `GET` | `/stats?limit=100` | Live stats: total requests, success rate, provider hits, performance series, request log |

---

## Usage

### cURL

```bash
# Full lyrics
curl "https://kkwehlfmisoenatxpank.supabase.co/functions/v1/lyrics?videoId=dSqEkCMJVkc"

# LRC synced
curl "https://kkwehlfmisoenatxpank.supabase.co/functions/v1/lyrics/lrc?videoId=HaEYUJ2aRHs"

# Resolve by title/artist
curl "https://kkwehlfmisoenatxpank.supabase.co/functions/v1/lyrics?title=Dynamite&artist=BTS"

# Plain text only
curl "https://kkwehlfmisoenatxpank.supabase.co/functions/v1/lyrics/plain?videoId=kM0Fpbz0W8U"
```

### JavaScript (fetch)

```js
const res = await fetch(
  'https://kkwehlfmisoenatxpank.supabase.co/functions/v1/lyrics?videoId=dSqEkCMJVkc'
);
const data = await res.json();
console.log(data.title);        // "Shoukei"
console.log(data.artist);       // "TrySail"
console.log(data.provider);     // "LyricFind" | "Musixmatch" | null
console.log(data.plain);        // plain lyrics text
console.log(data.timed);        // LRC synced lines with start/end
console.log(data.synced);       // true if real LRC, false if plain-converted
console.log(data.lrc);          // formatted LRC string (only if synced)
```

### Example response (`/lyrics?videoId=HaEYUJ2aRHs`)

```json
{
  "videoId": "HaEYUJ2aRHs",
  "browseId": "MPLYt_M6GxuQGhwkR-8",
  "provider": "Musixmatch",
  "trackId": "t_M6GxuQGhwkR-8  \" 114947355",
  "title": "Dynamite",
  "artist": "BTS",
  "plain": "'Cause I, I, I'm in the stars tonight\nSo watch me bring the fire...",
  "timed": [
    {
      "text": "'Cause I, I, I'm in the stars tonight",
      "start": 440,
      "end": 4060,
      "id": 0
    }
  ],
  "synced": true,
  "lrc": "[ti:Dynamite]\n[ar:BTS]\n[al:]\n[length:]\n[re:Musixmatch]\n[00:00.44]'Cause I, I, I'm in the stars tonight\n...",
  "error": null
}
```

### LRC format example (`/lyrics/lrc?videoId=HaEYUJ2aRHs`)

```lrc
[ti:Dynamite]
[ar:BTS]
[al:]
[length:]
[re:Musixmatch]
[00:00.44]'Cause I, I, I'm in the stars tonight
[00:04.06]So watch me bring the fire and set the night alight
[00:09.01]Your shoes on, get up in the morn'
...
```

---

## How it works

The API uses YouTube Music InnerTube — Google's internal API for music.youtube.com. Three clients are queried in parallel for each request:

1. **WEB_REMIX** — primary client, returns `musicDescriptionShelfRenderer` (plain text) + provider footer ("Source: LyricFind" or "Source: Musixmatch")
2. **ANDROID_MUSIC** — returns `lyricLine` + `cueRange` for **LRC synced timestamps**
3. **IOS_MUSIC** — fallback for plain lyrics when web fails

The merged response prioritizes LRC synced (from Android) over plain (from Web), with provider detection from the web footer.

### Architecture

```
┌─────────────────┐
│  Client (any)   │
└────────┬────────┘
         │ GET /lyrics?videoId=XXX
         ▼
┌─────────────────────────────────────┐
│  Supabase Edge Function (US-East-1) │
│  ├─ Promise.all([                    │
│  │   ytMusic.next(videoId),          │
│  │   youtubeOEmbed(videoId)          │
│  │  ])                               │
│  ├─ ytMusic.browse(browseId) × 3     │
│  ├─ extractPlain + extractTimed      │
│  └─ POST /stats/record (fire-forget) │
└────────┬────────────────────────────┘
         │ JSON response
         ▼
┌─────────────────┐
│  Stats (Postgres)│
│  lyrics_request_  │
│  logs (max 100)   │
└─────────────────┘
```

---

## Self-hosting

This project is built on Supabase Edge Functions. To deploy your own instance:

### Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm i -g supabase`)
- Supabase project (free tier works)

### 1. Clone & link

```bash
git clone https://github.com/AlFarrizi-Studio/Liriqo.git
cd Liriqo
supabase link --project-ref YOUR_PROJECT_REF
```

### 2. Create database tables

Run in Supabase Dashboard → SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS lyrics_request_logs (
  id          BIGSERIAL PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  status      TEXT NOT NULL CHECK (status IN ('ok','err')),
  title       TEXT NOT NULL DEFAULT '—',
  artist      TEXT NOT NULL DEFAULT '',
  provider    TEXT,
  endpoint    TEXT NOT NULL DEFAULT '—',
  ip          TEXT NOT NULL DEFAULT '0.0.0.0',
  ms          INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON lyrics_request_logs (created_at DESC);
ALTER TABLE lyrics_request_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_all_logs ON lyrics_request_logs;
CREATE POLICY anon_all_logs ON lyrics_request_logs FOR ALL TO anon USING (true) WITH CHECK (true);
```

### 3. Set secrets

```bash
supabase secrets set LIRIYO_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
```

### 4. Deploy functions

```bash
supabase functions deploy lyrics
supabase functions deploy stats
```

### 5. Configure verify_jwt = false

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/YOUR_PROJECT_REF/functions/lyrics" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"verify_jwt": false}'
curl -X PATCH "https://api.supabase.com/v1/projects/YOUR_PROJECT_REF/functions/stats" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"verify_jwt": false}'
```

### 6. Update frontend URL

Edit `website/app.js`:

```js
const LYRICS_API = "https://YOUR_PROJECT_REF.supabase.co/functions/v1/lyrics";
const STATS_API  = "https://YOUR_PROJECT_REF.supabase.co/functions/v1/stats";
```

Deploy `website/` to Netlify, Vercel, or any static host.

---

## Tech stack

- **[Supabase Edge Functions](https://supabase.com/docs/guides/functions)** — Deno runtime, deployed in us-east-1
- **[YouTube Music InnerTube](https://github.com/sigma67/ytmusicapi)** — unofficial YT Music API protocol
- **Postgres** — request log storage (capped at 100 entries, auto-prune oldest)
- **Vanilla JS frontend** — no framework, ~390 lines, polls stats every 3s
- **YouTube oEmbed** — public API for title/artist/author (no auth)

---

## Limitations

- Some tracks have **geo-restricted** lyrics (LyricFind licensing excludes certain regions) — function returns `error: "Lyrics not available for this track/region"`
- Not all tracks have LRC synced timing from YT Music — `synced: false` means plain only
- Some tracks (e.g. Stella/SEKAI NO OWARI) may have lyrics from one region but not another
- **No user authentication** — uses anonymous InnerTube access; no `__Secure-3PSID` cookie required

---

## Credits

Built with ❤️ by [AlFarrizi-Studio](https://github.com/AlFarrizi-Studio)

Powered by YouTube Music InnerTube · Lyrics by [LyricFind](https://www.lyricfind.com) & [Musixmatch](https://www.musixmatch.com)

Inspired by the YT Music LRC synced format and the work of [NodeLink](https://github.com/PerformanC/NodeLink), [ytmusic-api](https://github.com/zS1L3NT/ts-npm-ytmusic-api), and [ytmusicapi](https://github.com/sigma67/ytmusicapi).

---

## License

MIT License — see [LICENSE](LICENSE) file for details.
