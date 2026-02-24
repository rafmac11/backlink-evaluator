const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redisCmd(...args) {
  const res = await fetch(REDIS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  const data = await res.json();
  return data.result;
}

async function redisGet(key) {
  const raw = await redisCmd("GET", key);
  return raw ? JSON.parse(raw) : null;
}

async function getValidToken(projectId) {
  const stored = await redisGet(`gsc:${projectId}`);
  if (!stored) return null;
  if (Date.now() > stored.expiry - 60000) {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: stored.refresh_token,
        grant_type: "refresh_token",
      }),
    });
    const refreshed = await res.json();
    if (refreshed.error) return stored.access_token; // use old token if refresh fails
    stored.access_token = refreshed.access_token;
    stored.expiry = Date.now() + (refreshed.expires_in * 1000);
    await redisCmd("SET", `gsc:${projectId}`, JSON.stringify(stored));
  }
  return stored.access_token;
}

async function fetchGscData(projectId, siteUrl, days) {
  try {
    const token = await getValidToken(projectId);
    if (!token || !siteUrl) return null;

    const end = new Date();
    end.setDate(end.getDate() - 3);
    const start = new Date(end);
    start.setDate(start.getDate() - days);
    const endDate = end.toISOString().split("T")[0];
    const startDate = start.toISOString().split("T")[0];

    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - days);

    const query = (body) => fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) }
    ).then(r => r.json());

    const [queriesData, dailyData, prevData] = await Promise.all([
      query({ startDate, endDate, dimensions: ["query"], rowLimit: 25, orderBy: [{ fieldName: "clicks", sortOrder: "DESCENDING" }] }),
      query({ startDate, endDate, dimensions: ["date"], rowLimit: 500 }),
      query({ startDate: prevStart.toISOString().split("T")[0], endDate: prevEnd.toISOString().split("T")[0], dimensions: ["date"], rowLimit: 500 }),
    ]);

    const rows = dailyData.rows || [];
    const prevRows = prevData.rows || [];
    const totals = rows.reduce((a, r) => ({ clicks: a.clicks + r.clicks, impressions: a.impressions + r.impressions }), { clicks: 0, impressions: 0 });
    const prevTotals = prevRows.reduce((a, r) => ({ clicks: a.clicks + r.clicks, impressions: a.impressions + r.impressions }), { clicks: 0, impressions: 0 });
    const queries = queriesData.rows || [];
    const totalImp = queries.reduce((a, r) => a + r.impressions, 0);
    const avgPos = totalImp > 0 ? queries.reduce((a, r) => a + r.position * r.impressions, 0) / totalImp : 0;

    return {
      summary: {
        clicks: totals.clicks, impressions: totals.impressions,
        prevClicks: prevTotals.clicks, prevImpressions: prevTotals.impressions,
        clicksDelta: totals.clicks - prevTotals.clicks,
        impressionsDelta: totals.impressions - prevTotals.impressions,
        avgPosition: avgPos,
        avgCtr: totals.impressions > 0 ? totals.clicks / totals.impressions : 0,
      },
      queries: queries.map(r => ({ query: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })),
    };
  } catch (e) {
    console.error("GSC fetch error:", e.message);
    return null;
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, projectId, to, notes, dateRange } = body;
    const days = dateRange || 30;

    if (action === "getData") {
      const [project, runs] = await Promise.all([
        redisGet(`project:${projectId}`),
        redisGet(`runs:${projectId}`),
      ]);

      const allRuns = runs || [];
      let gscData = null;
      if (project?.gscSiteUrl) {
        gscData = await fetchGscData(projectId, project.gscSiteUrl, days);
      }

      return Response.json({ project, runs: allRuns.slice(0, 10), gscData });
    }

    if (action === "email") {
      const [project, runs] = await Promise.all([
        redisGet(`project:${projectId}`),
        redisGet(`runs:${projectId}`),
      ]);
      const allRuns = runs || [];
      const latestRun = allRuns[0];
      const prevRun = allRuns[1];

      let gscData = null;
      if (project?.gscSiteUrl) {
        gscData = await fetchGscData(projectId, project.gscSiteUrl, days);
      }

      const html = buildEmailHtml(project, latestRun, prevRun, gscData, notes, days);

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "WebLeadsNow Reports <reports@webleadsnow.com>",
          to: [to],
          subject: `SEO Report — ${project?.name || "Your Project"} — ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
          html,
        }),
      });

      const resendData = await resendRes.json();
      if (resendData.error) throw new Error(typeof resendData.error === "object" ? resendData.error.message : resendData.error);
      return Response.json({ ok: true, id: resendData.id });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

function rankColor(pos) {
  if (!pos) return "#888";
  if (pos <= 3) return "#00c853";
  if (pos <= 10) return "#c8b800";
  if (pos <= 30) return "#e67e00";
  return "#cc2200";
}

function buildEmailHtml(project, latestRun, prevRun, gscData, notes, days) {
  const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const bl = latestRun?.backlinks;
  const prevBl = prevRun?.backlinks;
  const gsc = gscData?.summary;

  const keywordRows = (project?.keywords || Object.keys(latestRun?.rankings || {})).map(kw => {
    const curr = latestRun?.rankings?.[kw];
    const prev = prevRun?.rankings?.[kw];
    const d = curr && prev ? prev - curr : null;
    const arrow = d == null ? "" : d > 0 ? `<span style="color:#00c853">▲${d}</span>` : d < 0 ? `<span style="color:#cc2200">▼${Math.abs(d)}</span>` : `<span style="color:#888">—</span>`;
    return `<tr>
      <td style="padding:10px 14px;border-bottom:1px solid #2a2a2a;font-family:monospace;font-size:12px;color:#e0e0e0">${kw}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #2a2a2a;text-align:center;font-weight:700;color:${rankColor(curr)}">${curr ? "#" + curr : "—"}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #2a2a2a;text-align:center;color:#666">${prev ? "#" + prev : "—"}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #2a2a2a;text-align:center;font-size:12px">${arrow}</td>
    </tr>`;
  }).join("");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#e0e0e0">
<div style="max-width:700px;margin:0 auto;padding:24px">

  <div style="background:#111;border:1px solid #333;border-radius:12px;padding:32px;margin-bottom:24px;text-align:center">
    <div style="font-size:10px;letter-spacing:4px;color:#b8ff00;margin-bottom:8px">WEBLEADSNOW.COM</div>
    <div style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-1px">SEO PERFORMANCE REPORT</div>
    <div style="font-size:13px;color:#888;margin-top:8px">${project?.name || ""} · ${date} · Last ${days} days</div>
    ${project?.domain ? `<div style="font-size:12px;color:#b8ff00;margin-top:4px;font-family:monospace">${project.domain}</div>` : ""}
  </div>

  ${notes ? `<div style="background:#111;border:1px solid #333;border-left:4px solid #b8ff00;border-radius:8px;padding:20px;margin-bottom:24px">
    <div style="font-size:10px;letter-spacing:3px;color:#b8ff00;margin-bottom:10px">NOTES FROM YOUR SEO TEAM</div>
    <div style="font-size:14px;color:#ccc;line-height:1.6">${notes.replace(/\n/g, "<br>")}</div>
  </div>` : ""}

  ${gsc ? `<div style="background:#111;border:1px solid #333;border-radius:12px;padding:24px;margin-bottom:24px">
    <div style="font-size:10px;letter-spacing:3px;color:#b8ff00;margin-bottom:16px">SEARCH CONSOLE — LAST ${days} DAYS</div>
    <table width="100%"><tr>
      ${[["CLICKS", gsc.clicks?.toLocaleString(), gsc.clicksDelta], ["IMPRESSIONS", gsc.impressions?.toLocaleString(), gsc.impressionsDelta], ["AVG POSITION", "#" + gsc.avgPosition?.toFixed(1), null], ["AVG CTR", (gsc.avgCtr * 100)?.toFixed(2) + "%", null]].map(([l, v, d]) =>
        `<td style="text-align:center;padding:0 8px"><div style="background:#0a0a0a;border-radius:8px;padding:14px"><div style="font-size:9px;letter-spacing:2px;color:#555;margin-bottom:6px">${l}</div><div style="font-size:22px;font-weight:900;color:#b8ff00">${v}</div>${d != null ? `<div style="font-size:11px;color:${d >= 0 ? "#00c853" : "#cc2200"};margin-top:4px">${d >= 0 ? "+" : ""}${d?.toLocaleString()}</div>` : ""}</div></td>`
      ).join("")}
    </tr></table>
  </div>` : ""}

  ${bl ? `<div style="background:#111;border:1px solid #333;border-radius:12px;padding:24px;margin-bottom:24px">
    <div style="font-size:10px;letter-spacing:3px;color:#b8ff00;margin-bottom:16px">BACKLINK METRICS</div>
    <table width="100%"><tr>
      ${[["REF DOMAINS", bl.referring_domains, prevBl?.referring_domains], ["TOTAL BACKLINKS", bl.backlinks, prevBl?.backlinks], ["DOFOLLOW", bl.dofollow_domains, prevBl?.dofollow_domains], ["DOMAIN RANK", bl.rank, prevBl?.rank]].map(([l, v, p]) => {
        const d = p != null ? v - p : null;
        return `<td style="text-align:center;padding:0 8px"><div style="background:#0a0a0a;border-radius:8px;padding:14px"><div style="font-size:9px;letter-spacing:2px;color:#555;margin-bottom:6px">${l}</div><div style="font-size:22px;font-weight:900;color:#b8ff00">${v?.toLocaleString() ?? "—"}</div>${d != null ? `<div style="font-size:11px;color:${d >= 0 ? "#00c853" : "#cc2200"};margin-top:4px">${d >= 0 ? "+" : ""}${d}</div>` : ""}</div></td>`;
      }).join("")}
    </tr></table>
  </div>` : ""}

  ${keywordRows ? `<div style="background:#111;border:1px solid #333;border-radius:12px;padding:24px;margin-bottom:24px">
    <div style="font-size:10px;letter-spacing:3px;color:#b8ff00;margin-bottom:16px">KEYWORD RANKINGS</div>
    <table width="100%" style="border-collapse:collapse">
      <tr><th style="text-align:left;padding:8px 14px;color:#555;font-size:9px;letter-spacing:2px;border-bottom:1px solid #2a2a2a;font-weight:400">KEYWORD</th><th style="padding:8px 14px;color:#555;font-size:9px;letter-spacing:2px;border-bottom:1px solid #2a2a2a;font-weight:400">RANK</th><th style="padding:8px 14px;color:#555;font-size:9px;letter-spacing:2px;border-bottom:1px solid #2a2a2a;font-weight:400">PREV</th><th style="padding:8px 14px;color:#555;font-size:9px;letter-spacing:2px;border-bottom:1px solid #2a2a2a;font-weight:400">CHANGE</th></tr>
      ${keywordRows}
    </table>
  </div>` : ""}

  <div style="text-align:center;padding:20px;color:#555;font-size:11px">
    <div style="color:#b8ff00;font-weight:700;margin-bottom:4px">WebLeadsNow</div>
    <div>webleadsnow.com · reports@webleadsnow.com</div>
    <div style="margin-top:8px">Generated ${date}</div>
  </div>
</div></body></html>`;
}
