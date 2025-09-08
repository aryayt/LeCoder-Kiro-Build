import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectList } from "~/components/ui/project-list";
import type { Project } from "~/types/project";

const mockProjects: Project[] = [
	{
		id: "1",
		title: "Machine Learning Paper",
		status: "COMPLETED",
		currentStage: 6,
		paperContent: "test content",
		metadata: {
			fileName: "ml-paper.pdf",
			fileSize: 1024000,
			pageCount: 15,
			authors: ["John Doe", "Jane Smith"],
		},
		stages: [],
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: "2",
		title: "Deep Learning Research",
		status: "PROCESSING",
		currentStage: 3,
		paperContent: "test content",
		metadata: {
			fileName: "dl-research.pdf",
			fileSize: 2048000,
			pageCount: 25,
			authors: ["Alice Johnson"],
		},
		stages: [],
		createdAt: "2024-01-02T00:00:00Z",
		updatedAt: "2024-01-02T00:00:00Z",
	},
	{
		id: "3",
		title: "Neural Networks Study",
		status: "ERROR",
		currentStage: 2,
		paperContent: "test content",
		metadata: {
			fileName: "nn-study.pdf",
			fileSize: 512000,
			pageCount: 8,
		},
		stages: [],
		createdAt: "2024-01-03T00:00:00Z",
		updatedAt: "2024-01-03T00:00:00Z",
	},
];

const mockHandlers = {
	onView: jest.fn(),
	onDownload: jest.fn(),
	onDelete: jest.fn(),
};

describe("ProjectList", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders loading state correctly", () => {
		render(<ProjectList projects={[]} isLoading={true} {...mockHandlers} />);

		// Should show loading skeletons
		const skeletons = screen.getAllByRole("generic");
		expect(skeletons.length).toBeGreaterThan(0);
	});

	it("displays all projects correctly", () => {
		render(<ProjectList projects={mockProjects} {...mockHandlers} />);

		// Check that all project titles are displayed
		expect(screen.getByText("Machine Learning Paper")).toBeInTheDocument();
		expect(screen.getByText("Deep Learning Research")).toBeInTheDocument();
		expect(screen.getByText("Neural Networks Study")).toBeInTheDocument();

		// Check file names
		expect(screen.getByText("ml-paper.pdf")).toBeInTheDocument();
		expect(screen.getByText("dl-research.pdf")).toBeInTheDocument();
		expect(screen.getByText("nn-study.pdf")).toBeInTheDocument();
	});

	it("filters projects by search query", async () => {
		const user = userEvent.setup();
		render(<ProjectList projects={mockProjects} {...mockHandlers} />);

		const searchInput = screen.getByPlaceholderText(
			"Search by title, filename, or author...",
		);

		// Search for "Machine"
		await user.type(searchInput, "Machine");

		// Should only show the Machine Learning Paper
		expect(screen.getByText("Machine Learning Paper")).toBeInTheDocument();
		expect(
			screen.queryByText("Deep Learning Research"),
		).not.toBeInTheDocument();
		expect(screen.queryByText("Neural Networks Study")).not.toBeInTheDocument();
	});

	it("filters projects by author", async () => {
		const user = userEvent.setup();
		render(<ProjectList projects={mockProjects} {...mockHandlers} />);

		const searchInput = screen.getByPlaceholderText(
			"Search by title, filename, or author...",
		);

		// Search for "Alice"
		await user.type(searchInput, "Alice");

		// Should only show the Deep Learning Research
		expect(
			screen.queryByText("Machine Learning Paper"),
		).not.toBeInTheDocument();
		expect(screen.getByText("Deep Learning Research")).toBeInTheDocument();
		expect(screen.queryByText("Neural Networks Study")).not.toBeInTheDocument();
	});

	it("filters projects by status", async () => {
		const user = userEvent.setup();
		render(<ProjectList projects={mockProjects} {...mockHandlers} />);

		// Click on "completed" filter
		const completedFilter = screen.getByRole("button", { name: /completed/i });
		await user.click(completedFilter);

		// Should only show completed projects
		expect(screen.getByText("Machine Learning Paper")).toBeInTheDocument();
		expect(
			screen.queryByText("Deep Learning Research"),
		).not.toBeInTheDocument();
		expect(screen.queryByText("Neural Networks Study")).not.toBeInTheDocument();
	});

	it("sorts projects correctly", async () => {
		const user = userEvent.setup();
		render(<ProjectList projects={mockProjects} {...mockHandlers} />);

		const sortSelect = screen.getByLabelText("Sort by:");

		// Sort by title A-Z
		await user.selectOptions(sortSelect, "title");

		const projectCards = screen
			.getAllByRole("generic")
			.filter((el) => el.textContent?.includes("View Details"));

		// First project should be "Deep Learning Research" (alphabetically first)
		expect(projectCards[0]).toHaveTextContent("Deep Learning Research");
	});

	it("calls onView when View Details is clicked", async () => {
		const user = userEvent.setup();
		render(<ProjectList projects={mockProjects} {...mockHandlers} />);

		const viewButtons = screen.getAllByText("View Details");
		await user.click(viewButtons[0]);

		// Projects are sorted by newest first, so first project should be id "3"
		expect(mockHandlers.onView).toHaveBeenCalledWith("3");
	});

	it("calls onDownload when Download is clicked for completed projects", async () => {
		const user = userEvent.setup();
		render(<ProjectList projects={mockProjects} {...mockHandlers} />);

		// Only completed projects should have download buttons
		const downloadButtons = screen.getAllByText("Download");
		expect(downloadButtons).toHaveLength(1);

		await user.click(downloadButtons[0]);
		expect(mockHandlers.onDownload).toHaveBeenCalledWith("1");
	});

	it("calls onDelete when Delete is clicked", async () => {
		const user = userEvent.setup();
		render(<ProjectList projects={mockProjects} {...mockHandlers} />);

		const deleteButtons = screen.getAllByText("Delete");
		await user.click(deleteButtons[0]);

		// Projects are sorted by newest first, so first project should be id "3"
		expect(mockHandlers.onDelete).toHaveBeenCalledWith("3");
	});

	it("displays empty state when no projects match filters", async () => {
		const user = userEvent.setup();
		render(<ProjectList projects={mockProjects} {...mockHandlers} />);

		const searchInput = screen.getByPlaceholderText(
			"Search by title, filename, or author...",
		);

		// Search for something that doesn't exist
		await user.type(searchInput, "nonexistent");

		expect(screen.getByText("No projects found")).toBeInTheDocument();
		expect(
			screen.getByText("Try adjusting your search or filter criteria."),
		).toBeInTheDocument();

		// Should have clear filters button
		const clearButton = screen.getByText("Clear filters");
		expect(clearButton).toBeInTheDocument();
	});

	it("clears filters when clear button is clicked", async () => {
		const user = userEvent.setup();
		render(<ProjectList projects={mockProjects} {...mockHandlers} />);

		const searchInput = screen.getByPlaceholderText(
			"Search by title, filename, or author...",
		);

		// Apply filters
		await user.type(searchInput, "nonexistent");

		// Click clear filters
		const clearButton = screen.getByText("Clear filters");
		await user.click(clearButton);

		// Should show all projects again
		expect(screen.getByText("Machine Learning Paper")).toBeInTheDocument();
		expect(screen.getByText("Deep Learning Research")).toBeInTheDocument();
		expect(screen.getByText("Neural Networks Study")).toBeInTheDocument();
	});

	it("displays correct project counts in filter buttons", () => {
		render(<ProjectList projects={mockProjects} {...mockHandlers} />);

		// Check filter button counts - text is split across elements
		expect(screen.getByText("All")).toBeInTheDocument();
		expect(screen.getAllByText("(3)")[0]).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /completed.*\(1\)/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /processing.*\(1\)/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /error.*\(1\)/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /uploaded.*\(0\)/i }),
		).toBeInTheDocument();
	});

	it("displays empty state for no projects", () => {
		render(<ProjectList projects={[]} {...mockHandlers} />);

		expect(screen.getByText("No projects yet")).toBeInTheDocument();
		expect(
			screen.getByText("Get started by uploading your first research paper."),
		).toBeInTheDocument();

		// Should have upload button
		const uploadButton = screen.getByRole("link", { name: /upload paper/i });
		expect(uploadButton).toHaveAttribute("href", "/upload");
	});
});
