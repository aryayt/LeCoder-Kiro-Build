import {
	formatFileSize,
	generateProjectTitle,
	isPDFFile,
} from "../../src/lib/utils";

describe("Utility Functions", () => {
	describe("formatFileSize", () => {
		it("should format bytes correctly", () => {
			expect(formatFileSize(0)).toBe("0 Bytes");
			expect(formatFileSize(1024)).toBe("1 KB");
			expect(formatFileSize(1048576)).toBe("1 MB");
			expect(formatFileSize(1073741824)).toBe("1 GB");
		});

		it("should handle decimal values", () => {
			expect(formatFileSize(1536)).toBe("1.5 KB");
			expect(formatFileSize(2097152)).toBe("2 MB");
		});
	});

	describe("isPDFFile", () => {
		it("should validate PDF files by MIME type", () => {
			const pdfFile = new File([""], "test.pdf", { type: "application/pdf" });
			expect(isPDFFile(pdfFile)).toBe(true);
		});

		it("should validate PDF files by extension", () => {
			const pdfFile = new File([""], "test.PDF", { type: "text/plain" });
			expect(isPDFFile(pdfFile)).toBe(true);
		});

		it("should reject non-PDF files", () => {
			const txtFile = new File([""], "test.txt", { type: "text/plain" });
			expect(isPDFFile(txtFile)).toBe(false);
		});
	});

	describe("generateProjectTitle", () => {
		it("should extract meaningful title from paper content", () => {
			const content =
				"This is a research paper about machine learning algorithms. It explores various approaches.";
			const title = generateProjectTitle(content);
			expect(title).toBe("This is a research paper about machine learning...");
		});

		it("should truncate long titles", () => {
			const content =
				"This is a very long research paper title that should be truncated because it exceeds the maximum length limit.";
			const title = generateProjectTitle(content);
			expect(title.length).toBeLessThanOrEqual(50);
			expect(title).toContain("...");
		});

		it("should provide fallback for empty content", () => {
			const title = generateProjectTitle("");
			expect(title).toMatch(/Research Project \d{4}-\d{2}-\d{2}/);
		});
	});
});
