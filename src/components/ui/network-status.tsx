'use client';
import { useNetworkStatus } from '~/hooks/use-network-status';

export function NetworkStatusIndicator() {
	const { isOnline, isSlowConnection } = useNetworkStatus();

	if (isOnline && !isSlowConnection) {
		return null; // Don't show anything when connection is good
	}

	return (
		<div className="fixed top-0 right-0 left-0 z-50">
			{!isOnline && (
				<div className="bg-red-600 px-4 py-2 text-center text-white">
					<span className="font-medium text-sm">
						⚠️ You're offline. Some features may not work properly.
					</span>
				</div>
			)}
			{isOnline && isSlowConnection && (
				<div className="bg-yellow-600 px-4 py-2 text-center text-white">
					<span className="font-medium text-sm">
						🐌 Slow connection detected. Operations may take longer.
					</span>
				</div>
			)}
		</div>
	);
}
