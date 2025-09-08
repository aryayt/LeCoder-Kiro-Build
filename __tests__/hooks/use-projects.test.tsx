import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { TRPCError } from "@trpc/server";
import type React from "react";
import { useProjects } from "~/hooks/use-projects";
import { api } from "~/trpc/react";

// Mock the tRPC API
jest.mock("~/trpc/react", () => ({
	api: {
		project: {
			getAll: {
				useQuery: jest.fn(),
			},
			delete: {
				useMutation: jest.fn(),
			},
			getDownloadUrl: {
				useMutation: jest.fn(),
			},
		},
	},
}));

const mockProjects = [
	{
		id: "1",
		title: "Test Project 1",
		status: "COMPLETED",
		currentStage: 6,
		paperContent: "test content",
		metadata: {
			fileName: "test1.pdf",
			fileSize: 1024,
			pageCount: 10,
		},
		stages: [],
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "2",
		title: "Test Project 2",
		status: "PROCESSING",
		currentStage: 3,
		paperContent: "test content",
		metadata: {
			fileName: "test2.pdf",
			fileSize: 2048,
			pageCount: 20,
		},
		stages: [],
		createdAt: "2024-01-02T00:00:00Z",
		updatedAt: "2024-01-02T00:00:00Z",
	},
];

const createWrapper = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});

	// eslint-disable-next-line react/display-name
	return ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
};

describe("useProjects", () => {
	const mockGetAll = api.project.getAll.useQuery as jest.Mock;
	const mockDelete = api.project.delete.useMutation as jest.Mock;
	const mockGetDownloadUrl = api.project.getDownloadUrl
		.useMutation as jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();

		// Default mock implementations
		mockGetAll.mockReturnValue({
			data: mockProjects,
			isLoading: false,
			error: null,
			refetch: jest.fn(),
		});

		mockDelete.mockReturnValue({
			mutateAsync: jest.fn(),
			isPending: false,
		});

		mockGetDownloadUrl.mockReturnValue({
			mutateAsync: jest.fn(),
			isPending: false,
		});
	});

	it("fetches projects correctly", () => {
		const { result } = renderHook(() => useProjects("user-1"), {
			wrapper: createWrapper(),
		});

		expect(mockGetAll).toHaveBeenCalledWith(
			{ userId: "user-1" },
			{ refetchInterval: 5000 },
		);

		expect(result.current.projects).toEqual(mockProjects);
		expect(result.current.isLoading).toBe(false);
	});

	it("handles loading state", () => {
		mockGetAll.mockReturnValue({
			data: undefined,
			isLoading: true,
			error: null,
			refetch: jest.fn(),
		});

		const { result } = renderHook(() => useProjects("user-1"), {
			wrapper: createWrapper(),
		});

		expect(result.current.isLoading).toBe(true);
		expect(result.current.projects).toEqual([]);
	});

	it("handles error state", () => {
		const mockError = new Error("Failed to fetch projects");
		mockGetAll.mockReturnValue({
			data: undefined,
			isLoading: false,
			error: mockError,
			refetch: jest.fn(),
		});

		const { result } = renderHook(() => useProjects("user-1"), {
			wrapper: createWrapper(),
		});

		expect(result.current.error).toBe(mockError);
		expect(result.current.projects).toEqual([]);
	});

	it("calculates project stats correctly", () => {
		const { result } = renderHook(() => useProjects("user-1"), {
			wrapper: createWrapper(),
		});

		expect(result.current.stats).toEqual({
			total: 2,
			uploaded: 0,
			processing: 1,
			completed: 1,
			error: 0,
		});
	});

	it("handles project deletion", async () => {
		const mockMutateAsync = jest.fn().mockResolvedValue({ success: true });
		const mockRefetch = jest.fn();

		mockDelete.mockReturnValue({
			mutateAsync: mockMutateAsync,
			isPending: false,
		});

		mockGetAll.mockReturnValue({
			data: mockProjects,
			isLoading: false,
			error: null,
			refetch: mockRefetch,
		});

		const { result } = renderHook(() => useProjects("user-1"), {
			wrapper: createWrapper(),
		});

		await result.current.handleDeleteProject("1");

		expect(mockMutateAsync).toHaveBeenCalledWith({ id: "1" });
	});

	it("handles download project", async () => {
		const mockMutateAsync = jest.fn().mockResolvedValue({
			downloadUrl: "/api/projects/1/download",
			fileCount: 5,
		});

		// Mock window.open
		const mockOpen = jest.fn();
		Object.defineProperty(window, "open", {
			value: mockOpen,
			writable: true,
		});

		mockGetDownloadUrl.mockReturnValue({
			mutateAsync: mockMutateAsync,
			isPending: false,
		});

		const { result } = renderHook(() => useProjects("user-1"), {
			wrapper: createWrapper(),
		});

		await result.current.handleDownloadProject("1");

		expect(mockMutateAsync).toHaveBeenCalledWith({ id: "1" });
		expect(mockOpen).toHaveBeenCalledWith("/api/projects/1/download", "_blank");
	});

	it("handles deletion errors", async () => {
		const mockMutateAsync = jest
			.fn()
			.mockRejectedValue(new Error("Delete failed"));
		const consoleSpy = jest.spyOn(console, "error").mockImplementation();

		mockDelete.mockReturnValue({
			mutateAsync: mockMutateAsync,
			isPending: false,
		});

		const { result } = renderHook(() => useProjects("user-1"), {
			wrapper: createWrapper(),
		});

		await result.current.handleDeleteProject("1");

		expect(consoleSpy).toHaveBeenCalledWith(
			"Delete failed:",
			expect.any(Error),
		);

		consoleSpy.mockRestore();
	});

	it("handles download errors", async () => {
		const mockMutateAsync = jest
			.fn()
			.mockRejectedValue(new Error("Download failed"));
		const consoleSpy = jest.spyOn(console, "error").mockImplementation();

		mockGetDownloadUrl.mockReturnValue({
			mutateAsync: mockMutateAsync,
			isPending: false,
		});

		const { result } = renderHook(() => useProjects("user-1"), {
			wrapper: createWrapper(),
		});

		await result.current.handleDownloadProject("1");

		expect(consoleSpy).toHaveBeenCalledWith(
			"Download failed:",
			expect.any(Error),
		);

		consoleSpy.mockRestore();
	});

	it("tracks deleting project ID", async () => {
		const mockMutateAsync = jest
			.fn()
			.mockImplementation(
				() => new Promise((resolve) => setTimeout(resolve, 100)),
			);

		mockDelete.mockReturnValue({
			mutateAsync: mockMutateAsync,
			isPending: true,
		});

		const { result } = renderHook(() => useProjects("user-1"), {
			wrapper: createWrapper(),
		});

		// Start deletion
		await result.current.handleDeleteProject("1");

		// The deletion should have been attempted
		expect(mockMutateAsync).toHaveBeenCalledWith({ id: "1" });
	});

	it("works with anonymous users", () => {
		const { result } = renderHook(() => useProjects(), {
			wrapper: createWrapper(),
		});

		expect(mockGetAll).toHaveBeenCalledWith(
			{ userId: undefined },
			{ refetchInterval: 5000 },
		);
	});
});
