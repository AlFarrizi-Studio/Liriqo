// Liriqo Lyrics API — Frontend (Live data from Supabase)
const LYRICS_API = "https://kkwehlfmisoenatxpank.supabase.co/functions/v1/lyrics";
const STATS_API  = "https://kkwehlfmisoenatxpank.supabase.co/functions/v1/stats";

const ENDPOINTS = [
  { provider: "LyricFind/Musixmatch", method: "GET", path: "/lyrics?videoId=XXX", full: "https://kkwehlfmisoenatxpank.supabase.co/functions/v1/lyrics" },
  { provider: "Multi-provider", method: "GET", path: "/lyrics?title=X&artist=Y&source=...", full: "https://kkwehlfmisoenatxpank.supabase.co/functions/v1/lyrics" },
  { provider: "Plain text only", method: "GET", path: "/lyrics/plain?videoId=XXX", full: "https://kkwehlfmisoenatxpank.supabase.co/functions/v1/lyrics" },
  { provider: "LRC synced", method: "GET", path: "/lyrics/lrc?videoId=XXX", full: "https://kkwehlfmisoenatxpank.supabase.co/functions/v1/lyrics" },
  { provider: "Search + top 5", method: "GET", path: "/lyrics/search?q=XXX", full: "https://kkwehlfmisoenatxpank.supabase.co/functions/v1/lyrics" },
];

// ===== Render Endpoints =====
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
      <button class="btn-copy" data-url="${ep.full}" title="Copy base URL">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
    `;
    grid.appendChild(card);
  });
  grid.querySelectorAll(".btn-copy").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const url = btn.getAttribute("data-url");
      navigator.clipboard.writeText(url).then(() => {
        btn.classList.add("copied");
        const original = btn.innerHTML;
        btn.innerHTML = "✓";
        setTimeout(() => {
          btn.classList.remove("copied");
          btn.innerHTML = original;
        }, 1200);
      });
    });
  });
}

// ===== Render Lyric Providers (static info card, stats pulled live) =====
const LYRIC_PROVIDER_INFO = {
  LyricFind: {
    key: "lyricfind",
    name: "LyricFind",
    desc: "Official lyrics from musicians, music labels, and publishers. Accurate and fully licensed for the commercial market.",
  },
  Musixmatch: {
    key: "musixmatch",
    name: "Musixmatch",
    desc: "Synced lyrics from the Musixmatch community. Extensive coverage for Western and K-Pop tracks. Accurate LRC format.",
  },
};

function renderLyricProviders() {
  const grid = document.getElementById("lyric-provider-grid");
  grid.innerHTML = "";
  const logos = {
    lyricfind: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="provider-logo-svg">
      <circle cx="50" cy="50" r="45" fill="#22c55e"/>
      <text x="50" y="62" font-size="32" font-weight="700" text-anchor="middle" fill="white" font-family="Inter, sans-serif">LF</text>
    </svg>`,
    musixmatch: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="provider-logo-svg">
      <circle cx="50" cy="50" r="45" fill="#eab308"/>
      <text x="50" y="62" font-size="32" font-weight="700" text-anchor="middle" fill="white" font-family="Inter, sans-serif">MM</text>
    </svg>`,
  };
  Object.values(LYRIC_PROVIDER_INFO).forEach((p) => {
    const card = document.createElement("div");
    card.className = "lyric-provider-card " + p.key;
    card.innerHTML = `
      <div class="lyric-provider-header">
        <div class="lyric-provider-logo">${logos[p.key] || ""}</div>
        <div class="lyric-provider-name">${p.name}</div>
      </div>
      <div class="lyric-provider-desc">${p.desc}</div>
      <div class="lyric-provider-stats" data-provider="${p.name}">
        <div class="lyric-stat">
          <div class="lyric-stat-value" data-hits>0</div>
          <div class="lyric-stat-label">total hits</div>
        </div>
        <div class="lyric-stat">
          <div class="lyric-stat-value" data-success>—</div>
          <div class="lyric-stat-label">success rate</div>
        </div>
        <div class="lyric-stat">
          <div class="lyric-stat-value" data-avg>—</div>
          <div class="lyric-stat-label">avg response</div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function updateLyricProviderStats(providers) {
  if (!providers) return;
  Object.entries(providers).forEach(([name, info]) => {
    const card = document.querySelector(`.lyric-provider-stats[data-provider="${name}"]`);
    if (!card) return;
    card.querySelector("[data-hits]").textContent = info.hits ?? 0;
    card.querySelector("[data-success]").textContent = info.success_rate ?? "100%";
    const avgMs = Math.round(info.avg_ms ?? 0);
    card.querySelector("[data-avg]").textContent = avgMs ? (avgMs / 1000).toFixed(1) + "s" : "—";
  });
}

// ===== Stats Animation =====
function animateValue(el, to, duration = 600) {
  const from = parseFloat(el.dataset.rawValue ?? to);
  el.dataset.rawValue = to;
  if (isNaN(to)) {
    el.textContent = to;
    return;
  }
  if (from === to) {
    el.textContent = to;
    return;
  }
  const startTime = performance.now();
  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(from + (to - from) * eased).toLocaleString();
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.classList.remove("changed");
      void el.offsetWidth;
      el.classList.add("changed");
    }
  }
  requestAnimationFrame(step);
}

// ===== Request Log (live from Supabase) =====
const LOG_PAGE = 10;
let _log = [];
let _lastLogTimestamp = null;
let _logExpanded = false;
let _collapsedHeight = null;

function setLog(entries) {
  _log = entries || [];
  renderLog();
}

function buildLogRow(entry, isNew) {
  const tr = document.createElement("tr");
  tr.dataset.ts = entry.timestamp;
  if (isNew) tr.classList.add("log-row-new");

  const statusHtml = entry.status === "ok"
    ? `<span class="log-status ok">200 OK</span>`
    : `<span class="log-status err">ERR</span>`;

  const providerKey = (entry.provider || "none").toLowerCase();
  const providerHtml = entry.provider
    ? `<span class="log-provider-tag ${providerKey}">${entry.provider}</span>`
    : `<span class="log-provider-tag none">none</span>`;

  const time = new Date(entry.timestamp);
  const timeStr = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  tr.innerHTML = `
    <td>${statusHtml}</td>
    <td><div class="log-track">${entry.title || entry.track || "—"}</div></td>
    <td><div class="log-track-artist">${entry.artist || ""}</div></td>
    <td>${providerHtml}</td>
    <td class="log-endpoint" title="${entry.endpoint || ""}">${entry.endpoint || ""}</td>
    <td class="log-ip col-ip" title="${entry.ip || ""}">${entry.ip || ""}</td>
    <td class="log-ms">${entry.ms ?? 0}</td>
    <td title="${entry.timestamp}">${timeStr}</td>
  `;
  return tr;
}

function renderLog() {
  const tbody = document.getElementById("log-tbody");
  const emptyEl = document.getElementById("log-empty");
  const countEl = document.getElementById("log-count");
  const toggleBtn = document.getElementById("log-toggle");
  const wrapEl = document.getElementById("log-table-wrap");

  countEl.textContent = `${_log.length} entr${_log.length === 1 ? "y" : "ies"} · live · max 100`;
  emptyEl.style.display = _log.length ? "none" : "block";

  tbody.innerHTML = "";
  const newest = _log[0]?.timestamp;
  _log.forEach((entry) => {
    const isNew = _lastLogTimestamp && entry.timestamp > _lastLogTimestamp;
    const tr = buildLogRow(entry, isNew);
    tbody.appendChild(tr);
  });
  if (newest) _lastLogTimestamp = newest;

  if (_log.length > LOG_PAGE) {
    toggleBtn.style.display = "flex";
    if (_collapsedHeight === null) {
      wrapEl.style.maxHeight = "none";
      const allRows = tbody.querySelectorAll("tr");
      let height = 0;
      for (let i = 0; i < Math.min(LOG_PAGE, allRows.length); i++) {
        height += allRows[i].getBoundingClientRect().height;
      }
      const thead = wrapEl.querySelector("thead");
      if (thead) height += thead.getBoundingClientRect().height;
      _collapsedHeight = Math.ceil(height) + 1;
      wrapEl.style.removeProperty("max-height");
      wrapEl.style.setProperty("--collapsed-height", _collapsedHeight + "px");
    }
  } else {
    toggleBtn.style.display = "none";
    wrapEl.classList.remove("collapsed");
    wrapEl.classList.add("expanded");
  }
}

function initLogToggle() {
  const btn = document.getElementById("log-toggle");
  const wrapEl = document.getElementById("log-table-wrap");

  btn.addEventListener("click", () => {
    _logExpanded = !_logExpanded;
    if (_logExpanded) {
      wrapEl.classList.remove("collapsed");
      wrapEl.classList.add("expanded");
      btn.classList.add("expanded");
      btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg> Show less`;
    } else {
      wrapEl.classList.remove("expanded");
      wrapEl.classList.add("collapsed");
      btn.classList.remove("expanded");
      btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg> Show more`;
    }
  });
}

// ===== Performance Charts (live data) =====
const PERF_WINDOW = 30;
const perfData = {
  lyricfind: [],
  musixmatch: [],
};

function calcStats(arr) {
  if (!arr.length) return { current: 0, avg: 0, trend: 0 };
  const half = Math.floor(arr.length / 2);
  const recent = arr.slice(half);
  const older = arr.slice(0, half);
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
  const recentAvg = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : avg;
  const olderAvg = older.length ? older.reduce((a, b) => a + b, 0) / older.length : avg;
  const change = olderAvg ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
  return { current: arr.length, avg: Math.round(avg), trend: change };
}

function buildPath(points, w, h) {
  if (!points.length) return "";
  const max = Math.max(...points, 100);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const stepX = w / Math.max(points.length - 1, 1);
  return points
    .map((v, i) => {
      const x = i * stepX;
      const y = h - ((v - min) / range) * h;
      return (i === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1);
    })
    .join(" ");
}

function buildAreaPath(points, w, h) {
  const line = buildPath(points, w, h);
  if (!line) return "";
  return line + ` L${w.toFixed(1)},${h} L0,${h} Z`;
}

function renderChart(provider) {
  const svg = document.getElementById("perf-svg");
  if (!svg) return;

  const w = 600;
  const h = 160;
  const data = perfData[provider];
  const color = provider === "lyricfind" ? "#22c55e" : "#eab308";

  if (provider === "lyricfind") {
    const grid = svg.querySelector(".perf-grid");
    grid.innerHTML = "";
    for (let i = 0; i < 4; i++) {
      const y = (h / 4) * i;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", 0);
      line.setAttribute("y1", y);
      line.setAttribute("x2", w);
      line.setAttribute("y2", y);
      grid.appendChild(line);
    }
  }

  const linePath = svg.querySelector(`.${provider === "lyricfind" ? "lyricfind" : "musixmatch"}-line`);
  const areaPath = svg.querySelector(`.${provider === "lyricfind" ? "lf" : "mxm"}-area`);
  linePath.setAttribute("d", buildPath(data, w, h));
  areaPath.setAttribute("d", buildAreaPath(data, w, h));

  const pointsG = svg.querySelector(`.${provider === "lyricfind" ? "lf" : "mxm"}-points`);
  pointsG.innerHTML = "";
  if (data.length) {
    const max = Math.max(...data, 100);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const stepX = w / Math.max(data.length - 1, 1);
    data.forEach((v, i) => {
      const x = i * stepX;
      const y = h - ((v - min) / range) * h;
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", x);
      c.setAttribute("cy", y);
      c.setAttribute("r", 2);
      c.setAttribute("fill", color);
      c.setAttribute("opacity", 0.6);
      pointsG.appendChild(c);
    });
  }

  const stats = calcStats(data);
  const prefix = provider === "lyricfind" ? "lf" : "mxm";
  document.getElementById(prefix + "-current").textContent = stats.current;
  document.getElementById(prefix + "-avg").textContent = stats.avg;
  const trendEl = document.getElementById(prefix + "-trend");
  if (stats.trend > 5) {
    trendEl.className = "trend-down";
    trendEl.textContent = `↑ ${Math.abs(stats.trend).toFixed(1)}%`;
  } else if (stats.trend < -5) {
    trendEl.className = "trend-up";
    trendEl.textContent = `↓ ${Math.abs(stats.trend).toFixed(1)}%`;
  } else {
    trendEl.className = "trend-neutral";
    trendEl.textContent = `— ${Math.abs(stats.trend).toFixed(1)}%`;
  }
}

function renderAllCharts() {
  renderChart("lyricfind");
  renderChart("musixmatch");
}

function applyPerformance(perf) {
  if (!perf) return;
  perfData.lyricfind = (perf.LyricFind || []).slice(-PERF_WINDOW);
  perfData.musixmatch = (perf.Musixmatch || []).slice(-PERF_WINDOW);
  renderAllCharts();
}

// ===== Top stats bar =====
function applyTopStats(s) {
  const total = s.total_requests ?? 0;
  const failed = s.failed_requests ?? 0;
  const success = s.successful_requests ?? (total - failed);
  const avg = s.avg_ms ?? 0;

  animateValue(document.getElementById("stat-total"), total, 500);

  const successRate = total > 0 ? ((success / total) * 100).toFixed(1) : "100.0";
  document.getElementById("stat-success").textContent = successRate + "%";
  document.getElementById("stat-success-sub").textContent =
    successRate === "100.0" ? "all requests passed" : "since deploy";

  animateValue(document.getElementById("stat-failed"), failed, 500);
  animateValue(document.getElementById("stat-uptime"), avg, 500);
}

// ===== Live polling from Supabase =====
async function fetchStats() {
  try {
    const r = await fetch(`${STATS_API}?limit=100&t=${Date.now()}`);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

let _polling = false;

async function pollStats() {
  if (_polling) return;
  _polling = true;
  try {
    const data = await fetchStats();
    if (!data) return;

    applyTopStats(data);

    const providers = {
      LyricFind: {
        hits: data.providers?.LyricFind?.hits ?? 0,
        success_rate: data.providers?.LyricFind?.success_rate ?? "100%",
        avg_ms: data.performance?.LyricFind?.length
          ? data.performance.LyricFind.reduce((a, b) => a + b, 0) / data.performance.LyricFind.length
          : 0,
      },
      Musixmatch: {
        hits: data.providers?.Musixmatch?.hits ?? 0,
        success_rate: data.providers?.Musixmatch?.success_rate ?? "100%",
        avg_ms: data.performance?.Musixmatch?.length
          ? data.performance.Musixmatch.reduce((a, b) => a + b, 0) / data.performance.Musixmatch.length
          : 0,
      },
    };
    updateLyricProviderStats(providers);
    applyPerformance(data.performance);
    setLog(data.logs || []);
  } finally {
    _polling = false;
  }
}

function startLivePolling() {
  pollStats();
  setInterval(pollStats, 3000);
}

// ===== Init =====
renderEndpoints();
renderLyricProviders();
initLogToggle();
renderAllCharts();
startLivePolling();
