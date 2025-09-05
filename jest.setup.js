import "@testing-library/jest-dom";

// Mock Next.js router
jest.mock("next/navigation", () => ({
	useRouter: () => ({
		push: jest.fn(),
		replace: jest.fn(),
		prefetch: jest.fn(),
	}),
	usePathname: () => "/",
}));

// Mock window.location only in jsdom environment
if (typeof window !== "undefined") {
	delete window.location;
	window.location = { href: "", assign: jest.fn() };
}

// Mock fetch
global.fetch = jest.fn();

// Mock environment variables
process.env.NEXT_PUBLIC_BETTER_AUTH_URL = "http://localhost:3000";
process.env.BETTER_AUTH_SECRET = "test-secret";
process.env.BETTER_AUTH_URL = "http://localhost:3000";
