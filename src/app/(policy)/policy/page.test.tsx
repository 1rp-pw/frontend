/** biome-ignore-all lint/a11y/useButtonType: dont care about keys */
import { fireEvent, render } from "@testing-library/react";
import IDEPage from "./page";

// Mock the policy store
const mockUsePolicyStore = jest.fn();
jest.mock("~/lib/state/policy", () => ({
	usePolicyStore: () => mockUsePolicyStore(),
}));

// Mock the components
jest.mock("~/components/policy/editor", () => ({
	Editor: ({
		rule,
		onChange,
	}: {
		rule: string;
		onChange: (rule: string) => void;
	}) => (
		<div data-testid="editor">
			<textarea
				value={rule}
				onChange={(e) => onChange(e.target.value)}
				data-testid="editor-textarea"
			/>
		</div>
	),
}));

jest.mock("~/components/policy/save", () => ({
	SavePolicy: () => <button data-testid="save-policy">Save Policy</button>,
}));

jest.mock("~/components/policy/schema/builder", () => ({
	SchemaBuilder: ({
		setSchema,
	}: {
		// biome-ignore lint/suspicious/noExplicitAny: Mock schema
		schema: any;
		// biome-ignore lint/suspicious/noExplicitAny: Mock schema
		setSchema: (schema: any) => void;
	}) => (
		<div data-testid="schema-builder">
			<button
				onClick={() => setSchema({ properties: { test: { type: "string" } } })}
			>
				Update Schema
			</button>
		</div>
	),
}));

jest.mock("~/components/policy/test/form", () => ({
	TestForm: ({
		currentTest,
		onSaveTest,
	}: {
		// biome-ignore lint/suspicious/noExplicitAny: Mock test
		currentTest: any;
		// biome-ignore lint/suspicious/noExplicitAny: Mock test
		onSaveTest: (test: any) => void;
	}) => (
		<div data-testid="test-form">
			<button onClick={() => onSaveTest(currentTest)}>Save Test</button>
		</div>
	),
}));

jest.mock("~/components/policy/test/list", () => ({
	TestList: ({
		tests,
		onSelectTest,
		onDeleteTest,
		onRunTest,
		onRepairTest,
		// biome-ignore lint/suspicious/noExplicitAny: Mock component
	}: any) => (
		<div data-testid="test-list">
			{tests.map(
				// biome-ignore lint/suspicious/noExplicitAny: Mock test
				(test: any) => (
					<div key={test.id} data-testid={`test-${test.id}`}>
						<span>{test.name}</span>
						<button onClick={() => onSelectTest(test.id)}>Select</button>
						<button onClick={() => onDeleteTest(test.id)}>Delete</button>
						<button onClick={() => onRunTest(test.id)}>Run</button>
						<button onClick={() => onRepairTest(test.id)}>Repair</button>
					</div>
				),
			)}
		</div>
	),
}));

jest.mock("~/components/ui/button", () => ({
	// biome-ignore lint/suspicious/noExplicitAny: Mock component
	Button: ({ children, onClick, disabled, variant, className }: any) => (
		<button
			onClick={onClick}
			disabled={disabled}
			className={className}
			data-variant={variant}
		>
			{children}
		</button>
	),
}));

// Mock Lucide icons
jest.mock("lucide-react", () => ({
	FilePlusIcon: () => <span data-testid="file-plus-icon">+</span>,
	PlayIcon: () => <span data-testid="play-icon">▶</span>,
}));

describe("IDEPage", () => {
	const defaultStoreState = {
		schema: { properties: {} },
		tests: [],
		currentTest: null,
		rule: "",
		setSchema: jest.fn(),
		setPolicyRule: jest.fn(),
		createTest: jest.fn(),
		saveTest: jest.fn(),
		selectTest: jest.fn(),
		deleteTest: jest.fn(),
		runTest: jest.fn(),
		repairTest: jest.fn(),
		runAllTests: jest.fn(),
		reset: jest.fn(),
	};

	beforeEach(() => {
		jest.clearAllMocks();
		mockUsePolicyStore.mockReturnValue(defaultStoreState);
	});

	it("should render the main IDE layout", () => {
		const { getByText, getByTestId } = render(<IDEPage />);

		expect(getByText("Policy Maker")).toBeInTheDocument();
		expect(getByText("Policy Text")).toBeInTheDocument();
		expect(getByText("Test Editor")).toBeInTheDocument();
		expect(getByText("Schema Builder")).toBeInTheDocument();
		expect(getByText("Tests")).toBeInTheDocument();

		expect(getByTestId("editor")).toBeInTheDocument();
		expect(getByTestId("schema-builder")).toBeInTheDocument();
		expect(getByTestId("test-list")).toBeInTheDocument();
	});

	it("should call reset on mount", () => {
		const resetMock = jest.fn();
		mockUsePolicyStore.mockReturnValue({
			...defaultStoreState,
			reset: resetMock,
		});

		render(<IDEPage />);

		expect(resetMock).toHaveBeenCalled();
	});

	it("should render editor with rule and handle changes", () => {
		const setPolicyRuleMock = jest.fn();
		mockUsePolicyStore.mockReturnValue({
			...defaultStoreState,
			rule: "Test rule",
			setPolicyRule: setPolicyRuleMock,
		});

		const { getByTestId } = render(<IDEPage />);

		const textarea = getByTestId("editor-textarea");
		expect(textarea).toHaveValue("Test rule");

		fireEvent.change(textarea, { target: { value: "Updated rule" } });
		expect(setPolicyRuleMock).toHaveBeenCalledWith("Updated rule");
	});

	it("should show test form when current test is selected", () => {
		mockUsePolicyStore.mockReturnValue({
			...defaultStoreState,
			currentTest: { id: "test-1", name: "Test 1" },
		});

		const { getByTestId } = render(<IDEPage />);

		expect(getByTestId("test-form")).toBeInTheDocument();
	});

	it("should show placeholder when no test is selected", () => {
		const { getByText } = render(<IDEPage />);

		expect(getByText("Select a test or create a new one")).toBeInTheDocument();
	});

	it("should render tests in test list", () => {
		const tests = [
			{ id: "test-1", name: "Test 1" },
			{ id: "test-2", name: "Test 2" },
		];

		mockUsePolicyStore.mockReturnValue({
			...defaultStoreState,
			tests,
		});

		const { getByTestId, getByText } = render(<IDEPage />);

		expect(getByTestId("test-list")).toBeInTheDocument();
		expect(getByText("Test 1")).toBeInTheDocument();
		expect(getByText("Test 2")).toBeInTheDocument();
	});

	it("should handle run all tests button", () => {
		const runAllTestsMock = jest.fn();
		const tests = [{ id: "test-1", name: "Test 1" }];

		mockUsePolicyStore.mockReturnValue({
			...defaultStoreState,
			tests,
			runAllTests: runAllTestsMock,
		});

		const { getByText } = render(<IDEPage />);

		const runAllButton = getByText("Run All");
		fireEvent.click(runAllButton);

		expect(runAllTestsMock).toHaveBeenCalled();
	});

	it("should disable run all tests when no tests exist", () => {
		const { getByText } = render(<IDEPage />);

		const runAllButton = getByText("Run All");
		expect(runAllButton).toBeDisabled();
	});

	it("should handle create test button", () => {
		const createTestMock = jest.fn();
		mockUsePolicyStore.mockReturnValue({
			...defaultStoreState,
			schema: { properties: { test: { type: "string" } } },
			createTest: createTestMock,
		});

		const { getByText } = render(<IDEPage />);

		const newTestButton = getByText("New Test");
		fireEvent.click(newTestButton);

		expect(createTestMock).toHaveBeenCalled();
	});

	it("should disable create test when schema has no properties", () => {
		const { getByText } = render(<IDEPage />);

		const newTestButton = getByText("New Test");
		expect(newTestButton).toBeDisabled();
	});

	it("should handle test list interactions", () => {
		const selectTestMock = jest.fn();
		const deleteTestMock = jest.fn();
		const runTestMock = jest.fn();
		const repairTestMock = jest.fn();

		const tests = [{ id: "test-1", name: "Test 1" }];

		mockUsePolicyStore.mockReturnValue({
			...defaultStoreState,
			tests,
			selectTest: selectTestMock,
			deleteTest: deleteTestMock,
			runTest: runTestMock,
			repairTest: repairTestMock,
		});

		const { getByTestId } = render(<IDEPage />);

		const testDiv = getByTestId("test-test-1");

		// Test select
		const selectButton = testDiv.querySelector("button");
		// biome-ignore lint/style/noNonNullAssertion: Test element exists
		fireEvent.click(selectButton!);
		expect(selectTestMock).toHaveBeenCalledWith("test-1");

		// Test delete
		const deleteButton = testDiv.querySelectorAll("button")[1];
		if (deleteButton) {
			fireEvent.click(deleteButton);
		}
		expect(deleteTestMock).toHaveBeenCalledWith("test-1");

		// Test run
		const runButton = testDiv.querySelectorAll("button")[2];
		if (runButton) {
			fireEvent.click(runButton);
		}
		expect(runTestMock).toHaveBeenCalledWith("test-1");

		// Test repair
		const repairButton = testDiv.querySelectorAll("button")[3];
		if (repairButton) {
			fireEvent.click(repairButton);
		}
		expect(repairTestMock).toHaveBeenCalledWith("test-1");
	});

	it("should have proper CSS classes for layout", () => {
		const { container } = render(<IDEPage />);

		const mainContainer = container.querySelector(".h-screen");
		expect(mainContainer).toHaveClass(
			"flex",
			"flex-col",
			"bg-zinc-900",
			"text-zinc-100",
		);

		const gridMain = container.querySelector("main");
		expect(gridMain).toHaveClass(
			"grid",
			"flex-1",
			"grid-cols-2",
			"gap-1",
			"overflow-hidden",
			"p-1",
		);
	});

	it("should render save policy button in header", () => {
		const { getByTestId } = render(<IDEPage />);

		expect(getByTestId("save-policy")).toBeInTheDocument();
	});

	it("should render icons in buttons", () => {
		const tests = [{ id: "test-1", name: "Test 1" }];
		mockUsePolicyStore.mockReturnValue({
			...defaultStoreState,
			tests,
			schema: { properties: { test: { type: "string" } } },
		});

		const { getByTestId } = render(<IDEPage />);

		expect(getByTestId("play-icon")).toBeInTheDocument();
		expect(getByTestId("file-plus-icon")).toBeInTheDocument();
	});
});
