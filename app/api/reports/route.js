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

export async function POST(req) {
  try {
    const { action, projectId, to, notes, dateRange } = await req.json();

    if (action === "getData") {
      const [project, runsRaw] = await Promise.all([
        redisGet(`project:${projectId}`),
        redisCmd("GET", `runs:${projectId}`),
      ]);
      const runs = runsRaw ? JSON.parse(runsRaw) : [];

      // Get GSC data if connected
      let gscData = null;
      const gscTokens = await redisGet(`gsc:${projectId}`);
      if (gscTokens && project?.gscSiteUrl) {
        try {
          const gscRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "https://backlink-evaluator-production.up.railway.app"}/api/gsc`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "fetch", projectId, siteUrl: project.gscSiteUrl, days: dateRange || 30 }),
          });
          gscData = await gscRes.json();
          if (gscData.error) gscData = null;
        } catch (e) { gscData = null; }
      }

      return Response.json({ project, runs: runs.slice(0, 10), gscData });
    }

    if (action === "email") {
      const { project, runs, gscData, notes: emailNotes } = await req.json().catch(() => ({})) || {};

      // Re-fetch data
      const [proj, runsRaw] = await Promise.all([
        redisGet(`project:${projectId}`),
        redisCmd("GET", `runs:${projectId}`),
      ]);
      const allRuns = runsRaw ? JSON.parse(runsRaw) : [];
      const latestRun = allRuns[0];
      const prevRun = allRuns[1];

      const html = buildEmailHtml(proj, allRuns.slice(0, 6), latestRun, prevRun, notes);

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "WebLeadsNow Reports <reports@webleadsnow.com>",
          to: [to],
          subject: `SEO Report — ${proj?.name || "Your Project"} — ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
          html,
        }),
      });

      const resendData = await resendRes.json();
      if (resendData.error) throw new Error(resendData.error.message || JSON.stringify(resendData.error));

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

function deltaArrow(curr, prev) {
  if (!curr || !prev) return "";
  const d = prev - curr; // negative = rank got worse (higher number)
  if (d > 0) return `<span style="color:#00c853">▲${d}</span>`;
  if (d < 0) return `<span style="color:#cc2200">▼${Math.abs(d)}</span>`;
  return `<span style="color:#888">—</span>`;
}

function buildEmailHtml(project, runs, latestRun, prevRun, notes) {
  const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const bl = latestRun?.backlinks;
  const prevBl = prevRun?.backlinks;

  const keywordRows = (project?.keywords || []).map(kw => {
    const curr = latestRun?.rankings?.[kw];
    const prev = prevRun?.rankings?.[kw];
    return `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #2a2a2a;font-family:monospace;font-size:13px;color:#e0e0e0">${kw}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #2a2a2a;text-align:center;font-weight:700;color:${rankColor(curr)}">${curr ? "#" + curr : "—"}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #2a2a2a;text-align:center;font-size:12px">${deltaArrow(curr, prev)}</td>
      </tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#e0e0e0">
  <div style="max-width:700px;margin:0 auto;padding:24px">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a1a1a,#111);border:1px solid #333;border-radius:12px;padding:32px;margin-bottom:24px;text-align:center">
      <div style="font-size:11px;letter-spacing:4px;color:#b8ff00;margin-bottom:8px">WEBLEADSNOW.COM</div>
      <div style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-1px">SEO PERFORMANCE REPORT</div>
      <div style="font-size:13px;color:#888;margin-top:8px">${project?.name || ""} · ${date}</div>
      ${project?.domain ? `<div style="font-size:12px;color:#b8ff00;margin-top:4px;font-family:monospace">${project.domain}</div>` : ""}
    </div>

    ${notes ? `
    <!-- Notes -->
    <div style="background:#1a1a1a;border:1px solid #333;border-left:3px solid #b8ff00;border-radius:8px;padding:20px;margin-bottom:24px">
      <div style="font-size:10px;letter-spacing:3px;color:#b8ff00;margin-bottom:10px">NOTES FROM YOUR SEO TEAM</div>
      <div style="font-size:14px;color:#ccc;line-height:1.6">${notes.replace(/\n/g, "<br>")}</div>
    </div>` : ""}

    ${bl ? `
    <!-- Backlinks -->
    <div style="background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:24px;margin-bottom:24px">
      <div style="font-size:10px;letter-spacing:3px;color:#b8ff00;margin-bottom:16px">BACKLINK METRICS</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
        ${[
          ["REF DOMAINS", bl.referring_domains, prevBl?.referring_domains],
          ["TOTAL BACKLINKS", bl.backlinks, prevBl?.backlinks],
          ["DOFOLLOW DOMAINS", bl.dofollow_domains, prevBl?.dofollow_domains],
          ["DOMAIN RANK", bl.rank, prevBl?.rank],
        ].map(([label, val, prev]) => {
          const delta = prev != null ? val - prev : null;
          return `<div style="background:#111;border-radius:8px;padding:14px;border:1px solid #222;text-align:center">
            <div style="font-size:9px;letter-spacing:2px;color:#666;margin-bottom:6px">${label}</div>
            <div style="font-size:22px;font-weight:900;color:#b8ff00">${val?.toLocaleString() ?? "—"}</div>
            ${delta != null ? `<div style="font-size:11px;color:${delta >= 0 ? "#00c853" : "#cc2200"};margin-top:4px">${delta >= 0 ? "+" : ""}${delta}</div>` : ""}
          </div>`;
        }).join("")}
      </div>
    </div>` : ""}

    ${latestRun?.rankings && Object.keys(latestRun.rankings).length > 0 ? `
    <!-- Rankings -->
    <div style="background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:24px;margin-bottom:24px">
      <div style="font-size:10px;letter-spacing:3px;color:#b8ff00;margin-bottom:16px">KEYWORD RANKINGS</div>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px 14px;color:#666;font-size:10px;letter-spacing:2px;border-bottom:1px solid #2a2a2a">KEYWORD</th>
            <th style="text-align:center;padding:8px 14px;color:#666;font-size:10px;letter-spacing:2px;border-bottom:1px solid #2a2a2a">RANK</th>
            <th style="text-align:center;padding:8px 14px;color:#666;font-size:10px;letter-spacing:2px;border-bottom:1px solid #2a2a2a">CHANGE</th>
          </tr>
        </thead>
        <tbody>${keywordRows}</tbody>
      </table>
    </div>` : ""}

    <!-- Footer -->
    <div style="text-align:center;padding:20px;color:#555;font-size:11px">
      <div style="color:#b8ff00;font-weight:700;margin-bottom:4px">WebLeadsNow</div>
      <div>webleadsnow.com · reports@webleadsnow.com</div>
      <div style="margin-top:8px">Generated ${date}</div>
    </div>

  </div>
</body>
</html>`;
}
