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
    const domain = targetUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "");

    const headers = {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    };

    const [summaryRes, backlinksRes] = await Promise.all([
      fetch("https://api.dataforseo.com/v3/backlinks/domain_pages_summary/live", {
        method: "POST",
        headers,
        body: JSON.stringify([{ target: domain, include_subdomains: true, limit: 1 }]),
      }),
      fetch("https://api.dataforseo.com/v3/backlinks/backlinks/live", {
        method: "POST",
        headers,
        body: JSON.stringify([{
          target: domain,
          include_subdomains: true,
          limit: 100,
          order_by: ["domain_from_rank,desc"],
        }]),
      }),
    ]);

    const [summaryData, backlinksData] = await Promise.all([
      summaryRes.json(),
      backlinksRes.json(),
    ]);

    console.log("SUMMARY TASK:", JSON.stringify(summaryData?.tasks?.[0]?.result?.[0], null, 2));

    const summaryResult = summaryData?.tasks?.[0]?.result?.[0] || {};
    const totalBacklinks = summaryResult.total_count || summaryResult.backlinks || 0;
    const rank = summaryResult.rank || 0;

    const summary = {
      target: domain,
      rank,
      backlinks: totalBacklinks,
      referring_domains: summaryResult.referring_domains || 0,
      referring_ips: summaryResult.referring_ips || 0,
      trust_flow: Math.min(100, rank),
      citation_flow: Math.min(100, Math.round(Math.log10(totalBacklinks + 1) * 20)),
    };

    const backlinksItems = backlinksData?.tasks?.[0]?.result?.[0]?.items || [];
    const backlinks = backlinksItems.map((item) => ({
      url_from: item.url_from,
      domain_from: item.domain_from,
      url_to: item.url_to,
      anchor: item.anchor,
      domain_from_rank: item.domain_from_rank || 0,
      trust_flow: Math.min(100, item.domain_from_rank || 0),
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
