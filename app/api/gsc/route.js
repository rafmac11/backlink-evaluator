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

async function redisSet(key, value) {
  return redisCmd("SET", key, JSON.stringify(value));
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
    if (refreshed.error) throw new Error("Token refresh failed: " + refreshed.error);
    stored.access_token = refreshed.access_token;
    stored.expiry = Date.now() + (refreshed.expires_in * 1000);
    await redisSet(`gsc:${projectId}`, stored);
  }

  return stored.access_token;
}

function getDates(days) {
  const end = new Date();
  end.setDate(end.getDate() - 3); // GSC has ~3 day lag
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  return {
    endDate: end.toISOString().split("T")[0],
    startDate: start.toISOString().split("T")[0],
  };
}

async function gscQuery(token, siteUrl, body) {
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  return res.json();
}

export async function POST(req) {
  try {
    const { projectId, siteUrl, action, days = 30 } = await req.json();

    if (action === "status") {
      const stored = await redisGet(`gsc:${projectId}`);
      return Response.json({ connected: !!stored, connectedAt: stored?.connected_at });
    }

    if (action === "disconnect") {
      await redisCmd("DEL", `gsc:${projectId}`);
      return Response.json({ ok: true });
    }

    if (action === "sites") {
      const token = await getValidToken(projectId);
      if (!token) return Response.json({ error: "Not connected" }, { status: 401 });
      const res = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      return Response.json({ sites: data.siteEntry || [] });
    }

    if (action === "fetch") {
      const token = await getValidToken(projectId);
      if (!token) return Response.json({ error: "Not connected" }, { status: 401 });

      const { startDate, endDate } = getDates(days);

      // Previous period for comparison
      const prevEnd = new Date(startDate);
      prevEnd.setDate(prevEnd.getDate() - 1);
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - days);
      const prevStartStr = prevStart.toISOString().split("T")[0];
      const prevEndStr = prevEnd.toISOString().split("T")[0];

      const [queriesData, pagesData, dailyData, prevData] = await Promise.all([
        // Top queries
        gscQuery(token, siteUrl, {
          startDate, endDate,
          dimensions: ["query"],
          rowLimit: 100,
          orderBy: [{ fieldName: "impressions", sortOrder: "DESCENDING" }],
        }),
        // Top pages
        gscQuery(token, siteUrl, {
          startDate, endDate,
          dimensions: ["page"],
          rowLimit: 25,
          orderBy: [{ fieldName: "clicks", sortOrder: "DESCENDING" }],
        }),
        // Daily trend
        gscQuery(token, siteUrl, {
          startDate, endDate,
          dimensions: ["date"],
          rowLimit: 500,
        }),
        // Previous period totals
        gscQuery(token, siteUrl, {
          startDate: prevStartStr,
          endDate: prevEndStr,
          dimensions: ["date"],
          rowLimit: 500,
        }),
      ]);

      if (queriesData.error) throw new Error(queriesData.error.message);

      // Calculate totals from daily data
      const currentRows = dailyData.rows || [];
      const prevRows = prevData.rows || [];

      const totals = currentRows.reduce((a, r) => ({
        clicks: a.clicks + r.clicks,
        impressions: a.impressions + r.impressions,
      }), { clicks: 0, impressions: 0 });

      const prevTotals = prevRows.reduce((a, r) => ({
        clicks: a.clicks + r.clicks,
        impressions: a.impressions + r.impressions,
      }), { clicks: 0, impressions: 0 });

      // Average position weighted by impressions
      const queries = queriesData.rows || [];
      const totalImpressions = queries.reduce((a, r) => a + r.impressions, 0);
      const weightedPos = queries.reduce((a, r) => a + r.position * r.impressions, 0);
      const avgPosition = totalImpressions > 0 ? weightedPos / totalImpressions : 0;

      // CTR
      const avgCtr = totals.impressions > 0 ? totals.clicks / totals.impressions : 0;

      return Response.json({
        dateRange: { startDate, endDate, days },
        summary: {
          clicks: totals.clicks,
          impressions: totals.impressions,
          avgPosition: avgPosition,
          avgCtr: avgCtr,
          prevClicks: prevTotals.clicks,
          prevImpressions: prevTotals.impressions,
          clicksDelta: totals.clicks - prevTotals.clicks,
          impressionsDelta: totals.impressions - prevTotals.impressions,
        },
        queries: queries.map(r => ({
          query: r.keys[0],
          clicks: r.clicks,
          impressions: r.impressions,
          ctr: r.ctr,
          position: r.position,
        })),
        pages: (pagesData.rows || []).map(r => ({
          page: r.keys[0],
          clicks: r.clicks,
          impressions: r.impressions,
          ctr: r.ctr,
          position: r.position,
        })),
        dailyTrend: currentRows.map(r => ({
          date: r.keys[0],
          clicks: r.clicks,
          impressions: r.impressions,
        })),
      });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
