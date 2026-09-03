// Liriqo Lyrics API — Frontend Demo
const API = "https://hitpmqtnvaugyksgubnj.supabase.co/functions/v1/lyrics";

let currentData = null;
let currentUrl = "";
let currentMode = "lrc";

// Tab switching
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById("tab-" + tab.dataset.tab).classList.add("active");
  });
});

// Code tab switching
document.querySelectorAll(".code-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".code-tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".code-block").forEach((c) => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById("code-" + tab.dataset.lang).classList.add("active");
  });
});

// Lyrics mode toggle
document.querySelectorAll(".toggle-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".toggle-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentMode = btn.dataset.mode;
    renderResult();
  });
});

// Build URL from form
function buildUrl(endpoint, params) {
  const u = new URL(endpoint);
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined && v !== "") u.searchParams.set(k, v);
  }
  return u.toString();
}

// Fetch with error handling
async function fetchLyrics(url) {
  const t0 = performance.now();
  const r = await fetch(url);
  const data = await r.json();
  const ms = performance.now() - t0;
  return { data, ms };
}

// Render result
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
  const trackId = currentData.trackId || currentData.tracks?.[0]?.trackId || "";

  document.getElementById("result-title").textContent = title;
  document.getElementById("result-artist").textContent = artist;

  const providerEl = document.getElementById("result-provider");
  providerEl.textContent = provider;
  providerEl.className = "provider-badge " + provider.toLowerCase();

  document.getElementById("result-trackid").textContent = trackId ? `Track ID: ${trackId}` : "";

  const plain = currentData.plain || currentData.lyrics || currentData.tracks?.[0]?.plain || "";
  const timed = currentData.timed || currentData.tracks?.[0]?.timed || [];
  const lrc = currentData.lrc || currentData.tracks?.[0]?.lrc || "";

  document.getElementById("stat-plain").textContent = plain.length || 0;
  document.getElementById("stat-timed").textContent = timed.length || 0;
  document.getElementById("stat-time").textContent = (currentData._ms / 1000).toFixed(2) + "s";

  let body = "";
  if (currentMode === "lrc") {
    body = lrc || "(no LRC available)";
  } else if (currentMode === "plain") {
    body = plain || "(no plain lyrics)";
  } else {
    body = JSON.stringify(currentData, null, 2);
  }
  bodyEl.textContent = body;

  document.getElementById("result-url").textContent = currentUrl;
}

// Form: By Metadata
document.getElementById("form-meta").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const params = {
    title: fd.get("title"),
    artist: fd.get("artist"),
    album: fd.get("album"),
    duration: fd.get("duration"),
    source: fd.get("source"),
  };
  currentUrl = buildUrl(API, params);
  await runFetch();
});

// Form: By videoId
document.getElementById("form-videoid").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const params = { videoId: fd.get("videoId") };
  currentUrl = buildUrl(API, params);
  await runFetch();
});

// Form: Search
document.getElementById("form-search").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const params = { q: fd.get("q") };
  currentUrl = API + "/search?" + new URLSearchParams(params).toString();
  await runFetch();
});

async function runFetch() {
  const btn = document.querySelector("#result.hidden") ? null : document.querySelector(".btn-primary");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="loading"></span>Loading...';
  }

  try {
    const { data, ms } = await fetchLyrics(currentUrl);
    data._ms = ms;
    currentData = data;
    currentMode = "lrc";
    document.querySelectorAll(".toggle-btn").forEach((b) => b.classList.remove("active"));
    document.querySelector('.toggle-btn[data-mode="lrc"]').classList.add("active");
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

// Copy URL
document.getElementById("copy-url-btn").addEventListener("click", () => {
  const url = document.getElementById("result-url").textContent;
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.getElementById("copy-url-btn");
    const orig = btn.textContent;
    btn.textContent = "✅ Copied!";
    setTimeout(() => (btn.textContent = orig), 1500);
  });
});

// Auto-load default example
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("form-meta").dispatchEvent(new Event("submit"));
});
