import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UploadZone } from "~/components/ui/upload-zone";

// Mock the PDF processor
jest.mock("~/lib/pdf/processor", () => ({
	validatePdfFile: jest.fn(),
}));

describe("UploadZone Component", () => {
	const mockOnFileUpload = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should render upload zone with correct text", () => {
		render(<UploadZone onFileUpload={mockOnFileUpload} isUploading={false} />);

		expect(screen.getByText("Upload your research paper")).toBeInTheDocument();
		expect(
			screen.getByText(/Drag and drop a PDF file here/),
		).toBeInTheDocument();
	});

	it("should show loading state when uploading", () => {
		render(<UploadZone onFileUpload={mockOnFileUpload} isUploading={true} />);

		expect(screen.getByText("Processing...")).toBeInTheDocument();
		expect(
			screen.getByText("Please wait while we process your PDF"),
		).toBeInTheDocument();
	});

	it("should handle file input change", async () => {
		const user = userEvent.setup();

		render(<UploadZone onFileUpload={mockOnFileUpload} isUploading={false} />);

		const file = new File(["test content"], "test.pdf", {
			type: "application/pdf",
		});

		const input = document.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;

		await user.upload(input, file);

		await waitFor(() => {
			expect(mockOnFileUpload).toHaveBeenCalledWith(file);
		});
	});

	it("should handle drag and drop", async () => {
		render(<UploadZone onFileUpload={mockOnFileUpload} isUploading={false} />);

		const file = new File(["test content"], "test.pdf", {
			type: "application/pdf",
		});

		const dropZone = screen
			.getByText("Upload your research paper")
			.closest("div");

		if (dropZone) {
			// Simulate drag over
			fireEvent.dragOver(dropZone, {
				dataTransfer: {
					files: [file],
				},
			});

			// Simulate drop
			fireEvent.drop(dropZone, {
				dataTransfer: {
					files: [file],
				},
			});
		}

		await waitFor(() => {
			expect(mockOnFileUpload).toHaveBeenCalledWith(file);
		});
	});

	it("should show error message when validation fails", async () => {
		const { validatePdfFile } = require("~/lib/pdf/processor");
		validatePdfFile.mockReturnValue({
			message: "Invalid file type",
			code: "INVALID_FILE_TYPE",
		});

		const user = userEvent.setup();

		render(<UploadZone onFileUpload={mockOnFileUpload} isUploading={false} />);

		const file = new File(["test content"], "test.txt", {
			type: "text/plain",
		});

		const input = document.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;

		await user.upload(input, file);

		await waitFor(() => {
			expect(screen.getByText("Invalid file type")).toBeInTheDocument();
		});

		expect(mockOnFileUpload).not.toHaveBeenCalled();
	});

	it("should show error when upload fails", async () => {
		mockOnFileUpload.mockRejectedValue(new Error("Upload failed"));

		const user = userEvent.setup();

		render(<UploadZone onFileUpload={mockOnFileUpload} isUploading={false} />);

		const file = new File(["test content"], "test.pdf", {
			type: "application/pdf",
		});

		const input = document.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;

		await user.upload(input, file);

		await waitFor(() => {
			expect(screen.getByText("Upload failed")).toBeInTheDocument();
		});
	});

	it("should disable input when uploading", () => {
		render(<UploadZone onFileUpload={mockOnFileUpload} isUploading={true} />);

		const input = document.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;
		expect(input).toBeDisabled();
	});

	it("should accept custom file size limit", () => {
		render(
			<UploadZone
				onFileUpload={mockOnFileUpload}
				isUploading={false}
				maxSize={25}
			/>,
		);

		expect(screen.getByText(/max 25MB/)).toBeInTheDocument();
	});
});
