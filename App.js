/**
 * EchoRoute — Urban Noise Command System
 * App.js  |  Login + Admin/User views + Leaflet live map
 *
 * Admin credentials : any ID  +  password  123
 * User  credentials : any name (no password)
 */

const API = 'http://localhost:8000';

/* ═══════════════════════════════════════════════════════════════════
   DEMO / FALLBACK DATA
═══════════════════════════════════════════════════════════════════ */
const DEMO_DATA = [
  { name: 'Hampankatta',      noise_level: 88.2, lat: 12.870, lon: 74.836 },
  { name: 'MG Road',          noise_level: 78.3, lat: 12.876, lon: 74.843 },
  { name: 'Old Airport Road', noise_level: 71.0, lat: 12.864, lon: 74.857 },
  { name: 'Hosur Road',       noise_level: 63.4, lat: 12.881, lon: 74.852 },
  { name: 'Brigade Road',     noise_level: 55.1, lat: 12.872, lon: 74.848 },
  { name: 'Kodialbail',       noise_level: 48.9, lat: 12.860, lon: 74.833 },
];

/* ═══════════════════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════════════════ */
function noiseColor(db) {
  if (db > 80) return 'var(--accent2)';   // #ff4b6e  critical
  if (db > 70) return 'var(--warn)';      // #ffb800  warning
  return 'var(--safe)';                   // #00e676  safe
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

/* ═══════════════════════════════════════════════════════════════════
   INJECT DARK-MODE LEAFLET STYLES (once)
═══════════════════════════════════════════════════════════════════ */
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
    .legend-dot {
      width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0;
    }

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
  `;
  document.head.appendChild(s);
})();

/* ═══════════════════════════════════════════════════════════════════
   LOGIN  STATE
═══════════════════════════════════════════════════════════════════ */
let currentRole = 'user';
let currentUser = '';
let _loginMode  = 'user';

/** Called by toggle buttons in login card */
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

  if (btnUser) {
    btnUser.style.background = mode === 'user' ? accent : 'transparent';
    btnUser.style.color      = mode === 'user' ? bg     : muted;
  }
  if (btnAdmin) {
    btnAdmin.style.background = mode === 'admin' ? accent : 'transparent';
    btnAdmin.style.color      = mode === 'admin' ? bg     : muted;
  }
};

/** Called by "Enter System" button */
window.handleLogin = function() {
  if (_loginMode === 'admin') {
    const id = (document.getElementById('admin-id')   || {}).value?.trim();
    const pw = (document.getElementById('admin-pass') || {}).value?.trim();
    if (!id)        { alert('⚠ Please enter an Admin ID.');           return; }
    if (pw !== '123') { alert('⛔ Incorrect password. Hint: 123');     return; }
    currentRole = 'admin';
    currentUser = id;
  } else {
    const name = (document.getElementById('user-name') || {}).value?.trim();
    if (!name) { alert('⚠ Please enter your name.'); return; }
    currentRole = 'user';
    currentUser = name;
  }

  // Hide login overlay
  const overlay = document.getElementById('login-overlay');
  if (overlay) { overlay.style.opacity = '0'; overlay.style.transition = 'opacity 0.4s'; setTimeout(() => overlay.style.display = 'none', 400); }

  // Show header
  const header = document.getElementById('main-header');
  if (header) header.style.display = 'flex';

  // Show greeting
  const disp = document.getElementById('display-user-type');
  if (disp) disp.textContent = currentUser + ' · ' + currentRole.toUpperCase();

  // Route to correct view
  switchTab(currentRole === 'admin' ? 'admin' : 'user');
};

/* ═══════════════════════════════════════════════════════════════════
   TAB SWITCHING
═══════════════════════════════════════════════════════════════════ */
window.switchTab = function(mode) {
  // Guard: non-admins can't access admin view
  if (mode === 'admin' && currentRole !== 'admin') {
    alert('⛔ Admin access only. Please log in as Admin.');
    return;
  }

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById('view-' + mode);
  if (target) target.classList.add('active');

  // Sync tab buttons
  ['user', 'admin'].forEach(m => {
    const btn = document.getElementById('tab-' + m);
    if (btn) btn.classList.toggle('active', m === mode);
  });

  if (mode === 'admin') {
    loadAdminDashboard();
    // Leaflet needs a size refresh when parent was hidden
    setTimeout(() => { if (_leafletMap) _leafletMap.invalidateSize(); }, 250);
  } else {
    loadUserView();
  }
};

/* ═══════════════════════════════════════════════════════════════════
   LEAFLET MAP
═══════════════════════════════════════════════════════════════════ */
let _leafletMap = null;

function initMap(data) {
  if (typeof L === 'undefined') {
    console.error('Leaflet not loaded.');
    return;
  }

  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  // Destroy old instance
  if (_leafletMap) { _leafletMap.remove(); _leafletMap = null; }

  // Remove old legend
  const oldLegend = document.getElementById('map-legend');
  if (oldLegend) oldLegend.remove();

  // Center map on data average, fallback to Mangaluru
  const lat0 = data.length ? data.reduce((s, d) => s + getLat(d), 0) / data.length : 12.87;
  const lon0 = data.length ? data.reduce((s, d) => s + getLon(d), 0) / data.length : 74.84;

  _leafletMap = L.map('map', { zoomControl: true }).setView([lat0, lon0], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(_leafletMap);

  data.forEach(r => {
    const lat    = getLat(r);
    const lon    = getLon(r);
    const db     = r.noise_level;
    const color  = noiseColorHex(db);
    const radius = db > 80 ? 18 : db > 70 ? 14 : 10;

    const marker = L.circleMarker([lat, lon], {
      color,
      fillColor:   color,
      fillOpacity: 0.22,
      weight:      2,
      opacity:     0.9,
      radius,
    }).addTo(_leafletMap);

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

  // Inject legend overlay inside #map container
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

function getLat(r) {
  return r.lat ?? (r.coordinates ? r.coordinates[1] : 12.87);
}
function getLon(r) {
  return r.lon ?? r.lng ?? (r.coordinates ? r.coordinates[0] : 74.84);
}

/* ═══════════════════════════════════════════════════════════════════
   ADMIN DASHBOARD
═══════════════════════════════════════════════════════════════════ */
let _adminLoaded = false;

async function loadAdminDashboard() {
  if (_adminLoaded) {
    // Just refresh map size
    setTimeout(() => { if (_leafletMap) _leafletMap.invalidateSize(); }, 250);
    return;
  }
  _adminLoaded = true;

  let roads = [];
  let statsData = null;

  // Fetch thermal / road data
  try {
    const res = await fetch(`${API}/admin/thermal-data`);
    roads = await res.json();
  } catch {
    roads = DEMO_DATA;
    showApiOfflineNotice();
  }

  // Fetch analytics
  try {
    const res  = await fetch(`${API}/admin/analytics`);
    statsData  = await res.json();
  } catch {
    statsData = null;
  }

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
    </div>
  `;
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
      <div class="stat-box">
        <div class="s-label">Segments</div>
        <div class="s-val" style="color:#e1e8ed;">${total}</div>
      </div>
      <div class="stat-box">
        <div class="s-label">Avg dB</div>
        <div class="s-val" style="color:var(--accent);">${avg}</div>
      </div>
      <div class="stat-box">
        <div class="s-label">High Risk</div>
        <div class="s-val" style="color:var(--accent2);">${high}</div>
      </div>
      <div class="stat-box">
        <div class="s-label">Safe</div>
        <div class="s-val" style="color:var(--safe);">${total - high}</div>
      </div>
    </div>
  `;
}

function renderNoiseBars(roads) {
  const el = document.getElementById('noise-bars');
  if (!el) return;

  // Show top 5 by noise_level
  const sorted = [...roads].sort((a, b) => b.noise_level - a.noise_level).slice(0, 5);

  el.innerHTML = sorted.map(r => {
    const pct   = ((r.noise_level - 40) / 50 * 100).toFixed(1);
    const color = noiseColor(r.noise_level);
    return `
      <div class="db-bar-wrap">
        <div class="db-bar-label">
          <span>${escHtml(r.name)}</span>
          <span style="color:${color}">${r.noise_level.toFixed(1)} dB</span>
        </div>
        <div class="db-bar-track">
          <div class="db-bar-fill" style="background:${color}" data-pct="${pct}"></div>
        </div>
      </div>
    `;
  }).join('');

  // Animate bars on next tick
  setTimeout(() => {
    el.querySelectorAll('.db-bar-fill').forEach(b => {
      b.style.width = b.dataset.pct + '%';
    });
  }, 80);
}

function renderAlerts(roads) {
  const existing = document.getElementById('alert-list');
  // Keep the offline notice if present
  const notice = existing ? existing.querySelector('div[style*="API offline"]') : null;

  const sorted = [...roads].sort((a, b) => b.noise_level - a.noise_level);

  const html = sorted.map(r => {
    const color  = noiseColor(r.noise_level);
    const status = noiseStatus(r.noise_level);
    const emoji  = noiseEmoji(r.noise_level);
    const suggestion = r.control_suggestion || r.suggestion ||
      (r.noise_level > 80 ? 'Immediate diversion recommended'
       : r.noise_level > 70 ? 'Optimize traffic signal timing'
       : 'Maintain current flow');
    return `
      <div class="alert-item">
        <span style="font-size:20px;">${emoji}</span>
        <div>
          <div class="alert-name">${escHtml(r.name)}</div>
          <div class="alert-detail">${escHtml(suggestion)}</div>
        </div>
        <div class="alert-badge" style="color:${color};background:${color}18;border:1px solid ${color}44;">
          ${r.noise_level.toFixed(1)} dB · ${status}
        </div>
      </div>
    `;
  }).join('');

  if (existing) {
    existing.innerHTML = (notice ? notice.outerHTML : '') + html;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   USER VIEW
═══════════════════════════════════════════════════════════════════ */
function loadUserView() {
  // Nothing to auto-load; user triggers checkReroute manually
}

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
        <div style="width:18px;height:18px;border:2px solid var(--accent);border-top-color:transparent;
                    border-radius:50%;animation:spin .7s linear infinite;"></div>
        Scanning nearby noise zones…
      </div>
    </div>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
  `;

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

function switchTab(tab) {
    // 1. Switch active view
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${tab}`).classList.add('active');

    // 2. Handle Map Initialization & Refresh
    if (tab === 'admin') {
        initAdminMap();
        if (window.adminMap) window.adminMap.invalidateSize();
    } else if (tab === 'user') {
        initUserMap();
        // Give the browser 100ms to render the 'display: block' 
        // before telling Leaflet to recalculate the map size.
        setTimeout(() => {
            if (window.userMap) {
                window.userMap.invalidateSize(); // THE FIX
            }
        }, 100);
    }
}

let userMap; // Global variable to track the citizen map

function initUserMap() {
    if (userMap) return; // Don't re-initialize if it exists

    userMap = L.map('user-map').setView([12.87, 74.84], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(userMap);

    // Initial marker at city center
    L.marker([12.87, 74.84]).addTo(userMap)
        .bindPopup('Monitoring Center')
        .openPopup();
}

function initUserMap() {
    if (window.userMap) return; // Stop if already initialized

    window.userMap = L.map('user-map').setView([12.87, 74.84], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(window.userMap);

    // Optional: Add a default marker for the city center
    L.marker([12.87, 74.84]).addTo(window.userMap)
        .bindPopup('Puttur/Mangalore Noise Monitoring Center')
        .openPopup();
}

function initUserMap() {
    if (window.userMap) return;

    window.userMap = L.map('user-map').setView([12.87, 74.84], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(window.userMap);

    // Click event to add start/end points
    window.userMap.on('click', function(e) {
        if (waypoints.length >= 2) {
            // Reset if they click a third time
            waypoints = [];
            if (routeControl) window.userMap.removeControl(routeControl);
        }
        
        waypoints.push(e.latlng);
        L.marker(e.latlng).addTo(window.userMap).bindPopup(waypoints.length === 1 ? "Start" : "End").openPopup();

        if (waypoints.length === 2) {
            calculateShortestPath();
        }
    });
}

function calculateShortestPath() {
    if (routeControl) window.userMap.removeControl(routeControl);

    routeControl = L.Routing.control({
        waypoints: waypoints,
        lineOptions: { styles: [{ color: 'var(--accent)', opacity: 0.8, weight: 6 }] },
        createMarker: function() { return null; }, // We already placed markers
        addWaypoints: false
    }).on('routesfound', function(e) {
        const routes = e.routes;
        const summary = routes[0].summary;
        
        // Convert meters to km
        const distanceKm = (summary.totalDistance / 1000).toFixed(2);
        
        // Logic: Get average noise from your data or a baseline (e.g., 70dB)
        const avgDb = 70; 
        const routeCost = (distanceKm * (avgDb / 10)).toFixed(2);

        document.getElementById('user-result').innerHTML = `
            <div class="route-result" style="border-color:var(--accent); background:rgba(0,255,225,0.05);">
                <div style="color:var(--accent); font-weight:700;">OPTIMIZED ROUTE FOUND</div>
                <div style="font-size:13px; margin-top:5px;">
                    Distance: ${distanceKm} km <br>
                    Estimated Noise Cost: <span style="color:var(--warn)">${routeCost} Units</span>
                </div>
            </div>`;
    }).addTo(window.userMap);
}

/* ═══════════════════════════════════════════════════════════════════
   9.  USER REROUTE LOGIC (Complete Integrated Version)
═══════════════════════════════════════════════════════════════════ */

// Global variable to track the user's current marker (add this at the top of App.js)
let currentUserMarker = null;

async function checkReroute() {
    const latInput = document.getElementById('u-lat');
    const lonInput = document.getElementById('u-lon');
    const resultDiv = document.getElementById('user-result');

    const lat = parseFloat(latInput.value);
    const lon = parseFloat(lonInput.value);

    // 1. Validation
    if (isNaN(lat) || isNaN(lon)) {
        alert("Please enter valid numerical coordinates for Latitude and Longitude.");
        return;
    }

    // 2. Loading State Feedback
    resultDiv.innerHTML = `
        <div style="color:var(--accent); font-family:var(--mono); font-size:12px; display:flex; align-items:center; gap:8px;">
            <span class="spinner"></span> ANALYZING URBAN NOISE DATA...
        </div>`;

    // 3. Map Interaction & Marker Management
    if (window.userMap) {
        // Center the map on the new location
        window.userMap.setView([lat, lon], 14);

        // Remove the previous search marker to prevent clutter
        if (currentUserMarker) {
            window.userMap.removeLayer(currentUserMarker);
        }

        // Add the new green custom marker
        currentUserMarker = L.marker([lat, lon], {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34]
            })
        })
        .addTo(window.userMap)
        .bindPopup(`<b>Your Search Point</b><br>Lat: ${lat}, Lon: ${lon}`)
        .openPopup();
    }

    // 4. API Request
    try {
        const response = await fetch(`${API}/user/check-reroute?user_lat=${lat}&user_lon=${lon}`);
        
        if (!response.ok) throw new Error("Server communication failed");
        
        const data = await response.json();
        
        // 5. Render the result using your existing UI logic
        renderRerouteResult(resultDiv, data);

    } catch (err) {
        console.error("EchoRoute Error:", err);
        resultDiv.innerHTML = `
            <div style="color:var(--accent2); font-size:13px; padding:10px; border:1px solid var(--accent2); border-radius:5px;">
                ⚠️ Connection Error: Unable to reach the noise analysis engine.
            </div>`;
    }
}


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
    </div>
  `).join('');

  el.innerHTML = `
    <div class="route-result" style="border-color:var(--accent2);background:rgba(255,75,110,0.07);">
      <div style="font-size:28px;margin-bottom:8px;">🚨</div>
      <div style="color:var(--accent2);font-weight:700;font-size:15px;margin-bottom:6px;">REROUTE ADVISED</div>
      <div style="color:var(--muted);font-size:13px;margin-bottom:14px;">
        ${data.breaches.length} high-noise zone(s) detected nearby
      </div>
      <div>${breachRows}</div>
    </div>`;
}
