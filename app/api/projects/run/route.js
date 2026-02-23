export async function POST(req) {
  try {
    const { domain, competitor } = await req.json();

    const login = process.env.DATAFORSEO_LOGIN;
    const password = process.env.DATAFORSEO_PASSWORD;
    const credentials = Buffer.from(`${login}:${password}`).toString("base64");
    const headers = { Authorization: `Basic ${credentials}`, "Content-Type": "application/json" };

    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");

    // Fetch backlink summary for main domain
    const blRes = await fetch("https://api.dataforseo.com/v3/backlinks/summary/live", {
      method: "POST", headers,
      body: JSON.stringify([{ target: cleanDomain, include_subdomains: true }]),
    });
    const blData = await blRes.json();
    const bl = blData?.tasks?.[0]?.result?.[0];
    const blStatus = blData?.tasks?.[0]?.status_code;
    const blMsg = blData?.tasks?.[0]?.status_message;
    const backlinks = bl ? {
      backlinks: bl.backlinks ?? 0,
      referring_domains: bl.referring_domains ?? 0,
      rank: bl.rank ?? 0,
      dofollow_backlinks: bl.backlinks_dofollow ?? bl.dofollow_backlinks ?? bl.dofollow ?? 0,
      nofollow_backlinks: bl.backlinks_nofollow ?? bl.nofollow_backlinks ?? bl.nofollow ?? 0,
    } : null;
    const backlinkError = !bl ? `status ${blStatus}: ${blMsg} (target: ${cleanDomain})` : null;

    // Fetch competitor backlinks if provided
    let competitorBacklinks = null;
    let opportunities = [];

    if (competitor) {
      const cleanComp = competitor.replace(/^https?:\/\//, "").replace(/\/$/, "");

      const compRes = await fetch("https://api.dataforseo.com/v3/backlinks/summary/live", {
        method: "POST", headers,
        body: JSON.stringify([{ target: cleanComp, include_subdomains: true }]),
      });
      const compData = await compRes.json();
      const comp = compData?.tasks?.[0]?.result?.[0];
      competitorBacklinks = comp ? {
        backlinks: comp.backlinks ?? 0,
        referring_domains: comp.referring_domains ?? 0,
        rank: comp.rank ?? 0,
      } : null;

      // Get link opportunities
      const intRes = await fetch("https://api.dataforseo.com/v3/backlinks/domain_intersection/live", {
        method: "POST", headers,
        body: JSON.stringify([{
          targets: { "yours": cleanDomain, "competitor": cleanComp },
          intersections: false,
          limit: 20,
        }]),
      });
      const intData = await intRes.json();
      const items = intData?.tasks?.[0]?.result?.[0]?.items ?? [];
      opportunities = items.map(i => ({ domain: i.domain, rank: i.rank }));
    }

    return Response.json({ backlinks, backlinkError, blRawKeys: bl ? Object.keys(bl) : null, competitorBacklinks, opportunities });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
