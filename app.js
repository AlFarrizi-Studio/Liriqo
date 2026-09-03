// Liriqo Lyrics API — Frontend
const API = "https://hitpmqtnvaugyksgubnj.supabase.co/functions/v1/lyrics";

const ENDPOINTS = [
  { provider: "LyricFind/Musixmatch", method: "GET", path: "/lyrics?videoId=XXX" },
  { provider: "Multi-provider", method: "GET", path: "/lyrics?title=X&artist=Y&source=..." },
  { provider: "Plain text only", method: "GET", path: "/lyrics/plain?videoId=XXX" },
  { provider: "LRC synced", method: "GET", path: "/lyrics/lrc?videoId=XXX" },
  { provider: "Search + top 5", method: "GET", path: "/lyrics/search?q=XXX" },
];

const LYRIC_PROVIDERS = [
  {
    name: "LyricFind",
    key: "lyricfind",
    desc: "Official lyrics from musicians, music labels, and publishers. Accurate and fully licensed for the commercial market.",
    sample: "Bohemian Rhapsody, As It Was, Tum Hi Ho, Kangen",
    hits: 28,
    success: "100%",
    avgTime: "1.1s",
  },
  {
    name: "Musixmatch",
    key: "musixmatch",
    desc: "Synced lyrics from the Musixmatch community. Extensive coverage for Western and K-Pop tracks. Accurate LRC format.",
    sample: "Dynamite, Blinding Lights, Bad Guy, STAY",
    hits: 24,
    success: "100%",
    avgTime: "1.3s",
  },
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
    `;
    grid.appendChild(card);
  });
}

// ===== Render Lyric Providers =====
function renderLyricProviders() {
  const grid = document.getElementById("lyric-provider-grid");
  grid.innerHTML = "";
  LYRIC_PROVIDERS.forEach((p) => {
    const card = document.createElement("div");
    card.className = "lyric-provider-card " + p.key;
    card.innerHTML = `
      <div class="lyric-provider-header">
        <div class="lyric-provider-name">${p.name}</div>
        <span class="lyric-provider-badge">${p.key === "lyricfind" ? "GREEN" : "YELLOW"}</span>
      </div>
      <div class="lyric-provider-desc">${p.desc}</div>
      <div style="font-size:0.7rem; color:var(--text-dim); font-family:'JetBrains Mono', monospace;">
        <strong style="color:var(--text-muted);">sample:</strong> ${p.sample}
      </div>
      <div class="lyric-provider-stats">
        <div class="lyric-stat">
          <div class="lyric-stat-value">${p.hits}</div>
          <div class="lyric-stat-label">total hits</div>
        </div>
        <div class="lyric-stat">
          <div class="lyric-stat-value">${p.success}</div>
          <div class="lyric-stat-label">success rate</div>
        </div>
        <div class="lyric-stat">
          <div class="lyric-stat-value">${p.avgTime}</div>
          <div class="lyric-stat-label">avg response</div>
        </div>
      </div>
    `;
    grid.appendChild(card);
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

// ===== Request Log =====
const LOG_PAGE = 10;
let _log = [];
let _lastLogTimestamp = null;
let _logExpanded = false;
let _collapsedHeight = null;

function pushLog(entry) {
  _log.unshift(entry);
  if (_log.length > 100) _log.pop();
  renderLog();
}

async function probeEndpoint(url, track, artist, provider) {
  const t0 = performance.now();
  try {
    const r = await fetch(url);
    const ms = Math.round(performance.now() - t0);
    const ok = r.ok;
    let actualProvider = provider;
    if (ok) {
      try {
        const data = await r.json();
        actualProvider = data.provider || provider;
      } catch {}
    }
    pushLog({
      status: ok ? "ok" : "err",
      track: track,
      artist: artist,
      provider: actualProvider,
      endpoint: new URL(url).pathname + (new URL(url).search || ""),
      ip: "127.0.0.1",
      ms: ms,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    pushLog({
      status: "err",
      track: track,
      artist: artist,
      provider: provider,
      endpoint: new URL(url).pathname,
      ip: "127.0.0.1",
      ms: Math.round(performance.now() - t0),
      timestamp: new Date().toISOString(),
    });
  }
}

function buildLogRow(entry, isNew) {
  const tr = document.createElement("tr");
  tr.dataset.ts = entry.timestamp;
  if (isNew) tr.classList.add("log-row-new");

  const statusHtml = entry.status === "ok"
    ? `<span class="log-status ok">200 OK</span>`
    : `<span class="log-status err">ERR</span>`;

  const providerClass = (entry.provider || "none").toLowerCase();
  const providerHtml = entry.provider
    ? `<span class="log-provider-tag ${providerClass}">${entry.provider}</span>`
    : `<span class="log-provider-tag none">none</span>`;

  const time = new Date(entry.timestamp);
  const timeStr = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  tr.innerHTML = `
    <td>${statusHtml}</td>
    <td>
      <div class="log-track">${entry.track || "—"}</div>
      <div class="log-track-artist">${entry.artist || ""}</div>
    </td>
    <td>${providerHtml}</td>
    <td class="log-endpoint" title="${entry.endpoint}">${entry.endpoint}</td>
    <td class="log-ip col-ip" title="${entry.ip}">${entry.ip}</td>
    <td class="log-ms">${entry.ms}</td>
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

  countEl.textContent = `${_log.length} entr${_log.length === 1 ? "y" : "ies"}`;
  emptyEl.style.display = _log.length ? "none" : "block";

  tbody.innerHTML = "";
  _log.forEach((entry) => {
    const isNew = _lastLogTimestamp && entry.timestamp > _lastLogTimestamp;
    const tr = buildLogRow(entry, isNew);
    tbody.appendChild(tr);
  });
  if (_log.length) _lastLogTimestamp = _log[0].timestamp;

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

// ===== Periodic Stats Update =====
let totalReq = 0;
let failedReq = 0;

function updateStats() {
  animateValue(document.getElementById("stat-total"), totalReq, 500);
  const successRate = totalReq > 0 ? Math.round(((totalReq - failedReq) / totalReq) * 100) : 100;
  document.getElementById("stat-success").textContent = successRate + "%";
  document.getElementById("stat-success-sub").textContent = successRate === 100 ? "all requests passed" : "last 24h";
  animateValue(document.getElementById("stat-failed"), failedReq, 500);
  animateValue(document.getElementById("stat-uptime"), 1200, 500);
}

// ===== Auto-probe endpoints for demo =====
async function autoProbe() {
  const samples = [
    { videoId: "HaEYUJ2aRHs", track: "Dynamite", artist: "BTS", expected: "Musixmatch" },
    { videoId: "JMAJS_s99Ho", track: "きゅうくらりん", artist: "Iyowa", expected: "LyricFind" },
    { videoId: "kM0Fpbz0W8U", track: "Bohemian Rhapsody", artist: "Queen", expected: "LyricFind" },
  ];
  for (const s of samples) {
    const url = `${API}?videoId=${s.videoId}`;
    totalReq++;
    await probeEndpoint(url, s.track, s.artist, s.expected);
    await new Promise((r) => setTimeout(r, 500));
  }
  updateStats();
}

// ===== Performance Charts =====
const PERF_WINDOW = 30;
const perfData = {
  lyricfind: [],
  musixmatch: [],
};

function recordPerf(provider, ms) {
  const key = (provider || "").toLowerCase();
  if (!perfData[key]) return;
  perfData[key].push(ms);
  if (perfData[key].length > PERF_WINDOW) perfData[key].shift();
  renderChart(key);
}

function calcStats(arr) {
  if (!arr.length) return { current: 0, avg: 0, trend: 0, change: 0 };
  const half = Math.floor(arr.length / 2);
  const recent = arr.slice(half);
  const older = arr.slice(0, half);
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
  const recentAvg = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : avg;
  const olderAvg = older.length ? older.reduce((a, b) => a + b, 0) / older.length : avg;
  const change = olderAvg ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
  return { current: arr.length, avg: Math.round(avg), trend: change, last: arr[arr.length - 1] };
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
  const svgId = provider === "lyricfind" ? "lf-svg" : "mxm-svg";
  const svg = document.getElementById(svgId);
  if (!svg) return;

  const data = perfData[provider];
  const w = 600;
  const h = 120;

  // Grid lines
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

  // Path
  const linePath = svg.querySelector(".perf-line");
  const areaPath = svg.querySelector(".perf-area");
  linePath.setAttribute("d", buildPath(data, w, h));
  areaPath.setAttribute("d", buildAreaPath(data, w, h));

  // Points
  const pointsG = svg.querySelector(".perf-points");
  pointsG.innerHTML = "";
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
    c.setAttribute("fill", provider === "lyricfind" ? "#22c55e" : "#eab308");
    c.setAttribute("opacity", 0.6);
    pointsG.appendChild(c);
  });

  // Update stats
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

// ===== Init =====
renderEndpoints();
renderLyricProviders();
initLogToggle();
renderAllCharts();
updateStats();
autoProbe();
