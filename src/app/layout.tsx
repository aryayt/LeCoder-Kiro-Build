import "~/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { AuthProvider } from "~/components/auth/auth-provider";
import { Navigation } from "~/components/layout/navigation";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
	title: "LeCodeR - Transform Research Papers to Code",
	description:
		"Automatically transform academic research papers into working code repositories using AI",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className={`${geist.variable}`}>
			<body>
				<TRPCReactProvider>
					<AuthProvider>
						<Navigation />
						{children}
					</AuthProvider>
				</TRPCReactProvider>
			</body>
		</html>
	);
}
