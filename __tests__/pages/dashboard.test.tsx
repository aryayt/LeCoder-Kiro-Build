import type React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import DashboardPage from "~/app/dashboard/page";
import { useAuth } from "~/components/auth/auth-provider";
import { useProjects } from "~/hooks/use-projects";

// Mock dependencies
jest.mock("next/navigation", () => ({
	useRouter: jest.fn(),
}));

jest.mock("~/components/auth/auth-provider", () => ({
	useAuth: jest.fn(),
}));

jest.mock("~/hooks/use-projects", () => ({
	useProjects: jest.fn(),
}));

// Mock components to avoid complex rendering
jest.mock("~/components/layout/dashboard-layout", () => ({
	DashboardLayout: ({ children, title, description }: { children: React.ReactNode; title: string; description: string }) => (
		<div data-testid="dashboard-layout">
			<h1>{title}</h1>
			<p>{description}</p>
			{children}
		</div>
	),
}));

jest.mock("~/components/ui/dashboard-stats", () => ({
	DashboardStats: ({ projects, isLoading }: { projects: unknown[]; isLoading: boolean }) => (
		<div data-testid="dashboard-stats">
			{isLoading ? "Loading stats..." : `${projects.length} projects`}
		</div>
	),
}));

jest.mock("~/components/ui/storage-limit-warning", () => ({
	StorageLimitWarning: ({ projects }: { projects: unknown[] }) => (
		<div data-testid="storage-limit-warning">
			{projects.length >= 40 ? "Storage warning displayed" : null}
		</div>
	),
}));

jest.mock("~/components/ui/project-list", () => ({
	ProjectList: ({ projects, onView, onDownload, onDelete, isLoading }: { projects: unknown[]; onView: (id: string) => void; onDownload: (id: string) => void; onDelete: (id: string) => void; isLoading: boolean }) => (
		<div data-testid="project-list">
			{isLoading ? (
				"Loading projects..."
			) : (
				<div>
					{projects.map((project: { id: string; title: string }) => (
						<div key={project.id} data-testid={`project-${project.id}`}>
							<span>{project.title}</span>
							<button type="button" onClick={() => onView(project.id)}>View</button>
							<button type="button" onClick={() => onDownload(project.id)}>Download</button>
							<button type="button" onClick={() => onDelete(project.id)}>Delete</button>
						</div>
					))}
				</div>
			)}
		</div>
	),
}));

jest.mock("~/components/ui/confirmation-dialog", () => ({
	ConfirmationDialog: ({
		isOpen,
		onConfirm,
		onClose,
		title,
		isLoading,
	}: { isOpen: boolean; onConfirm: () => void; onClose: () => void; title: string; isLoading: boolean }) =>
		isOpen ? (
			<div data-testid="confirmation-dialog">
				<h2>{title}</h2>
				<button type="button" onClick={onConfirm} disabled={isLoading}>
					{isLoading ? "Deleting..." : "Confirm"}
				</button>
				<button type="button" onClick={onClose}>Cancel</button>
			</div>
		) : null,
}));

const mockRouter = {
	push: jest.fn(),
};

const mockSession = {
	user: {
		id: "user-1",
		name: "John Doe",
		email: "john@example.com",
	},
};

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

const mockUseProjects = {
	projects: mockProjects,
	isLoading: false,
	handleDeleteProject: jest.fn(),
	handleDownloadProject: jest.fn(),
	deletingProjectId: null,
	isDeleting: false,
};

describe("DashboardPage", () => {
	beforeEach(() => {
		jest.clearAllMocks();

		(useRouter as jest.Mock).mockReturnValue(mockRouter);
		(useAuth as jest.Mock).mockReturnValue({ session: mockSession });
		(useProjects as jest.Mock).mockReturnValue(mockUseProjects);
	});

	it("renders dashboard with user name", () => {
		render(<DashboardPage />);

		expect(screen.getByText("Welcome back, John Doe!")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Manage your research paper projects and track their progress.",
			),
		).toBeInTheDocument();
	});

	it("renders dashboard without user name when no session", () => {
		(useAuth as jest.Mock).mockReturnValue({ session: null });

		render(<DashboardPage />);

		expect(screen.getByText("Dashboard")).toBeInTheDocument();
	});

	it("displays loading state", () => {
		(useProjects as jest.Mock).mockReturnValue({
			...mockUseProjects,
			isLoading: true,
		});

		render(<DashboardPage />);

		expect(screen.getByText("Loading stats...")).toBeInTheDocument();
		expect(screen.getByText("Loading projects...")).toBeInTheDocument();
	});

	it("displays projects correctly", () => {
		render(<DashboardPage />);

		expect(screen.getByText("2 projects")).toBeInTheDocument();
		expect(screen.getByText("Test Project 1")).toBeInTheDocument();
		expect(screen.getByText("Test Project 2")).toBeInTheDocument();
	});

	it("handles project view", async () => {
		const user = userEvent.setup();
		render(<DashboardPage />);

		const viewButton = screen.getAllByText("View")[0];
		await user.click(viewButton);

		expect(mockRouter.push).toHaveBeenCalledWith("/projects/1");
	});

	it("handles project download", async () => {
		const user = userEvent.setup();
		render(<DashboardPage />);

		const downloadButton = screen.getAllByText("Download")[0];
		await user.click(downloadButton);

		expect(mockUseProjects.handleDownloadProject).toHaveBeenCalledWith("1");
	});

	it("opens delete confirmation dialog", async () => {
		const user = userEvent.setup();
		render(<DashboardPage />);

		const deleteButton = screen.getAllByText("Delete")[0];
		await user.click(deleteButton);

		expect(screen.getByTestId("confirmation-dialog")).toBeInTheDocument();
		expect(screen.getByText("Delete Project")).toBeInTheDocument();
	});

	it("handles project deletion confirmation", async () => {
		const user = userEvent.setup();
		render(<DashboardPage />);

		// Open delete dialog
		const deleteButton = screen.getAllByText("Delete")[0];
		await user.click(deleteButton);

		// Confirm deletion
		const confirmButton = screen.getByText("Confirm");
		await user.click(confirmButton);

		expect(mockUseProjects.handleDeleteProject).toHaveBeenCalledWith("1");
	});

	it("cancels project deletion", async () => {
		const user = userEvent.setup();
		render(<DashboardPage />);

		// Open delete dialog
		const deleteButton = screen.getAllByText("Delete")[0];
		await user.click(deleteButton);

		// Cancel deletion
		const cancelButton = screen.getByText("Cancel");
		await user.click(cancelButton);

		expect(mockUseProjects.handleDeleteProject).not.toHaveBeenCalled();
		expect(screen.queryByTestId("confirmation-dialog")).not.toBeInTheDocument();
	});

	it("shows loading state in delete dialog", async () => {
		const user = userEvent.setup();

		(useProjects as jest.Mock).mockReturnValue({
			...mockUseProjects,
			isDeleting: true,
			deletingProjectId: "1",
		});

		render(<DashboardPage />);

		// Open delete dialog
		const deleteButton = screen.getAllByText("Delete")[0];
		await user.click(deleteButton);

		expect(screen.getByText("Deleting...")).toBeInTheDocument();
		expect(screen.getByText("Deleting...")).toBeDisabled();
	});

	it("renders upload button", () => {
		render(<DashboardPage />);

		const uploadButton = screen.getByRole("link", { name: /upload paper/i });
		expect(uploadButton).toHaveAttribute("href", "/upload");
	});

	it("passes correct user ID to useProjects hook", () => {
		render(<DashboardPage />);

		expect(useProjects).toHaveBeenCalledWith("user-1");
	});

	it("handles anonymous user", () => {
		(useAuth as jest.Mock).mockReturnValue({ session: null });

		render(<DashboardPage />);

		expect(useProjects).toHaveBeenCalledWith(undefined);
	});

	it("displays storage limit warning component", () => {
		render(<DashboardPage />);

		expect(screen.getByTestId("storage-limit-warning")).toBeInTheDocument();
	});
});
