export async function POST(req) {
  try {
    const { targetUrl } = await req.json();
    if (!targetUrl) return Response.json({ error: "Target URL is required." }, { status: 400 });

    const login = process.env.DATAFORSEO_LOGIN;
    const password = process.env.DATAFORSEO_PASSWORD;
    const oprKey = process.env.OPENPAGERANK_API_KEY;
    if (!login || !password) return Response.json({ error: "DataForSEO credentials not configured." }, { status: 500 });

    const credentials = Buffer.from(`${login}:${password}`).toString("base64");
    const domain = targetUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    const dfsHeaders = { Authorization: `Basic ${credentials}`, "Content-Type": "application/json" };

    // Fetch backlinks + anchors + referring domains from DataForSEO
    const [backlinksRes, anchorsRes, refDomainsRes] = await Promise.all([
      fetch("https://api.dataforseo.com/v3/backlinks/backlinks/live", {
        method: "POST", headers: dfsHeaders,
        body: JSON.stringify([{ target: domain, include_subdomains: true, limit: 100, order_by: ["rank,desc"] }]),
      }),
      fetch("https://api.dataforseo.com/v3/backlinks/anchors/live", {
        method: "POST", headers: dfsHeaders,
        body: JSON.stringify([{ target: domain, include_subdomains: true, limit: 10, order_by: ["backlinks,desc"] }]),
      }),
      fetch("https://api.dataforseo.com/v3/backlinks/referring_domains/live", {
        method: "POST", headers: dfsHeaders,
        body: JSON.stringify([{ target: domain, include_subdomains: true, limit: 100, order_by: ["rank,desc"] }]),
      }),
    ]);

    const [backlinksData, anchorsData, refDomainsData] = await Promise.all([
      backlinksRes.json(), anchorsRes.json(), refDomainsRes.json(),
    ]);

    const items = backlinksData?.tasks?.[0]?.result?.[0]?.items ?? [];
    const anchorItems = anchorsData?.tasks?.[0]?.result?.[0]?.items ?? [];
    const refDomainItems = refDomainsData?.tasks?.[0]?.result?.[0]?.items ?? [];
    const totalCount = backlinksData?.tasks?.[0]?.result?.[0]?.total_count ?? 0;

    // Collect unique domains to query OpenPageRank (max 100 per request)
    const uniqueDomains = [...new Set([domain, ...items.map(i => i.domain_from)])].slice(0, 100);

    // Fetch OpenPageRank for target + all linking domains
    let oprMap = {};
    if (oprKey && uniqueDomains.length > 0) {
      try {
        const params = uniqueDomains.map(d => `domains[]=${encodeURIComponent(d)}`).join("&");
        const oprRes = await fetch(`https://openpagerank.com/api/v1.0/getPageRank?${params}`, {
          headers: { "API-OPR": oprKey },
        });
        const oprData = await oprRes.json();
        if (oprData?.response) {
          oprData.response.forEach(entry => {
            oprMap[entry.domain] = {
              page_rank_integer: entry.page_rank_integer ?? 0,
              page_rank_decimal: entry.page_rank_decimal ?? 0,
              rank: entry.rank ?? 0,
            };
          });
        }
      } catch (e) {
        console.error("OpenPageRank error:", e);
      }
    }

    const targetOpr = oprMap[domain] || { page_rank_integer: 0, page_rank_decimal: 0, rank: 0 };
    const uniqueIPs = new Set(items.map(i => i.ip_from).filter(Boolean)).size;
    const totalBacklinks = totalCount || items.length;
    const refDomains = new Set(items.map(i => i.domain_from)).size;

    // PR 0-10 → scale to 0-100 for display
    const prScore = Math.round((targetOpr.page_rank_decimal / 10) * 100);
    const citationFlow = Math.min(100, Math.round(Math.log10(totalBacklinks + 1) * 20));

    // Topical categories from anchor texts
    const topicMap = {
      "Business / Finance": ["business", "finance", "money", "invest", "bank", "loan", "credit", "insurance"],
      "Technology": ["tech", "software", "digital", "app", "web", "code", "data", "cloud", "ai", "computer"],
      "Marketing / SEO": ["seo", "marketing", "backlink", "rank", "traffic", "keyword", "content", "social"],
      "Home / Family": ["home", "house", "family", "garden", "kitchen", "living", "interior", "furniture"],
      "Health": ["health", "medical", "doctor", "wellness", "fitness", "diet", "care"],
      "Shopping / Commerce": ["shop", "store", "buy", "deal", "price", "product", "sale", "retail"],
      "News / Media": ["news", "media", "blog", "press", "journal", "magazine", "article"],
      "Education": ["edu", "learn", "school", "university", "course", "study", "training"],
    };

    const allText = [...items.map(i => `${i.domain_from} ${i.anchor}`), ...anchorItems.map(i => i.anchor)].join(" ").toLowerCase();
    const topicScores = Object.entries(topicMap).map(([topic, keywords]) => ({
      topic,
      score: keywords.reduce((acc, kw) => acc + (allText.match(new RegExp(kw, "g")) || []).length, 0),
    })).filter(t => t.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);

    const topicTotal = topicScores.reduce((a, b) => a + b.score, 0) || 1;
    const topics = topicScores.map(t => ({
      topic: t.topic,
      score: Math.round((t.score / topicTotal) * prScore),
      pct: Math.round((t.score / topicTotal) * 100),
    }));

    // Scatter: PR (x) vs citation flow (y) per referring domain
    const scatterData = refDomainItems.slice(0, 50).map(d => {
      const opr = oprMap[d.domain] || {};
      return {
        domain: d.domain,
        tf: Math.round((opr.page_rank_decimal ?? 0) / 10 * 100),
        cf: Math.min(100, Math.round(Math.log10((d.backlinks ?? 1) + 1) * 20)),
        backlinks: d.backlinks ?? 0,
      };
    });

    const summary = {
      target: domain,
      page_rank: targetOpr.page_rank_integer,
      page_rank_decimal: targetOpr.page_rank_decimal?.toFixed(2),
      global_rank: targetOpr.rank,
      pr_score: prScore,
      citation_flow: citationFlow,
      backlinks: totalBacklinks,
      referring_domains: refDomains,
      referring_ips: uniqueIPs,
      dofollow_pct: items.length > 0 ? Math.round(items.filter(i => i.dofollow).length / items.length * 100) : 0,
      top_anchors: anchorItems.slice(0, 8).map(a => ({ anchor: a.anchor || "(none)", count: a.backlinks ?? 0 })),
      topics,
      scatter: scatterData,
      opr_enabled: !!oprKey,
    };

    const backlinks = items.map((item) => {
      const opr = oprMap[item.domain_from] || {};
      return {
        url_from: item.url_from,
        domain_from: item.domain_from,
        url_to: item.url_to,
        anchor: item.anchor,
        domain_from_rank: item.domain_from_rank ?? 0,
        page_rank: opr.page_rank_integer ?? null,
        page_rank_decimal: opr.page_rank_decimal ?? null,
        dofollow: item.dofollow,
        first_seen: item.first_seen,
        last_seen: item.last_seen,
      };
    });

    return Response.json({ summary, backlinks });
  } catch (err) {
    console.error("Backlinks error:", err);
    return Response.json({ error: err.message || "Failed to fetch backlinks." }, { status: 500 });
  }
}
