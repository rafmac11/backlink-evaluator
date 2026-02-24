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

  // Refresh if expired
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

export async function POST(req) {
  try {
    const { projectId, siteUrl, action } = await req.json();

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

      // Get last 90 days of data
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      // Fetch top queries
      const queryRes = await fetch(
        `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate,
            endDate,
            dimensions: ["query"],
            rowLimit: 100,
            orderBy: [{ fieldName: "impressions", sortOrder: "DESCENDING" }],
          }),
        }
      );
      const queryData = await queryRes.json();
      if (queryData.error) throw new Error(queryData.error.message);

      // Fetch page-level data
      const pageRes = await fetch(
        `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate,
            endDate,
            dimensions: ["page"],
            rowLimit: 20,
            orderBy: [{ fieldName: "clicks", sortOrder: "DESCENDING" }],
          }),
        }
      );
      const pageData = await pageRes.json();

      // Fetch last 30 days vs previous 30 for trend
      const mid = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const prev30Start = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const [recent, previous] = await Promise.all([
        fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ startDate: mid, endDate, dimensions: ["date"], rowLimit: 30 }),
        }).then(r => r.json()),
        fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ startDate: prev30Start, endDate: mid, dimensions: ["date"], rowLimit: 30 }),
        }).then(r => r.json()),
      ]);

      const recentTotals = (recent.rows || []).reduce((a, r) => ({ clicks: a.clicks + r.clicks, impressions: a.impressions + r.impressions }), { clicks: 0, impressions: 0 });
      const prevTotals = (previous.rows || []).reduce((a, r) => ({ clicks: a.clicks + r.clicks, impressions: a.impressions + r.impressions }), { clicks: 0, impressions: 0 });

      return Response.json({
        queries: (queryData.rows || []).map(r => ({
          query: r.keys[0],
          clicks: r.clicks,
          impressions: r.impressions,
          ctr: r.ctr,
          position: r.position,
        })),
        pages: (pageData.rows || []).map(r => ({
          page: r.keys[0],
          clicks: r.clicks,
          impressions: r.impressions,
          ctr: r.ctr,
          position: r.position,
        })),
        dailyTrend: (recent.rows || []).map(r => ({ date: r.keys[0], clicks: r.clicks, impressions: r.impressions })),
        summary: {
          recentClicks: recentTotals.clicks,
          recentImpressions: recentTotals.impressions,
          prevClicks: prevTotals.clicks,
          prevImpressions: prevTotals.impressions,
          clicksDelta: recentTotals.clicks - prevTotals.clicks,
          impressionsDelta: recentTotals.impressions - prevTotals.impressions,
        },
      });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
