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

    const [summaryRes, backlinksRes, anchorsRes, refDomainsRes] = await Promise.all([
      fetch("https://api.dataforseo.com/v3/backlinks/summary/live", {
        method: "POST", headers,
        body: JSON.stringify([{ target: domain, include_subdomains: true }]),
      }),
      fetch("https://api.dataforseo.com/v3/backlinks/backlinks/live", {
        method: "POST", headers,
        body: JSON.stringify([{ target: domain, include_subdomains: true, limit: 100, order_by: ["rank,desc"] }]),
      }),
      fetch("https://api.dataforseo.com/v3/backlinks/anchors/live", {
        method: "POST", headers,
        body: JSON.stringify([{ target: domain, include_subdomains: true, limit: 10, order_by: ["backlinks,desc"] }]),
      }),
      fetch("https://api.dataforseo.com/v3/backlinks/referring_domains/live", {
        method: "POST", headers,
        body: JSON.stringify([{ target: domain, include_subdomains: true, limit: 100, order_by: ["rank,desc"] }]),
      }),
    ]);

    const [summaryData, backlinksData, anchorsData, refDomainsData] = await Promise.all([
      summaryRes.json(), backlinksRes.json(), anchorsRes.json(), refDomainsRes.json(),
    ]);

    const summaryResult = summaryData?.tasks?.[0]?.result?.[0] ?? {};
    const items = backlinksData?.tasks?.[0]?.result?.[0]?.items ?? [];
    const anchorItems = anchorsData?.tasks?.[0]?.result?.[0]?.items ?? [];
    const refDomainItems = refDomainsData?.tasks?.[0]?.result?.[0]?.items ?? [];
    const totalCount = backlinksData?.tasks?.[0]?.result?.[0]?.total_count ?? 0;

    const uniqueDomains = new Set(items.map(i => i.domain_from)).size;
    const uniqueIPs = new Set(items.map(i => i.ip_from).filter(Boolean)).size;
    const ranks = items.map(i => i.domain_from_rank ?? 0).filter(r => r > 0);
    const avgRank = ranks.length > 0 ? Math.round(ranks.reduce((a, b) => a + b, 0) / ranks.length) : 0;

    const totalBacklinks = summaryResult.backlinks || totalCount || items.length;
    const refDomains = summaryResult.referring_domains || uniqueDomains;
    const refIPs = summaryResult.referring_ips || uniqueIPs;
    const rank = summaryResult.rank || 0;
    const trustFlow = Math.min(100, rank || Math.round(avgRank / 10));
    const citationFlow = Math.min(100, Math.round(Math.log10(totalBacklinks + 1) * 20));

    // Derive topical categories from anchor texts and domain names
    const topicMap = {
      "Business / Finance": ["business", "finance", "money", "invest", "bank", "loan", "credit", "insurance", "accounting"],
      "Technology": ["tech", "software", "digital", "app", "web", "code", "data", "cloud", "ai", "computer", "internet"],
      "Marketing / SEO": ["seo", "marketing", "backlink", "rank", "traffic", "keyword", "content", "social", "brand"],
      "Home / Family": ["home", "house", "family", "garden", "kitchen", "living", "interior", "furniture", "real estate"],
      "Health": ["health", "medical", "doctor", "wellness", "fitness", "diet", "care", "pharma", "clinic"],
      "Shopping / Commerce": ["shop", "store", "buy", "deal", "price", "product", "sale", "retail", "ecommerce"],
      "News / Media": ["news", "media", "blog", "press", "journal", "magazine", "article", "post"],
      "Education": ["edu", "learn", "school", "university", "course", "study", "training", "guide"],
    };

    const allText = [
      ...items.map(i => `${i.domain_from} ${i.anchor}`),
      ...anchorItems.map(i => i.anchor),
    ].join(" ").toLowerCase();

    const topicScores = Object.entries(topicMap).map(([topic, keywords]) => {
      const score = keywords.reduce((acc, kw) => {
        const matches = (allText.match(new RegExp(kw, "g")) || []).length;
        return acc + matches;
      }, 0);
      return { topic, score };
    }).filter(t => t.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);

    const topicTotal = topicScores.reduce((a, b) => a + b.score, 0) || 1;
    const topics = topicScores.map(t => ({
      topic: t.topic,
      score: Math.round((t.score / topicTotal) * trustFlow),
      pct: Math.round((t.score / topicTotal) * 100),
    }));

    // Scatter plot data: trust_flow vs citation_flow per referring domain
    const scatterData = refDomainItems.slice(0, 50).map(d => ({
      domain: d.domain,
      tf: Math.min(100, d.rank ?? 0),
      cf: Math.min(100, Math.round(Math.log10((d.backlinks ?? 1) + 1) * 20)),
      backlinks: d.backlinks ?? 0,
    }));

    const summary = {
      target: domain,
      rank,
      backlinks: totalBacklinks,
      referring_domains: refDomains,
      referring_ips: refIPs,
      trust_flow: trustFlow,
      citation_flow: citationFlow,
      dofollow_pct: items.length > 0 ? Math.round(items.filter(i => i.dofollow).length / items.length * 100) : 0,
      top_anchors: anchorItems.slice(0, 8).map(a => ({ anchor: a.anchor || "(none)", count: a.backlinks ?? 0 })),
      topics,
      scatter: scatterData,
    };

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
