"use client";

import { useState } from "react";

const ScoreBar = ({ score, color = "#c8f542" }) => {
  const pct = Math.round(score * 100);
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: "var(--muted)", fontSize: 11 }}>SCORE</span>
        <span style={{ color, fontWeight: 700, fontSize: 13 }}>{pct}/100</span>
      </div>
      <div style={{ height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: 2,
            transition: "width 1s cubic-bezier(.16,1,.3,1)",
          }}
        />
      </div>
    </div>
  );
};

const PillarCard = ({ title, tag, score, findings, summary, color, delay }) => (
  <div
    style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: "24px",
      animation: `fadeUp 0.5s ease both`,
      animationDelay: delay,
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
      <div>
        <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 2, marginBottom: 4 }}>{tag}</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600 }}>{title}</div>
      </div>
      {score !== undefined && (
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            border: `2px solid ${color}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ color, fontSize: 13, fontWeight: 700 }}>{Math.round(score * 100)}</span>
        </div>
      )}
    </div>

    {score !== undefined && <ScoreBar score={score} color={color} />}

    <p style={{ color: "var(--muted)", fontSize: 12, margin: "16px 0 12px", lineHeight: 1.7 }}>{summary}</p>

    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
      {Object.entries(findings).map(([key, val]) => (
        <div key={key} style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 8 }}>
          <span style={{ color: "var(--muted)", fontSize: 11, letterSpacing: 0.5 }}>
            {key.replace(/_/g, " ").toUpperCase()}
          </span>
          <span style={{ fontSize: 12, lineHeight: 1.5 }}>{val || "—"}</span>
        </div>
      ))}
    </div>
  </div>
);

const FlagBadge = ({ flag }) => {
  const colors = { CLEAN: "#42f5c8", CAUTION: "#f5a342", TOXIC: "#f54242" };
  const color = colors[flag] || "#6b6b80";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 4,
        border: `1px solid ${color}`,
        color,
        fontSize: 11,
        letterSpacing: 2,
        fontWeight: 700,
      }}
    >
      {flag}
    </span>
  );
};

export default function Home() {
  const [sourceUrl, setSourceUrl] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const evaluate = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUrl, targetUrl }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const lvColor = (lv) => {
    if (lv >= 0.75) return "#c8f542";
    if (lv >= 0.5) return "#f5a342";
    return "#f54242";
  };

  const recColor = (rec) => {
    if (rec === "Acquire") return "#c8f542";
    if (rec === "Monitor") return "#f5a342";
    return "#f54242";
  };

  return (
    <>
      <div className="scanline" />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 48, animation: "fadeUp 0.4s ease both" }}>
          <div style={{ fontSize: 10, color: "var(--accent)", letterSpacing: 4, marginBottom: 8 }}>
            BACKLINK INTELLIGENCE
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 5vw, 48px)",
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: 12,
            }}
          >
            Link Value{" "}
            <span style={{ color: "var(--accent)" }}>Evaluator</span>
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>
            AI-powered 4-pillar backlink scoring — Authority · Topical Alignment · Toxicity · Utility
          </p>
        </div>

        {/* Input form */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "32px",
            marginBottom: 32,
            animation: "fadeUp 0.4s ease 0.1s both",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            {[
              { label: "SOURCE URL", sub: "The linking domain", val: sourceUrl, set: setSourceUrl, ph: "https://example.com" },
              { label: "TARGET URL", sub: "Receiving the link", val: targetUrl, set: setTargetUrl, ph: "https://yourdomain.com" },
            ].map(({ label, sub, val, set, ph }) => (
              <div key={label}>
                <label style={{ display: "block", fontSize: 10, color: "var(--accent)", letterSpacing: 2, marginBottom: 4 }}>
                  {label}
                </label>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>{sub}</div>
                <input
                  type="url"
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  placeholder={ph}
                  style={{
                    width: "100%",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    color: "var(--text)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </div>
            ))}
          </div>

          <button
            onClick={evaluate}
            disabled={loading || !sourceUrl || !targetUrl}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? "var(--surface2)" : "var(--accent)",
              color: loading ? "var(--muted)" : "#000",
              border: "none",
              borderRadius: 8,
              fontFamily: "var(--font-display)",
              fontSize: 15,
              fontWeight: 700,
              cursor: loading || !sourceUrl || !targetUrl ? "not-allowed" : "pointer",
              letterSpacing: 1,
              transition: "all 0.2s",
            }}
          >
            {loading ? "⟳ RESEARCHING & SCORING..." : "→ RUN EVALUATION"}
          </button>

          {loading && (
            <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 12, marginTop: 12, animation: "pulse 2s infinite" }}>
              Claude is researching both domains. This takes ~30 seconds...
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: "#1a0a0a",
              border: "1px solid var(--danger)",
              borderRadius: 12,
              padding: 20,
              color: "var(--danger)",
              marginBottom: 32,
              fontSize: 13,
            }}
          >
            ✕ {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Final verdict */}
            <div
              style={{
                background: "var(--surface2)",
                border: `1px solid ${recColor(result.final?.recommendation)}`,
                borderRadius: 16,
                padding: "28px 32px",
                animation: "fadeUp 0.4s ease both",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 2, marginBottom: 4 }}>COMPOSITE LINK VALUE</div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 56,
                      fontWeight: 800,
                      color: lvColor(result.final?.composite_lv),
                      lineHeight: 1,
                    }}
                  >
                    {(result.final?.composite_lv * 100).toFixed(0)}
                    <span style={{ fontSize: 20, color: "var(--muted)" }}>/100</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 2, marginBottom: 8 }}>RECOMMENDATION</div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 28,
                      fontWeight: 800,
                      color: recColor(result.final?.recommendation),
                    }}
                  >
                    {result.final?.recommendation}
                  </div>
                </div>
              </div>
              {result.final?.reasoning && (
                <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 20, lineHeight: 1.7, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                  {result.final.reasoning}
                </p>
              )}
            </div>

            {/* 4 Pillars */}
            <PillarCard
              title="Source Authority & Trust"
              tag="PILLAR 01"
              score={result.source_authority?.score}
              findings={result.source_authority?.findings || {}}
              summary={result.source_authority?.summary}
              color="#c8f542"
              delay="0.1s"
            />

            <PillarCard
              title="Topical Alignment & Niche Proximity"
              tag="PILLAR 02"
              score={result.topical_alignment?.score}
              findings={result.topical_alignment?.findings || {}}
              summary={result.topical_alignment?.summary}
              color="#42f5c8"
              delay="0.2s"
            />

            {/* Toxicity - special layout */}
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "24px",
                animation: "fadeUp 0.5s ease 0.3s both",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 2, marginBottom: 4 }}>PILLAR 03</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600 }}>Toxicity & Safety</div>
                </div>
                <FlagBadge flag={result.toxicity_risk?.flag || "CLEAN"} />
              </div>
              <p style={{ color: "var(--muted)", fontSize: 12, margin: "16px 0 12px", lineHeight: 1.7 }}>
                {result.toxicity_risk?.summary}
              </p>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(result.toxicity_risk?.findings || {}).map(([key, val]) => (
                  <div key={key} style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 8 }}>
                    <span style={{ color: "var(--muted)", fontSize: 11, letterSpacing: 0.5 }}>
                      {key.replace(/_/g, " ").toUpperCase()}
                    </span>
                    <span style={{ fontSize: 12, lineHeight: 1.5 }}>{val || "—"}</span>
                  </div>
                ))}
              </div>
            </div>

            <PillarCard
              title="Agentic Value & Traffic Utility"
              tag="PILLAR 04"
              score={result.agentic_utility?.score}
              findings={result.agentic_utility?.findings || {}}
              summary={result.agentic_utility?.summary}
              color="#a542f5"
              delay="0.4s"
            />

            {/* URLs evaluated */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, color: "var(--muted)", fontSize: 11 }}>
              <span>SOURCE: {result.source_url}</span>
              <span style={{ margin: "0 12px" }}>→</span>
              <span>TARGET: {result.target_url}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
