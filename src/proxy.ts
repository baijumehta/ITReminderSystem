import { NextResponse, type NextRequest } from "next/server";

// Proof-of-concept protection: if APP_PASSWORD is set, the whole site sits
// behind a browser Basic Auth prompt (any username). Replace with Entra ID later.
export function proxy(request: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next();

  const header = request.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    const decoded = atob(header.slice(6));
    if (decoded.slice(decoded.indexOf(":") + 1) === password) return NextResponse.next();
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="IT Reminders", charset="UTF-8"' },
  });
}

export const config = {
  // The cron endpoint has its own bearer-token check.
  matcher: ["/((?!api/cron|_next/static|_next/image|favicon.ico).*)"],
};
