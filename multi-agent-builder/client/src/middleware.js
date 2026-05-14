import { NextResponse } from "next/server";

// Runs in the Edge runtime — no next-auth imports (CJS interop issues).
// We just check for the session cookie; the client-side useSession() in
// App.jsx does the real JWT validation via /api/auth/session.
export function middleware(request) {
  const { pathname } = request.nextUrl;

  const sessionToken =
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", encodeURIComponent(request.url));
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!login|register|forgot-password|reset-password|api/auth|_next/static|_next/image|favicon\\.ico).*)",
  ],
};
