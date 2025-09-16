import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { env } from '~/env';
import { db } from '~/server/db';

export const auth = betterAuth({
	database: prismaAdapter(db, {
		provider: 'postgresql',
	}),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false, // Set to true in production
		sendResetPassword: async ({ user, url }) => {},
	},
	emailVerification: {
		sendOnSignUp: false, // Set to true in production
		sendVerificationEmail: async ({ user, url }) => {},
	},
	socialProviders: {
		google: {
			clientId: env.GOOGLE_CLIENT_ID || '',
			clientSecret: env.GOOGLE_CLIENT_SECRET || '',
			enabled: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
		},
		github: {
			clientId: env.GITHUB_CLIENT_ID || '',
			clientSecret: env.GITHUB_CLIENT_SECRET || '',
			enabled: !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
		},
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day
	},
	account: {
		fields: {
			providerId: 'providerId',
			accountId: 'accountId',
		},
	},
	rateLimit: {
		window: 60, // 1 minute
		max: 10, // 10 requests per minute
	},
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
});

export type Session = typeof auth.$Infer.Session;
export type User = Session['user'];
