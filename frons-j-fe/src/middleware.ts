import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - frons-logo.png, etc (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Get hostname of request (e.g. demo.frons.id, frons.id, localhost:3000)
  // We use headers.get('host') because Next.js sometimes sets req.nextUrl.hostname to localhost
  let hostname = req.headers
    .get('host')!
    .replace('.localhost:3000', `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'frons.id'}`);

  // Determine root domain based on environment
  const rootDomain = process.env.NODE_ENV === 'development' 
    ? 'localhost:3000' 
    : process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'frons.id';

  // Check if we are on a subdomain (i.e. not the root domain)
  // e.g. "medicine.frons.id" -> subdomain: "medicine"
  // e.g. "frons.id" -> no subdomain
  
  // Exclude main domain, www, app (if you have an app subdomain), etc.
  if (
    hostname === rootDomain ||
    hostname === `www.${rootDomain}` ||
    hostname === `app.${rootDomain}`
  ) {
    return NextResponse.next();
  }

  // Extract the slug (tenant identifier)
  const currentHost = hostname.replace(`.${rootDomain}`, '');

  // Rewrite the request to the dynamic /[slug] folder
  // So a visit to "medicine.frons.id/about" transparently becomes "/medicine/about"
  // And "medicine.frons.id/" becomes "/medicine"
  url.pathname = `/${currentHost}${url.pathname}`;
  
  return NextResponse.rewrite(url);
}
