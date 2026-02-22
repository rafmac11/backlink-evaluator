export async function POST(req) {
  try {
    const { targetUrl } = await req.json();
    if (!targetUrl) return Response.json({ error: "Target URL is required." }, { status: 400 });

    const login = process.env.DATAFORSEO_LOGIN;
    const password = process.env.DATAFORSEO_PASSWORD;
    if (!login || !password) return Response.json({ error: "DataForSEO credentials not configured." }, { status: 500 });

    const credentials = Buffer.from(`${login}:${password}`).toString("base64");
    const domain = targetUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    const headers = { Authorization: `Basic ${credentials}`, "Content-Type": "application/json" };

    const [summaryRes, backlinksRes] = await Promise.all([
      fetch("https://api.dataforseo.com/v3/backlinks/summary/live", {
        method: "POST", headers,
        body: JSON.stringify([{ target: domain, include_subdomains: true }]),
      }),
      fetch("https://api.dataforseo.com/v3/backlinks/backlinks/live", {
        method: "POST", headers,
        body: JSON.stringify([{ target: domain, include_subdomains: true, limit: 100, order_by: ["rank,desc"] }]),
      }),
    ]);

    const [summaryData, backlinksData] = await Promise.all([
      summaryRes.json(),
      backlinksRes.json(),
    ]);

    // Return raw data so we can debug
    const summaryTask = summaryData?.tasks?.[0];
    const summaryResult = summaryTask?.result?.[0] ?? {};

    const summary = {
      target: domain,
      rank: summaryResult.rank ?? 0,
      backlinks: summaryResult.backlinks ?? 0,
      referring_domains: summaryResult.referring_domains ?? 0,
      referring_ips: summaryResult.referring_ips ?? 0,
      trust_flow: Math.min(100, summaryResult.rank ?? 0),
      citation_flow: Math.min(100, Math.round(Math.log10((summaryResult.backlinks ?? 0) + 1) * 20)),
      // expose raw for debugging
      _debug: {
        status: summaryTask?.status_message,
        raw: summaryResult,
        backlinks_status: backlinksData?.tasks?.[0]?.status_message,
        backlinks_count: backlinksData?.tasks?.[0]?.result?.[0]?.items?.length ?? 0,
      }
    };

    const items = backlinksData?.tasks?.[0]?.result?.[0]?.items ?? [];
    const backlinks = items.map((item) => ({
      url_from: item.url_from,
      domain_from: item.domain_from,
      url_to: item.url_to,
      anchor: item.anchor,
      domain_from_rank: item.domain_from_rank ?? 0,
      trust_flow: Math.min(100, item.domain_from_rank ?? 0),
      dofollow: item.dofollow,
      first_seen: item.first_seen,
      last_seen: item.last_seen,
    }));

    return Response.json({ summary, backlinks });
  } catch (err) {
    console.error("Backlinks error:", err);
    return Response.json({ error: err.message || "Failed to fetch backlinks." }, { status: 500 });
  }
}
