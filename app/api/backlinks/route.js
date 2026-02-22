export async function POST(req) {
  try {
    const { targetUrl } = await req.json();

    if (!targetUrl) {
      return Response.json({ error: "Target URL is required." }, { status: 400 });
    }

    const login = process.env.DATAFORSEO_LOGIN;
    const password = process.env.DATAFORSEO_PASSWORD;

    if (!login || !password) {
      return Response.json({ error: "DataForSEO credentials not configured." }, { status: 500 });
    }

    const credentials = Buffer.from(`${login}:${password}`).toString("base64");

    // Extract domain from URL
    const domain = targetUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "");

    // Fetch backlinks summary + backlinks list in parallel
    const [summaryRes, backlinksRes] = await Promise.all([
      fetch("https://api.dataforseo.com/v3/backlinks/summary/live", {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([{ target: domain, include_subdomains: true }]),
      }),
      fetch("https://api.dataforseo.com/v3/backlinks/backlinks/live", {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          {
            target: domain,
            include_subdomains: true,
            limit: 100,
            order_by: ["rank,desc"],
            filters: ["dofollow", "=", true],
          },
        ]),
      }),
    ]);

    const [summaryData, backlinksData] = await Promise.all([
      summaryRes.json(),
      backlinksRes.json(),
    ]);

    // Parse summary
    const summaryResult = summaryData?.tasks?.[0]?.result?.[0] || {};
    const summary = {
      target: domain,
      rank: summaryResult.rank || 0,
      backlinks: summaryResult.backlinks || 0,
      referring_domains: summaryResult.referring_domains || 0,
      referring_ips: summaryResult.referring_ips || 0,
      broken_backlinks: summaryResult.broken_backlinks || 0,
      referring_domains_nofollow: summaryResult.referring_domains_nofollow || 0,
      // Trust Flow / Citation Flow equivalents
      trust_flow: summaryResult.rank || 0,
      citation_flow: Math.min(100, Math.round(Math.log10((summaryResult.backlinks || 1) + 1) * 30)),
    };

    // Parse backlinks list
    const backlinksItems = backlinksData?.tasks?.[0]?.result?.[0]?.items || [];
    const backlinks = backlinksItems.map((item) => ({
      url_from: item.url_from,
      domain_from: item.domain_from,
      url_to: item.url_to,
      anchor: item.anchor,
      domain_from_rank: item.domain_from_rank || 0,
      trust_flow: item.domain_from_rank || 0,
      citation_flow: Math.min(100, Math.round(Math.log10((item.backlinks_spam_score || 1) + 1) * 20 + (item.domain_from_rank || 0) * 0.5)),
      dofollow: item.dofollow,
      first_seen: item.first_seen,
      last_seen: item.last_seen,
      broken: item.broken,
    }));

    return Response.json({ summary, backlinks });
  } catch (err) {
    console.error("Backlinks error:", err);
    return Response.json({ error: err.message || "Failed to fetch backlinks." }, { status: 500 });
  }
}
