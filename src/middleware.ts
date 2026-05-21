import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname === "/login";
  const isHomeRoute = pathname === "/";
  const isAdminRoute = pathname.startsWith("/admin");
  const isEmployeeRoute = pathname.startsWith("/employee");

  // 1. If session exists (token is present)
  if (token) {
    const role = token.role;

    // If visiting home or login, redirect to their role's dashboard
    if (isHomeRoute || isAuthRoute) {
      if (role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      } else {
        return NextResponse.redirect(new URL("/employee/projects", request.url));
      }
    }

    // Role protection: redirect if they try to access a route of the wrong role
    if (isAdminRoute && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/employee/projects", request.url));
    }
    if (isEmployeeRoute && role !== "EMPLOYEE") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  } else {
    // 2. If session does NOT exist (no token)
    // If trying to access home or any protected dashboard, redirect to login
    if (isHomeRoute || isAdminRoute || isEmployeeRoute) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/admin/:path*",
    "/employee/:path*",
  ],
};
