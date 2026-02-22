export async function POST(req) {
  try {
    const { targetUrl } = await req.json();
    const login = process.env.DATAFORSEO_LOGIN;
    const password = process.env.DATAFORSEO_PASSWORD;
    const credentials = Buffer.from(`${login}:${password}`).toString("base64");
    const domain = targetUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    const headers = { Authorization: `Basic ${credentials}`, "Content-Type": "application/json" };

    const res = await fetch("https://api.dataforseo.com/v3/backlinks/summary/live", {
      method: "POST", headers,
      body: JSON.stringify([{ target: domain, include_subdomains: true }]),
    });

    const data = await res.json();
    return Response.json({ raw: data, domain });
  } catch (err) {
    return Response.json({ error: err.message });
  }
}
