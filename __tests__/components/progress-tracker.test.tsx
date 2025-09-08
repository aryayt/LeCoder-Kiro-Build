import { render, screen, waitFor } from "@testing-library/react";
import {
	type PipelineStage,
	ProgressTracker,
} from "~/components/ui/progress-tracker";

// Mock the real-time progress hook
jest.mock("~/hooks/use-real-time-progress", () => ({
	useRealTimeProgress: jest.fn(() => ({
		progress: null,
		isConnected: false,
		connectionType: null,
		error: null,
		reconnect: jest.fn(),
		disconnect: jest.fn(),
	})),
}));

import { useRealTimeProgress } from "~/hooks/use-real-time-progress";

const mockUseRealTimeProgress = useRealTimeProgress as jest.MockedFunction<
	typeof useRealTimeProgress
>;

describe("ProgressTracker", () => {
	const mockStages: PipelineStage[] = [
		{
			id: "1",
			stageNumber: 1,
			stageName: "Concept Extraction",
			status: "COMPLETED",
			startedAt: new Date("2023-01-01T10:00:00Z"),
			completedAt: new Date("2023-01-01T10:05:00Z"),
		},
		{
			id: "2",
			stageNumber: 2,
			stageName: "Algorithm Analysis",
			status: "PROCESSING",
			startedAt: new Date("2023-01-01T10:05:00Z"),
			completedAt: null,
		},
		{
			id: "3",
			stageNumber: 3,
			stageName: "Architecture Planning",
			status: "PENDING",
			startedAt: null,
			completedAt: null,
		},
	];

	beforeEach(() => {
		mockUseRealTimeProgress.mockReturnValue({
			progress: null,
			isConnected: false,
			connectionType: null,
			error: null,
			reconnect: jest.fn(),
			disconnect: jest.fn(),
		});
	});

	it("renders pipeline stages correctly", () => {
		render(
			<ProgressTracker
				projectId="test-project"
				stages={mockStages}
				currentStage={2}
			/>,
		);

		expect(screen.getByText("Processing Pipeline")).toBeInTheDocument();
		expect(screen.getByText("Concept Extraction")).toBeInTheDocument();
		expect(screen.getByText("Algorithm Analysis")).toBeInTheDocument();
		expect(screen.getByText("Architecture Planning")).toBeInTheDocument();
	});

	it("displays correct status for each stage", () => {
		render(
			<ProgressTracker
				projectId="test-project"
				stages={mockStages}
				currentStage={2}
			/>,
		);

		expect(screen.getByText("Completed")).toBeInTheDocument();
		expect(screen.getByText("Processing...")).toBeInTheDocument();
		expect(screen.getByText("Pending")).toBeInTheDocument();
	});

	it("shows real-time connection status when enabled", () => {
		mockUseRealTimeProgress.mockReturnValue({
			progress: null,
			isConnected: true,
			connectionType: "sse",
			error: null,
			reconnect: jest.fn(),
			disconnect: jest.fn(),
		});

		render(
			<ProgressTracker
				projectId="test-project"
				stages={mockStages}
				currentStage={2}
				enableRealTime={true}
			/>,
		);

		expect(screen.getByText("Live (SSE)")).toBeInTheDocument();
	});

	it("shows reconnect button when connection fails", () => {
		const mockReconnect = jest.fn();
		mockUseRealTimeProgress.mockReturnValue({
			progress: null,
			isConnected: false,
			connectionType: null,
			error: "Connection failed",
			reconnect: mockReconnect,
			disconnect: jest.fn(),
		});

		render(
			<ProgressTracker
				projectId="test-project"
				stages={mockStages}
				currentStage={2}
				enableRealTime={true}
			/>,
		);

		const reconnectButton = screen.getByText("Reconnect");
		expect(reconnectButton).toBeInTheDocument();

		reconnectButton.click();
		expect(mockReconnect).toHaveBeenCalled();
	});

	it("updates stages from real-time progress", async () => {
		const updatedStages = [
			{
				id: "1",
				stageNumber: 1,
				stageName: "Concept Extraction",
				status: "COMPLETED",
				startedAt: "2023-01-01T10:00:00Z",
				completedAt: "2023-01-01T10:05:00Z",
			},
			{
				id: "2",
				stageNumber: 2,
				stageName: "Algorithm Analysis",
				status: "COMPLETED",
				startedAt: "2023-01-01T10:05:00Z",
				completedAt: "2023-01-01T10:10:00Z",
			},
		];

		mockUseRealTimeProgress.mockReturnValue({
			progress: {
				type: "progress",
				projectId: "test-project",
				currentStage: 2,
				stages: updatedStages,
				timestamp: "2023-01-01T10:10:00Z",
			},
			isConnected: true,
			connectionType: "sse",
			error: null,
			reconnect: jest.fn(),
			disconnect: jest.fn(),
		});

		render(
			<ProgressTracker
				projectId="test-project"
				stages={mockStages}
				currentStage={1}
				enableRealTime={true}
			/>,
		);

		await waitFor(() => {
			// Both stages should now show as completed
			const completedTexts = screen.getAllByText("Completed");
			expect(completedTexts).toHaveLength(2);
		});
	});

	it("shows error message for failed stages", () => {
		const stagesWithError: PipelineStage[] = [
			...mockStages,
			{
				id: "4",
				stageNumber: 4,
				stageName: "Code Generation",
				status: "ERROR",
				errorMessage: "Failed to generate code",
				startedAt: new Date("2023-01-01T10:10:00Z"),
				completedAt: null,
			},
		];

		render(
			<ProgressTracker
				projectId="test-project"
				stages={stagesWithError}
				currentStage={4}
			/>,
		);

		expect(screen.getByText("Failed to generate code")).toBeInTheDocument();
	});

	it("displays completion time for completed stages", () => {
		render(
			<ProgressTracker
				projectId="test-project"
				stages={mockStages}
				currentStage={2}
			/>,
		);

		// Check if completion time is displayed (format may vary based on locale)
		expect(screen.getByText(/Completed at/)).toBeInTheDocument();
	});

	it("shows retrying status correctly", () => {
		const stagesWithRetry: PipelineStage[] = [
			{
				id: "1",
				stageNumber: 1,
				stageName: "Concept Extraction",
				status: "RETRYING",
				startedAt: new Date("2023-01-01T10:00:00Z"),
				completedAt: null,
			},
		];

		render(
			<ProgressTracker
				projectId="test-project"
				stages={stagesWithRetry}
				currentStage={1}
			/>,
		);

		expect(screen.getByText("Retrying...")).toBeInTheDocument();
	});

	it("applies custom className", () => {
		const { container } = render(
			<ProgressTracker
				projectId="test-project"
				stages={mockStages}
				currentStage={2}
				className="custom-class"
			/>,
		);

		expect(container.firstChild).toHaveClass("custom-class");
	});

	it("disables real-time updates when enableRealTime is false", () => {
		render(
			<ProgressTracker
				projectId="test-project"
				stages={mockStages}
				currentStage={2}
				enableRealTime={false}
			/>,
		);

		expect(mockUseRealTimeProgress).toHaveBeenCalledWith({
			projectId: "test-project",
			enabled: false,
			fallbackToPolling: true,
		});
	});

	it("shows fallback warning when connection error occurs", () => {
		mockUseRealTimeProgress.mockReturnValue({
			progress: null,
			isConnected: false,
			connectionType: null,
			error: "Connection failed",
			reconnect: jest.fn(),
			disconnect: jest.fn(),
		});

		render(
			<ProgressTracker
				projectId="test-project"
				stages={mockStages}
				currentStage={2}
				enableRealTime={true}
			/>,
		);

		expect(
			screen.getByText(
				"Real-time updates unavailable. Using fallback polling.",
			),
		).toBeInTheDocument();
	});
});
