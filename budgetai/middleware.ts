
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./lib/auth";

const PROTECTED_PATHS = ["/dashboard", "/transactions", "/subscriptions", "/statistics", "/settings"];
const AUTH_PATHS = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth-token")?.value;

  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p));
  const isAuthPage = AUTH_PATHS.some(p => pathname.startsWith(p));

  if (isProtected) {
    if (!token) return NextResponse.redirect(new URL("/login", request.url));
    const payload = await verifyToken(token);
    if (!payload) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("auth-token");
      return response;
    }
  }

  if (isAuthPage && token) {
    const payload = await verifyToken(token);
    if (payload) return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
