import { redirect } from "next/navigation";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const APP_URL = "https://backlink-evaluator-production.up.railway.app";
const REDIRECT_URI = "https://backlink-evaluator-production.up.railway.app/api/auth/gsc/callback";

async function redisSet(key, value) {
  await fetch(REDIS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(["SET", key, JSON.stringify(value)]),
  });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const projectId = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !projectId) {
    return redirect(`${APP_URL}/dashboard?gsc=error`);
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();
    if (tokens.error) throw new Error(tokens.error_description || tokens.error);

    await redisSet(`gsc:${projectId}`, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry: Date.now() + (tokens.expires_in * 1000),
      connected_at: new Date().toISOString(),
    });

    return redirect(`${APP_URL}/dashboard?gsc=connected&projectId=${projectId}`);
  } catch (e) {
    return redirect(`${APP_URL}/dashboard?gsc=error&msg=${encodeURIComponent(e.message)}`);
  }
}
