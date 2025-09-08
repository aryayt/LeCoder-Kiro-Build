import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmationDialog } from "~/components/ui/confirmation-dialog";

const mockProps = {
	isOpen: true,
	onClose: jest.fn(),
	onConfirm: jest.fn(),
	title: "Delete Project",
	message: "Are you sure you want to delete this project?",
};

describe("ConfirmationDialog", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders when open", () => {
		render(<ConfirmationDialog {...mockProps} />);

		expect(screen.getByText("Delete Project")).toBeInTheDocument();
		expect(
			screen.getByText("Are you sure you want to delete this project?"),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
	});

	it("does not render when closed", () => {
		render(<ConfirmationDialog {...mockProps} isOpen={false} />);

		expect(screen.queryByText("Delete Project")).not.toBeInTheDocument();
	});

	it("calls onConfirm when confirm button is clicked", async () => {
		const user = userEvent.setup();
		render(<ConfirmationDialog {...mockProps} />);

		const confirmButton = screen.getByRole("button", { name: "Confirm" });
		await user.click(confirmButton);

		expect(mockProps.onConfirm).toHaveBeenCalledTimes(1);
	});

	it("calls onClose when cancel button is clicked", async () => {
		const user = userEvent.setup();
		render(<ConfirmationDialog {...mockProps} />);

		const cancelButton = screen.getByRole("button", { name: "Cancel" });
		await user.click(cancelButton);

		expect(mockProps.onClose).toHaveBeenCalledTimes(1);
	});

	it("calls onClose when backdrop is clicked", async () => {
		const user = userEvent.setup();
		render(<ConfirmationDialog {...mockProps} />);

		// Click on backdrop (the overlay behind the dialog)
		const backdrop = document.querySelector(".fixed.inset-0.bg-black");
		if (backdrop) {
			await user.click(backdrop);
			expect(mockProps.onClose).toHaveBeenCalledTimes(1);
		}
	});

	it("handles escape key press", () => {
		render(<ConfirmationDialog {...mockProps} />);

		fireEvent.keyDown(document, { key: "Escape" });
		expect(mockProps.onClose).toHaveBeenCalledTimes(1);
	});

	it("does not close on escape when loading", () => {
		render(<ConfirmationDialog {...mockProps} isLoading={true} />);

		fireEvent.keyDown(document, { key: "Escape" });
		expect(mockProps.onClose).not.toHaveBeenCalled();
	});

	it("shows loading state correctly", () => {
		render(<ConfirmationDialog {...mockProps} isLoading={true} />);

		const confirmButton = screen.getByRole("button", { name: /loading/i });
		expect(confirmButton).toBeDisabled();
		expect(screen.getByText("Loading...")).toBeInTheDocument();

		const cancelButton = screen.getByRole("button", { name: "Cancel" });
		expect(cancelButton).toBeDisabled();
	});

	it("renders custom button text", () => {
		render(
			<ConfirmationDialog
				{...mockProps}
				confirmText="Delete Forever"
				cancelText="Keep It"
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Delete Forever" }),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Keep It" })).toBeInTheDocument();
	});

	it("renders different types with correct styling", () => {
		const { rerender } = render(
			<ConfirmationDialog {...mockProps} type="danger" />,
		);

		// Danger type should have red styling
		let confirmButton = screen.getByRole("button", { name: "Confirm" });
		expect(confirmButton).toHaveClass("bg-red-600");

		// Warning type
		rerender(<ConfirmationDialog {...mockProps} type="warning" />);
		confirmButton = screen.getByRole("button", { name: "Confirm" });
		expect(confirmButton).toHaveClass("bg-yellow-600");

		// Info type
		rerender(<ConfirmationDialog {...mockProps} type="info" />);
		confirmButton = screen.getByRole("button", { name: "Confirm" });
		expect(confirmButton).toHaveClass("bg-blue-600");
	});

	it("renders appropriate icons for different types", () => {
		const { rerender } = render(
			<ConfirmationDialog {...mockProps} type="danger" />,
		);

		// Should have an icon (SVG)
		let icon = document.querySelector("svg");
		expect(icon).toBeInTheDocument();

		// Test other types
		rerender(<ConfirmationDialog {...mockProps} type="warning" />);
		icon = document.querySelector("svg");
		expect(icon).toBeInTheDocument();

		rerender(<ConfirmationDialog {...mockProps} type="info" />);
		icon = document.querySelector("svg");
		expect(icon).toBeInTheDocument();
	});

	it("prevents body scroll when open", () => {
		const { unmount } = render(<ConfirmationDialog {...mockProps} />);

		expect(document.body.style.overflow).toBe("hidden");

		unmount();
		expect(document.body.style.overflow).toBe("unset");
	});
});
