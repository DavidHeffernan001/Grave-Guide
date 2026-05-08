import { NextResponse, type NextRequest } from "next/server";

const canonicalHost = "graveguide.ie";
const redirectHosts = new Set(["www.graveguide.ie", "graveguide.co.uk", "www.graveguide.co.uk"]);

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase().split(":")[0];

  if (host && redirectHosts.has(host)) {
    const url = request.nextUrl.clone();
    url.host = canonicalHost;
    url.protocol = "https";
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*"
};
