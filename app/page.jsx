"use client";
import { useState, useEffect } from "react";

export default function Landing() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  const features = [
    { icon: "⟳", title: "AI Link Evaluator", desc: "Claude researches both source and target domains in real time, scoring links across 4 pillars. Get a composite 0-100 Link Value score with a clear Acquire / Monitor / Avoid recommendation." },
    { icon: "↗", title: "Backlink Explorer", desc: "Fetch the full backlink profile of any domain — 100 top linking domains sorted by PageRank, anchor text distribution, dofollow ratio, and first-seen dates. Powered by DataForSEO." },
    { icon: "◎", title: "Real PageRank Data", desc: "Integrated with OpenPageRank to show true Google-derived PageRank (0-10) for the target domain and every linking domain in the table. No inflated vanity metrics." },
    { icon: "▦", title: "Link Profile Visualization", desc: "Interactive scatter plot, topical category breakdown from anchor texts, and top anchor text bar chart — everything to understand a link profile at a glance." },
  ];

  const pillars = [
    { num: "01", label: "Authority & Trust", color: "#c8f542", desc: "Domain age, DR, backlink quality, spam signals" },
    { num: "02", label: "Topical Alignment", color: "#42f5c8", desc: "Niche proximity, content relevance, audience overlap" },
    { num: "03", label: "Toxicity Risk", color: "#f5a342", desc: "PBN detection, thin content, manual penalty signals" },
    { num: "04", label: "Agentic Utility", color: "#a542f5", desc: "Real traffic, indexed pages, commercial value" },
  ];

  const pillarScores = [
    { label: "Authority & Trust", score: 82, color: "#c8f542" },
    { label: "Topical Alignment", score: 91, color: "#42f5c8" },
    { label: "Toxicity Risk", score: 95, color: "#f5a342" },
    { label: "Agentic Utility", score: 61, color: "#a542f5" },
  ];

  const t = dark ? {
    bg: "#0a0a0f", surface: "#111118", surface2: "#18181f", border: "#222230",
    text: "#f0f0f5", muted: "#6b6b80", accent: "#c8f542", navBg: "rgba(10,10,15,0.85)",
    heroGrad: "radial-gradient(ellipse 80% 60% at 50% -10%,rgba(200,245,66,0.12) 0%,transparent 70%)",
  } : {
    bg: "#f5f5f0", surface: "#ffffff", surface2: "#f0f0eb", border: "#e0e0d8",
    text: "#111118", muted: "#888880", accent: "#5a9e00", navBg: "rgba(245,245,240,0.92)",
    heroGrad: "radial-gradient(ellipse 80% 60% at 50% -10%,rgba(90,158,0,0.08) 0%,transparent 70%)",
  };

  return (
    <div style={{ fontFamily: "'Space Mono', monospace", background: t.bg, color: t.text, minHeight: "100vh", transition: "background 0.3s, color 0.3s" }}>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: t.navBg, backdropFilter: "blur(12px)", borderBottom: `1px solid ${t.border}`, padding: "0 40px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18 }}>
          Link Value <span style={{ color: t.accent }}>Platform</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 10, color: t.muted, letterSpacing: 1 }}>{dark ? "DARK" : "LIGHT"}</span>
          <div onClick={() => setDark(!dark)} style={{ width: 44, height: 24, background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 12, cursor: "pointer", position: "relative" }}>
            <div style={{ position: "absolute", top: 3, left: dark ? 3 : 23, width: 16, height: 16, background: t.accent, borderRadius: "50%", transition: "left 0.3s" }} />
          </div>
          <a href="/dashboard" style={{ padding: "8px 24px", background: t.accent, color: "#000", borderRadius: 6, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>→ LAUNCH APP</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 24px 80px", position: "relative", background: t.heroGrad }}>
        <div style={{ display: "inline-block", padding: "4px 16px", border: `1px solid ${t.accent}`, borderRadius: 100, fontSize: 10, color: t.accent, letterSpacing: 3, marginBottom: 32 }}>
          AI-POWERED BACKLINK INTELLIGENCE
        </div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(40px,7vw,80px)", lineHeight: 1.05, letterSpacing: -2, marginBottom: 28 }}>
          Know if a link<br />is worth <span style={{ color: t.accent }}>acquiring.</span>
        </h1>
        <p style={{ maxWidth: 560, color: t.muted, fontSize: 14, lineHeight: 1.8, marginBottom: 48 }}>
          The only tool that combines Claude AI research, real PageRank data, and deep backlink analysis to give you a definitive link value score — before you spend a dollar on outreach.
        </p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          <a href="/dashboard" style={{ padding: "14px 36px", background: t.accent, color: "#000", borderRadius: 8, fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15, textDecoration: "none" }}>→ Launch Platform</a>
          <a href="#how" style={{ padding: "14px 36px", background: "transparent", color: t.text, border: `1px solid ${t.border}`, borderRadius: 8, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>How it works</a>
        </div>
        <div style={{ display: "flex", gap: 48, flexWrap: "wrap", justifyContent: "center", marginTop: 72, paddingTop: 48, borderTop: `1px solid ${t.border}`, width: "100%", maxWidth: 700 }}>
          {[{ n: "4", l: "EVALUATION PILLARS" }, { n: "0-100", l: "LINK VALUE SCORE" }, { n: "100+", l: "BACKLINKS PER LOOKUP" }, { n: "~30s", l: "AI RESEARCH TIME" }].map(s => (
            <div key={s.l} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 36, fontWeight: 800, color: t.accent, lineHeight: 1, marginBottom: 6 }}>{s.n}</div>
              <div style={{ fontSize: 10, color: t.muted, letterSpacing: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 24px" }}>
        <div style={{ fontSize: 10, color: t.accent, letterSpacing: 3, marginBottom: 16 }}>WHAT'S INSIDE</div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(28px,4vw,48px)", lineHeight: 1.1, marginBottom: 16, letterSpacing: -1 }}>Two tools.<br />One decision.</h2>
        <p style={{ color: t.muted, fontSize: 13, lineHeight: 1.8, maxWidth: 500, marginBottom: 60 }}>Evaluate a prospective link with Claude AI research, or explore the full backlink profile of any domain with real data.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 1, background: t.border, border: `1px solid ${t.border}`, borderRadius: 16, overflow: "hidden" }}>
          {features.map(f => (
            <div key={f.title} style={{ background: t.surface, padding: "36px 32px" }}>
              <div style={{ fontSize: 24, color: t.accent, marginBottom: 20 }}>{f.icon}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, marginBottom: 12 }}>{f.title}</div>
              <p style={{ color: t.muted, fontSize: 12, lineHeight: 1.8 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PILLARS */}
      <div style={{ background: t.surface, borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 24px 0" }}>
          <div style={{ fontSize: 10, color: t.accent, letterSpacing: 3, marginBottom: 16 }}>THE EVALUATION FRAMEWORK</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(28px,4vw,48px)", letterSpacing: -1, marginBottom: 48 }}>4 pillars. 1 score.</h2>
        </div>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderTop: `1px solid ${t.border}` }}>
          {pillars.map((p, i) => (
            <div key={p.num} style={{ padding: "48px 32px", borderRight: i < 3 ? `1px solid ${t.border}` : "none", position: "relative" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: p.color }} />
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 48, fontWeight: 800, color: t.border, lineHeight: 1, marginBottom: 16 }}>{p.num}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: p.color, marginBottom: 10 }}>{p.label}</div>
              <p style={{ fontSize: 11, color: t.muted, lineHeight: 1.7 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="how" style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10, color: t.accent, letterSpacing: 3, marginBottom: 16 }}>HOW IT WORKS</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(24px,3vw,40px)", letterSpacing: -1, marginBottom: 16 }}>Research-backed scoring in 30 seconds.</h2>
          <p style={{ color: t.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 40 }}>Claude browses the live web to evaluate both domains, then synthesizes a composite score across all four pillars.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {[
              { n: "1", t2: "Enter source & target URLs", d: "Paste the linking domain and the page receiving the link." },
              { n: "2", t2: "Claude researches both domains", d: "Real-time web research on authority, content relevance, spam indicators, and traffic quality." },
              { n: "3", t2: "Get your Link Value score", d: "A 0-100 composite score with a clear recommendation: Acquire, Monitor, or Avoid." },
            ].map(s => (
              <div key={s.n} style={{ display: "flex", gap: 20 }}>
                <div style={{ width: 36, height: 36, border: `1px solid ${t.accent}`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif", fontWeight: 700, color: t.accent, flexShrink: 0 }}>{s.n}</div>
                <div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{s.t2}</div>
                  <p style={{ fontSize: 12, color: t.muted, lineHeight: 1.7 }}>{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: 32 }}>
          <div style={{ fontSize: 10, color: t.muted, letterSpacing: 2, marginBottom: 8 }}>COMPOSITE LINK VALUE</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 80, fontWeight: 800, color: t.accent, lineHeight: 1, marginBottom: 4 }}>78</div>
          <div style={{ fontSize: 10, color: t.muted, letterSpacing: 2, marginBottom: 24 }}>/100</div>
          <div style={{ height: 4, background: t.border, borderRadius: 2, marginBottom: 20, overflow: "hidden" }}>
            <div style={{ height: "100%", width: "78%", background: t.accent, borderRadius: 2 }} />
          </div>
          {pillarScores.map(p => (
            <div key={p.label} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6, color: t.muted }}>
                <span>{p.label}</span><span style={{ color: t.text, fontWeight: 700 }}>{p.score}/100</span>
              </div>
              <div style={{ height: 3, background: t.border, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${p.score}%`, background: p.color, borderRadius: 2 }} />
              </div>
            </div>
          ))}
          <div style={{ display: "inline-block", marginTop: 20, padding: "6px 20px", background: "rgba(200,245,66,0.1)", color: "#c8f542", border: "1px solid rgba(200,245,66,0.3)", borderRadius: 6, fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18 }}>→ ACQUIRE</div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: "center", padding: "120px 24px", background: t.heroGrad }}>
        <div style={{ fontSize: 10, color: t.accent, letterSpacing: 3, marginBottom: 20 }}>READY TO START</div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(32px,5vw,60px)", letterSpacing: -1, marginBottom: 20, lineHeight: 1.1 }}>Stop guessing.<br />Start scoring.</h2>
        <p style={{ color: t.muted, fontSize: 13, marginBottom: 40 }}>Every link acquisition decision deserves data-backed confidence.</p>
        <a href="/dashboard" style={{ padding: "16px 48px", background: t.accent, color: "#000", borderRadius: 8, fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, textDecoration: "none" }}>→ Launch the Platform</a>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${t.border}`, padding: "32px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14 }}>Link Value <span style={{ color: t.accent }}>Platform</span></div>
        <div style={{ fontSize: 11, color: t.muted }}>AI-powered · PageRank data · DataForSEO backlinks</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, color: t.muted }}>{dark ? "Dark mode" : "Light mode"}</span>
          <div onClick={() => setDark(!dark)} style={{ width: 44, height: 24, background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 12, cursor: "pointer", position: "relative" }}>
            <div style={{ position: "absolute", top: 3, left: dark ? 3 : 23, width: 16, height: 16, background: t.accent, borderRadius: "50%", transition: "left 0.3s" }} />
          </div>
        </div>
      </footer>
    </div>
  );
}
