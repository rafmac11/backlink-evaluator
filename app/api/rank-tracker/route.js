export async function POST(req) {
  try {
    const { keyword, domain, taskId } = await req.json();

    const login = process.env.DATAFORSEO_LOGIN;
    const password = process.env.DATAFORSEO_PASSWORD;
    if (!login || !password) return Response.json({ error: "DataForSEO credentials not configured." }, { status: 500 });

    const credentials = Buffer.from(`${login}:${password}`).toString("base64");
    const headers = { Authorization: `Basic ${credentials}`, "Content-Type": "application/json" };

    // MODE 2: Poll for results using existing taskId
    if (taskId) {
      const getRes = await fetch(`https://api.dataforseo.com/v3/serp/google/organic/task_get/regular/${taskId}`, {
        method: "GET", headers,
      });
      const getData = await getRes.json();
      const taskStatus = getData?.tasks?.[0]?.status_code;

      if (taskStatus === 20000) {
        const items = getData?.tasks?.[0]?.result?.[0]?.items ?? [];
        const organicItems = items.filter(i => i.type === "organic");
        const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
        const domainNoWww = cleanDomain.replace(/^www\./, "");

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

        const top10 = organicItems.slice(0, 50).map(i => ({
          position: i.rank_absolute,
          domain: i.domain,
          title: i.title,
          url: i.url,
          description: i.description,
          isTarget: (i.domain ?? "").replace(/^www\./, "") === domainNoWww,
        }));

        return Response.json({ done: true, keyword, domain: domainNoWww, position, matchedItem, top10 });
      }

      // Still processing
      return Response.json({ done: false, taskId, statusCode: taskStatus, statusMsg: getData?.tasks?.[0]?.status_message ?? null });
    }

    // MODE 1: Create a new task
    if (!keyword || !domain) return Response.json({ error: "Keyword and domain are required." }, { status: 400 });

    const postRes = await fetch("https://api.dataforseo.com/v3/serp/google/organic/task_post", {
      method: "POST", headers,
      body: JSON.stringify([{ keyword, location_name: "United States", language_name: "English", device: "desktop", depth: 50 }]),
    });

    const postData = await postRes.json();
    const newTaskId = postData?.tasks?.[0]?.id;
    const postStatus = postData?.tasks?.[0]?.status_code;

    if (!newTaskId || (postStatus !== 20100 && postStatus !== 20000)) {
      return Response.json({
        error: `Task creation failed: ${postData?.tasks?.[0]?.status_message || "Unknown error"}`
      }, { status: 500 });
    }

    return Response.json({ done: false, taskId: newTaskId });
  } catch (err) {
    console.error("Rank tracker error:", err);
    return Response.json({ error: err.message || "Failed to fetch rankings." }, { status: 500 });
  }
}
