export async function POST(req) {
  try {
    const { domain, competitor } = await req.json();
    if (!domain || !competitor) return Response.json({ error: "Both domain and competitor are required." }, { status: 400 });

    const login = process.env.DATAFORSEO_LOGIN;
    const password = process.env.DATAFORSEO_PASSWORD;
    if (!login || !password) return Response.json({ error: "DataForSEO credentials not configured." }, { status: 500 });

    const credentials = Buffer.from(`${login}:${password}`).toString("base64");
    const headers = { Authorization: `Basic ${credentials}`, "Content-Type": "application/json" };

    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const cleanCompetitor = competitor.replace(/^https?:\/\//, "").replace(/\/$/, "");

    const [myRes, compRes, oppRes, overlapRes] = await Promise.all([
      fetch("https://api.dataforseo.com/v3/backlinks/summary/live", {
        method: "POST", headers,
        body: JSON.stringify([{ target: cleanDomain, include_subdomains: true }]),
      }),
      fetch("https://api.dataforseo.com/v3/backlinks/summary/live", {
        method: "POST", headers,
        body: JSON.stringify([{ target: cleanCompetitor, include_subdomains: true }]),
      }),
      // Domains linking to competitor but NOT to you (opportunities)
      fetch("https://api.dataforseo.com/v3/backlinks/domain_intersection/live", {
        method: "POST", headers,
        body: JSON.stringify([{
          target1: cleanDomain,
          target2: cleanCompetitor,
          intersections: false,
          limit: 50,
          order_by: ["rank,desc"],
        }]),
      }),
      // Domains linking to BOTH (overlap)
      fetch("https://api.dataforseo.com/v3/backlinks/domain_intersection/live", {
        method: "POST", headers,
        body: JSON.stringify([{
          target1: cleanDomain,
          target2: cleanCompetitor,
          intersections: true,
          limit: 20,
          order_by: ["rank,desc"],
        }]),
      }),
    ]);

    const [myData, compData, oppData, overlapData] = await Promise.all([
      myRes.json(), compRes.json(), oppRes.json(), overlapRes.json(),
    ]);

    const mySummary = myData?.tasks?.[0]?.result?.[0] ?? {};
    const compSummary = compData?.tasks?.[0]?.result?.[0] ?? {};
    const oppItems = oppData?.tasks?.[0]?.result?.[0]?.items ?? [];
    const overlapItems = overlapData?.tasks?.[0]?.result?.[0]?.items ?? [];

    return Response.json({
      your: {
        domain: cleanDomain,
        backlinks: mySummary.backlinks ?? 0,
        referring_domains: mySummary.referring_domains ?? 0,
        rank: mySummary.rank ?? 0,
        dofollow: mySummary.referring_domains_nofollow
          ? mySummary.referring_domains - mySummary.referring_domains_nofollow
          : null,
      },
      competitor: {
        domain: cleanCompetitor,
        backlinks: compSummary.backlinks ?? 0,
        referring_domains: compSummary.referring_domains ?? 0,
        rank: compSummary.rank ?? 0,
        dofollow: compSummary.referring_domains_nofollow
          ? compSummary.referring_domains - compSummary.referring_domains_nofollow
          : null,
      },
      opportunities: oppItems.map(i => ({
        domain: i.domain ?? i.url_from_domain ?? "",
        rank: i.rank ?? 0,
        backlinks_to_competitor: i.intersections?.[1]?.backlinks ?? i.backlinks ?? 0,
      })),
      overlap: overlapItems.map(i => ({
        domain: i.domain ?? i.url_from_domain ?? "",
        rank: i.rank ?? 0,
      })),
    });
  } catch (err) {
    console.error("Competitor gap error:", err);
    return Response.json({ error: err.message || "Failed to fetch competitor data." }, { status: 500 });
  }
}
