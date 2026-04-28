import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// ─── Inline Styles ────────────────────────────────────────────────────────────

const styles = {
  root: {
    display: "flex",
    height: "100vh",
    width: "100vw",
    background: "#0b0f1a",
    fontFamily: "'IBM Plex Mono', monospace",
    color: "#e2e8f0",
    overflow: "hidden",
  },
  sidebar: {
    width: "320px",
    minWidth: "320px",
    background: "#0d1220",
    borderRight: "1px solid #1e293b",
    display: "flex",
    flexDirection: "column",
    zIndex: 1000,
    overflow: "hidden",
  },
  sidebarHeader: {
    padding: "24px 20px 16px",
    borderBottom: "1px solid #1e293b",
  },
  sidebarLabel: {
    fontSize: "10px",
    letterSpacing: "0.2em",
    color: "#475569",
    textTransform: "uppercase",
    marginBottom: "6px",
  },
  sidebarTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#f1f5f9",
    letterSpacing: "-0.02em",
    lineHeight: 1.2,
  },
  sidebarTitleAccent: {
    color: "#38bdf8",
  },
  statsRow: {
    display: "flex",
    gap: "12px",
    padding: "14px 20px",
    borderBottom: "1px solid #1e293b",
    background: "#0b0f1a",
  },
  statCard: {
    flex: 1,
    background: "#111827",
    border: "1px solid #1e293b",
    borderRadius: "8px",
    padding: "10px 12px",
  },
  statLabel: {
    fontSize: "9px",
    letterSpacing: "0.15em",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: "4px",
  },
  statValue: {
    fontSize: "22px",
    fontWeight: "700",
    letterSpacing: "-0.03em",
    lineHeight: 1,
  },
  segmentList: {
    overflowY: "auto",
    flex: 1,
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  segmentCard: (level) => ({
    background: "#111827",
    border: `1px solid ${level > 70 ? "#7f1d1d" : "#14532d"}`,
    borderLeft: `3px solid ${level > 70 ? "#ef4444" : "#22c55e"}`,
    borderRadius: "8px",
    padding: "12px 14px",
    cursor: "pointer",
    transition: "background 0.15s ease",
  }),
  segmentName: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#cbd5e1",
    marginBottom: "6px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  segmentMeta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  noiseBar: (level) => ({
    height: "4px",
    borderRadius: "2px",
    background: "#1e293b",
    flex: 1,
    marginRight: "10px",
    overflow: "hidden",
    position: "relative",
  }),
  noiseBarFill: (level) => ({
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    width: `${((level - 40) / 50) * 100}%`,
    background: level > 70 ? "#ef4444" : "#22c55e",
    borderRadius: "2px",
    transition: "width 0.6s ease",
  }),
  noiseValue: (level) => ({
    fontSize: "13px",
    fontWeight: "700",
    color: level > 70 ? "#f87171" : "#4ade80",
    letterSpacing: "-0.02em",
    whiteSpace: "nowrap",
  }),
  badge: (level) => ({
    fontSize: "9px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: level > 70 ? "#f87171" : "#4ade80",
    marginTop: "6px",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  }),
  dot: (level) => ({
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: level > 70 ? "#ef4444" : "#22c55e",
    display: "inline-block",
    boxShadow: level > 70 ? "0 0 6px #ef4444" : "0 0 6px #22c55e",
  }),
  mapWrapper: {
    flex: 1,
    position: "relative",
  },
  loadingOverlay: {
    position: "absolute",
    inset: 0,
    background: "#0b0f1a",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    gap: "16px",
  },
  loadingText: {
    fontSize: "12px",
    letterSpacing: "0.2em",
    color: "#475569",
    textTransform: "uppercase",
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "2px solid #1e293b",
    borderTop: "2px solid #38bdf8",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  errorBox: {
    margin: "16px",
    background: "#1c0a0a",
    border: "1px solid #7f1d1d",
    borderRadius: "8px",
    padding: "14px",
    fontSize: "11px",
    color: "#fca5a5",
    lineHeight: 1.6,
  },
  refreshBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 14px",
    margin: "0 20px 16px",
    background: "transparent",
    border: "1px solid #1e293b",
    borderRadius: "6px",
    color: "#64748b",
    fontSize: "10px",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "border-color 0.15s, color 0.15s",
  },
  mapTopBar: {
    position: "absolute",
    top: "16px",
    right: "16px",
    zIndex: 1000,
    display: "flex",
    gap: "8px",
  },
  legendPill: (color, label) => ({
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(11,15,26,0.88)",
    border: "1px solid #1e293b",
    borderRadius: "20px",
    padding: "5px 12px",
    fontSize: "10px",
    letterSpacing: "0.12em",
    color: "#94a3b8",
    backdropFilter: "blur(8px)",
    textTransform: "uppercase",
  }),
  legendDot: (color) => ({
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: color,
    boxShadow: `0 0 6px ${color}`,
  }),
  popup: {
    fontFamily: "'IBM Plex Mono', monospace",
  },
};

// ─── Keyframe injection ───────────────────────────────────────────────────────

const injectGlobalStyles = () => {
  if (document.getElementById("noisemap-styles")) return;
  const el = document.createElement("style");
  el.id = "noisemap-styles";
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { overflow: hidden; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
    .segment-card { animation: fadeIn 0.3s ease both; }
    .leaflet-popup-content-wrapper {
      background: #111827 !important;
      border: 1px solid #1e293b !important;
      border-radius: 10px !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
      padding: 0 !important;
    }
    .leaflet-popup-tip { background: #111827 !important; }
    .leaflet-popup-close-button { color: #64748b !important; top: 8px !important; right: 8px !important; }
    .leaflet-popup-content { margin: 0 !important; }
    .leaflet-tile { filter: brightness(0.65) saturate(0.4) hue-rotate(180deg); }
    .leaflet-container { background: #0b0f1a; }
    .segment-list-item:hover { background: #1a2235 !important; }
  `;
  document.head.appendChild(el);
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, color }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div style={{ ...styles.statValue, color: color || "#f1f5f9" }}>{value}</div>
    </div>
  );
}

function SegmentCard({ segment, index }) {
  const level = segment.noise_level;
  return (
    <div
      className="segment-list-item"
      style={{ ...styles.segmentCard(level), animationDelay: `${index * 40}ms` }}
    >
      <div style={styles.segmentName}>{segment.name || segment.road_name || `Segment #${segment.id}`}</div>
      <div style={styles.segmentMeta}>
        <div style={styles.noiseBar(level)}>
          <div style={styles.noiseBarFill(level)} />
        </div>
        <div style={styles.noiseValue(level)}>{level.toFixed(1)} dB</div>
      </div>
      <div style={styles.badge(level)}>
        <span style={styles.dot(level)} />
        {level > 70 ? "High noise" : "Normal"}
      </div>
    </div>
  );
}

function PopupContent({ segment }) {
  const level = segment.noise_level;
  const name = segment.name || segment.road_name || `Segment #${segment.id}`;
  return (
    <div style={{ padding: "14px 16px", minWidth: "180px" }}>
      <div style={{ fontSize: "9px", letterSpacing: "0.18em", color: "#475569", textTransform: "uppercase", marginBottom: "6px" }}>
        Road Segment
      </div>
      <div style={{ fontSize: "14px", fontWeight: "700", color: "#f1f5f9", marginBottom: "12px", fontFamily: "IBM Plex Mono, monospace" }}>
        {name}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ ...styles.dot(level > 70 ? "#ef4444" : "#22c55e"), width: "10px", height: "10px" }} />
        <span style={{ fontSize: "22px", fontWeight: "700", color: level > 70 ? "#f87171" : "#4ade80", fontFamily: "IBM Plex Mono, monospace", letterSpacing: "-0.03em" }}>
          {level.toFixed(1)}
        </span>
        <span style={{ fontSize: "11px", color: "#64748b" }}>dB</span>
      </div>
      <div style={{ marginTop: "8px", fontSize: "10px", color: level > 70 ? "#fca5a5" : "#86efac", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        {level > 70 ? "⚠ High Noise Zone" : "✓ Normal Level"}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

const API_URL = "http://localhost:8000/admin/thermal-data";
const MAP_CENTER = [12.87, 74.84];
const MAP_ZOOM = 13;

// Fallback mock data so the UI is never empty during development
const MOCK_DATA = [
  { id: 1, name: "MG Road",          lat: 12.876, lng: 74.843, noise_level: 78.3 },
  { id: 2, name: "Brigade Road",     lat: 12.872, lng: 74.848, noise_level: 55.1 },
  { id: 3, name: "Residency Road",   lat: 12.868, lng: 74.839, noise_level: 82.7 },
  { id: 4, name: "Hosur Road",       lat: 12.881, lng: 74.852, noise_level: 63.4 },
  { id: 5, name: "Old Airport Road", lat: 12.864, lng: 74.857, noise_level: 71.0 },
  { id: 6, name: "Kodialbail",       lat: 12.860, lng: 74.833, noise_level: 48.9 },
  { id: 7, name: "Hampankatta",      lat: 12.870, lng: 74.836, noise_level: 88.2 },
];

export default function App() {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  injectGlobalStyles();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      // Support both array and { data: [...] } shapes
      const list = Array.isArray(json) ? json : json.data ?? json.segments ?? [];
      setSegments(list);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message);
      // Fall back to mock data so the map still renders
      setSegments(MOCK_DATA);
      setLastUpdated("mock data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── derived stats
  const highNoise  = segments.filter(s => s.noise_level > 70).length;
  const normalNoise = segments.length - highNoise;
  const avgNoise   = segments.length
    ? (segments.reduce((a, s) => a + s.noise_level, 0) / segments.length).toFixed(1)
    : "—";

  return (
    <div style={styles.root}>
      {/* ── Sidebar ── */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.sidebarLabel}>Urban Infrastructure</div>
          <div style={styles.sidebarTitle}>
            Noise<span style={styles.sidebarTitleAccent}>Map</span>
          </div>
        </div>

        <div style={styles.statsRow}>
          <StatCard label="Segments"  value={segments.length} />
          <StatCard label="Avg dB"    value={avgNoise}         color="#38bdf8" />
        </div>
        <div style={styles.statsRow}>
          <StatCard label="High"   value={highNoise}   color="#f87171" />
          <StatCard label="Normal" value={normalNoise} color="#4ade80" />
        </div>

        {error && (
          <div style={styles.errorBox}>
            ⚠ API unreachable — showing mock data.<br />
            <span style={{ color: "#94a3b8" }}>{error}</span>
          </div>
        )}

        <button
          style={styles.refreshBtn}
          onClick={fetchData}
          onMouseEnter={e => { e.target.style.borderColor = "#38bdf8"; e.target.style.color = "#38bdf8"; }}
          onMouseLeave={e => { e.target.style.borderColor = "#1e293b"; e.target.style.color = "#64748b"; }}
        >
          ↻ &nbsp;Refresh
          {lastUpdated && <span style={{ opacity: 0.5 }}>· {lastUpdated}</span>}
        </button>

        <div style={styles.segmentList}>
          {segments.map((seg, i) => (
            <SegmentCard key={seg.id ?? i} segment={seg} index={i} />
          ))}
        </div>
      </aside>

      {/* ── Map area ── */}
      <div style={styles.mapWrapper}>
        {loading && (
          <div style={styles.loadingOverlay}>
            <div style={styles.spinner} />
            <div style={styles.loadingText}>Fetching segments…</div>
          </div>
        )}

        {/* Legend */}
        <div style={styles.mapTopBar}>
          <div style={styles.legendPill("#ef4444", "High")}>
            <div style={styles.legendDot("#ef4444")} /> &gt; 70 dB
          </div>
          <div style={styles.legendPill("#22c55e", "Normal")}>
            <div style={styles.legendDot("#22c55e")} /> ≤ 70 dB
          </div>
        </div>

        <MapContainer
          center={MAP_CENTER}
          zoom={MAP_ZOOM}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
          />

          {segments.map((seg, i) => {
            const isHigh  = seg.noise_level > 70;
            const color   = isHigh ? "#ef4444" : "#22c55e";
            const lat = seg.lat ?? seg.latitude  ?? seg.coordinates?.[1] ?? MAP_CENTER[0];
            const lng = seg.lng ?? seg.longitude ?? seg.coordinates?.[0] ?? MAP_CENTER[1];

            return (
              <CircleMarker
                key={seg.id ?? i}
                center={[lat, lng]}
                radius={isHigh ? 14 : 10}
                pathOptions={{
                  color:       color,
                  fillColor:   color,
                  fillOpacity: 0.25,
                  weight:      2,
                  opacity:     0.9,
                }}
              >
                <Popup>
                  <PopupContent segment={seg} />
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
