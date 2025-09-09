import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "~/lib/auth";

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Public routes that don't require authentication
	const publicRoutes = [
		"/",
		"/auth/login",
		"/auth/register",
		"/auth/forgot-password",
		"/auth/reset-password",
		"/api/auth",
	];

	// Check if the current path is public
	const isPublicRoute = publicRoutes.some(
		(route) => pathname === route || pathname.startsWith(`${route}/`),
	);

	// If it's a public route, allow access
	if (isPublicRoute) {
		return NextResponse.next();
	}

	// For protected routes, check authentication
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			// Redirect to login if not authenticated
			const loginUrl = new URL("/auth/login", request.url);
			loginUrl.searchParams.set("callbackUrl", pathname);
			return NextResponse.redirect(loginUrl);
		}

		return NextResponse.next();
	} catch (error) {
		// If there's an error checking the session, redirect to login
		const loginUrl = new URL("/auth/login", request.url);
		loginUrl.searchParams.set("callbackUrl", pathname);
		return NextResponse.redirect(loginUrl);
	}
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		"/((?!api|_next/static|_next/image|favicon.ico).*)",
	],
	runtime: "nodejs",
};
