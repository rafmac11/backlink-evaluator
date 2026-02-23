const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redisCmd(...args) {
  const res = await fetch(REDIS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

async function redisSet(key, value) {
  return redisCmd("SET", key, JSON.stringify(value));
}

async function redisGet(key) {
  const raw = await redisCmd("GET", key);
  return raw ? JSON.parse(raw) : null;
}

async function redisDel(key) {
  return redisCmd("DEL", key);
}

export async function GET() {
  try {
    const ids = await redisGet('projects:list') || [];
    const projects = await Promise.all(ids.map(id => redisGet(`project:${id}`)));
    return Response.json({ projects: projects.filter(Boolean) });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'save') {
      const project = body.project;
      const id = project.id || Date.now().toString();
      const p = { ...project, id };
      await redisSet(`project:${id}`, p);
      const ids = await redisGet('projects:list') || [];
      if (!ids.includes(id)) await redisSet('projects:list', [...ids, id]);
      return Response.json({ ok: true, project: p });
    }

    if (action === 'delete') {
      const { id } = body;
      await redisDel(`project:${id}`);
      await redisDel(`runs:${id}`);
      const ids = (await redisGet('projects:list') || []).filter(i => i !== id);
      await redisSet('projects:list', ids);
      return Response.json({ ok: true });
    }

    if (action === 'getRuns') {
      const runs = await redisGet(`runs:${body.id}`) || [];
      return Response.json({ runs });
    }

    if (action === 'saveRun') {
      const runs = await redisGet(`runs:${body.id}`) || [];
      runs.unshift(body.run);
      await redisSet(`runs:${body.id}`, runs.slice(0, 50));
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
