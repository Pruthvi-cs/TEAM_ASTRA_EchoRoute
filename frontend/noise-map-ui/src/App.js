/**
    EchoRoute — Urban Noise Command System
    App.js  |  Login + Admin/User views + Leaflet live map
  
    Admin credentials : any ID  +  password  123
    User  credentials : any name (no password)

    NEW (User Tab): Route Planner
    - Select Start & End from road-node dropdowns OR click the map
    - Dijkstra over the road graph with cost = α·distance + β·noise
    - Route is drawn on the Leaflet map with noise-zone overlays
    - Summary card shows total distance, avg noise, noise-cost score
 */

const API = 'http://localhost:8000';

/* DEMO / FALLBACK DATA  (used when API is offline)*/
const DEMO_DATA = [
  { name: 'Hampankatta',      noise_level: 88.2, lat: 12.870, lon: 74.836 },
  { name: 'MG Road',          noise_level: 78.3, lat: 12.876, lon: 74.843 },
  { name: 'Old Airport Road', noise_level: 71.0, lat: 12.864, lon: 74.857 },
  { name: 'Hosur Road',       noise_level: 63.4, lat: 12.881, lon: 74.852 },
  { name: 'Brigade Road',     noise_level: 55.1, lat: 12.872, lon: 74.848 },
  { name: 'Kodialbail',       noise_level: 48.9, lat: 12.860, lon: 74.833 },
];

/* UTILITIES*/
function noiseColor(db) {
  if (db > 80) return 'var(--accent2)';
  if (db > 70) return 'var(--warn)';
  return 'var(--safe)';
}
function noiseColorHex(db) {
  if (db > 80) return '#ff4b6e';
  if (db > 70) return '#ffb800';
  return '#00e676';
}
function noiseStatus(db) {
  if (db > 80) return 'CRITICAL';
  if (db > 70) return 'WARNING';
  return 'SAFE';
}
function noiseEmoji(db) {
  if (db > 80) return '🔴';
  if (db > 70) return '🟡';
  return '🟢';
}
function escHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

/** Haversine distance in km between two lat/lon points */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* INJECT STYLES (once)*/
(function injectLeafletStyles() {
  if (document.getElementById('echoroute-leaflet-css')) return;
  const s = document.createElement('style');
  s.id = 'echoroute-leaflet-css';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap');

    /* ── Leaflet dark tile & popup overrides ── */
    .leaflet-tile { filter: brightness(0.65) saturate(0.4) hue-rotate(180deg); }
    .leaflet-container { background: #050a0f !important; }
    .leaflet-popup-content-wrapper {
      background: #0a1219 !important;
      border: 1px solid #1e2d3d !important;
      border-radius: 10px !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.75) !important;
      padding: 0 !important;
    }
    .leaflet-popup-tip-container { display: none; }
    .leaflet-popup-close-button {
      color: #8899a6 !important; top: 8px !important; right: 8px !important; font-size: 16px !important;
    }
    .leaflet-popup-content { margin: 0 !important; }
    .leaflet-control-zoom a {
      background: #0a1219 !important; color: #00ffe1 !important; border-color: #1e2d3d !important;
    }
    .leaflet-control-zoom a:hover { background: #101c26 !important; }

    /* ── Map legend ── */
    #map-legend {
      position: absolute; top: 14px; right: 14px; z-index: 999;
      display: flex; flex-direction: column; gap: 6px;
    }
    .legend-pill {
      display: flex; align-items: center; gap: 8px;
      background: rgba(10,18,25,0.9); border: 1px solid #1e2d3d;
      border-radius: 20px; padding: 5px 12px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px; letter-spacing: 0.12em;
      color: #8899a6; backdrop-filter: blur(8px); text-transform: uppercase;
    }
    .legend-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }

    /* ── Alert list items ── */
    .alert-item {
      display: flex; align-items: center; gap: 14px;
      padding: 12px 16px; border-radius: 8px; margin-bottom: 10px;
      border: 1px solid var(--border); background: var(--panel);
      font-family: 'JetBrains Mono', monospace;
    }
    .alert-badge {
      font-size: 11px; font-weight: 700; padding: 4px 10px;
      border-radius: 20px; white-space: nowrap; margin-left: auto;
    }
    .alert-name { font-weight: 600; font-size: 14px; margin-bottom: 2px; }
    .alert-detail { font-size: 11px; color: var(--muted); }

    /* ── Noise bars ── */
    .db-bar-wrap { margin-bottom: 12px; }
    .db-bar-label {
      display: flex; justify-content: space-between;
      font-size: 12px; margin-bottom: 5px; font-family: 'JetBrains Mono', monospace;
    }
    .db-bar-track { height: 7px; background: var(--border); border-radius: 4px; overflow: hidden; }
    .db-bar-fill { height: 100%; border-radius: 4px; width: 0%; transition: width 0.8s cubic-bezier(.4,0,.2,1); }

    /* ── Admin stats ── */
    .stat-grid { display: flex; gap: 12px; flex-wrap: wrap; }
    .stat-box {
      flex: 1; min-width: 100px;
      background: var(--panel); border: 1px solid var(--border);
      border-radius: 10px; padding: 14px 16px;
    }
    .stat-box .s-label {
      font-family: 'JetBrains Mono', monospace; font-size: 9px;
      letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-bottom: 6px;
    }
    .stat-box .s-val {
      font-size: 26px; font-weight: 700; letter-spacing: -0.03em; line-height: 1;
    }

    /* ── User reroute result ── */
    .route-result {
      border-radius: 10px; padding: 16px 18px;
      font-family: 'JetBrains Mono', monospace;
      border: 1px solid var(--border);
    }
    .breach-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 13px;
    }
    .breach-row:last-child { border-bottom: none; }

    /* ── Route Planner specific ── */
    .rp-section {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 18px;
      margin-bottom: 16px;
    }
    .rp-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px; letter-spacing: 2px; text-transform: uppercase;
      color: var(--muted); margin-bottom: 12px;
    }
    .rp-row {
      display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 10px;
    }
    .rp-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px; color: var(--muted); min-width: 50px;
    }
    .rp-select {
      flex: 1; min-width: 140px;
      background: #060d14; border: 1px solid var(--border);
      color: var(--fg); border-radius: 8px;
      padding: 9px 12px; font-family: 'JetBrains Mono', monospace;
      font-size: 12px; outline: none; cursor: pointer;
    }
    .rp-select:focus { border-color: var(--accent); }
    .rp-select option { background: #060d14; }
    .rp-map-hint {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px; color: var(--muted);
      padding: 8px 12px; border-radius: 8px;
      background: rgba(0,255,225,0.04);
      border: 1px dashed rgba(0,255,225,0.15);
      margin-bottom: 12px;
    }
    .rp-weight-row {
      display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; align-items: center;
    }
    .rp-weight-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px; color: var(--muted); white-space: nowrap;
    }
    .rp-slider { flex: 1; min-width: 80px; accent-color: var(--accent); cursor: pointer; }
    .rp-slider-val {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px; color: var(--accent); min-width: 32px; text-align: right;
    }
    .rp-find-btn {
      width: 100%; padding: 12px;
      background: var(--accent); color: #050a0f;
      border: none; border-radius: 10px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px; font-weight: 700; letter-spacing: 1px;
      cursor: pointer; transition: opacity .2s;
    }
    .rp-find-btn:hover { opacity: 0.85; }
    .rp-find-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .rp-clear-btn {
      width: 100%; padding: 9px;
      background: transparent; color: var(--muted);
      border: 1px solid var(--border); border-radius: 10px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px; cursor: pointer; margin-top: 8px; transition: border-color .2s;
    }
    .rp-clear-btn:hover { border-color: var(--accent2); color: var(--accent2); }

    /* route summary card */
    .rp-summary {
      border-radius: 10px; padding: 18px 20px;
      font-family: 'JetBrains Mono', monospace;
      border: 1px solid var(--border); background: var(--panel);
      animation: fadeUp .35s ease;
    }
    @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
    .rp-sum-title { font-size: 13px; font-weight: 700; margin-bottom: 12px; }
    .rp-sum-grid { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
    .rp-sum-box {
      flex: 1; min-width: 80px;
      background: rgba(0,255,225,0.04); border: 1px solid rgba(0,255,225,0.12);
      border-radius: 8px; padding: 10px 12px;
    }
    .rp-sum-box .lbl { font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }
    .rp-sum-box .val { font-size: 20px; font-weight: 700; line-height: 1; }
    .rp-hop {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 8px 0; border-bottom: 1px solid var(--border);
      font-size: 12px;
    }
    .rp-hop:last-child { border-bottom: none; }
    .rp-hop-num {
      font-size: 9px; font-weight: 700; width: 18px; height: 18px;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; margin-top: 1px;
    }
    .rp-hop-name { font-weight: 600; }
    .rp-hop-detail { font-size: 10px; color: var(--muted); }

    /* map click mode indicator */
    #rp-click-mode-badge {
      display: none;
      position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%);
      z-index: 999; background: rgba(10,18,25,0.92);
      border: 1px solid var(--accent); border-radius: 20px;
      padding: 6px 16px; font-family: 'JetBrains Mono', monospace;
      font-size: 11px; color: var(--accent); backdrop-filter: blur(8px);
      white-space: nowrap; pointer-events: none;
    }
    .spinning {
      display: inline-block;
      width: 14px; height: 14px;
      border: 2px solid var(--accent); border-top-color: transparent;
      border-radius: 50%; animation: spin .7s linear infinite;
      vertical-align: middle; margin-right: 6px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(s);
})();

/* LOGIN  STATE*/
let currentRole = 'user';
let currentUser = '';
let _loginMode  = 'user';

window.toggleLoginMode = function(mode) {
  _loginMode = mode;
  const userFields  = document.getElementById('user-login-fields');
  const adminFields = document.getElementById('admin-login-fields');
  const btnUser     = document.getElementById('btn-user-mode');
  const btnAdmin    = document.getElementById('btn-admin-mode');

  if (userFields)  userFields.style.display  = mode === 'user'  ? 'block' : 'none';
  if (adminFields) adminFields.style.display = mode === 'admin' ? 'block' : 'none';

  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#00ffe1';
  const bg     = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()     || '#050a0f';
  const muted  = getComputedStyle(document.documentElement).getPropertyValue('--muted').trim()  || '#8899a6';

  if (btnUser)  { btnUser.style.background  = mode === 'user'  ? accent : 'transparent'; btnUser.style.color  = mode === 'user'  ? bg : muted; }
  if (btnAdmin) { btnAdmin.style.background = mode === 'admin' ? accent : 'transparent'; btnAdmin.style.color = mode === 'admin' ? bg : muted; }
};

window.handleLogin = function() {
  if (_loginMode === 'admin') {
    const id = (document.getElementById('admin-id')   || {}).value?.trim();
    const pw = (document.getElementById('admin-pass') || {}).value?.trim();
    if (!id)          { alert('⚠ Please enter an Admin ID.');       return; }
    if (pw !== '123') { alert('⛔ Incorrect password. Hint: 123');  return; }
    currentRole = 'admin';
    currentUser = id;
  } else {
    const name = (document.getElementById('user-name') || {}).value?.trim();
    if (!name) { alert('⚠ Please enter your name.'); return; }
    currentRole = 'user';
    currentUser = name;
  }

  const overlay = document.getElementById('login-overlay');
  if (overlay) { overlay.style.opacity = '0'; overlay.style.transition = 'opacity 0.4s'; setTimeout(() => overlay.style.display = 'none', 400); }

  const header = document.getElementById('main-header');
  if (header) header.style.display = 'flex';

  const disp = document.getElementById('display-user-type');
  if (disp) disp.textContent = currentUser + ' · ' + currentRole.toUpperCase();

  switchTab(currentRole === 'admin' ? 'admin' : 'user');
};

/*TAB SWITCHING*/
window.switchTab = function(mode) {
  if (mode === 'admin' && currentRole !== 'admin') {
    alert('⛔ Admin access only. Please log in as Admin.');
    return;
  }
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById('view-' + mode);
  if (target) target.classList.add('active');

  ['user', 'admin'].forEach(m => {
    const btn = document.getElementById('tab-' + m);
    if (btn) btn.classList.toggle('active', m === mode);
  });

  if (mode === 'admin') {
    loadAdminDashboard();
    setTimeout(() => { if (_leafletMap) _leafletMap.invalidateSize(); }, 250);
  } else {
    loadUserView();
    setTimeout(() => { if (window.userMap) window.userMap.invalidateSize(); }, 100);
  }
};

/* ADMIN MAP*/
let _leafletMap = null;

function initMap(data) {
  if (typeof L === 'undefined') { console.error('Leaflet not loaded.'); return; }
  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  if (_leafletMap) { _leafletMap.remove(); _leafletMap = null; }
  const oldLegend = document.getElementById('map-legend');
  if (oldLegend) oldLegend.remove();

  const lat0 = data.length ? data.reduce((s, d) => s + getLat(d), 0) / data.length : 12.87;
  const lon0 = data.length ? data.reduce((s, d) => s + getLon(d), 0) / data.length : 74.84;

  _leafletMap = L.map('map', { zoomControl: true }).setView([lat0, lon0], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>', maxZoom: 19,
  }).addTo(_leafletMap);

  data.forEach(r => {
    const lat = getLat(r), lon = getLon(r), db = r.noise_level;
    const color = noiseColorHex(db);
    const radius = db > 80 ? 18 : db > 70 ? 14 : 10;
    const marker = L.circleMarker([lat, lon], { color, fillColor: color, fillOpacity: 0.22, weight: 2, opacity: 0.9, radius }).addTo(_leafletMap);
    marker.bindPopup(`
      <div style="font-family:'JetBrains Mono',monospace;padding:14px 16px;min-width:190px;background:#0a1219;border-radius:10px;">
        <div style="font-size:9px;letter-spacing:.18em;color:#8899a6;text-transform:uppercase;margin-bottom:6px;">Road Segment</div>
        <div style="font-size:15px;font-weight:700;color:#e1e8ed;margin-bottom:12px;">${escHtml(r.name)}</div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="width:10px;height:10px;border-radius:50%;background:${color};box-shadow:0 0 8px ${color};display:inline-block;flex-shrink:0;"></span>
          <span style="font-size:26px;font-weight:700;color:${color};letter-spacing:-.03em;">${db.toFixed(1)}</span>
          <span style="font-size:12px;color:#8899a6;">dB</span>
        </div>
        <div style="margin-top:10px;font-size:10px;color:${color};letter-spacing:.1em;text-transform:uppercase;">
          ${db > 80 ? '⚠ CRITICAL ZONE' : db > 70 ? '⚠ HIGH NOISE ZONE' : '✓ NORMAL LEVEL'}
        </div>
      </div>
    `, { maxWidth: 260 });
  });

  const legend = document.createElement('div');
  legend.id = 'map-legend';
  legend.innerHTML = `
    <div class="legend-pill"><div class="legend-dot" style="background:#ff4b6e;box-shadow:0 0 6px #ff4b6e;"></div>&gt; 80 dB Critical</div>
    <div class="legend-pill"><div class="legend-dot" style="background:#ffb800;box-shadow:0 0 6px #ffb800;"></div>&gt; 70 dB Warning</div>
    <div class="legend-pill"><div class="legend-dot" style="background:#00e676;box-shadow:0 0 6px #00e676;"></div>≤ 70 dB Safe</div>
  `;
  mapEl.style.position = 'relative';
  mapEl.appendChild(legend);
}

function getLat(r) { return r.lat ?? (r.coordinates ? r.coordinates[1] : 12.87); }
function getLon(r) { return r.lon ?? r.lng ?? (r.coordinates ? r.coordinates[0] : 74.84); }

/* ADMIN DASHBOARD*/
let _adminLoaded = false;

async function loadAdminDashboard() {
  if (_adminLoaded) { setTimeout(() => { if (_leafletMap) _leafletMap.invalidateSize(); }, 250); return; }
  _adminLoaded = true;

  let roads = [], statsData = null;
  try { const res = await fetch(`${API}/admin/thermal-data`); roads = await res.json(); }
  catch { roads = DEMO_DATA; showApiOfflineNotice(); }
  try { const res = await fetch(`${API}/admin/analytics`); statsData = await res.json(); }
  catch { statsData = null; }

  renderAdminStats(roads, statsData);
  renderNoiseBars(roads);
  renderAlerts(roads);
  initMap(roads);
}

function showApiOfflineNotice() {
  const el = document.getElementById('alert-list');
  if (el) el.innerHTML = `
    <div style="font-family:var(--mono);font-size:12px;color:var(--warn);padding:10px;
                background:rgba(255,184,0,0.08);border-radius:8px;border:1px solid rgba(255,184,0,0.3);margin-bottom:12px;">
      ⚠ API offline — showing demo data. Run: <code style="color:var(--accent)">uvicorn main:app --reload</code>
    </div>`;
}

function renderAdminStats(roads, statsData) {
  const el = document.getElementById('admin-stats');
  if (!el) return;
  const total = statsData?.stats?.total_monitored_roads ?? roads.length;
  const high  = statsData?.stats?.high_risk_zones       ?? roads.filter(r => r.noise_level > 70).length;
  const avg   = statsData?.stats?.avg_city_noise        ??
    (roads.length ? (roads.reduce((s, r) => s + r.noise_level, 0) / roads.length).toFixed(1) : '—');
  el.innerHTML = `
    <div class="stat-grid">
      <div class="stat-box"><div class="s-label">Segments</div><div class="s-val" style="color:#e1e8ed;">${total}</div></div>
      <div class="stat-box"><div class="s-label">Avg dB</div><div class="s-val" style="color:var(--accent);">${avg}</div></div>
      <div class="stat-box"><div class="s-label">High Risk</div><div class="s-val" style="color:var(--accent2);">${high}</div></div>
      <div class="stat-box"><div class="s-label">Safe</div><div class="s-val" style="color:var(--safe);">${total - high}</div></div>
    </div>`;
}

function renderNoiseBars(roads) {
  const el = document.getElementById('noise-bars');
  if (!el) return;
  const sorted = [...roads].sort((a, b) => b.noise_level - a.noise_level).slice(0, 5);
  el.innerHTML = sorted.map(r => {
    const pct = ((r.noise_level - 40) / 50 * 100).toFixed(1);
    const color = noiseColor(r.noise_level);
    return `
      <div class="db-bar-wrap">
        <div class="db-bar-label"><span>${escHtml(r.name)}</span><span style="color:${color}">${r.noise_level.toFixed(1)} dB</span></div>
        <div class="db-bar-track"><div class="db-bar-fill" style="background:${color}" data-pct="${pct}"></div></div>
      </div>`;
  }).join('');
  setTimeout(() => el.querySelectorAll('.db-bar-fill').forEach(b => { b.style.width = b.dataset.pct + '%'; }), 80);
}

function renderAlerts(roads) {
  const existing = document.getElementById('alert-list');
  const notice = existing ? existing.querySelector('div[style*="API offline"]') : null;
  const sorted = [...roads].sort((a, b) => b.noise_level - a.noise_level);
  const html = sorted.map(r => {
    const color = noiseColor(r.noise_level);
    const status = noiseStatus(r.noise_level);
    const emoji  = noiseEmoji(r.noise_level);
    const suggestion = r.control_suggestion || r.suggestion ||
      (r.noise_level > 80 ? 'Immediate diversion recommended'
      : r.noise_level > 70 ? 'Optimize traffic signal timing'
      : 'Maintain current flow');
    return `
      <div class="alert-item">
        <span style="font-size:20px;">${emoji}</span>
        <div><div class="alert-name">${escHtml(r.name)}</div><div class="alert-detail">${escHtml(suggestion)}</div></div>
        <div class="alert-badge" style="color:${color};background:${color}18;border:1px solid ${color}44;">
          ${r.noise_level.toFixed(1)} dB · ${status}
        </div>
      </div>`;
  }).join('');
  if (existing) existing.innerHTML = (notice ? notice.outerHTML : '') + html;
}

/* USER VIEW  ─  state*/
let _roadNodes    = [];   // Array of { name, lat, lon, noise_level }
let _userViewInit = false;
let _userMapClickMode = null;  // 'start' | 'end' | null
let _routePolylines  = [];
let _routeMarkers    = [];
let _noiseCircles    = [];

/* ─── load user view ─── */
async function loadUserView() {
  if (_userViewInit) return;
  _userViewInit = true;

  // Fetch road nodes (try API, fallback to DEMO)
  try {
    const res = await fetch(`${API}/admin/thermal-data`);
    const raw = await res.json();
    _roadNodes = raw.map(r => ({
      name: r.name,
      lat: getLat(r),
      lon: getLon(r),
      noise_level: r.noise_level ?? 60,
    }));
  } catch {
    _roadNodes = DEMO_DATA.map(r => ({ name: r.name, lat: r.lat, lon: r.lon, noise_level: r.noise_level }));
  }

  buildUserMapHTML();
  initUserMap();
  populateRouteSelects();
}

/*  Build the user panel HTML (replaces the old placeholder)  */
function buildUserMapHTML() {
  const view = document.getElementById('view-user');
  if (!view) return;

  // Preserve any existing structure if the host HTML already has a user-map div
  const existingMap = document.getElementById('user-map');
  if (!existingMap) {
    // fallback: inject full user panel
    view.innerHTML = `
      <div style="display:flex;gap:18px;flex-wrap:wrap;height:100%;">
        <div style="flex:0 0 320px;display:flex;flex-direction:column;gap:0;overflow-y:auto;max-height:calc(100vh - 120px);">
          ${routePlannerPanelHTML()}
        </div>
        <div style="flex:1;min-width:280px;display:flex;flex-direction:column;gap:12px;">
          <div id="user-map" style="flex:1;border-radius:12px;overflow:hidden;border:1px solid var(--border);min-height:420px;position:relative;"></div>
        </div>
      </div>`;
  } else {
    // If host HTML already has user-map, inject the planner panel alongside
    const panel = document.createElement('div');
    panel.id = 'rp-panel';
    panel.style.cssText = 'flex:0 0 320px;display:flex;flex-direction:column;gap:0;overflow-y:auto;max-height:calc(100vh - 120px);';
    panel.innerHTML = routePlannerPanelHTML();
    view.style.display = 'flex';
    view.style.gap = '18px';
    view.style.flexWrap = 'wrap';
    view.insertBefore(panel, existingMap.parentElement || existingMap);
  }
}

function routePlannerPanelHTML() {
  return `
    <!-- ── ROUTE PLANNER ── -->
    <div class="rp-section">
      <div class="rp-title">🗺 Route Planner — Low Noise Optimizer</div>

      <!-- Start point -->
      <div class="rp-row">
        <span class="rp-label">Start</span>
        <select id="rp-start" class="rp-select">
          <option value="">— Select or click map —</option>
        </select>
        <button onclick="activateMapClick('start')" title="Pick on map"
          style="background:rgba(0,255,225,0.1);border:1px solid rgba(0,255,225,0.3);color:var(--accent);
                border-radius:8px;padding:7px 10px;cursor:pointer;font-size:14px;flex-shrink:0;">📍</button>
      </div>

      <!-- End point -->
      <div class="rp-row">
        <span class="rp-label">End</span>
        <select id="rp-end" class="rp-select">
          <option value="">— Select or click map —</option>
        </select>
        <button onclick="activateMapClick('end')" title="Pick on map"
          style="background:rgba(255,75,110,0.1);border:1px solid rgba(255,75,110,0.3);color:var(--accent2);
                border-radius:8px;padding:7px 10px;cursor:pointer;font-size:14px;flex-shrink:0;">📍</button>
      </div>

      <div class="rp-map-hint">💡 Tip: Use 📍 buttons then click anywhere on the map to place custom points</div>

      <!-- Weight sliders -->
      <div style="margin-bottom:6px;">
        <div class="rp-title" style="margin-bottom:8px;">Optimization Priority</div>
        <div class="rp-weight-row">
          <span class="rp-weight-label">Distance weight</span>
          <input type="range" class="rp-slider" id="rp-w-dist" min="0" max="100" value="50"
            oninput="document.getElementById('rp-wdv').textContent=this.value+'%'">
          <span class="rp-slider-val" id="rp-wdv">50%</span>
        </div>
        <div class="rp-weight-row">
          <span class="rp-weight-label">Noise weight</span>
          <input type="range" class="rp-slider" id="rp-w-noise" min="0" max="100" value="50"
            oninput="document.getElementById('rp-wnv').textContent=this.value+'%'">
          <span class="rp-slider-val" id="rp-wnv">50%</span>
        </div>
      </div>

      <!-- Action buttons -->
      <button class="rp-find-btn" id="rp-find-btn" onclick="findOptimalRoute()">⚡ FIND OPTIMAL ROUTE</button>
      <button class="rp-clear-btn" onclick="clearRoute()">✕ Clear Route</button>
    </div>

    <!-- ── RESULT AREA ── -->
    <div id="rp-result"></div>

    <!-- ── NEARBY NOISE CHECK (legacy) ── -->
    <div class="rp-section" style="margin-top:0;">
      <div class="rp-title">📡 Nearby Noise Check</div>
      <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
        <input id="u-lat" type="number" step="any" placeholder="Latitude"
          style="flex:1;min-width:90px;background:#060d14;border:1px solid var(--border);color:var(--fg);
                border-radius:8px;padding:9px 10px;font-family:var(--mono);font-size:12px;outline:none;" />
        <input id="u-lon" type="number" step="any" placeholder="Longitude"
          style="flex:1;min-width:90px;background:#060d14;border:1px solid var(--border);color:var(--fg);
                border-radius:8px;padding:9px 10px;font-family:var(--mono);font-size:12px;outline:none;" />
      </div>
      <button onclick="checkReroute()"
        style="width:100%;padding:10px;background:rgba(0,255,225,0.1);border:1px solid rgba(0,255,225,0.3);
              color:var(--accent);border-radius:8px;font-family:var(--mono);font-size:12px;cursor:pointer;">
        🔍 CHECK MY LOCATION
      </button>
      <div id="user-result" style="margin-top:12px;"></div>
    </div>
  `;
}

/* Populate start/end selects with road nodes */
function populateRouteSelects() {
  ['rp-start', 'rp-end'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    // Keep placeholder
    while (sel.options.length > 1) sel.remove(1);
    _roadNodes.forEach((node, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `${noiseEmoji(node.noise_level)} ${node.name} (${node.noise_level.toFixed(1)} dB)`;
      sel.appendChild(opt);
    });
  });
}

/* USER MAP INITIALIZATION*/
function initUserMap() {
  if (window.userMap) return;

  const mapEl = document.getElementById('user-map');
  if (!mapEl) return;

  window.userMap = L.map('user-map').setView([12.87, 74.84], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
  }).addTo(window.userMap);

  // Draw all road nodes as noise circles
  _roadNodes.forEach(node => {
    const color = noiseColorHex(node.noise_level);
    const circle = L.circleMarker([node.lat, node.lon], {
      color, fillColor: color, fillOpacity: 0.18, weight: 2, radius: node.noise_level > 80 ? 16 : node.noise_level > 70 ? 12 : 9,
    }).addTo(window.userMap);
    circle.bindTooltip(`${node.name}<br>${node.noise_level.toFixed(1)} dB`, { permanent: false, direction: 'top' });
    _noiseCircles.push(circle);
  });

  // Map click handler for picking start/end
  window.userMap.on('click', function(e) {
    if (!_userMapClickMode) return;
    const { lat, lng } = e.latlng;
    const pseudoIdx = _roadNodes.length; // beyond real nodes
    // Find nearest real node to snap to (within 2 km) — or use raw coords
    let nearest = null, nearDist = Infinity;
    _roadNodes.forEach((n, i) => {
      const d = haversine(lat, lng, n.lat, n.lon);
      if (d < nearDist) { nearDist = d; nearest = i; }
    });

    const sel = document.getElementById(`rp-${_userMapClickMode}`);
    if (sel) {
      if (nearDist < 0.5) {
        // Snap to nearest node
        sel.value = nearest;
      } else {
        // Add a custom option for the clicked point
        const label = `📌 Custom (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        const opt = sel.querySelector(`option[data-custom="1"]`);
        if (opt) { opt.value = JSON.stringify({ lat, lon: lng, name: label, noise_level: 60 }); opt.textContent = label; }
        else {
          const newOpt = document.createElement('option');
          newOpt.value = JSON.stringify({ lat, lon: lng, name: label, noise_level: 60 });
          newOpt.textContent = label;
          newOpt.dataset.custom = '1';
          sel.appendChild(newOpt);
        }
        sel.value = sel.querySelector(`option[data-custom="1"]`).value;
      }
    }

    // Place pin on map
    const pinColor = _userMapClickMode === 'start' ? '#00ffe1' : '#ff4b6e';
    L.circleMarker([lat, lng], { color: pinColor, fillColor: pinColor, fillOpacity: 0.8, radius: 8, weight: 3 })
      .addTo(window.userMap)
      .bindPopup(`<span style="font-family:monospace;font-size:12px;color:${pinColor};">${_userMapClickMode === 'start' ? '▶ START' : '⏹ END'}</span>`)
      .openPopup();

    deactivateMapClick();
  });

  // Badge for click mode
  const badge = document.createElement('div');
  badge.id = 'rp-click-mode-badge';
  badge.textContent = '';
  mapEl.style.position = 'relative';
  mapEl.appendChild(badge);
}

/* activate / deactivate map-click mode */
window.activateMapClick = function(mode) {
  _userMapClickMode = mode;
  const badge = document.getElementById('rp-click-mode-badge');
  if (badge) {
    badge.style.display = 'block';
    badge.textContent = mode === 'start' ? '📍 Click map to set START point' : '📍 Click map to set END point';
  }
  if (window.userMap) window.userMap.getContainer().style.cursor = 'crosshair';
};

function deactivateMapClick() {
  _userMapClickMode = null;
  const badge = document.getElementById('rp-click-mode-badge');
  if (badge) badge.style.display = 'none';
  if (window.userMap) window.userMap.getContainer().style.cursor = '';
}

/*
   ROUTE PLANNING  —  Dijkstra with composite cost
   cost(u→v) = α · dist_km  +  β · noise_v/90
   α and β come from the weight sliders (normalised to sum=1)*/
window.findOptimalRoute = function() {
  const startSel = document.getElementById('rp-start');
  const endSel   = document.getElementById('rp-end');
  const resultEl = document.getElementById('rp-result');

  if (!startSel || !endSel || !resultEl) return;

  // Parse selected nodes
  const startNode = parseNodeSelection(startSel.value);
  const endNode   = parseNodeSelection(endSel.value);

  if (!startNode) { resultEl.innerHTML = rpError('Please select a start point.'); return; }
  if (!endNode)   { resultEl.innerHTML = rpError('Please select an end point.');   return; }
  if (startNode.name === endNode.name) { resultEl.innerHTML = rpError('Start and End must be different.'); return; }

  // Weight sliders
  const wDist  = parseInt((document.getElementById('rp-w-dist')  || {}).value ?? 50) / 100;
  const wNoise = parseInt((document.getElementById('rp-w-noise') || {}).value ?? 50) / 100;
  const α = wDist, β = wNoise;

  // Loading
  resultEl.innerHTML = `<div class="route-result" style="color:var(--muted);">
    <span class="spinning"></span> Computing optimal route…
  </div>`;

  // Build graph: all nodes including start/end if custom
  const nodes = buildNodeGraph(startNode, endNode);
  const startIdx = nodes.findIndex(n => n.name === startNode.name);
  const endIdx   = nodes.findIndex(n => n.name === endNode.name);

  // Dijkstra
  const { path, cost } = dijkstra(nodes, startIdx, endIdx, α, β);

  if (!path || path.length === 0) {
    resultEl.innerHTML = rpError('No route found between selected points.');
    return;
  }

  // Draw route on map
  drawRouteOnMap(path, nodes);

  // Build summary
  const pathNodes = path.map(i => nodes[i]);
  let totalDist = 0;
  for (let i = 0; i < pathNodes.length - 1; i++) {
    totalDist += haversine(pathNodes[i].lat, pathNodes[i].lon, pathNodes[i+1].lat, pathNodes[i+1].lon);
  }
  const avgNoise = pathNodes.reduce((s, n) => s + n.noise_level, 0) / pathNodes.length;
  const maxNoise = Math.max(...pathNodes.map(n => n.noise_level));
  const safeHops = pathNodes.filter(n => n.noise_level <= 70).length;

  resultEl.innerHTML = routeSummaryHTML(pathNodes, totalDist, avgNoise, maxNoise, safeHops, cost);
};

/** Parse a select value — returns a node object or null */
function parseNodeSelection(val) {
  if (!val && val !== 0) return null;
  // Try as a numeric index into _roadNodes
  const idx = parseInt(val);
  if (!isNaN(idx) && idx >= 0 && idx < _roadNodes.length) return _roadNodes[idx];
  // Try as JSON (custom map-click point)
  try { return JSON.parse(val); } catch { return null; }
}

/** Build the full node list for routing (includes custom start/end if needed) */
function buildNodeGraph(startNode, endNode) {
  const nodes = [..._roadNodes];
  if (!nodes.find(n => n.name === startNode.name)) nodes.push(startNode);
  if (!nodes.find(n => n.name === endNode.name))   nodes.push(endNode);
  return nodes;
}

/**
 * Dijkstra — fully connected graph (any node can reach any other).
 * Edge cost = α·dist_km + β·(avgNoise/90)
 *
 * "Noise" cost is computed as the average noise of the two endpoint nodes
 * (since we have point data, not segment data).
 */
function dijkstra(nodes, src, dst, α, β) {
  const N = nodes.length;
  const dist = new Array(N).fill(Infinity);
  const prev = new Array(N).fill(-1);
  const visited = new Array(N).fill(false);
  dist[src] = 0;

  // Simple O(N²) Dijkstra (fine for small graphs)
  for (let iter = 0; iter < N; iter++) {
    // Pick unvisited node with min dist
    let u = -1;
    for (let i = 0; i < N; i++) {
      if (!visited[i] && (u === -1 || dist[i] < dist[u])) u = i;
    }
    if (u === -1 || dist[u] === Infinity) break;
    visited[u] = true;
    if (u === dst) break;

    // Relax neighbours (all unvisited nodes — fully connected graph)
    for (let v = 0; v < N; v++) {
      if (visited[v]) continue;
      const d = haversine(nodes[u].lat, nodes[u].lon, nodes[v].lat, nodes[v].lon);
      const avgNoise = (nodes[u].noise_level + nodes[v].noise_level) / 2;
      const edgeCost = α * d + β * (avgNoise / 90) * d;  // noise term scales with distance
      if (dist[u] + edgeCost < dist[v]) {
        dist[v] = dist[u] + edgeCost;
        prev[v] = u;
      }
    }
  }

  // Reconstruct path
  if (dist[dst] === Infinity) return { path: null, cost: Infinity };
  const path = [];
  for (let cur = dst; cur !== -1; cur = prev[cur]) path.unshift(cur);
  return { path, cost: dist[dst] };
}

/* ─── Draw route polyline on the user map ─── */
function drawRouteOnMap(path, nodes) {
  if (!window.userMap) return;

  // Clear previous route layers
  _routePolylines.forEach(l => window.userMap.removeLayer(l));
  _routeMarkers.forEach(l => window.userMap.removeLayer(l));
  _routePolylines = []; _routeMarkers = [];

  const pathNodes = path.map(i => nodes[i]);
  const latlngs   = pathNodes.map(n => [n.lat, n.lon]);

  // Glow polyline (thick, dim)
  const glow = L.polyline(latlngs, { color: '#00ffe1', weight: 10, opacity: 0.15 }).addTo(window.userMap);
  // Main polyline
  const line = L.polyline(latlngs, { color: '#00ffe1', weight: 4, opacity: 0.9, dashArray: null }).addTo(window.userMap);
  _routePolylines.push(glow, line);

  // Step markers
  pathNodes.forEach((n, i) => {
    const isFirst = i === 0, isLast = i === pathNodes.length - 1;
    const color = isFirst ? '#00ffe1' : isLast ? '#ff4b6e' : noiseColorHex(n.noise_level);
    const radius = isFirst || isLast ? 11 : 7;
    const marker = L.circleMarker([n.lat, n.lon], {
      color, fillColor: color, fillOpacity: isFirst || isLast ? 0.95 : 0.6, weight: 3, radius,
    }).addTo(window.userMap);
    marker.bindTooltip(
      `${isFirst ? '▶ START — ' : isLast ? '⏹ END — ' : (i + 1) + '. '}${n.name}<br>${n.noise_level.toFixed(1)} dB`,
      { direction: 'top', permanent: false }
    );
    _routeMarkers.push(marker);
  });

  // Fit map to route
  window.userMap.fitBounds(L.polyline(latlngs).getBounds().pad(0.2));
}

/* ─── Route summary card HTML ─── */
function routeSummaryHTML(pathNodes, totalDist, avgNoise, maxNoise, safeHops, cost) {
  const overallColor = noiseColorHex(avgNoise);
  const hopRows = pathNodes.map((n, i) => {
    const c = noiseColorHex(n.noise_level);
    const isFirst = i === 0, isLast = i === pathNodes.length - 1;
    return `
      <div class="rp-hop">
        <div class="rp-hop-num" style="background:${c}22;color:${c};border:1px solid ${c}55;">
          ${isFirst ? '▶' : isLast ? '⏹' : i + 1}
        </div>
        <div>
          <div class="rp-hop-name">${escHtml(n.name)}</div>
          <div class="rp-hop-detail">${n.noise_level.toFixed(1)} dB · ${noiseStatus(n.noise_level)}${isFirst ? ' · START' : isLast ? ' · END' : ''}</div>
        </div>
        <div style="margin-left:auto;font-size:13px;">${noiseEmoji(n.noise_level)}</div>
      </div>`;
  }).join('');

  return `
    <div class="rp-summary" style="border-color:${overallColor}44;">
      <div class="rp-sum-title" style="color:var(--accent);">⚡ OPTIMAL ROUTE FOUND</div>
      <div class="rp-sum-grid">
        <div class="rp-sum-box">
          <div class="lbl">Distance</div>
          <div class="val" style="color:var(--accent);">${totalDist.toFixed(2)}<span style="font-size:12px;font-weight:400;"> km</span></div>
        </div>
        <div class="rp-sum-box">
          <div class="lbl">Avg Noise</div>
          <div class="val" style="color:${overallColor};">${avgNoise.toFixed(1)}<span style="font-size:12px;font-weight:400;"> dB</span></div>
        </div>
        <div class="rp-sum-box">
          <div class="lbl">Peak Noise</div>
          <div class="val" style="color:${noiseColorHex(maxNoise)};">${maxNoise.toFixed(1)}<span style="font-size:12px;font-weight:400;"> dB</span></div>
        </div>
        <div class="rp-sum-box">
          <div class="lbl">Safe Hops</div>
          <div class="val" style="color:var(--safe);">${safeHops}<span style="font-size:12px;font-weight:400;">/${pathNodes.length}</span></div>
        </div>
      </div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">
        Route — ${pathNodes.length} waypoints
      </div>
      <div>${hopRows}</div>
      <div style="margin-top:12px;font-size:10px;font-family:'JetBrains Mono',monospace;color:var(--muted);">
        Composite cost score: <span style="color:var(--accent);">${cost.toFixed(4)}</span>
        (lower = better — balances distance + noise exposure)
      </div>
    </div>`;
}

/* ─── Error helper ─── */
function rpError(msg) {
  return `<div class="route-result" style="border-color:var(--warn);background:rgba(255,184,0,0.07);">
    <div style="color:var(--warn);font-weight:700;margin-bottom:4px;">⚠️ ${escHtml(msg)}</div>
  </div>`;
}

/* ─── Clear route ─── */
window.clearRoute = function() {
  _routePolylines.forEach(l => window.userMap && window.userMap.removeLayer(l));
  _routeMarkers.forEach(l => window.userMap && window.userMap.removeLayer(l));
  _routePolylines = []; _routeMarkers = [];

  const resultEl = document.getElementById('rp-result');
  if (resultEl) resultEl.innerHTML = '';

  // Reset selects
  ['rp-start', 'rp-end'].forEach(id => {
    const sel = document.getElementById(id);
    if (sel) sel.value = '';
  });
};

/*USER REROUTE  (legacy nearby-check)*/
let currentUserMarker = null;

window.checkReroute = async function() {
  const lat      = parseFloat((document.getElementById('u-lat') || {}).value);
  const lon      = parseFloat((document.getElementById('u-lon') || {}).value);
  const resultEl = document.getElementById('user-result');
  if (!resultEl) return;

  if (isNaN(lat) || isNaN(lon)) {
    resultEl.innerHTML = `
      <div class="route-result" style="border-color:var(--warn);background:rgba(255,184,0,0.07);">
        <div style="font-size:20px;margin-bottom:8px;">⚠️</div>
        <div style="color:var(--warn);font-weight:700;margin-bottom:4px;">INVALID INPUT</div>
        <div style="color:var(--muted);font-size:13px;">Please enter valid latitude and longitude.</div>
      </div>`;
    return;
  }

  resultEl.innerHTML = `
    <div class="route-result" style="color:var(--muted);">
      <div style="display:flex;align-items:center;gap:10px;">
        <div class="spinning"></div>Scanning nearby noise zones…
      </div>
    </div>`;

  if (window.userMap) {
    window.userMap.setView([lat, lon], 14);
    if (currentUserMarker) window.userMap.removeLayer(currentUserMarker);
    currentUserMarker = L.marker([lat, lon], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
      })
    }).addTo(window.userMap).bindPopup(`<b>Your Search Point</b><br>Lat: ${lat}, Lon: ${lon}`).openPopup();
  }

  try {
    const res  = await fetch(`${API}/user/check-reroute?user_lat=${lat}&user_lon=${lon}`);
    const data = await res.json();
    renderRerouteResult(resultEl, data);
  } catch {
    resultEl.innerHTML = `
      <div class="route-result" style="border-color:var(--accent2);background:rgba(255,75,110,0.07);">
        <div style="font-size:20px;margin-bottom:8px;">⚠️</div>
        <div style="color:var(--accent2);font-weight:700;margin-bottom:4px;">API OFFLINE</div>
        <div style="color:var(--muted);font-size:13px;">
          Start backend: <code style="color:var(--accent)">uvicorn main:app --reload</code>
        </div>
      </div>`;
  }
};

function renderRerouteResult(el, data) {
  if (!data.reroute_required) {
    el.innerHTML = `
      <div class="route-result" style="border-color:var(--safe);background:rgba(0,230,118,0.07);">
        <div style="font-size:28px;margin-bottom:8px;">✅</div>
        <div style="color:var(--safe);font-weight:700;font-size:15px;margin-bottom:6px;">ROUTE CLEAR</div>
        <div style="color:var(--muted);font-size:13px;">No high-noise zones within 1 km of your location.</div>
      </div>`;
    return;
  }
  const breachRows = data.breaches.map(b => `
    <div class="breach-row">
      <span>📍 ${escHtml(b.location)} <span style="color:var(--muted)">(${b.distance_km} km)</span></span>
      <span style="color:var(--accent2);font-weight:700;">${b.db} dB</span>
    </div>`).join('');
  el.innerHTML = `
    <div class="route-result" style="border-color:var(--accent2);background:rgba(255,75,110,0.07);">
      <div style="font-size:28px;margin-bottom:8px;">🚨</div>
      <div style="color:var(--accent2);font-weight:700;font-size:15px;margin-bottom:6px;">REROUTE ADVISED</div>
      <div style="color:var(--muted);font-size:13px;margin-bottom:14px;">${data.breaches.length} high-noise zone(s) detected nearby</div>
      <div>${breachRows}</div>
    </div>`;
}

/*MAIN TAB SWITCHER (backward-compat version)*/
function switchTab(tab) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const el = document.getElementById(`view-${tab}`);
  if (el) el.classList.add('active');

  ['user', 'admin'].forEach(m => {
    const btn = document.getElementById(`tab-${m}`);
    if (btn) btn.classList.toggle('active', m === tab);
  });

  if (tab === 'admin') {
    loadAdminDashboard();
    if (window.adminMap) window.adminMap.invalidateSize();
  } else if (tab === 'user') {
    loadUserView();
    setTimeout(() => { if (window.userMap) window.userMap.invalidateSize(); }, 100);
  }
}