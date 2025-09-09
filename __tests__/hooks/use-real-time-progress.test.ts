import { afterEach, beforeEach, describe, it } from "@jest/globals";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useRealTimeProgress } from "~/hooks/use-real-time-progress";

// Mock EventSource
class MockEventSource {
	public onopen: ((event: Event) => void) | null = null;
	public onmessage: ((event: MessageEvent) => void) | null = null;
	public onerror: ((event: Event) => void) | null = null;
	public readyState = 0;
	public url: string;

	constructor(url: string) {
		this.url = url;
		// Simulate connection opening
		setTimeout(() => {
			this.readyState = 1;
			if (this.onopen) {
				this.onopen(new Event("open"));
			}
		}, 10);
	}

	close() {
		this.readyState = 2;
	}

	// Helper method to simulate receiving messages
	simulateMessage(data: Record<string, unknown>) {
		if (this.onmessage) {
			const event = new MessageEvent("message", {
				data: JSON.stringify(data),
			});
			this.onmessage(event);
		}
	}

	// Helper method to simulate errors
	simulateError() {
		if (this.onerror) {
			this.onerror(new Event("error"));
		}
	}
}

// Mock fetch for WebSocket fallback
global.fetch = jest.fn();

// Replace EventSource with mock
(globalThis as unknown as { EventSource: unknown }).EventSource = MockEventSource;

describe("useRealTimeProgress", () => {
	let mockEventSource: MockEventSource;

	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();

		// Mock EventSource constructor to capture instance
		(globalThis as unknown as { EventSource: unknown }).EventSource = jest
			.fn()
			.mockImplementation((url: string) => {
				mockEventSource = new MockEventSource(url);
				return mockEventSource;
			});
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllTimers();
	});

	it("should initialize with default values", () => {
		const { result } = renderHook(() =>
			useRealTimeProgress({ projectId: "test-project" }),
		);

		expect(result.current.progress).toBeNull();
		expect(result.current.isConnected).toBe(false);
		expect(result.current.connectionType).toBeNull();
		expect(result.current.error).toBeNull();
	});

	it("should establish SSE connection when enabled", async () => {
		const { result } = renderHook(() =>
			useRealTimeProgress({ projectId: "test-project" }),
		);

		// Fast-forward to allow connection to establish
		act(() => {
			jest.advanceTimersByTime(20);
		});

		await waitFor(() => {
			expect(result.current.isConnected).toBe(true);
			expect(result.current.connectionType).toBe("sse");
		});
	});

	it("should handle SSE messages correctly", async () => {
		const { result } = renderHook(() =>
			useRealTimeProgress({ projectId: "test-project" }),
		);

		// Wait for connection
		act(() => {
			jest.advanceTimersByTime(20);
		});

		const mockProgressData = {
			type: "progress",
			projectId: "test-project",
			status: "PROCESSING",
			currentStage: 2,
			stages: [
				{
					id: "stage-1",
					stageNumber: 1,
					stageName: "Concept Extraction",
					status: "COMPLETED",
					errorMessage: null,
					startedAt: "2023-01-01T10:00:00Z",
					completedAt: "2023-01-01T10:05:00Z",
				},
			],
			timestamp: "2023-01-01T10:05:00Z",
		};

		act(() => {
			mockEventSource.simulateMessage(mockProgressData);
		});

		await waitFor(() => {
			expect(result.current.progress).toEqual(mockProgressData);
		});
	});

	it("should handle SSE connection errors and retry", async () => {
		const { result } = renderHook(() =>
			useRealTimeProgress({
				projectId: "test-project",
				maxReconnectAttempts: 2,
				reconnectDelay: 100,
			}),
		);

		// Wait for initial connection
		act(() => {
			jest.advanceTimersByTime(20);
		});

		// Simulate connection error
		act(() => {
			mockEventSource.simulateError();
		});

		await waitFor(() => {
			expect(result.current.isConnected).toBe(false);
			expect(result.current.error).toBeTruthy();
		});

		// Should attempt to reconnect
		act(() => {
			jest.advanceTimersByTime(200);
		});

		expect(global.EventSource).toHaveBeenCalledTimes(2);
	});

	it("should fall back to WebSocket polling after SSE failures", async () => {
		const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
		mockFetch.mockResolvedValue({
			ok: true,
			json: () =>
				Promise.resolve({
					type: "current",
					projectId: "test-project",
					status: "PROCESSING",
					stages: [],
					timestamp: "2023-01-01T10:00:00Z",
				}),
		} as Response);

		const { result } = renderHook(() =>
			useRealTimeProgress({
				projectId: "test-project",
				maxReconnectAttempts: 0, // No retries, immediate fallback
				fallbackToPolling: true,
			}),
		);

		// Wait for initial connection
		act(() => {
			jest.advanceTimersByTime(20);
		});

		// Simulate connection error to trigger immediate fallback
		act(() => {
			mockEventSource.simulateError();
		});

		// Wait for fallback to occur
		act(() => {
			jest.advanceTimersByTime(100);
		});

		// Should have attempted to use fetch for WebSocket fallback
		await waitFor(
			() => {
				expect(result.current.connectionType).toBe("websocket");
			},
			{ timeout: 500 },
		);
	});

	it("should handle final state messages by closing connection", async () => {
		const { result } = renderHook(() =>
			useRealTimeProgress({ projectId: "test-project" }),
		);

		// Wait for connection
		act(() => {
			jest.advanceTimersByTime(20);
		});

		const finalMessage = {
			type: "final",
			projectId: "test-project",
			status: "COMPLETED",
			timestamp: "2023-01-01T10:00:00Z",
		};

		act(() => {
			mockEventSource.simulateMessage(finalMessage);
		});

		await waitFor(() => {
			expect(result.current.progress).toEqual(finalMessage);
			expect(result.current.isConnected).toBe(false);
		});
	});

	it("should not connect when disabled", () => {
		const { result } = renderHook(() =>
			useRealTimeProgress({
				projectId: "test-project",
				enabled: false,
			}),
		);

		act(() => {
			jest.advanceTimersByTime(100);
		});

		expect(result.current.isConnected).toBe(false);
		expect(global.EventSource).not.toHaveBeenCalled();
	});

	it("should provide manual reconnect function", async () => {
		const { result } = renderHook(() =>
			useRealTimeProgress({ projectId: "test-project" }),
		);

		// Simulate error state
		act(() => {
			jest.advanceTimersByTime(20);
			mockEventSource.simulateError();
		});

		await waitFor(() => {
			expect(result.current.isConnected).toBe(false);
		});

		// Manual reconnect
		act(() => {
			result.current.reconnect();
		});

		expect(global.EventSource).toHaveBeenCalledTimes(2);
	});

	it("should provide manual disconnect function", async () => {
		const { result } = renderHook(() =>
			useRealTimeProgress({ projectId: "test-project" }),
		);

		// Wait for connection
		act(() => {
			jest.advanceTimersByTime(20);
		});

		await waitFor(() => {
			expect(result.current.isConnected).toBe(true);
		});

		// Manual disconnect
		act(() => {
			result.current.disconnect();
		});

		expect(result.current.isConnected).toBe(false);
		expect(result.current.connectionType).toBeNull();
	});

	it("should clean up connections on unmount", () => {
		const { unmount } = renderHook(() =>
			useRealTimeProgress({ projectId: "test-project" }),
		);

		act(() => {
			jest.advanceTimersByTime(20);
		});

		const closeSpy = jest.spyOn(mockEventSource, "close");

		unmount();

		expect(closeSpy).toHaveBeenCalled();
	});
});
