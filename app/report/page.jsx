"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ReportContent() {
  const params = useSearchParams();
  const projectId = params.get("projectId");
  const notes = params.get("notes") || "";
  const days = parseInt(params.get("days") || "30");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectId) { setError("No project ID"); setLoading(false); return; }
    fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getData", projectId, dateRange: days }),
    }).then(r => r.json()).then(d => {
      if (d.error) throw new Error(d.error);
      setData(d);
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [projectId, days]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a0a0a", color: "#b8ff00", fontFamily: "monospace", fontSize: 14 }}>
      Generating report...
    </div>
  );
  if (error) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a0a0a", color: "#ff4444", fontFamily: "monospace" }}>
      Error: {error}
    </div>
  );

  const { project, runs, gscData } = data;
  const latestRun = runs?.[0];
  const prevRun = runs?.[1];
  const bl = latestRun?.backlinks;
  const prevBl = prevRun?.backlinks;
  const gsc = gscData?.summary;
  const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const rankColor = (pos) => {
    if (!pos) return "#666";
    if (pos <= 3) return "#00c853";
    if (pos <= 10) return "#b8ff00";
    if (pos <= 30) return "#e67e00";
    return "#cc2200";
  };

  const delta = (curr, prev, invert = false) => {
    if (curr == null || prev == null) return null;
    const d = invert ? prev - curr : curr - prev;
    return { val: Math.abs(curr - prev), positive: d > 0, zero: d === 0 };
  };

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", padding: "0", color: "#e0e0e0", fontFamily: "Arial, sans-serif" }}>

      {/* Print button - hidden when printing */}
      <div className="no-print" style={{ position: "fixed", top: 16, right: 16, display: "flex", gap: 8, zIndex: 100 }}>
        <button onClick={() => window.print()} style={{ background: "#b8ff00", color: "#000", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, cursor: "pointer", fontSize: 13, letterSpacing: 1 }}>
          ⬇ DOWNLOAD PDF
        </button>
        <button onClick={() => window.close()} style={{ background: "#1a1a1a", color: "#888", border: "1px solid #333", borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 13 }}>
          ✕
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 32px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48, paddingBottom: 32, borderBottom: "1px solid #222" }}>
          <div style={{ fontSize: 11, letterSpacing: 5, color: "#b8ff00", marginBottom: 12 }}>WEBLEADSNOW.COM</div>
          <div style={{ fontSize: 42, fontWeight: 900, color: "#fff", letterSpacing: -2, marginBottom: 8 }}>SEO PERFORMANCE REPORT</div>
          <div style={{ fontSize: 16, color: "#888" }}>{project?.name}</div>
          <div style={{ fontSize: 13, color: "#b8ff00", fontFamily: "monospace", marginTop: 4 }}>{project?.domain}</div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 8 }}>Generated {date} · {days}-day period</div>
        </div>

        {/* Notes */}
        {notes && (
          <div style={{ background: "#111", border: "1px solid #333", borderLeft: "4px solid #b8ff00", borderRadius: 8, padding: 24, marginBottom: 32 }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#b8ff00", marginBottom: 10 }}>NOTES FROM YOUR SEO TEAM</div>
            <div style={{ fontSize: 14, color: "#ccc", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{notes}</div>
          </div>
        )}

        {/* GSC Summary */}
        {gsc && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 10, letterSpacing: 4, color: "#b8ff00", marginBottom: 16 }}>SEARCH CONSOLE PERFORMANCE — LAST {days} DAYS</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "TOTAL CLICKS", val: gsc.clicks?.toLocaleString(), d: delta(gsc.clicks, gsc.prevClicks) },
                { label: "IMPRESSIONS", val: gsc.impressions?.toLocaleString(), d: delta(gsc.impressions, gsc.prevImpressions) },
                { label: "AVG POSITION", val: `#${gsc.avgPosition?.toFixed(1)}`, d: null },
                { label: "AVG CTR", val: `${(gsc.avgCtr * 100)?.toFixed(2)}%`, d: null },
              ].map(({ label, val, d }) => (
                <div key={label} style={{ background: "#111", border: "1px solid #222", borderRadius: 10, padding: "18px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 9, letterSpacing: 2, color: "#555", marginBottom: 8 }}>{label}</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: "#b8ff00" }}>{val}</div>
                  {d && !d.zero && (
                    <div style={{ fontSize: 11, color: d.positive ? "#00c853" : "#cc2200", marginTop: 6 }}>
                      {d.positive ? "▲" : "▼"} {d.val?.toLocaleString()} vs prev
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GSC Top Queries */}
        {gscData?.queries?.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 10, letterSpacing: 4, color: "#b8ff00", marginBottom: 16 }}>TOP SEARCH QUERIES</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #222" }}>
                  {["QUERY", "CLICKS", "IMPRESSIONS", "CTR", "AVG POSITION"].map(h => (
                    <th key={h} style={{ padding: "8px 14px", textAlign: h === "QUERY" ? "left" : "center", fontSize: 9, letterSpacing: 2, color: "#555", fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gscData.queries.slice(0, 20).map((q, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #1a1a1a" }}>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12, color: "#ccc" }}>{q.query}</td>
                    <td style={{ padding: "10px 14px", textAlign: "center", color: "#b8ff00", fontWeight: 700 }}>{q.clicks.toLocaleString()}</td>
                    <td style={{ padding: "10px 14px", textAlign: "center", color: "#666" }}>{q.impressions.toLocaleString()}</td>
                    <td style={{ padding: "10px 14px", textAlign: "center", color: "#666" }}>{(q.ctr * 100).toFixed(1)}%</td>
                    <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: rankColor(Math.round(q.position)) }}>#{q.position.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Backlinks */}
        {bl && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 10, letterSpacing: 4, color: "#b8ff00", marginBottom: 16 }}>BACKLINK METRICS</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "REF DOMAINS", val: bl.referring_domains, prev: prevBl?.referring_domains },
                { label: "TOTAL BACKLINKS", val: bl.backlinks, prev: prevBl?.backlinks },
                { label: "DOFOLLOW DOMAINS", val: bl.dofollow_domains, prev: prevBl?.dofollow_domains },
                { label: "DOMAIN RANK", val: bl.rank, prev: prevBl?.rank },
              ].map(({ label, val, prev: p }) => {
                const d = delta(val, p);
                return (
                  <div key={label} style={{ background: "#111", border: "1px solid #222", borderRadius: 10, padding: "18px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 9, letterSpacing: 2, color: "#555", marginBottom: 8 }}>{label}</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: "#b8ff00" }}>{val?.toLocaleString() ?? "—"}</div>
                    {d && !d.zero && (
                      <div style={{ fontSize: 11, color: d.positive ? "#00c853" : "#cc2200", marginTop: 6 }}>
                        {d.positive ? "▲" : "▼"} {d.val?.toLocaleString()} vs prev run
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Keyword Rankings */}
        {latestRun?.rankings && Object.keys(latestRun.rankings).length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 10, letterSpacing: 4, color: "#b8ff00", marginBottom: 16 }}>KEYWORD RANKINGS</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #222" }}>
                  {["KEYWORD", "CURRENT RANK", "PREVIOUS", "CHANGE"].map(h => (
                    <th key={h} style={{ padding: "8px 14px", textAlign: h === "KEYWORD" ? "left" : "center", fontSize: 9, letterSpacing: 2, color: "#555", fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(project?.keywords || Object.keys(latestRun.rankings)).map((kw, i) => {
                  const curr = latestRun.rankings[kw];
                  const prev = prevRun?.rankings?.[kw];
                  const d = curr && prev ? prev - curr : null; // positive = improved
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #1a1a1a" }}>
                      <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12, color: "#ccc" }}>{kw}</td>
                      <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: rankColor(curr) }}>{curr ? `#${curr}` : "—"}</td>
                      <td style={{ padding: "10px 14px", textAlign: "center", color: "#555" }}>{prev ? `#${prev}` : "—"}</td>
                      <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700 }}>
                        {d == null ? <span style={{ color: "#555" }}>—</span>
                          : d > 0 ? <span style={{ color: "#00c853" }}>▲{d}</span>
                          : d < 0 ? <span style={{ color: "#cc2200" }}>▼{Math.abs(d)}</span>
                          : <span style={{ color: "#555" }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Link Opportunities */}
        {latestRun?.opportunities?.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 10, letterSpacing: 4, color: "#b8ff00", marginBottom: 16 }}>LINK OPPORTUNITIES — COMPETITOR GAP</div>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 12 }}>Domains linking to your competitor but not to you</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #222" }}>
                  <th style={{ padding: "8px 14px", textAlign: "left", fontSize: 9, letterSpacing: 2, color: "#555", fontWeight: 400 }}>DOMAIN</th>
                  <th style={{ padding: "8px 14px", textAlign: "center", fontSize: 9, letterSpacing: 2, color: "#555", fontWeight: 400 }}>DOMAIN RANK</th>
                </tr>
              </thead>
              <tbody>
                {latestRun.opportunities.slice(0, 15).map((op, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #1a1a1a" }}>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12, color: "#b8ff00" }}>{op.domain}</td>
                    <td style={{ padding: "10px 14px", textAlign: "center", color: "#666" }}>{op.rank || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: "1px solid #222", paddingTop: 24, textAlign: "center", marginTop: 48 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#b8ff00", marginBottom: 4 }}>WebLeadsNow</div>
          <div style={{ fontSize: 11, color: "#555" }}>webleadsnow.com · reports@webleadsnow.com</div>
          <div style={{ fontSize: 11, color: "#333", marginTop: 8 }}>This report was automatically generated on {date}</div>
        </div>

      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #0a0a0a !important; }
          @page { margin: 0.5in; size: A4; }
        }
      `}</style>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div style={{ background: "#0a0a0a", color: "#b8ff00", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace" }}>Loading...</div>}>
      <ReportContent />
    </Suspense>
  );
}
