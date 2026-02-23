export async function POST(req) {
  try {
    const { keyword, domain } = await req.json();
    if (!keyword || !domain) return Response.json({ error: "Keyword and domain are required." }, { status: 400 });

    const login = process.env.DATAFORSEO_LOGIN;
    const password = process.env.DATAFORSEO_PASSWORD;
    if (!login || !password) return Response.json({ error: "DataForSEO credentials not configured." }, { status: 500 });

    const credentials = Buffer.from(`${login}:${password}`).toString("base64");
    const headers = { Authorization: `Basic ${credentials}`, "Content-Type": "application/json" };

    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const domainNoWww = cleanDomain.replace(/^www\./, "");

    // Step 1: Post the task
    const postRes = await fetch("https://api.dataforseo.com/v3/serp/google/organic/task_post", {
      method: "POST",
      headers,
      body: JSON.stringify([{
        keyword,
        location_name: "United States",
        language_name: "English",
        device: "desktop",
        depth: 100,
      }]),
    });

    const postData = await postRes.json();
    const taskId = postData?.tasks?.[0]?.id;
    const postStatus = postData?.tasks?.[0]?.status_code;

    if (!taskId || (postStatus !== 20100 && postStatus !== 20000)) {
      return Response.json({
        error: `Task creation failed: ${postData?.tasks?.[0]?.status_message || postData?.status_message || "Unknown error"}`
      }, { status: 500 });
    }

    // Step 2: Poll for results (up to 30 seconds)
    let items = null;
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 3000)); // wait 3s between polls

      const getRes = await fetch(`https://api.dataforseo.com/v3/serp/google/organic/task_get/regular/${taskId}`, {
        method: "GET",
        headers,
      });

      const getData = await getRes.json();
      const taskStatus = getData?.tasks?.[0]?.status_code;

      if (taskStatus === 20000) {
        items = getData?.tasks?.[0]?.result?.[0]?.items ?? [];
        break;
      }
      // 20100 = still processing, keep polling
    }

    if (items === null) {
      return Response.json({ error: "Timed out waiting for SERP results. Please try again." }, { status: 504 });
    }

    const organicItems = items.filter(i => i.type === "organic");

    let position = null;
    let matchedItem = null;

    for (const item of organicItems) {
      const itemDomain = (item.domain ?? "").replace(/^www\./, "");
      if (itemDomain === domainNoWww) {
        position = item.rank_absolute;
        matchedItem = { title: item.title, url: item.url, description: item.description };
        break;
      }
    }

    const top10 = organicItems.slice(0, 10).map(i => ({
      position: i.rank_absolute,
      domain: i.domain,
      title: i.title,
      url: i.url,
      description: i.description,
      isTarget: (i.domain ?? "").replace(/^www\./, "") === domainNoWww,
    }));

    return Response.json({ keyword, domain: domainNoWww, position, matchedItem, top10, totalOrganicResults: organicItems.length });
  } catch (err) {
    console.error("Rank tracker error:", err);
    return Response.json({ error: err.message || "Failed to fetch rankings." }, { status: 500 });
  }
}
