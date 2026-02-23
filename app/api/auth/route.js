import { NextResponse } from "next/server";

export async function POST(req) {
  const { password, action } = await req.json();
  const correctPassword = process.env.APP_PASSWORD || "changeme";

  if (action === "logout") {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("auth_token", "", { maxAge: 0, path: "/" });
    return res;
  }

  if (password === correctPassword) {
    const token = Buffer.from(correctPassword).toString("base64");
    const res = NextResponse.json({ ok: true });
    res.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    return res;
  }

  return NextResponse.json({ error: "Invalid password" }, { status: 401 });
}
