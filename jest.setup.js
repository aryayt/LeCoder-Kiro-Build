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

// Polyfill for Node.js environment
if (typeof globalThis.TransformStream === "undefined") {
	const { TransformStream } = require("node:stream/web");
	globalThis.TransformStream = TransformStream;
}

if (typeof globalThis.ReadableStream === "undefined") {
	const { ReadableStream } = require("node:stream/web");
	globalThis.ReadableStream = ReadableStream;
}

if (typeof globalThis.WritableStream === "undefined") {
	const { WritableStream } = require("node:stream/web");
	globalThis.WritableStream = WritableStream;
}

// Add TextEncoder/TextDecoder polyfills
if (typeof globalThis.TextEncoder === "undefined") {
	const { TextEncoder, TextDecoder } = require("util");
	globalThis.TextEncoder = TextEncoder;
	globalThis.TextDecoder = TextDecoder;
}

// Mock environment variables for tests
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.NODE_ENV = "test";
process.env.SKIP_ENV_VALIDATION = "true";
process.env.OPENAI_API_KEY = "test-openai-key";
process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-google-key";
process.env.ANTHROPIC_API_KEY = "test-anthropic-key";

// Mock the env module to avoid import issues
jest.mock("~/env.js", () => ({
	env: {
		DATABASE_URL: "postgresql://test:test@localhost:5432/test",
		NODE_ENV: "test",
		BETTER_AUTH_SECRET: "test-secret",
		BETTER_AUTH_URL: "http://localhost:3000",
		NEXT_PUBLIC_BETTER_AUTH_URL: "http://localhost:3000",
		OPENAI_API_KEY: "test-openai-key",
		GOOGLE_GENERATIVE_AI_API_KEY: "test-google-key",
		ANTHROPIC_API_KEY: "test-anthropic-key",
	},
}));
