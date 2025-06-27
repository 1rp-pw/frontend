import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { FlowEdgeData, FlowNodeData, FlowSpec } from "~/lib/types";
import { FlowDiffModal } from "./flow-diff-modal";

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

// Mock UI components (same as policy diff modal)
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
		<div data-testid="select" onClick={() => onValueChange("test-flow-id")}>
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
		<div data-testid="tabs" onClick={() => onValueChange("nodes")}>
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

describe("FlowDiffModal", () => {
	const mockFlowSpec1: FlowSpec = {
		baseId: "base-1",
		id: "flow-1",
		name: "Test Flow",
		description: "Test flow description",
		nodes: JSON.stringify([
			{
				id: "start-1",
				type: "start",
				label: "Start",
				policyId: "policy-1",
				position: { x: 100, y: 100 },
			},
			{
				id: "return-1",
				type: "return",
				label: "Return True",
				returnValue: true,
				position: { x: 300, y: 100 },
			},
		]) as unknown as FlowNodeData[],
		edges: JSON.stringify([
			{
				id: "edge-1",
				source: "start-1",
				target: "return-1",
				label: "True",
				style: { stroke: "#22c55e" },
			},
		]) as unknown as FlowEdgeData[],
		version: "v1.0",
		draft: false,
		status: "published",
		createdAt: new Date("2023-01-01"),
		updatedAt: new Date("2023-01-01"),
		lastPublishedAt: new Date("2023-01-01"),
		hasDraft: false,
		flow: "",
		error: null,
	};

	const mockFlowSpec2: FlowSpec = {
		baseId: "base-1",
		id: "flow-2",
		name: "Test Flow",
		description: "Updated flow description",
		nodes: JSON.stringify([
			{
				id: "start-1",
				type: "start",
				label: "Start",
				policyId: "policy-2", // Changed policy
				position: { x: 150, y: 150 }, // Position changed (should be ignored)
			},
			{
				id: "return-1",
				type: "return",
				label: "Return False", // Changed return value
				returnValue: false,
				position: { x: 350, y: 150 },
			},
		]) as unknown as FlowNodeData[],
		edges: JSON.stringify([
			{
				id: "edge-1",
				source: "start-1",
				target: "return-1",
				label: "False", // Changed label
				style: { stroke: "#ef4444" }, // Style changed (should be ignored)
			},
		]) as unknown as FlowEdgeData[],
		version: "v2.0",
		draft: false,
		status: "published",
		createdAt: new Date("2023-01-02"),
		updatedAt: new Date("2023-01-02"),
		lastPublishedAt: new Date("2023-01-02"),
		hasDraft: false,
		flow: "",
		error: null,
	};

	const mockVersions = [mockFlowSpec1, mockFlowSpec2];

	const defaultProps = {
		open: true,
		onOpenChange: jest.fn(),
		versions: mockVersions,
		currentVersion: mockFlowSpec2,
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should render when open", () => {
		render(<FlowDiffModal {...defaultProps} />);

		expect(screen.getByTestId("dialog")).toBeInTheDocument();
		expect(screen.getByTestId("dialog-title")).toHaveTextContent(
			"Compare Flow Versions",
		);
	});

	it("should not render when closed", () => {
		render(<FlowDiffModal {...defaultProps} open={false} />);

		expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
	});

	it("should show flow-specific tab triggers", () => {
		render(<FlowDiffModal {...defaultProps} />);

		expect(screen.getByTestId("tab-trigger-nodes")).toHaveTextContent(
			"Flow Nodes",
		);
		expect(screen.getByTestId("tab-trigger-edges")).toHaveTextContent(
			"Connections",
		);
		expect(screen.getByTestId("tab-trigger-description")).toHaveTextContent(
			"Description",
		);
	});

	it("should show 'please select' message when no version is selected", () => {
		render(<FlowDiffModal {...defaultProps} />);

		expect(
			screen.getByText("Please select a version to compare with"),
		).toBeInTheDocument();
	});

	it("should show meaningful field information for nodes", async () => {
		render(<FlowDiffModal {...defaultProps} />);

		// Simulate selecting a version for comparison
		fireEvent.click(screen.getByTestId("select"));

		await waitFor(() => {
			expect(
				screen.getByText("Comparing: type, policyId, returnValue, outcome"),
			).toBeInTheDocument();
		});
	});

	it("should show meaningful field information for edges", async () => {
		render(<FlowDiffModal {...defaultProps} />);

		// Simulate selecting a version for comparison
		fireEvent.click(screen.getByTestId("select"));

		// Switch to edges tab
		fireEvent.click(screen.getByTestId("tab-trigger-edges"));

		await waitFor(() => {
			expect(
				screen.getByText("Comparing: source, target, labels"),
			).toBeInTheDocument();
		});
	});

	it("should show 'nothing different' for identical nodes", async () => {
		const identicalVersion = {
			...mockFlowSpec1,
			id: "flow-identical",
			version: "v1.1",
		};
		const identicalFlows = [mockFlowSpec1, identicalVersion];

		render(
			<FlowDiffModal
				{...defaultProps}
				versions={identicalFlows}
				currentVersion={identicalVersion}
			/>,
		);

		// Simulate selecting the first version for comparison
		fireEvent.click(screen.getByTestId("select"));

		await waitFor(() => {
			expect(screen.getByText("✓ Nothing different")).toBeInTheDocument();
			expect(
				screen.getByText("The flow nodes are identical between these versions"),
			).toBeInTheDocument();
		});
	});

	it("should show 'nothing different' for identical descriptions", async () => {
		const identicalVersion = {
			...mockFlowSpec1,
			id: "flow-identical",
			version: "v1.1",
		};
		const identicalFlows = [mockFlowSpec1, identicalVersion];

		render(
			<FlowDiffModal
				{...defaultProps}
				versions={identicalFlows}
				currentVersion={identicalVersion}
			/>,
		);

		// Simulate selecting a version for comparison
		fireEvent.click(screen.getByTestId("select"));

		// Switch to description tab
		fireEvent.click(screen.getByTestId("tab-trigger-description"));

		await waitFor(() => {
			expect(screen.getByText("✓ Nothing different")).toBeInTheDocument();
			expect(
				screen.getByText(
					"The descriptions are identical between these versions",
				),
			).toBeInTheDocument();
		});
	});

	it("should filter out current version from comparison options", () => {
		render(<FlowDiffModal {...defaultProps} />);

		// The select should only show options that are not the current version
		expect(screen.getByTestId("select-item-flow-1")).toBeInTheDocument();
		expect(screen.queryByTestId("select-item-flow-2")).not.toBeInTheDocument();
	});

	it("should handle empty descriptions gracefully", async () => {
		const flowWithNoDesc = {
			...mockFlowSpec1,
			description: undefined,
		};
		const flowsWithEmptyDesc = [flowWithNoDesc as FlowSpec, mockFlowSpec2];

		render(
			<FlowDiffModal
				{...defaultProps}
				versions={flowsWithEmptyDesc}
				currentVersion={mockFlowSpec2}
			/>,
		);

		// Simulate selecting a version for comparison
		fireEvent.click(screen.getByTestId("select"));

		// Switch to description tab
		fireEvent.click(screen.getByTestId("tab-trigger-description"));

		await waitFor(() => {
			expect(screen.getByText("Description Comparison")).toBeInTheDocument();
		});
	});

	it("should parse and clean node data correctly", async () => {
		render(<FlowDiffModal {...defaultProps} />);

		// Simulate selecting a version for comparison
		fireEvent.click(screen.getByTestId("select"));

		await waitFor(() => {
			// Should show diff content (scroll area) indicating nodes are being processed
			expect(screen.getByTestId("scroll-area")).toBeInTheDocument();
		});
	});

	it("should parse and clean edge data correctly", async () => {
		render(<FlowDiffModal {...defaultProps} />);

		// Simulate selecting a version for comparison
		fireEvent.click(screen.getByTestId("select"));

		// Switch to edges tab
		fireEvent.click(screen.getByTestId("tab-trigger-edges"));

		await waitFor(() => {
			// Should show diff content (scroll area) indicating edges are being processed
			expect(screen.getByTestId("scroll-area")).toBeInTheDocument();
		});
	});

	it("should display version information in description", () => {
		render(<FlowDiffModal {...defaultProps} />);

		expect(screen.getByTestId("dialog-description")).toHaveTextContent(
			/Comparing .* with v2\.0/,
		);
	});
});
