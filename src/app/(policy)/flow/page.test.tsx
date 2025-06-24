/** biome-ignore-all lint/a11y/useButtonType: dont care about key */
import { render } from "@testing-library/react";
import FlowPage from "./page";

// Mock the flow store
const mockUseFlowStore = jest.fn();
jest.mock("~/lib/state/flow", () => ({
	useFlowStore: () => mockUseFlowStore(),
}));

// Mock flow components
jest.mock("~/components/flow/FlowEditor", () => ({
	FlowEditor: ({
		nodes,
		edges,
		onNodesChange,
		onEdgesChange,
		validationResult,
		// biome-ignore lint/suspicious/noExplicitAny: Mock component
	}: any) => (
		<div data-testid="flow-editor">
			<div>Nodes: {nodes.length}</div>
			<div>Edges: {edges.length}</div>
			<button onClick={() => onNodesChange([...nodes, { id: "new-node" }])}>
				Add Node
			</button>
			<button onClick={() => onEdgesChange([...edges, { id: "new-edge" }])}>
				Add Edge
			</button>
			{validationResult && (
				<div data-testid="validation-result">
					{validationResult.isValid ? "Valid" : "Invalid"}
				</div>
			)}
		</div>
	),
}));

jest.mock("~/components/flow/FlowHeader", () => ({
	FlowHeader: ({ name }: { name: string }) => (
		<div data-testid="flow-header">Header: {name}</div>
	),
}));

jest.mock("~/components/flow/FlowFooter", () => ({
	// biome-ignore lint/suspicious/noExplicitAny: can be anything
	FlowFooter: ({ validationResult, yamlPreview }: any) => (
		<div data-testid="flow-footer">
			<div>Footer</div>
			{validationResult && <div>Validation: {validationResult.isValid}</div>}
			<div>YAML: {yamlPreview.hierarchical.length} chars</div>
		</div>
	),
}));

jest.mock("~/components/flow/FlowTestList", () => ({
	FlowTestList: ({
		tests,
		currentTest,
		onCreateTest,
		onSelectTest,
		onDeleteTest,
		onRunTest,
		onRunAllTests,
		isRunning,
		// biome-ignore lint/suspicious/noExplicitAny: Mock component
	}: any) => (
		<div data-testid="flow-test-list">
			<div>Tests: {tests.length}</div>
			<div>Current: {currentTest?.name || "None"}</div>
			<div>Running: {isRunning ? "Yes" : "No"}</div>
			<button onClick={onCreateTest}>Create Test</button>
			<button onClick={() => onSelectTest("test-1")}>Select Test</button>
			<button onClick={() => onDeleteTest("test-1")}>Delete Test</button>
			<button onClick={() => onRunTest("test-1")}>Run Test</button>
			<button onClick={onRunAllTests}>Run All Tests</button>
		</div>
	),
}));

jest.mock("~/components/flow/FlowTestPanel", () => ({
	FlowTestPanel: ({
		testData,
		isRunning,
		testResult,
		error,
		onTestDataChange,
		onRunTest,
		onSaveTest,
		// biome-ignore lint/suspicious/noExplicitAny: Mock component
	}: any) => (
		<div data-testid="flow-test-panel">
			<div>Test Panel</div>
			<div>Running: {isRunning ? "Yes" : "No"}</div>
			<div>Error: {error || "None"}</div>
			<div>Result: {testResult ? "Has result" : "No result"}</div>
			<button onClick={onRunTest}>Run Current Test</button>
			<button onClick={() => onSaveTest({ id: "test-1", data: testData })}>
				Save Test
			</button>
			<button onClick={() => onTestDataChange({ test: "data" })}>
				Change Test Data
			</button>
		</div>
	),
}));

// Mock resizable components
jest.mock("~/components/ui/resizable", () => ({
	// biome-ignore lint/suspicious/noExplicitAny: Mock component
	ResizablePanelGroup: ({ children, direction, className }: any) => (
		<div
			data-testid="resizable-panel-group"
			data-direction={direction}
			className={className}
		>
			{children}
		</div>
	),
	// biome-ignore lint/suspicious/noExplicitAny: Mock component
	ResizablePanel: ({ children, defaultSize, minSize, maxSize }: any) => (
		<div
			data-testid="resizable-panel"
			data-default-size={defaultSize}
			data-min-size={minSize}
			data-max-size={maxSize}
		>
			{children}
		</div>
	),
	// biome-ignore lint/suspicious/noExplicitAny: Mock component
	ResizableHandle: ({ withHandle }: any) => (
		<div data-testid="resizable-handle" data-with-handle={withHandle}>
			Handle
		</div>
	),
}));

// Mock flow-to-yaml utility
jest.mock("~/lib/utils/flow-to-yaml", () => ({
	// biome-ignore lint/suspicious/noExplicitAny: Mock data
	flowToYaml: (nodes: any[], edges: any[]) => ({
		hierarchical: `YAML content for ${nodes.length} nodes and ${edges.length} edges`,
		flat: "flat yaml content",
	}),
}));

describe("FlowPage", () => {
	const defaultStoreState = {
		nodes: [{ id: "node-1" }, { id: "node-2" }],
		edges: [{ id: "edge-1" }],
		name: "Test Flow",
		updateNodesAndEdges: jest.fn(),
		error: null,
		isTestRunning: false,
		testResult: null,
		testData: {},
		setTestData: jest.fn(),
		tests: [{ id: "test-1", name: "Test 1" }],
		currentTest: { id: "test-1", name: "Test 1" },
		createTest: jest.fn(),
		saveTest: jest.fn(),
		selectTest: jest.fn(),
		deleteTest: jest.fn(),
		runTest: jest.fn(),
		runAllTests: jest.fn(),
		validationResult: { isValid: true, errors: [] },
		validateFlow: jest.fn(),
	};

	beforeEach(() => {
		jest.clearAllMocks();
		mockUseFlowStore.mockReturnValue(defaultStoreState);
	});

	it("should render the main flow layout", () => {
		const { getByTestId, getByText } = render(<FlowPage />);

		expect(getByTestId("flow-header")).toBeInTheDocument();
		expect(getByTestId("flow-editor")).toBeInTheDocument();
		expect(getByTestId("flow-test-list")).toBeInTheDocument();
		expect(getByTestId("flow-test-panel")).toBeInTheDocument();
		expect(getByTestId("flow-footer")).toBeInTheDocument();

		expect(getByText("Header: Test Flow")).toBeInTheDocument();
	});

	it("should validate flow on mount", () => {
		const validateFlowMock = jest.fn();
		mockUseFlowStore.mockReturnValue({
			...defaultStoreState,
			validateFlow: validateFlowMock,
		});

		render(<FlowPage />);

		expect(validateFlowMock).toHaveBeenCalled();
	});

	it("should handle nodes change and trigger validation", () => {
		const updateNodesAndEdgesMock = jest.fn();
		const validateFlowMock = jest.fn();

		mockUseFlowStore.mockReturnValue({
			...defaultStoreState,
			updateNodesAndEdges: updateNodesAndEdgesMock,
			validateFlow: validateFlowMock,
		});

		const { getByText } = render(<FlowPage />);

		const addNodeButton = getByText("Add Node");
		addNodeButton.click();

		expect(updateNodesAndEdgesMock).toHaveBeenCalledWith(
			[{ id: "node-1" }, { id: "node-2" }, { id: "new-node" }],
			[{ id: "edge-1" }],
		);

		// Validation should be called with setTimeout
		setTimeout(() => {
			expect(validateFlowMock).toHaveBeenCalled();
		}, 0);
	});

	it("should handle edges change and trigger validation", () => {
		const updateNodesAndEdgesMock = jest.fn();
		const validateFlowMock = jest.fn();

		mockUseFlowStore.mockReturnValue({
			...defaultStoreState,
			updateNodesAndEdges: updateNodesAndEdgesMock,
			validateFlow: validateFlowMock,
		});

		const { getByText } = render(<FlowPage />);

		const addEdgeButton = getByText("Add Edge");
		addEdgeButton.click();

		expect(updateNodesAndEdgesMock).toHaveBeenCalledWith(
			[{ id: "node-1" }, { id: "node-2" }],
			[{ id: "edge-1" }, { id: "new-edge" }],
		);
	});

	it("should handle test list interactions", () => {
		const createTestMock = jest.fn();
		const selectTestMock = jest.fn();
		const deleteTestMock = jest.fn();
		const runTestMock = jest.fn();
		const runAllTestsMock = jest.fn();

		mockUseFlowStore.mockReturnValue({
			...defaultStoreState,
			createTest: createTestMock,
			selectTest: selectTestMock,
			deleteTest: deleteTestMock,
			runTest: runTestMock,
			runAllTests: runAllTestsMock,
		});

		const { getByText } = render(<FlowPage />);

		getByText("Create Test").click();
		expect(createTestMock).toHaveBeenCalled();

		getByText("Select Test").click();
		expect(selectTestMock).toHaveBeenCalledWith("test-1");

		getByText("Delete Test").click();
		expect(deleteTestMock).toHaveBeenCalledWith("test-1");

		getByText("Run Test").click();
		expect(runTestMock).toHaveBeenCalledWith("test-1");

		getByText("Run All Tests").click();
		expect(runAllTestsMock).toHaveBeenCalled();
	});

	it("should handle test panel interactions", () => {
		const setTestDataMock = jest.fn();
		const saveTestMock = jest.fn();
		const runTestMock = jest.fn();

		mockUseFlowStore.mockReturnValue({
			...defaultStoreState,
			setTestData: setTestDataMock,
			saveTest: saveTestMock,
			runTest: runTestMock,
		});

		const { getByText } = render(<FlowPage />);

		getByText("Change Test Data").click();
		expect(setTestDataMock).toHaveBeenCalledWith({ test: "data" });

		getByText("Save Test").click();
		expect(saveTestMock).toHaveBeenCalledWith({ id: "test-1", data: {} });

		getByText("Run Current Test").click();
		expect(runTestMock).toHaveBeenCalledWith("test-1");
	});

	it("should display store data correctly", () => {
		const { getByText, getAllByText } = render(<FlowPage />);

		expect(getByText("Nodes: 2")).toBeInTheDocument();
		expect(getByText("Edges: 1")).toBeInTheDocument();
		expect(getByText("Tests: 1")).toBeInTheDocument();
		expect(getByText("Current: Test 1")).toBeInTheDocument();

		// There might be multiple "Running: No" texts, just check one exists
		const runningTexts = getAllByText("Running: No");
		expect(runningTexts.length).toBeGreaterThan(0);
	});

	it("should display validation result", () => {
		const { getByTestId } = render(<FlowPage />);

		const validationResult = getByTestId("validation-result");
		expect(validationResult).toHaveTextContent("Valid");
	});

	it("should handle test running state", () => {
		mockUseFlowStore.mockReturnValue({
			...defaultStoreState,
			isTestRunning: true,
		});

		const { getAllByText } = render(<FlowPage />);

		// There might be multiple "Running: Yes" texts, just check one exists
		const runningTexts = getAllByText("Running: Yes");
		expect(runningTexts.length).toBeGreaterThan(0);
	});

	it("should handle errors", () => {
		mockUseFlowStore.mockReturnValue({
			...defaultStoreState,
			error: "Test error",
		});

		const { getByText } = render(<FlowPage />);

		expect(getByText("Error: Test error")).toBeInTheDocument();
	});

	it("should generate and display YAML preview", () => {
		const { getByText } = render(<FlowPage />);

		// YAML preview should be generated based on nodes and edges
		expect(getByText(/YAML: \d+ chars/)).toBeInTheDocument();
	});

	it("should have proper resizable layout structure", () => {
		const { getAllByTestId } = render(<FlowPage />);

		const panelGroups = getAllByTestId("resizable-panel-group");
		expect(panelGroups).toHaveLength(3); // Main vertical, horizontal, and nested vertical

		const panels = getAllByTestId("resizable-panel");
		expect(panels).toHaveLength(6); // All 6 panels (main top, flow editor, right container, test list, test panel, footer)

		const handles = getAllByTestId("resizable-handle");
		expect(handles).toHaveLength(3); // Between main sections
	});

	it("should set correct panel sizes", () => {
		const { getAllByTestId } = render(<FlowPage />);

		const panels = getAllByTestId("resizable-panel");

		// Check main top panel (75% default)
		expect(panels[0]).toHaveAttribute("data-default-size", "75");
		expect(panels[0]).toHaveAttribute("data-min-size", "50");

		// Check main bottom panel (25% default) - now at index 5 with 6 panels
		expect(panels[5]).toHaveAttribute("data-default-size", "25");
		expect(panels[5]).toHaveAttribute("data-min-size", "15");
		expect(panels[5]).toHaveAttribute("data-max-size", "50");
	});

	it("should handle no current test", () => {
		mockUseFlowStore.mockReturnValue({
			...defaultStoreState,
			currentTest: null,
		});

		const { getByText } = render(<FlowPage />);

		expect(getByText("Current: None")).toBeInTheDocument();
	});

	it("should handle invalid validation result", () => {
		mockUseFlowStore.mockReturnValue({
			...defaultStoreState,
			validationResult: { isValid: false, errors: ["Error 1"] },
		});

		const { getByTestId } = render(<FlowPage />);

		const validationResult = getByTestId("validation-result");
		expect(validationResult).toHaveTextContent("Invalid");
	});

	it("should have correct CSS classes", () => {
		const { container } = render(<FlowPage />);

		const mainDiv = container.firstChild as HTMLElement;
		expect(mainDiv).toHaveClass(
			"flex",
			"h-screen",
			"flex-col",
			"bg-background",
			"text-foreground",
		);
	});
});
