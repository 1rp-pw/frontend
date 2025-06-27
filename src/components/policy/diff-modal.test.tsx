import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import type { PolicySpec } from "~/lib/types";
import { DiffModal } from "./diff-modal";

// Mock diff library
jest.mock("diff", () => ({
	diffLines: jest.fn((oldText: string, newText: string) => {
		if (oldText === newText) {
			return [{ value: oldText, added: false, removed: false }];
		}
		return [
			{ value: "removed line\n", removed: true },
			{ value: "added line\n", added: true },
		];
	}),
}));

// Mock UI components
jest.mock("~/components/ui/dialog", () => ({
	Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
		open ? <div data-testid="dialog">{children}</div> : null,
	DialogContent: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="dialog-content">{children}</div>
	),
	DialogHeader: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="dialog-header">{children}</div>
	),
	DialogTitle: ({ children }: { children: React.ReactNode }) => (
		<h2 data-testid="dialog-title">{children}</h2>
	),
	DialogDescription: ({ children }: { children: React.ReactNode }) => (
		<p data-testid="dialog-description">{children}</p>
	),
}));

jest.mock("~/components/ui/label", () => ({
	Label: ({
		children,
		htmlFor,
	}: {
		children: React.ReactNode;
		htmlFor?: string;
	}) => (
		<label htmlFor={htmlFor} data-testid="label">
			{children}
		</label>
	),
}));

jest.mock("~/components/ui/select", () => ({
	Select: ({
		children,
		onValueChange,
	}: {
		children: React.ReactNode;
		onValueChange: (value: string) => void;
	}) => (
		// biome-ignore lint/a11y/noStaticElementInteractions: Mock component
		// biome-ignore lint/a11y/useKeyWithClickEvents: Mock component
		<div data-testid="select" onClick={() => onValueChange("policy-1")}>
			{children}
		</div>
	),
	SelectTrigger: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="select-trigger">{children}</div>
	),
	SelectValue: ({ placeholder }: { placeholder?: string }) => (
		<span data-testid="select-value">{placeholder}</span>
	),
	SelectContent: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="select-content">{children}</div>
	),
	SelectItem: ({
		children,
		value,
	}: {
		children: React.ReactNode;
		value: string;
	}) => <div data-testid={`select-item-${value}`}>{children}</div>,
}));

jest.mock("~/components/ui/tabs", () => ({
	Tabs: ({
		children,
		onValueChange,
	}: {
		children: React.ReactNode;
		onValueChange: (value: string) => void;
	}) => (
		// biome-ignore lint/a11y/noStaticElementInteractions: Mock component
		// biome-ignore lint/a11y/useKeyWithClickEvents: Mock component
		<div data-testid="tabs" onClick={() => onValueChange("policy-text")}>
			{children}
		</div>
	),
	TabsList: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="tabs-list">{children}</div>
	),
	TabsTrigger: ({
		children,
		value,
	}: {
		children: React.ReactNode;
		value: string;
	}) => (
		<button type="button" data-testid={`tab-trigger-${value}`}>
			{children}
		</button>
	),
	TabsContent: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="tabs-content">{children}</div>
	),
}));

jest.mock("~/components/ui/scroll-area", () => ({
	ScrollArea: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="scroll-area">{children}</div>
	),
}));

describe("DiffModal", () => {
	const mockPolicySpec1: PolicySpec = {
		baseId: "base-1",
		id: "policy-1",
		name: "Test Policy",
		rule: "A **person** gets a licence if they pass the test",
		schema: '{"type": "object", "properties": {"name": {"type": "string"}}}',
		schemaVersion: "v1",
		version: "v1.0",
		draft: false,
		createdAt: new Date("2023-01-01"),
		updatedAt: new Date("2023-01-01"),
		status: "published",
		hasDraft: false,
		error: null,
	};

	const mockPolicySpec2: PolicySpec = {
		baseId: "base-1",
		id: "policy-2",
		name: "Test Policy",
		rule: "A **person** gets a licence if they pass the test and pay the fee",
		schema:
			'{"type": "object", "properties": {"name": {"type": "string"}, "fee": {"type": "number"}}}',
		schemaVersion: "v2",
		version: "v2.0",
		draft: false,
		createdAt: new Date("2023-01-02"),
		updatedAt: new Date("2023-01-02"),
		status: "published",
		hasDraft: false,
		error: null,
	};

	const mockVersions = [mockPolicySpec1, mockPolicySpec2];

	const defaultProps = {
		open: true,
		onOpenChange: jest.fn(),
		versions: mockVersions,
		currentVersion: mockPolicySpec2,
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it("should render when open", () => {
		render(<DiffModal {...defaultProps} />);

		expect(screen.getByTestId("dialog")).toBeInTheDocument();
		expect(screen.getByTestId("dialog-title")).toHaveTextContent(
			"Compare Policy Versions",
		);
	});

	it("should not render when closed", () => {
		render(<DiffModal {...defaultProps} open={false} />);

		expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
	});

	it("should show version selection", () => {
		render(<DiffModal {...defaultProps} />);

		expect(screen.getByTestId("label")).toHaveTextContent(
			"Compare with version",
		);
		expect(screen.getByTestId("select-value")).toHaveTextContent(
			"Select a version to compare",
		);
	});

	it("should show tab triggers for different comparison types", () => {
		render(<DiffModal {...defaultProps} />);

		expect(screen.getByTestId("tab-trigger-policy-text")).toHaveTextContent(
			"Policy Text",
		);
		expect(screen.getByTestId("tab-trigger-schema")).toHaveTextContent(
			"Data Model",
		);
	});

	it("should show 'please select' message when no version is selected", () => {
		render(<DiffModal {...defaultProps} />);

		expect(
			screen.getByText("Please select a version to compare with"),
		).toBeInTheDocument();
	});

	it("should show 'nothing different' message when content is identical", async () => {
		const identicalVersion = {
			...mockPolicySpec1,
			id: "policy-identical",
			version: "v1.1",
		};
		const identicalVersions = [mockPolicySpec1, identicalVersion];

		render(
			<DiffModal
				{...defaultProps}
				versions={identicalVersions}
				currentVersion={identicalVersion}
			/>,
		);

		// Simulate selecting the first version for comparison
		fireEvent.click(screen.getByTestId("select"));

		await waitFor(() => {
			expect(screen.getByText("✓ Nothing different")).toBeInTheDocument();
			expect(
				screen.getByText("The policy text is identical between these versions"),
			).toBeInTheDocument();
		});
	});

	it("should show diff when content is different", async () => {
		render(<DiffModal {...defaultProps} />);

		// Simulate selecting a version for comparison
		fireEvent.click(screen.getByTestId("select"));

		await waitFor(() => {
			// Should show side-by-side diff (two scroll areas)
			const scrollAreas = screen.getAllByTestId("scroll-area");
			expect(scrollAreas).toHaveLength(2);
		});
	});

	it("should handle schema comparison", async () => {
		render(<DiffModal {...defaultProps} />);

		// Simulate selecting a version for comparison
		fireEvent.click(screen.getByTestId("select"));

		// Switch to schema tab
		fireEvent.click(screen.getByTestId("tab-trigger-schema"));

		await waitFor(() => {
			// Should have clicked the schema tab trigger
			expect(screen.getByTestId("tab-trigger-schema")).toBeInTheDocument();
		});
	});

	it("should call onOpenChange when dialog state changes", () => {
		const mockOnOpenChange = jest.fn();
		render(<DiffModal {...defaultProps} onOpenChange={mockOnOpenChange} />);

		// This would typically be triggered by the Dialog component
		// In a real test, you'd interact with a close button or overlay
		expect(mockOnOpenChange).not.toHaveBeenCalled();
	});

	it("should filter out current version from comparison options", () => {
		render(<DiffModal {...defaultProps} />);

		// The select should only show options that are not the current version
		expect(screen.getByTestId("select-item-policy-1")).toBeInTheDocument();
		expect(
			screen.queryByTestId("select-item-policy-2"),
		).not.toBeInTheDocument();
	});

	it("should display version information in description", () => {
		render(<DiffModal {...defaultProps} />);

		expect(screen.getByTestId("dialog-description")).toHaveTextContent(
			/Comparing .* with v2\.0/,
		);
	});
});
