export async function POST(req) {
  try {
    const { keyword, domain } = await req.json();
    if (!keyword || !domain) return Response.json({ error: "Keyword and domain are required." }, { status: 400 });

    const login = process.env.DATAFORSEO_LOGIN;
    const password = process.env.DATAFORSEO_PASSWORD;
    if (!login || !password) return Response.json({ error: "DataForSEO credentials not configured." }, { status: 500 });

    const credentials = Buffer.from(`${login}:${password}`).toString("base64");
    const headers = { Authorization: `Basic ${credentials}`, "Content-Type": "application/json" };

    // Clean domain - remove protocol, trailing slash, but keep www variants
    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
    // Also make a version without www for matching
    const domainNoWww = cleanDomain.replace(/^www\./, "");

    const res = await fetch("https://api.dataforseo.com/v3/serp/google/organic/live/regular", {
      method: "POST",
      headers,
      body: JSON.stringify([{
        keyword,
        language_code: "en",
        location_code: 2840, // United States
        device: "desktop",
        depth: 100,
      }]),
    });

    const data = await res.json();

    if (data?.tasks?.[0]?.status_code !== 20000) {
      return Response.json({ error: data?.tasks?.[0]?.status_message || "SERP API error" }, { status: 500 });
    }

    const items = data?.tasks?.[0]?.result?.[0]?.items ?? [];
    const organicItems = items.filter(i => i.type === "organic");

    let position = null;
    let matchedItem = null;

    for (const item of organicItems) {
      const itemDomain = (item.domain ?? "").replace(/^www\./, "");
      if (itemDomain === domainNoWww) {
        position = item.rank_absolute;
        matchedItem = {
          title: item.title,
          url: item.url,
          description: item.description,
        };
        break;
      }
    }

    const top10 = organicItems.slice(0, 10).map(i => {
      const itemDomainClean = (i.domain ?? "").replace(/^www\./, "");
      return {
        position: i.rank_absolute,
        domain: i.domain,
        title: i.title,
        url: i.url,
        description: i.description,
        isTarget: itemDomainClean === domainNoWww,
      };
    });

    return Response.json({
      keyword,
      domain: domainNoWww,
      position,
      matchedItem,
      top10,
      totalOrganicResults: organicItems.length,
    });
  } catch (err) {
    console.error("Rank tracker error:", err);
    return Response.json({ error: err.message || "Failed to fetch rankings." }, { status: 500 });
  }
}
