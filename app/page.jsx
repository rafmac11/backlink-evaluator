"use client";
import { useState } from "react";

// ── Donut Chart ────────────────────────────────────────────────────────────
function DonutChart({ value, max = 100, color, label, size = 120 }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const dash = pct * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
          <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.16,1,.3,1)" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: size * 0.22, fontWeight: 800, color }}>{value}</span>
          <span style={{ fontSize: size * 0.1, color: "var(--muted)", letterSpacing: 1 }}>/{max}</span>
        </div>
      </div>
      <span style={{ fontSize: 11, letterSpacing: 2, color: "var(--muted)" }}>{label}</span>
    </div>
  );
}

// ── Scatter Plot ───────────────────────────────────────────────────────────
function ScatterPlot({ data }) {
  const [hovered, setHovered] = useState(null);
  const W = 280, H = 220, PAD = 32;
  if (!data || data.length === 0) return null;
  const toX = (tf) => PAD + (tf / 100) * (W - PAD * 2);
  const toY = (cf) => H - PAD - (cf / 100) * (H - PAD * 2);
  return (
    <div style={{ position: "relative" }}>
      <svg width={W} height={H} style={{ overflow: "visible" }}>
        {/* Grid */}
        {[0, 25, 50, 75, 100].map(v => (
          <g key={v}>
            <line x1={toX(v)} y1={PAD} x2={toX(v)} y2={H - PAD} stroke="var(--border)" strokeWidth="1" strokeDasharray="3,3" />
            <line x1={PAD} y1={toY(v)} x2={W - PAD} y2={toY(v)} stroke="var(--border)" strokeWidth="1" strokeDasharray="3,3" />
            <text x={toX(v)} y={H - PAD + 14} textAnchor="middle" fill="var(--muted)" fontSize="9">{v}</text>
            <text x={PAD - 6} y={toY(v) + 3} textAnchor="end" fill="var(--muted)" fontSize="9">{v}</text>
          </g>
        ))}
        {/* Diagonal reference line */}
        <line x1={toX(0)} y1={toY(0)} x2={toX(100)} y2={toY(100)} stroke="var(--border)" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
        {/* Dots */}
        {data.map((d, i) => (
          <circle key={i} cx={toX(d.tf)} cy={toY(d.cf)} r={hovered === i ? 6 : 4}
            fill={d.tf > d.cf ? "#c8f542" : d.tf < d.cf ? "#f54242" : "#42f5c8"}
            opacity={0.8} style={{ cursor: "pointer", transition: "r 0.2s" }}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
        ))}
        {/* Axis labels */}
        <text x={W / 2} y={H} textAnchor="middle" fill="var(--muted)" fontSize="10" letterSpacing="1">TRUST FLOW</text>
        <text x={10} y={H / 2} textAnchor="middle" fill="var(--muted)" fontSize="10" letterSpacing="1"
          transform={`rotate(-90, 10, ${H / 2})`}>CITATION FLOW</text>
      </svg>
      {hovered !== null && data[hovered] && (
        <div style={{ position: "absolute", top: toY(data[hovered].cf) - 40, left: toX(data[hovered].tf) + 10,
          background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px",
          fontSize: 11, pointerEvents: "none", whiteSpace: "nowrap", zIndex: 10 }}>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>{data[hovered].domain}</div>
          <div style={{ color: "var(--muted)" }}>TF: {data[hovered].tf} · CF: {data[hovered].cf}</div>
        </div>
      )}
    </div>
  );
}

// ── Topical Trust Flow ─────────────────────────────────────────────────────
const TOPIC_COLORS = ["#c8f542", "#42f5c8", "#a542f5", "#f5a342", "#f54242"];
function TopicalTrustFlow({ topics, trustFlow }) {
  if (!topics || topics.length === 0) return <div style={{ color: "var(--muted)", fontSize: 12 }}>Insufficient data for topical analysis.</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {topics.map((t, i) => (
        <div key={t.topic} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: TOPIC_COLORS[i % TOPIC_COLORS.length],
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: "#000", flexShrink: 0 }}>{t.score}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12 }}>{t.topic}</span>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>{t.pct}%</span>
            </div>
            <div style={{ height: 3, background: "var(--border)", borderRadius: 2 }}>
              <div style={{ height: "100%", width: `${t.pct}%`, background: TOPIC_COLORS[i % TOPIC_COLORS.length],
                borderRadius: 2, transition: "width 1s cubic-bezier(.16,1,.3,1)" }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Anchor Text Chart ──────────────────────────────────────────────────────
function AnchorChart({ anchors }) {
  if (!anchors || anchors.length === 0) return null;
  const max = Math.max(...anchors.map(a => a.count), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {anchors.map((a, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 160, fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0 }}>
            {a.anchor || "(none)"}
          </span>
          <div style={{ flex: 1, height: 4, background: "var(--border)", borderRadius: 2 }}>
            <div style={{ height: "100%", width: `${(a.count / max) * 100}%`, background: "#c8f542",
              borderRadius: 2, transition: "width 1s cubic-bezier(.16,1,.3,1)" }} />
          </div>
          <span style={{ fontSize: 11, color: "var(--muted)", width: 30, textAlign: "right" }}>{a.count}</span>
        </div>
      ))}
    </div>
  );
}

// ── Score Card ─────────────────────────────────────────────────────────────
const ScoreBar = ({ score, color = "#c8f542" }) => {
  const pct = Math.round(score * 100);
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: "var(--muted)", fontSize: 11 }}>SCORE</span>
        <span style={{ color, fontWeight: 700, fontSize: 13 }}>{pct}/100</span>
      </div>
      <div style={{ height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 1s cubic-bezier(.16,1,.3,1)" }} />
      </div>
    </div>
  );
};

const FlagBadge = ({ flag }) => {
  const colors = { CLEAN: "#42f5c8", CAUTION: "#f5a342", TOXIC: "#f54242" };
  const color = colors[flag] || "#6b6b80";
  return (
    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 4, border: `1px solid ${color}`, color, fontSize: 11, letterSpacing: 2, fontWeight: 700 }}>{flag}</span>
  );
};

const PillarCard = ({ title, tag, score, findings, summary, color, delay }) => (
  <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "24px", animation: `fadeUp 0.5s ease both`, animationDelay: delay }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
      <div>
        <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 2, marginBottom: 4 }}>{tag}</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600 }}>{title}</div>
      </div>
      {score !== undefined && (
        <div style={{ width: 52, height: 52, borderRadius: "50%", border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color, fontSize: 13, fontWeight: 700 }}>{Math.round(score * 100)}</span>
        </div>
      )}
    </div>
    {score !== undefined && <ScoreBar score={score} color={color} />}
    <p style={{ color: "var(--muted)", fontSize: 12, margin: "16px 0 12px", lineHeight: 1.7 }}>{summary}</p>
    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
      {Object.entries(findings).map(([key, val]) => (
        <div key={key} style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 8 }}>
          <span style={{ color: "var(--muted)", fontSize: 11, letterSpacing: 0.5 }}>{key.replace(/_/g, " ").toUpperCase()}</span>
          <span style={{ fontSize: 12, lineHeight: 1.5 }}>{val || "—"}</span>
        </div>
      ))}
    </div>
  </div>
);

// ── Evaluator Tab ──────────────────────────────────────────────────────────
function EvaluatorTab() {
  const [sourceUrl, setSourceUrl] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const evaluate = async () => {
    setLoading(true); setResult(null); setError(null);
    try {
      const res = await fetch("/api/evaluate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceUrl, targetUrl }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const lvColor = (lv) => lv >= 0.75 ? "#c8f542" : lv >= 0.5 ? "#f5a342" : "#f54242";
  const recColor = (rec) => rec === "Acquire" ? "#c8f542" : rec === "Monitor" ? "#f5a342" : "#f54242";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          {[{ label: "SOURCE URL", sub: "The linking domain", val: sourceUrl, set: setSourceUrl, ph: "https://example.com" },
            { label: "TARGET URL", sub: "Receiving the link", val: targetUrl, set: setTargetUrl, ph: "https://yourdomain.com" }
          ].map(({ label, sub, val, set, ph }) => (
            <div key={label}>
              <label style={{ display: "block", fontSize: 10, color: "var(--accent)", letterSpacing: 2, marginBottom: 4 }}>{label}</label>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>{sub}</div>
              <input type="url" value={val} onChange={(e) => set(e.target.value)} placeholder={ph}
                style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 13, outline: "none" }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
            </div>
          ))}
        </div>
        <button onClick={evaluate} disabled={loading || !sourceUrl || !targetUrl}
          style={{ width: "100%", padding: "14px", background: loading ? "var(--surface2)" : "var(--accent)", color: loading ? "var(--muted)" : "#000", border: "none", borderRadius: 8, fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, cursor: loading || !sourceUrl || !targetUrl ? "not-allowed" : "pointer", letterSpacing: 1 }}>
          {loading ? "⟳ RESEARCHING & SCORING..." : "→ RUN EVALUATION"}
        </button>
        {loading && <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 12, marginTop: 12, animation: "pulse 2s infinite" }}>Claude is researching both domains (~30s)...</p>}
      </div>
      {error && <div style={{ background: "#1a0a0a", border: "1px solid var(--danger)", borderRadius: 12, padding: 20, color: "var(--danger)", fontSize: 13 }}>✕ {error}</div>}
      {result && (
        <>
          <div style={{ background: "var(--surface2)", border: `1px solid ${recColor(result.final?.recommendation)}`, borderRadius: 16, padding: "28px 32px", animation: "fadeUp 0.4s ease both" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 2, marginBottom: 4 }}>COMPOSITE LINK VALUE</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 56, fontWeight: 800, color: lvColor(result.final?.composite_lv), lineHeight: 1 }}>
                  {(result.final?.composite_lv * 100).toFixed(0)}<span style={{ fontSize: 20, color: "var(--muted)" }}>/100</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 2, marginBottom: 8 }}>RECOMMENDATION</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, color: recColor(result.final?.recommendation) }}>{result.final?.recommendation}</div>
              </div>
            </div>
            {result.final?.reasoning && <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 20, lineHeight: 1.7, borderTop: "1px solid var(--border)", paddingTop: 16 }}>{result.final.reasoning}</p>}
          </div>
          <PillarCard title="Source Authority & Trust" tag="PILLAR 01" score={result.source_authority?.score} findings={result.source_authority?.findings || {}} summary={result.source_authority?.summary} color="#c8f542" delay="0.1s" />
          <PillarCard title="Topical Alignment & Niche Proximity" tag="PILLAR 02" score={result.topical_alignment?.score} findings={result.topical_alignment?.findings || {}} summary={result.topical_alignment?.summary} color="#42f5c8" delay="0.2s" />
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "24px", animation: "fadeUp 0.5s ease 0.3s both" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 2, marginBottom: 4 }}>PILLAR 03</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600 }}>Toxicity & Safety</div>
              </div>
              <FlagBadge flag={result.toxicity_risk?.flag || "CLEAN"} />
            </div>
            <p style={{ color: "var(--muted)", fontSize: 12, margin: "16px 0 12px", lineHeight: 1.7 }}>{result.toxicity_risk?.summary}</p>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(result.toxicity_risk?.findings || {}).map(([key, val]) => (
                <div key={key} style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 8 }}>
                  <span style={{ color: "var(--muted)", fontSize: 11, letterSpacing: 0.5 }}>{key.replace(/_/g, " ").toUpperCase()}</span>
                  <span style={{ fontSize: 12, lineHeight: 1.5 }}>{val || "—"}</span>
                </div>
              ))}
            </div>
          </div>
          <PillarCard title="Agentic Value & Traffic Utility" tag="PILLAR 04" score={result.agentic_utility?.score} findings={result.agentic_utility?.findings || {}} summary={result.agentic_utility?.summary} color="#a542f5" delay="0.4s" />
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, color: "var(--muted)", fontSize: 11 }}>
            <span>SOURCE: {result.source_url}</span><span style={{ margin: "0 12px" }}>→</span><span>TARGET: {result.target_url}</span>
          </div>
        </>
      )}
    </div>
  );
}

// ── Backlink Explorer Tab ──────────────────────────────────────────────────
const tfColor = (score) => score >= 50 ? "#c8f542" : score >= 25 ? "#f5a342" : "#f54242";

function BacklinkExplorer() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [sortKey, setSortKey] = useState("trust_flow");
  const [sortDir, setSortDir] = useState("desc");
  const [filter, setFilter] = useState("");
  const [view, setView] = useState("table"); // table | profile

  const fetchBacklinks = async () => {
    setLoading(true); setResult(null); setError(null);
    try {
      const res = await fetch("/api/backlinks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetUrl: url }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sorted = result?.backlinks
    ? [...result.backlinks]
        .filter(b => !filter || b.domain_from?.includes(filter) || b.anchor?.includes(filter))
        .sort((a, b) => {
          const av = a[sortKey], bv = b[sortKey];
          if (typeof av === "boolean") return sortDir === "desc" ? (bv ? 1 : -1) : (av ? -1 : 1);
          return sortDir === "desc" ? (bv || 0) - (av || 0) : (av || 0) - (bv || 0);
        })
    : [];

  const thStyle = (key) => ({
    padding: "10px 12px", fontSize: 10, letterSpacing: 1.5,
    color: sortKey === key ? "var(--accent)" : "var(--muted)",
    cursor: "pointer", whiteSpace: "nowrap", userSelect: "none",
    textAlign: "left", fontFamily: "var(--font-mono)",
    borderBottom: "1px solid var(--border)", background: "var(--surface2)",
  });
  const tdStyle = { padding: "10px 12px", fontSize: 12, borderBottom: "1px solid var(--border)", verticalAlign: "middle" };

  const s = result?.summary;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Input */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "32px" }}>
        <label style={{ display: "block", fontSize: 10, color: "var(--accent)", letterSpacing: 2, marginBottom: 4 }}>TARGET DOMAIN</label>
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12 }}>Enter the domain to explore backlinks, flow metrics and link profile</div>
        <div style={{ display: "flex", gap: 12 }}>
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://yourdomain.com"
            style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 13, outline: "none" }}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            onKeyDown={(e) => e.key === "Enter" && url && fetchBacklinks()} />
          <button onClick={fetchBacklinks} disabled={loading || !url}
            style={{ padding: "10px 28px", background: loading ? "var(--surface2)" : "var(--accent)", color: loading ? "var(--muted)" : "#000", border: "none", borderRadius: 8, fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, cursor: loading || !url ? "not-allowed" : "pointer" }}>
            {loading ? "⟳" : "→ FETCH"}
          </button>
        </div>
        {loading && <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 12, animation: "pulse 2s infinite" }}>Fetching backlink profile from DataForSEO...</p>}
      </div>

      {error && <div style={{ background: "#1a0a0a", border: "1px solid var(--danger)", borderRadius: 12, padding: 20, color: "var(--danger)", fontSize: 13 }}>✕ {error}</div>}

      {result && s && (
        <>
          {/* Flow Metrics — Majestic-style donut row */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 32px", animation: "fadeUp 0.3s ease both" }}>
            <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 2, marginBottom: 24 }}>FLOW METRICS — {s.target}</div>
            <div style={{ display: "flex", gap: 40, flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between" }}>
              {/* Donuts */}
              <div style={{ display: "flex", gap: 40 }}>
                <DonutChart value={s.trust_flow ?? 0} label="TRUST FLOW" color="#c8f542" size={130} />
                <DonutChart value={s.citation_flow ?? 0} label="CITATION FLOW" color="#42f5c8" size={130} />
                <DonutChart value={s.dofollow_pct ?? 0} label="DOFOLLOW %" color="#a542f5" size={130} />
              </div>
              {/* Quick stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "TOTAL BACKLINKS", val: s.backlinks?.toLocaleString() },
                  { label: "REF DOMAINS", val: s.referring_domains?.toLocaleString() },
                  { label: "REF IPs", val: s.referring_ips?.toLocaleString() },
                  { label: "DOMAIN RANK", val: s.rank },
                ].map(({ label, val }) => (
                  <div key={label} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px" }}>
                    <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 2, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800 }}>{val ?? "—"}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Topical TF + Scatter + Anchors */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, animation: "fadeUp 0.4s ease 0.1s both" }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "24px" }}>
              <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 2, marginBottom: 16 }}>TOPICAL TRUST FLOW</div>
              <TopicalTrustFlow topics={s.topics} trustFlow={s.trust_flow} />
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "24px" }}>
              <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 2, marginBottom: 16 }}>LINK PROFILE (TF vs CF)</div>
              <ScatterPlot data={s.scatter} />
              <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 10, color: "var(--muted)" }}>
                <span style={{ color: "#c8f542" }}>● TF &gt; CF</span>
                <span style={{ color: "#f54242" }}>● CF &gt; TF</span>
                <span style={{ color: "#42f5c8" }}>● Balanced</span>
              </div>
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "24px" }}>
              <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 2, marginBottom: 16 }}>TOP ANCHOR TEXTS</div>
              <AnchorChart anchors={s.top_anchors} />
            </div>
          </div>

          {/* View toggle */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {["table"].map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding: "6px 16px", background: view === v ? "var(--accent)" : "transparent", color: view === v ? "#000" : "var(--muted)", border: "1px solid " + (view === v ? "var(--accent)" : "var(--border)"), borderRadius: 6, fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                BACKLINKS TABLE
              </button>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
              <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by domain or anchor..."
                style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 14px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 12, outline: "none", width: 240 }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
              <span style={{ color: "var(--muted)", fontSize: 12, whiteSpace: "nowrap" }}>{sorted.length} results</span>
            </div>
          </div>

          {/* Table */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", animation: "fadeUp 0.5s ease 0.2s both" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {[{ key: "domain_from", label: "LINKING DOMAIN" }, { key: "trust_flow", label: "TRUST FLOW" },
                      { key: "domain_from_rank", label: "DOMAIN RANK" }, { key: "anchor", label: "ANCHOR TEXT" },
                      { key: "dofollow", label: "TYPE" }, { key: "first_seen", label: "FIRST SEEN" }
                    ].map(({ key, label }) => (
                      <th key={key} style={thStyle(key)} onClick={() => toggleSort(key)}>
                        {label} {sortKey === key ? (sortDir === "desc" ? "↓" : "↑") : ""}
                      </th>
                    ))}
                    <th style={{ ...thStyle(""), cursor: "default" }}>LINK</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((b, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                      <td style={tdStyle}><span style={{ fontWeight: 600 }}>{b.domain_from}</span></td>
                      <td style={tdStyle}><span style={{ color: tfColor(b.trust_flow), fontWeight: 700 }}>{b.trust_flow}</span></td>
                      <td style={tdStyle}><span style={{ color: tfColor(b.domain_from_rank) }}>{b.domain_from_rank}</span></td>
                      <td style={{ ...tdStyle, maxWidth: 180 }}>
                        <span style={{ color: "var(--muted)", fontSize: 11, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.anchor || "(none)"}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 10, letterSpacing: 1, color: b.dofollow ? "#42f5c8" : "var(--muted)", border: `1px solid ${b.dofollow ? "#42f5c8" : "var(--border)"}`, borderRadius: 3, padding: "2px 6px" }}>
                          {b.dofollow ? "DOFOLLOW" : "NOFOLLOW"}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: "var(--muted)", fontSize: 11 }}>{b.first_seen ? new Date(b.first_seen).toLocaleDateString() : "—"}</td>
                      <td style={tdStyle}>
                        <a href={b.url_from} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", fontSize: 11, textDecoration: "none" }}>↗ view</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sorted.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>No backlinks found.</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function Home() {
  const [tab, setTab] = useState("evaluator");
  const tabStyle = (t) => ({
    padding: "8px 20px",
    background: tab === t ? "var(--accent)" : "transparent",
    color: tab === t ? "#000" : "var(--muted)",
    border: "1px solid " + (tab === t ? "var(--accent)" : "var(--border)"),
    borderRadius: 6, fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700,
    cursor: "pointer", letterSpacing: 0.5, transition: "all 0.2s",
  });

  return (
    <>
      <div className="scanline" />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ marginBottom: 36, animation: "fadeUp 0.4s ease both" }}>
          <div style={{ fontSize: 10, color: "var(--accent)", letterSpacing: 4, marginBottom: 8 }}>BACKLINK INTELLIGENCE</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800, lineHeight: 1.1, marginBottom: 12 }}>
            Link Value <span style={{ color: "var(--accent)" }}>Platform</span>
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>AI-powered evaluation · Trust Flow & Citation Flow · Topical analysis · Link profile</p>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <button style={tabStyle("evaluator")} onClick={() => setTab("evaluator")}>⟳ Link Evaluator</button>
          <button style={tabStyle("explorer")} onClick={() => setTab("explorer")}>↗ Backlink Explorer</button>
        </div>
        {tab === "evaluator" ? <EvaluatorTab /> : <BacklinkExplorer />}
      </div>
    </>
  );
}
