'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface ProgressUpdate {
	type: 'connected' | 'progress' | 'final' | 'error' | 'update' | 'current' | 'timeout';
	projectId: string;
	status?: string;
	currentStage?: number;
	stages?: Array<{
		id: string;
		stageNumber: number;
		stageName: string;
		status: string;
		errorMessage?: string | null;
		startedAt?: string | null;
		completedAt?: string | null;
	}>;
	error?: string;
	timestamp: string;
}

export interface UseRealTimeProgressOptions {
	projectId: string;
	enabled?: boolean;
	fallbackToPolling?: boolean;
	pollingInterval?: number;
	maxReconnectAttempts?: number;
	reconnectDelay?: number;
}

export interface UseRealTimeProgressReturn {
	progress: ProgressUpdate | null;
	isConnected: boolean;
	connectionType: 'sse' | 'websocket' | 'polling' | null;
	error: string | null;
	reconnect: () => void;
	disconnect: () => void;
}

export function useRealTimeProgress({
	projectId,
	enabled = true,
	fallbackToPolling = true,
	pollingInterval = 2000,
	maxReconnectAttempts = 5,
	reconnectDelay = 1000,
}: UseRealTimeProgressOptions): UseRealTimeProgressReturn {
	const [progress, setProgress] = useState<ProgressUpdate | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const [connectionType, setConnectionType] = useState<'sse' | 'websocket' | 'polling' | null>(
		null
	);
	const [error, setError] = useState<string | null>(null);

	const eventSourceRef = useRef<EventSource | null>(null);
	const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const reconnectAttemptsRef = useRef(0);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const lastUpdateRef = useRef<string | null>(null);

	// Check if SSE is supported
	const isSSESupported = useCallback(() => {
		return typeof EventSource !== 'undefined';
	}, []);

	// Clean up connections
	const cleanup = useCallback(() => {
		if (eventSourceRef.current) {
			eventSourceRef.current.close();
			eventSourceRef.current = null;
		}

		if (pollingIntervalRef.current) {
			clearInterval(pollingIntervalRef.current);
			pollingIntervalRef.current = null;
		}

		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
			reconnectTimeoutRef.current = null;
		}

		setIsConnected(false);
		setConnectionType(null);
	}, []);

	// Handle connection errors and reconnection
	const handleConnectionError = useCallback(
		(errorMessage: string) => {
			console.error('Real-time connection error:', errorMessage);
			setError(errorMessage);
			setIsConnected(false);

			if (reconnectAttemptsRef.current < maxReconnectAttempts) {
				reconnectAttemptsRef.current++;
				const delay = reconnectDelay * 2 ** (reconnectAttemptsRef.current - 1);

				reconnectTimeoutRef.current = setTimeout(() => {
					if (enabled) {
						connectSSE();
					}
				}, delay);
			} else if (fallbackToPolling) {
				// Fall back to WebSocket polling
				connectWebSocket();
			}
		},
		[enabled, fallbackToPolling, maxReconnectAttempts, reconnectDelay]
	);

	// Connect using Server-Sent Events
	const connectSSE = useCallback(() => {
		if (!(enabled && projectId)) {
			return;
		}

		cleanup();

		try {
			const eventSource = new EventSource(`/api/projects/${projectId}/progress`);
			eventSourceRef.current = eventSource;

			eventSource.onopen = () => {
				setIsConnected(true);
				setConnectionType('sse');
				setError(null);
				reconnectAttemptsRef.current = 0;
			};

			eventSource.onmessage = (event) => {
				try {
					const data: ProgressUpdate = JSON.parse(event.data);
					setProgress(data);
					lastUpdateRef.current = data.timestamp;

					// Close connection if final state reached
					if (data.type === 'final') {
						cleanup();
					}
				} catch (err) {
					console.error('Failed to parse SSE message:', err);
				}
			};

			eventSource.onerror = () => {
				handleConnectionError('SSE connection failed');
			};
		} catch (_err) {
			handleConnectionError('Failed to create SSE connection');
		}
	}, [enabled, projectId, cleanup, handleConnectionError]);

	// Connect using WebSocket fallback (long polling)
	const connectWebSocket = useCallback(() => {
		if (!(enabled && projectId)) {
			return;
		}

		cleanup();
		setConnectionType('websocket');

		const poll = async () => {
			try {
				const url = new URL(`/api/projects/${projectId}/websocket`, window.location.origin);
				if (lastUpdateRef.current) {
					url.searchParams.set('lastUpdate', lastUpdateRef.current);
				}

				const response = await fetch(url.toString());

				if (!response.ok) {
					throw new Error(`HTTP ${response.status}`);
				}

				const data: ProgressUpdate = await response.json();
				setProgress(data);
				setIsConnected(true);
				setError(null);
				lastUpdateRef.current = data.timestamp;

				// Continue polling unless final state reached
				if (data.type !== 'final' && enabled) {
					pollingIntervalRef.current = setTimeout(poll, pollingInterval);
				} else {
					setIsConnected(false);
				}
			} catch (err) {
				console.error('WebSocket polling error:', err);
				setError('WebSocket polling failed');
				setIsConnected(false);

				// Retry with exponential backoff
				if (reconnectAttemptsRef.current < maxReconnectAttempts && enabled) {
					reconnectAttemptsRef.current++;
					const delay = reconnectDelay * 2 ** (reconnectAttemptsRef.current - 1);
					pollingIntervalRef.current = setTimeout(poll, delay);
				} else {
					// Fall back to regular polling
					connectPolling();
				}
			}
		};

		poll();
	}, [enabled, projectId, pollingInterval, maxReconnectAttempts, reconnectDelay, cleanup]);

	// Connect using regular polling as final fallback
	const connectPolling = useCallback(() => {
		if (!(enabled && projectId)) {
			return;
		}

		cleanup();
		setConnectionType('polling');

		const poll = async () => {
			try {
				const response = await fetch(`/api/projects/${projectId}/websocket`);

				if (!response.ok) {
					throw new Error(`HTTP ${response.status}`);
				}

				const data: ProgressUpdate = await response.json();
				setProgress(data);
				setIsConnected(true);
				setError(null);

				// Continue polling unless final state reached
				if (data.type !== 'final' && enabled) {
					pollingIntervalRef.current = setTimeout(poll, pollingInterval);
				} else {
					setIsConnected(false);
				}
			} catch (err) {
				console.error('Polling error:', err);
				setError('Polling failed');
				setIsConnected(false);

				// Keep trying with regular polling
				if (enabled) {
					pollingIntervalRef.current = setTimeout(poll, pollingInterval * 2);
				}
			}
		};

		poll();
	}, [enabled, projectId, pollingInterval, cleanup]);

	// Manual reconnect function
	const reconnect = useCallback(() => {
		reconnectAttemptsRef.current = 0;
		setError(null);

		if (isSSESupported()) {
			connectSSE();
		} else if (fallbackToPolling) {
			connectWebSocket();
		} else {
			connectPolling();
		}
	}, [isSSESupported, connectSSE, connectWebSocket, connectPolling, fallbackToPolling]);

	// Manual disconnect function
	const disconnect = useCallback(() => {
		cleanup();
		setError(null);
	}, [cleanup]);

	// Initialize connection
	useEffect(() => {
		if (!(enabled && projectId)) {
			cleanup();
			return;
		}

		// Start with SSE if supported, otherwise fall back
		if (isSSESupported()) {
			connectSSE();
		} else if (fallbackToPolling) {
			connectWebSocket();
		} else {
			connectPolling();
		}

		return cleanup;
	}, [
		enabled,
		projectId,
		isSSESupported,
		connectSSE,
		connectWebSocket,
		connectPolling,
		fallbackToPolling,
		cleanup,
	]);

	// Cleanup on unmount
	useEffect(() => {
		return cleanup;
	}, [cleanup]);

	return {
		progress,
		isConnected,
		connectionType,
		error,
		reconnect,
		disconnect,
	};
}
