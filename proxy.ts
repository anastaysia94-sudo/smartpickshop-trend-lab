import { NextRequest, NextResponse } from "next/server";

function unauthorized() {
  return new NextResponse("SmartPickShop Trend Lab is private.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="SmartPickShop Trend Lab"' },
  });
}

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/api/health") return NextResponse.next();
  if (process.env.NODE_ENV === "development" && ["127.0.0.1", "localhost"].includes(request.nextUrl.hostname)) return NextResponse.next();
  const expectedUser = process.env.TRENDLAB_USER;
  const expectedPassword = process.env.TRENDLAB_PASSWORD;

  // Fail closed on a hosted deployment if credentials were not configured.
  if (!expectedUser || !expectedPassword) return unauthorized();

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return unauthorized();

  try {
    const decoded = atob(header.slice(6));
    const separator = decoded.indexOf(":");
    const user = separator >= 0 ? decoded.slice(0, separator) : "";
    const password = separator >= 0 ? decoded.slice(separator + 1) : "";
    if (user !== expectedUser || password !== expectedPassword) return unauthorized();
    return NextResponse.next();
  } catch {
    return unauthorized();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
