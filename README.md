# LIRIQO

Live lyrics API powered by YouTube Music InnerTube. Pull LRC-synced or plain lyrics from **LyricFind** and **Musixmatch** via a single endpoint.

🌐 **Dashboard:** https://alfarrizi-studio.github.io/Liriqo/

---

## API Endpoints

Base URL: `https://kkwehlfmisoenatxpank.supabase.co/functions/v1`

| Method | Path | Description |
|---|---|---|
| `GET` | `/lyrics?videoId=XXX` | Full lyrics (plain + LRC) by YT Music videoId |
| `GET` | `/lyrics?title=X&artist=Y&album=Z&duration=N&source=spotify` | Resolve any provider's track + get lyrics |
| `GET` | `/lyrics/plain?videoId=XXX` | Plain text only (JSON) |
| `GET` | `/lyrics/lrc?videoId=XXX` | LRC synced lyrics (text/plain) |
| `GET` | `/lyrics/search?q=XXX` | Search YT Music + return top 5 tracks with lyrics |
| `GET` | `/stats?limit=100` | Live stats: total requests, success rate, provider hits, performance, request log |

No auth, CORS-enabled. Free forever.

---

## Quick start

```bash
# Full lyrics
curl "https://kkwehlfmisoenatxpank.supabase.co/functions/v1/lyrics?videoId=HaEYUJ2aRHs"

# LRC synced
curl "https://kkwehlfmisoenatxpank.supabase.co/functions/v1/lyrics/lrc?videoId=HaEYUJ2aRHs"
```

```js
const res = await fetch('https://kkwehlfmisoenatxpank.supabase.co/functions/v1/lyrics?videoId=HaEYUJ2aRHs');
const data = await res.json();
// data.title, data.artist, data.provider, data.plain, data.timed, data.synced, data.lrc
```

---

## License

MIT — see [LICENSE](LICENSE).
