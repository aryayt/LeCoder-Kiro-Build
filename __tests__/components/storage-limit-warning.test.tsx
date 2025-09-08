import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StorageLimitWarning } from "~/components/ui/storage-limit-warning";
import type { Project } from "~/types/project";

const createMockProject = (
	id: string,
	fileSize: number = 1024 * 1024,
): Project => ({
	id,
	title: `Project ${id}`,
	status: "COMPLETED",
	currentStage: 6,
	paperContent: "test content",
	metadata: {
		fileName: `project-${id}.pdf`,
		fileSize,
		pageCount: 10,
	},
	stages: [],
	createdAt: "2024-01-01T00:00:00Z",
	updatedAt: "2024-01-01T00:00:00Z",
});

describe("StorageLimitWarning", () => {
	it("does not render when usage is below 80%", () => {
		const projects = Array.from({ length: 10 }, (_, i) =>
			createMockProject(i.toString()),
		);

		render(<StorageLimitWarning projects={projects} maxProjects={50} />);

		expect(
			screen.queryByText(/Storage Usage Warning/i),
		).not.toBeInTheDocument();
	});

	it("renders info warning when project usage is 80-89%", () => {
		const projects = Array.from({ length: 40 }, (_, i) =>
			createMockProject(i.toString()),
		);

		render(<StorageLimitWarning projects={projects} maxProjects={50} />);

		expect(screen.getByText("Storage Usage Warning")).toBeInTheDocument();
		expect(
			screen.getByText(/You're using 40 of 50 projects \(80%\)/),
		).toBeInTheDocument();
	});

	it("renders warning when project usage is 90-99%", () => {
		const projects = Array.from({ length: 45 }, (_, i) =>
			createMockProject(i.toString()),
		);

		render(<StorageLimitWarning projects={projects} maxProjects={50} />);

		expect(screen.getByText("Storage Almost Full")).toBeInTheDocument();
		expect(
			screen.getByText(/You're using 45 of 50 projects \(90%\)/),
		).toBeInTheDocument();
	});

	it("renders error when project limit is reached", () => {
		const projects = Array.from({ length: 50 }, (_, i) =>
			createMockProject(i.toString()),
		);

		render(<StorageLimitWarning projects={projects} maxProjects={50} />);

		expect(screen.getByText("Storage Limit Reached")).toBeInTheDocument();
		expect(
			screen.getByText(/You've reached the maximum of 50 projects/),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				/Please delete some projects to free up space before uploading new papers/,
			),
		).toBeInTheDocument();
	});

	it("renders warning when storage usage is high", () => {
		const largeFileSize = 100 * 1024 * 1024; // 100MB each
		const projects = Array.from({ length: 10 }, (_, i) =>
			createMockProject(i.toString(), largeFileSize),
		);

		const maxStorageBytes = 1024 * 1024 * 1024; // 1GB
		render(
			<StorageLimitWarning
				projects={projects}
				maxProjects={50}
				maxStorageBytes={maxStorageBytes}
			/>,
		);

		expect(screen.getByText("Storage Almost Full")).toBeInTheDocument();
		expect(screen.getByText(/You're using.*of.*storage/)).toBeInTheDocument();
	});

	it("renders error when storage limit is reached", () => {
		const largeFileSize = 200 * 1024 * 1024; // 200MB each
		const projects = Array.from({ length: 6 }, (_, i) =>
			createMockProject(i.toString(), largeFileSize),
		);

		const maxStorageBytes = 1024 * 1024 * 1024; // 1GB
		render(
			<StorageLimitWarning
				projects={projects}
				maxProjects={50}
				maxStorageBytes={maxStorageBytes}
			/>,
		);

		expect(screen.getByText("Storage Limit Reached")).toBeInTheDocument();
		expect(
			screen.getByText(/You've reached the storage limit of/),
		).toBeInTheDocument();
	});

	it("formats bytes correctly", () => {
		const largeFileSize = 100 * 1024 * 1024; // 100MB each
		const projects = Array.from({ length: 9 }, (_, i) =>
			createMockProject(i.toString(), largeFileSize),
		);

		const maxStorageBytes = 1024 * 1024 * 1024; // 1GB
		render(
			<StorageLimitWarning
				projects={projects}
				maxProjects={50}
				maxStorageBytes={maxStorageBytes}
			/>,
		);

		expect(screen.getByText(/900 MB of 1 GB storage/)).toBeInTheDocument();
	});

	it("can be dismissed", async () => {
		const user = userEvent.setup();
		const projects = Array.from({ length: 40 }, (_, i) =>
			createMockProject(i.toString()),
		);

		render(<StorageLimitWarning projects={projects} maxProjects={50} />);

		expect(screen.getByText("Storage Usage Warning")).toBeInTheDocument();

		const dismissButton = screen.getByText("Dismiss");
		await user.click(dismissButton);

		expect(screen.queryByText("Storage Usage Warning")).not.toBeInTheDocument();
	});

	it("handles projects with no metadata", () => {
		const projectsWithoutMetadata: Project[] = [
			{
				id: "1",
				title: "Project 1",
				status: "COMPLETED",
				currentStage: 6,
				paperContent: "test content",
				metadata: null,
				stages: [],
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			},
		];

		const projects = [
			...projectsWithoutMetadata,
			...Array.from({ length: 39 }, (_, i) =>
				createMockProject((i + 2).toString()),
			),
		];

		render(<StorageLimitWarning projects={projects} maxProjects={50} />);

		expect(screen.getByText("Storage Usage Warning")).toBeInTheDocument();
	});

	it("uses default limits when not provided", () => {
		const projects = Array.from({ length: 40 }, (_, i) =>
			createMockProject(i.toString()),
		);

		render(<StorageLimitWarning projects={projects} />);

		expect(screen.getByText("Storage Usage Warning")).toBeInTheDocument();
		expect(
			screen.getByText(/You're using 40 of 50 projects/),
		).toBeInTheDocument();
	});

	it("shows appropriate icons for different warning types", () => {
		const { rerender } = render(
			<StorageLimitWarning
				projects={Array.from({ length: 40 }, (_, i) =>
					createMockProject(i.toString()),
				)}
				maxProjects={50}
			/>,
		);

		// Info warning should have info icon
		let icon = document.querySelector("svg");
		expect(icon).toBeInTheDocument();

		// Warning level
		rerender(
			<StorageLimitWarning
				projects={Array.from({ length: 45 }, (_, i) =>
					createMockProject(i.toString()),
				)}
				maxProjects={50}
			/>,
		);

		icon = document.querySelector("svg");
		expect(icon).toBeInTheDocument();

		// Error level
		rerender(
			<StorageLimitWarning
				projects={Array.from({ length: 50 }, (_, i) =>
					createMockProject(i.toString()),
				)}
				maxProjects={50}
			/>,
		);

		icon = document.querySelector("svg");
		expect(icon).toBeInTheDocument();
	});
});
