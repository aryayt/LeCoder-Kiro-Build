import { fileToBuffer, validatePdfFile } from "~/lib/pdf/processor";

describe("PDF Processor", () => {
	describe("validatePdfFile", () => {
		it("should accept valid PDF files", () => {
			const validFile = new File(["test content"], "test.pdf", {
				type: "application/pdf",
			});

			const result = validatePdfFile(validFile);
			expect(result).toBeNull();
		});

		it("should reject non-PDF files", () => {
			const invalidFile = new File(["test content"], "test.txt", {
				type: "text/plain",
			});

			const result = validatePdfFile(invalidFile);
			expect(result).toEqual({
				message: "Invalid file type. Only PDF files are accepted.",
				code: "INVALID_FILE_TYPE",
			});
		});

		it("should reject files larger than 50MB", () => {
			// Create a mock file that's larger than 50MB
			const largeFile = new File(["x".repeat(51 * 1024 * 1024)], "large.pdf", {
				type: "application/pdf",
			});

			const result = validatePdfFile(largeFile);
			expect(result).toEqual({
				message: "File size exceeds 50MB limit.",
				code: "FILE_TOO_LARGE",
			});
		});

		it("should reject empty files", () => {
			const emptyFile = new File([], "empty.pdf", {
				type: "application/pdf",
			});

			const result = validatePdfFile(emptyFile);
			expect(result).toEqual({
				message: "File is empty.",
				code: "EMPTY_FILE",
			});
		});

		it("should accept PDF files without proper MIME type but with .pdf extension", () => {
			const pdfFile = new File(["test content"], "test.pdf", {
				type: "application/octet-stream", // Generic MIME type
			});

			const result = validatePdfFile(pdfFile);
			expect(result).toBeNull();
		});
	});

	describe("fileToBuffer", () => {
		it("should convert File to Buffer", async () => {
			const testContent = "test file content";
			const mockFile = {
				arrayBuffer: jest
					.fn()
					.mockResolvedValue(new ArrayBuffer(testContent.length)),
			} as unknown as File;

			// Mock the arrayBuffer to return the test content
			const encoder = new TextEncoder();
			const arrayBuffer = encoder.encode(testContent).buffer;
			(mockFile.arrayBuffer as jest.Mock).mockResolvedValue(arrayBuffer);

			const buffer = await fileToBuffer(mockFile);

			expect(buffer).toBeInstanceOf(Buffer);
			expect(buffer.toString()).toBe(testContent);
		});

		it("should handle binary data correctly", async () => {
			const binaryData = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF header
			const mockFile = {
				arrayBuffer: jest.fn().mockResolvedValue(binaryData.buffer),
			} as unknown as File;

			const buffer = await fileToBuffer(mockFile);

			expect(buffer).toBeInstanceOf(Buffer);
			expect(buffer[0]).toBe(0x25);
			expect(buffer[1]).toBe(0x50);
			expect(buffer[2]).toBe(0x44);
			expect(buffer[3]).toBe(0x46);
		});
	});
});
