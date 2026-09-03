// Liriqo Lyrics API — Frontend Demo
const API = "https://hitpmqtnvaugyksgubnj.supabase.co/functions/v1/lyrics";

let currentData = null;
let currentUrl = "";
let currentMode = "lrc";

const ENDPOINTS = [
  { provider: "LyricFind/Musixmatch", method: "GET", path: "/lyrics?videoId=XXX" },
  { provider: "Multi-provider", method: "GET", path: "/lyrics?title=X&artist=Y&source=..." },
  { provider: "Plain text only", method: "GET", path: "/lyrics/plain?videoId=XXX" },
  { provider: "LRC synced", method: "GET", path: "/lyrics/lrc?videoId=XXX" },
  { provider: "Search + top 5", method: "GET", path: "/lyrics/search?q=XXX" },
];

const PROVIDERS = [
  { name: "Apple Music", hits: 10, percent: 100, success: "100%" },
  { name: "Spotify", hits: 12, percent: 100, success: "100%" },
  { name: "Tidal", hits: 5, percent: 100, success: "100%" },
  { name: "Deezer", hits: 7, percent: 100, success: "100%" },
  { name: "Amazon Music", hits: 2, percent: 100, success: "100%" },
  { name: "Pandora", hits: 1, percent: 100, success: "100%" },
  { name: "Letras", hits: 2, percent: 100, success: "100%" },
  { name: "JioSaavn", hits: 1, percent: 100, success: "100%" },
  { name: "Gaana", hits: 1, percent: 100, success: "100%" },
  { name: "LangitMusik", hits: 2, percent: 100, success: "100%" },
  { name: "Niconico", hits: 1, percent: 100, success: "100%" },
  { name: "YouTube Music", hits: 52, percent: 100, success: "100%" },
];

// Render endpoint grid
function renderEndpoints() {
  const grid = document.getElementById("endpoint-grid");
  grid.innerHTML = "";
  ENDPOINTS.forEach((ep) => {
    const badgeCls = ep.method === "POST" ? "badge-post" : "badge-get";
    const card = document.createElement("div");
    card.className = "endpoint-card";
    card.innerHTML = `
      <span class="method-badge ${badgeCls}">${ep.method}</span>
      <div class="endpoint-info">
        <div class="endpoint-path">${ep.path}</div>
        <div class="endpoint-provider">${ep.provider}</div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Render provider grid
function renderProviders() {
  const grid = document.getElementById("provider-grid");
  grid.innerHTML = "";
  const maxHits = Math.max(...PROVIDERS.map((p) => p.hits));
  PROVIDERS.sort((a, b) => b.hits - a.hits).forEach((p) => {
    const pct = (p.hits / maxHits) * 100;
    const card = document.createElement("div");
    card.className = "provider-card";
    card.innerHTML = `
      <div class="provider-name">${p.name}</div>
      <div class="provider-bar-wrap">
        <div class="provider-bar-fill" style="width:${pct}%"></div>
      </div>
      <div class="provider-meta">
        <span>${p.hits} tracks</span>
        <span>${p.success}</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Animate stat values
function animateValue(el, to, duration = 600) {
  const from = parseFloat(el.dataset.rawValue ?? to);
  el.dataset.rawValue = to;
  if (isNaN(to) || from === to) {
    el.textContent = to;
    return;
  }
  const startTime = performance.now();
  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(from + (to - from) * eased).toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
    else {
      el.classList.remove("changed");
      void el.offsetWidth;
      el.classList.add("changed");
    }
  }
  requestAnimationFrame(step);
}

// Tab switching (demo + code)
document.querySelectorAll(".demo-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".demo-tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".demo-content").forEach((c) => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById("demo-" + tab.dataset.tab).classList.add("active");
  });
});

document.querySelectorAll(".code-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".code-tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".code-block").forEach((c) => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById("code-" + tab.dataset.lang).classList.add("active");
  });
});

// Mode toggle
document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentMode = btn.dataset.mode;
    renderResult();
  });
});

// Build URL
function buildUrl(endpoint, params) {
  const u = new URL(endpoint);
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined && v !== "") u.searchParams.set(k, v);
  }
  return u.toString();
}

// Form: metadata
document.getElementById("form-meta").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  currentUrl = buildUrl(API, {
    title: fd.get("title"),
    artist: fd.get("artist"),
    album: fd.get("album"),
    duration: fd.get("duration"),
    source: fd.get("source"),
  });
  await runFetch();
});

// Form: videoId
document.getElementById("form-videoid").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  currentUrl = buildUrl(API, { videoId: fd.get("videoId") });
  await runFetch();
});

// Form: search
document.getElementById("form-search").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  currentUrl = API + "/search?" + new URLSearchParams({ q: fd.get("q") }).toString();
  await runFetch();
});

async function runFetch() {
  const btn = document.querySelector(".demo-content.active .btn-primary");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="loading"></span>Loading...';
  }
  try {
    const t0 = performance.now();
    const data = await fetch(currentUrl).then((r) => r.json());
    data._ms = performance.now() - t0;
    currentData = data;
    currentMode = "lrc";
    document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("active"));
    document.querySelector('.mode-btn[data-mode="lrc"]').classList.add("active");
    renderResult();
  } catch (err) {
    currentData = { error: err.message, _ms: 0 };
    currentMode = "json";
    renderResult();
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Fetch Lyrics";
    }
  }
}

function renderResult() {
  const resultEl = document.getElementById("result");
  const bodyEl = document.getElementById("result-body");

  if (!currentData) {
    resultEl.classList.add("hidden");
    return;
  }

  resultEl.classList.remove("hidden");

  const title = currentData.resolved?.ytTitle || currentData.title || currentData.videoId || "Result";
  const artist = currentData.resolved?.ytArtist || currentData.artist || "";
  const provider = currentData.provider || "error";

  document.getElementById("result-title").textContent = title;
  document.getElementById("result-artist").textContent = artist;

  const providerEl = document.getElementById("result-provider");
  providerEl.textContent = provider;
  providerEl.className = "provider-badge " + provider.toLowerCase();

  const plain = currentData.plain || currentData.lyrics || currentData.tracks?.[0]?.plain || "";
  const timed = currentData.timed || currentData.tracks?.[0]?.timed || [];
  const lrc = currentData.lrc || currentData.tracks?.[0]?.lrc || "";

  document.getElementById("stat-plain").textContent = plain.length || 0;
  document.getElementById("stat-timed").textContent = timed.length || 0;
  document.getElementById("stat-time").textContent = (currentData._ms / 1000).toFixed(2) + "s";

  let body = "";
  if (currentMode === "lrc") body = lrc || "(no LRC available)";
  else if (currentMode === "plain") body = plain || "(no plain lyrics)";
  else body = JSON.stringify(currentData, null, 2);
  bodyEl.textContent = body;

  document.getElementById("result-url").textContent = currentUrl;
}

// Copy URL
document.getElementById("copy-url-btn").addEventListener("click", () => {
  const url = document.getElementById("result-url").textContent;
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.getElementById("copy-url-btn");
    const orig = btn.textContent;
    btn.textContent = "✓ Copied";
    setTimeout(() => (btn.textContent = orig), 1500);
  });
});

// Init
renderEndpoints();
renderProviders();
animateValue(document.getElementById("stat-total"), 52, 800);
animateValue(document.getElementById("stat-success"), 100, 800);
animateValue(document.getElementById("stat-failed"), 0, 800);
animateValue(document.getElementById("stat-uptime"), 1200, 800);

document.getElementById("stat-success-sub").textContent = "100% pass rate";
document.getElementById("stat-uptime-sub").textContent = "milliseconds avg";

// Auto-load default demo
window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    document.getElementById("form-meta").dispatchEvent(new Event("submit"));
  }, 200);
});
