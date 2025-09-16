import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
	// Provide the path to your Next.js app to load next.config.js and .env files
	dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
	setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
	testEnvironment: 'jsdom',
	testPathIgnorePatterns: [
		'<rootDir>/.next/',
		'<rootDir>/node_modules/',
		'<rootDir>/__tests__/ai/test-utils.ts',
		'<rootDir>/e2e/',
	],
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
		'^~/(.*)$': '<rootDir>/src/$1',
	},
	collectCoverageFrom: [
		'src/**/*.{js,jsx,ts,tsx}',
		'!src/**/*.d.ts',
		'!src/**/*.stories.{js,jsx,ts,tsx}',
		'!src/env.js',
		'!src/middleware.ts',
		'!src/app/layout.tsx',
		'!src/app/globals.css',
	],
	coverageThreshold: {},
	coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
	extensionsToTreatAsEsm: ['.ts', '.tsx'],
	globals: {
		'ts-jest': {
			useESM: true,
		},
	},
	transformIgnorePatterns: [
		'node_modules/(?!(@t3-oss/env-nextjs|@t3-oss/env-core|@ai-sdk|ai|nanostores|better-auth)/)',
	],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig);
