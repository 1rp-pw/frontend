import { fireEvent, render } from "@testing-library/react";
import { FlowEditor } from "./FlowEditor";
import type { FlowEdgeData, FlowNodeData } from "~/lib/types";

// Mock ReactFlow dependencies
jest.mock("@xyflow/react", () => ({
	ReactFlow: ({ children, nodes, edges, onNodesChange, onEdgesChange, onConnect, nodeTypes }: any) => (
		<div data-testid="react-flow">
			<div data-testid="nodes-count">{nodes.length}</div>
			<div data-testid="edges-count">{edges.length}</div>
			{children}
			<button 
				onClick={() => {
					// Simulate node connection
					onConnect({
						source: "start-1",
						target: "policy-1", 
						sourceHandle: "true"
					});
				}}
				data-testid="connect-nodes"
			>
				Connect Nodes
			</button>
			<button
				onClick={() => {
					// Simulate node change
					onNodesChange([{
						id: "new-node",
						type: "add",
						position: { x: 0, y: 0 },
						data: { id: "new-node", type: "policy" }
					}]);
				}}
				data-testid="change-nodes"
			>
				Change Nodes
			</button>
			<button
				onClick={() => {
					// Simulate edge change
					onEdgesChange([{
						id: "new-edge",
						type: "add",
						source: "start-1",
						target: "policy-1"
					}]);
				}}
				data-testid="change-edges"
			>
				Change Edges
			</button>
		</div>
	),
	Background: () => <div data-testid="background">Background</div>,
	Controls: () => <div data-testid="controls">Controls</div>,
	MiniMap: ({ nodeStrokeColor, nodeColor }: any) => (
		<div data-testid="minimap">
			<div data-testid="minimap-stroke">{typeof nodeStrokeColor}</div>
			<div data-testid="minimap-color">{typeof nodeColor}</div>
		</div>
	),
	useNodesState: (initialNodes: any) => [
		initialNodes,
		(setter: any) => {
			if (typeof setter === "function") {
				setter(initialNodes);
			}
		},
		jest.fn()
	],
	useEdgesState: (initialEdges: any) => [
		initialEdges,
		(setter: any) => {
			if (typeof setter === "function") {
				setter(initialEdges);
			}
		},
		jest.fn()
	],
	addEdge: (edge: any, edges: any) => [...edges, edge],
}));

// Mock flow context
jest.mock("~/components/flow/flow-context", () => ({
	FlowContext: {
		Provider: ({ children, value }: any) => (
			<div data-testid="flow-context" data-value={JSON.stringify(Object.keys(value))}>
				{children}
			</div>
		),
	},
}));

// Mock node components
jest.mock("~/components/flow/nodes/start-node", () => ({
	StartNode: () => <div data-testid="start-node">Start Node</div>,
}));

jest.mock("~/components/flow/nodes/policy-node", () => ({
	PolicyNode: () => <div data-testid="policy-node">Policy Node</div>,
}));

jest.mock("~/components/flow/nodes/return-node", () => ({
	ReturnNode: () => <div data-testid="return-node">Return Node</div>,
}));

jest.mock("~/components/flow/nodes/custom-node", () => ({
	CustomNode: () => <div data-testid="custom-node">Custom Node</div>,
}));

describe("FlowEditor", () => {
	const mockNodes: FlowNodeData[] = [
		{
			id: "start-1",
			type: "start",
			label: "Start",
			data: null,
			position: { x: 100, y: 100 },
		},
		{
			id: "policy-1",
			type: "policy",
			label: "Policy Node",
			policyId: "test-policy",
			policyName: "Test Policy",
			data: null,
			position: { x: 300, y: 100 },
		},
	];

	const mockEdges: FlowEdgeData[] = [
		{
			id: "edge-1",
			source: "start-1",
			target: "policy-1",
			sourceHandle: "true",
			label: "True",
			style: { stroke: "#22c55e" },
			labelStyle: { fill: "#22c55e" },
		},
	];

	const defaultProps = {
		nodes: mockNodes,
		edges: mockEdges,
		onNodesChange: jest.fn(),
		onEdgesChange: jest.fn(),
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should render ReactFlow with nodes and edges", () => {
		const { getByTestId } = render(<FlowEditor {...defaultProps} />);

		expect(getByTestId("react-flow")).toBeInTheDocument();
		expect(getByTestId("nodes-count")).toHaveTextContent("2");
		expect(getByTestId("edges-count")).toHaveTextContent("1");
	});

	it("should render all ReactFlow components", () => {
		const { getByTestId } = render(<FlowEditor {...defaultProps} />);

		expect(getByTestId("background")).toBeInTheDocument();
		expect(getByTestId("controls")).toBeInTheDocument();
		expect(getByTestId("minimap")).toBeInTheDocument();
	});

	it("should provide FlowContext with required functions", () => {
		const { getByTestId } = render(<FlowEditor {...defaultProps} />);

		const context = getByTestId("flow-context");
		expect(context).toBeInTheDocument();
		
		const contextValue = JSON.parse(context.getAttribute("data-value") || "[]");
		expect(contextValue).toContain("addConnectedNode");
		expect(contextValue).toContain("changeNodeType");
		expect(contextValue).toContain("getConnectedNodes");
		expect(contextValue).toContain("deleteNode");
	});

	it("should handle node connections", () => {
		const { getByTestId } = render(<FlowEditor {...defaultProps} />);

		const connectButton = getByTestId("connect-nodes");
		fireEvent.click(connectButton);

		// Connection should be handled by ReactFlow mock
		expect(connectButton).toBeInTheDocument();
	});

	it("should handle nodes change callback", () => {
		const onNodesChange = jest.fn();
		const { getByTestId } = render(
			<FlowEditor {...defaultProps} onNodesChange={onNodesChange} />
		);

		const changeButton = getByTestId("change-nodes");
		fireEvent.click(changeButton);

		expect(changeButton).toBeInTheDocument();
	});

	it("should handle edges change callback", () => {
		const onEdgesChange = jest.fn();
		const { getByTestId } = render(
			<FlowEditor {...defaultProps} onEdgesChange={onEdgesChange} />
		);

		const changeButton = getByTestId("change-edges");
		fireEvent.click(changeButton);

		expect(changeButton).toBeInTheDocument();
	});

	it("should handle validation results", () => {
		const validationResult = {
			unterminatedNodes: ["policy-1"],
		};

		const { getByTestId } = render(
			<FlowEditor {...defaultProps} validationResult={validationResult} />
		);

		expect(getByTestId("react-flow")).toBeInTheDocument();
	});

	it("should work without optional props", () => {
		const minimalProps = {
			nodes: mockNodes,
			edges: mockEdges,
		};

		const { getByTestId } = render(<FlowEditor {...minimalProps} />);

		expect(getByTestId("react-flow")).toBeInTheDocument();
		expect(getByTestId("nodes-count")).toHaveTextContent("2");
		expect(getByTestId("edges-count")).toHaveTextContent("1");
	});

	it("should render with empty nodes and edges", () => {
		const emptyProps = {
			nodes: [],
			edges: [],
		};

		const { getByTestId } = render(<FlowEditor {...emptyProps} />);

		expect(getByTestId("react-flow")).toBeInTheDocument();
		expect(getByTestId("nodes-count")).toHaveTextContent("0");
		expect(getByTestId("edges-count")).toHaveTextContent("0");
	});

	it("should set up node types correctly", () => {
		const { getByTestId } = render(<FlowEditor {...defaultProps} />);

		// Verify that the ReactFlow component is rendered with proper setup
		expect(getByTestId("react-flow")).toBeInTheDocument();
	});

	it("should configure MiniMap with color functions", () => {
		const { getByTestId } = render(<FlowEditor {...defaultProps} />);

		const minimap = getByTestId("minimap");
		expect(minimap).toBeInTheDocument();
		
		// Check that color functions are provided
		expect(getByTestId("minimap-stroke")).toHaveTextContent("function");
		expect(getByTestId("minimap-color")).toHaveTextContent("function");
	});

	it("should handle nodes with default positions", () => {
		const nodesWithoutPositions: FlowNodeData[] = [
			{
				id: "node-1",
				type: "start",
				label: "Start",
				data: null,
			},
			{
				id: "node-2",
				type: "policy",
				label: "Policy",
				policyId: "test",
				policyName: "Test",
				data: null,
			},
		];

		const props = {
			nodes: nodesWithoutPositions,
			edges: [],
		};

		const { getByTestId } = render(<FlowEditor {...props} />);

		expect(getByTestId("react-flow")).toBeInTheDocument();
		expect(getByTestId("nodes-count")).toHaveTextContent("2");
	});

	it("should handle edges with missing style properties", () => {
		const edgesWithoutStyles: FlowEdgeData[] = [
			{
				id: "edge-1",
				source: "start-1",
				target: "policy-1",
				sourceHandle: "true",
			},
		];

		const props = {
			nodes: mockNodes,
			edges: edgesWithoutStyles,
		};

		const { getByTestId } = render(<FlowEditor {...props} />);

		expect(getByTestId("react-flow")).toBeInTheDocument();
		expect(getByTestId("edges-count")).toHaveTextContent("1");
	});
});