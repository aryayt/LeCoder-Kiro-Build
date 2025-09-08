import { render, screen } from "@testing-library/react";
import { DashboardStats } from "~/components/ui/dashboard-stats";
import type { Project } from "~/types/project";

const mockProjects: Project[] = [
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
	{
		id: "3",
		title: "Test Project 3",
		status: "ERROR",
		currentStage: 2,
		paperContent: "test content",
		metadata: {
			fileName: "test3.pdf",
			fileSize: 512,
			pageCount: 5,
		},
		stages: [],
		createdAt: "2024-01-03T00:00:00Z",
		updatedAt: "2024-01-03T00:00:00Z",
	},
];

describe("DashboardStats", () => {
	it("renders loading state correctly", () => {
		render(<DashboardStats projects={[]} isLoading={true} />);

		// Should show loading skeletons
		const skeletons = screen.getAllByRole("generic");
		expect(skeletons.length).toBeGreaterThan(0);
	});

	it("displays correct project statistics", () => {
		render(<DashboardStats projects={mockProjects} />);

		// Check total projects
		expect(screen.getByText("Total Projects")).toBeInTheDocument();
		expect(screen.getAllByText("3")[0]).toBeInTheDocument();

		// Check in progress
		expect(screen.getByText("In Progress")).toBeInTheDocument();
		expect(screen.getAllByText("1")[0]).toBeInTheDocument();

		// Check completed
		expect(screen.getByText("Completed")).toBeInTheDocument();
		expect(screen.getAllByText("1")[1]).toBeInTheDocument();

		// Check errors
		expect(screen.getByText("Errors")).toBeInTheDocument();
		expect(screen.getAllByText("1")[2]).toBeInTheDocument();
	});

	it("displays empty state messages correctly", () => {
		render(<DashboardStats projects={[]} />);

		expect(screen.getByText("No projects yet")).toBeInTheDocument();
		expect(screen.getByText("None processing")).toBeInTheDocument();
		expect(screen.getByText("None completed")).toBeInTheDocument();
		expect(screen.getByText("No errors")).toBeInTheDocument();
	});

	it("displays correct icons for each stat", () => {
		const { container } = render(<DashboardStats projects={mockProjects} />);

		// All stat cards should have icons (SVG elements)
		const svgs = container.querySelectorAll("svg");
		expect(svgs).toHaveLength(4);
	});
});
