'use client';

import { useEffect, useState } from 'react';

export interface NetworkStatus {
	isOnline: boolean;
	isSlowConnection: boolean;
	connectionType?: string;
	isClient?: boolean;
}

export function useNetworkStatus(): NetworkStatus {
	const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
		isOnline: true, // Default to true for SSR
		isSlowConnection: false,
	});

	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
		if (typeof window === 'undefined') {
			return;
		}

		const updateNetworkStatus = () => {
			const connection =
				(navigator as any).connection ||
				(navigator as any).mozConnection ||
				(navigator as any).webkitConnection;

			const isSlowConnection = connection
				? connection.effectiveType === 'slow-2g' ||
					connection.effectiveType === '2g' ||
					connection.downlink < 1.5
				: false;

			setNetworkStatus({
				isOnline: navigator.onLine,
				isSlowConnection,
				connectionType: connection?.effectiveType,
				isClient: true,
			});
		};

		const handleOnline = () => updateNetworkStatus();
		const handleOffline = () => updateNetworkStatus();
		const handleConnectionChange = () => updateNetworkStatus();

		// Initial check
		updateNetworkStatus();

		// Event listeners
		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		// Connection API listeners (if supported)
		const connection =
			(navigator as any).connection ||
			(navigator as any).mozConnection ||
			(navigator as any).webkitConnection;

		if (connection) {
			connection.addEventListener('change', handleConnectionChange);
		}

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
			if (connection) {
				connection.removeEventListener('change', handleConnectionChange);
			}
		};
	}, []);

	return {
		...networkStatus,
		isClient,
	};
}
