import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname === "/login";
  const isHomeRoute = pathname === "/";
  const isAdminRoute = pathname.startsWith("/admin");
  const isEmployeeRoute = pathname.startsWith("/employee");

  let token = null;
  try {
    token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
  } catch (error) {
    console.error("Middleware failed to get session token:", error);
  }

  // 1. If session exists (token is present)
  if (token) {
    const role = token.role;

    // If visiting home or login, redirect to their role's dashboard if role is valid
    if (isHomeRoute || isAuthRoute) {
      if (role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      } else if (role === "EMPLOYEE") {
        return NextResponse.redirect(new URL("/employee/projects", request.url));
      }
      // If the role is missing or invalid, let them view the login page or request route normally
      return NextResponse.next();
    }

    // Role protection: redirect if they try to access a route of the wrong role.
    // If role is undefined or invalid, we redirect to login to be safe.
    if (isAdminRoute && role !== "ADMIN") {
      if (role === "EMPLOYEE") {
        return NextResponse.redirect(new URL("/employee/projects", request.url));
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (isEmployeeRoute && role !== "EMPLOYEE") {
      if (role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/login", request.url));
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
