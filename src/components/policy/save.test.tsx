import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { usePolicyStore } from "~/lib/state/policy";
import { SavePolicy } from "./save";

// Mock dependencies
jest.mock("next/navigation", () => ({
	useRouter: jest.fn(),
}));

jest.mock("sonner", () => ({
	toast: jest.fn(),
}));

jest.mock("~/lib/state/policy", () => ({
	usePolicyStore: jest.fn(),
}));

const mockRouter = {
	push: jest.fn(),
	replace: jest.fn(),
	back: jest.fn(),
	forward: jest.fn(),
	refresh: jest.fn(),
	prefetch: jest.fn(),
};

const mockPolicyStore = {
	id: null,
	name: "Test Policy",
	setPolicyName: jest.fn(),
	savePolicy: jest.fn(),
};

describe("SavePolicy", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(useRouter as jest.Mock).mockReturnValue(mockRouter);
		(usePolicyStore as unknown as jest.Mock).mockReturnValue(mockPolicyStore);
	});

	describe("New Policy (no ID)", () => {
		it("should render save dialog trigger", () => {
			render(<SavePolicy />);

			const saveButton = screen.getByRole("button", { name: /save/i });
			expect(saveButton).toBeInTheDocument();
		});

		it("should open dialog when save button is clicked", async () => {
			const user = userEvent.setup();
			render(<SavePolicy />);

			const saveButton = screen.getByRole("button", { name: /save/i });
			await user.click(saveButton);

			expect(
				screen.getByRole("heading", { name: "Save Policy" }),
			).toBeInTheDocument();
			expect(screen.getByText("Save the draft policy")).toBeInTheDocument();
			expect(screen.getByPlaceholderText("Policy Name")).toBeInTheDocument();
		});

		it("should validate policy name is required", async () => {
			const user = userEvent.setup();
			render(<SavePolicy />);

			// Open dialog
			const saveButton = screen.getByRole("button", { name: /save/i });
			await user.click(saveButton);

			// Try to submit without name
			const submitButton = screen.getByRole("button", { name: "Save Policy" });
			await user.click(submitButton);

			await waitFor(() => {
				expect(
					screen.getByText("Policy name needs to be more than 2 chars"),
				).toBeInTheDocument();
			});
		});

		it("should save policy successfully", async () => {
			const user = userEvent.setup();
			mockPolicyStore.savePolicy.mockResolvedValue({
				success: true,
				returnId: "new-policy-id",
			});

			render(<SavePolicy />);

			// Open dialog
			const saveButton = screen.getByRole("button", { name: /save/i });
			await user.click(saveButton);

			// Fill form
			const nameInput = screen.getByPlaceholderText("Policy Name");
			await user.type(nameInput, "My New Policy");

			// Submit
			const submitButton = screen.getByRole("button", { name: "Save Policy" });
			await user.click(submitButton);

			await waitFor(() => {
				expect(mockPolicyStore.setPolicyName).toHaveBeenCalledWith(
					"My New Policy",
				);
				expect(mockPolicyStore.savePolicy).toHaveBeenCalled();
				expect(toast).toHaveBeenCalledWith("Policy Saved!");
				expect(mockRouter.push).toHaveBeenCalledWith("/policy/new-policy-id");
			});
		});

		it("should handle save error", async () => {
			const user = userEvent.setup();
			mockPolicyStore.savePolicy.mockResolvedValue({
				success: false,
				error: "Validation failed",
			});

			render(<SavePolicy />);

			// Open dialog and fill form
			const saveButton = screen.getByRole("button", { name: /save/i });
			await user.click(saveButton);

			const nameInput = screen.getByPlaceholderText("Policy Name");
			await user.type(nameInput, "Test Policy");

			const submitButton = screen.getByRole("button", { name: "Save Policy" });
			await user.click(submitButton);

			await waitFor(() => {
				expect(toast).toHaveBeenCalledWith("Failed to Save Policy!");
			});
		});

		it("should close dialog on cancel", async () => {
			const user = userEvent.setup();
			render(<SavePolicy />);

			// Open dialog
			const saveButton = screen.getByRole("button", { name: /save/i });
			await user.click(saveButton);

			expect(
				screen.getByRole("heading", { name: "Save Policy" }),
			).toBeInTheDocument();

			// Cancel
			const cancelButton = screen.getByRole("button", { name: "Cancel" });
			await user.click(cancelButton);

			await waitFor(() => {
				expect(
					screen.queryByRole("heading", { name: "Save Policy" }),
				).not.toBeInTheDocument();
			});
		});
	});

	describe("Existing Policy (with ID)", () => {
		beforeEach(() => {
			// biome-ignore lint/suspicious/noExplicitAny: anything
			(mockPolicyStore as any).id = "existing-policy-id";
		});

		it("should render update button directly", () => {
			render(<SavePolicy />);

			const updateButton = screen.getByRole("button", { name: "Update Draft" });
			expect(updateButton).toBeInTheDocument();
			expect(screen.queryByText("Save Policy")).not.toBeInTheDocument();
		});

		it("should update policy directly without dialog", async () => {
			const user = userEvent.setup();
			mockPolicyStore.savePolicy.mockResolvedValue({
				success: true,
				returnId: "existing-policy-id",
			});

			render(<SavePolicy />);

			const updateButton = screen.getByRole("button", { name: "Update Draft" });
			await user.click(updateButton);

			await waitFor(() => {
				expect(mockPolicyStore.savePolicy).toHaveBeenCalled();
				expect(toast).toHaveBeenCalledWith("Policy Saved!");
			});
		});

		it("should show loading state while saving", async () => {
			const user = userEvent.setup();
			mockPolicyStore.savePolicy.mockImplementation(
				() =>
					new Promise((resolve) =>
						setTimeout(() => resolve({ success: true }), 100),
					),
			);

			render(<SavePolicy />);

			const updateButton = screen.getByRole("button", { name: "Update Draft" });
			await user.click(updateButton);

			expect(screen.getByText("Saving...")).toBeInTheDocument();
			expect(updateButton).toBeDisabled();

			await waitFor(() => {
				expect(screen.queryByText("Saving...")).not.toBeInTheDocument();
			});
		});
	});
});
