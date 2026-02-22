import { NextResponse } from "next/server";

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Allow API routes through (they handle their own auth)
  if (pathname.startsWith("/api/")) return NextResponse.next();

  const basicAuth = req.headers.get("authorization");
  const password = process.env.APP_PASSWORD || "changeme";

  if (basicAuth) {
    const [scheme, encoded] = basicAuth.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = Buffer.from(encoded, "base64").toString("utf-8");
      const [, pwd] = decoded.split(":");
      if (pwd === password) return NextResponse.next();
    }
  }

  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Link Value Platform"',
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
