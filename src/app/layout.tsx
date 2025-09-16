import '~/styles/globals.css';

import type { Metadata } from 'next';
import { AuthProvider } from '~/components/auth/auth-provider';
import { Navigation } from '~/components/layout/navigation';
import { ErrorBoundary } from '~/components/ui/error-boundary';
import { NetworkStatusIndicator } from '~/components/ui/network-status';
import { ToastProvider } from '~/components/ui/toast';
import { TRPCReactProvider } from '~/trpc/react';

export const metadata: Metadata = {
	title: 'LeCodeR - Transform Research Papers to Code',
	description:
		'Automatically transform academic research papers into working code repositories using AI',
	icons: [{ rel: 'icon', url: '/favicon.ico' }],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en">
			<body>
				<ErrorBoundary>
					<ToastProvider>
						<TRPCReactProvider>
							<AuthProvider>
								<NetworkStatusIndicator />
								<Navigation />
								{children}
							</AuthProvider>
						</TRPCReactProvider>
					</ToastProvider>
				</ErrorBoundary>
			</body>
		</html>
	);
}
