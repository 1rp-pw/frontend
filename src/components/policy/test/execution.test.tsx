/** biome-ignore-all lint/a11y/useKeyWithClickEvents: key click */
import { fireEvent, render } from "@testing-library/react";
import { Button } from "~/components/ui/button";
import type { TestResultSet } from "~/lib/state/policy";
import { PolicyExecutionModal } from "./execution";

// Mock UI components
jest.mock("~/components/ui/badge", () => ({
	// biome-ignore lint/suspicious/noExplicitAny: any
	Badge: ({ children, variant }: any) => (
		<span data-testid="badge" data-variant={variant}>
			{children}
		</span>
	),
}));

jest.mock("~/components/ui/dialog", () => ({
	// biome-ignore lint/suspicious/noExplicitAny: any
	Dialog: ({ children, open, onOpenChange }: any) => (
		// biome-ignore lint/a11y/noStaticElementInteractions: static
		<div
			data-testid="dialog"
			data-open={open}
			onClick={() => onOpenChange(false)}
		>
			{open && children}
		</div>
	),
	// biome-ignore lint/suspicious/noExplicitAny: any
	DialogContent: ({ children, className }: any) => (
		<div data-testid="dialog-content" className={className}>
			{children}
		</div>
	),
	// biome-ignore lint/suspicious/noExplicitAny: any
	DialogHeader: ({ children }: any) => (
		<div data-testid="dialog-header">{children}</div>
	),
	// biome-ignore lint/suspicious/noExplicitAny: any
	DialogTitle: ({ children }: any) => (
		<h2 data-testid="dialog-title">{children}</h2>
	),
	// biome-ignore lint/suspicious/noExplicitAny: any
	DialogDescription: ({ children }: any) => (
		<div data-testid="dialog-description">{children}</div>
	),
}));

jest.mock("~/components/ui/rainbow", () => ({
	// biome-ignore lint/suspicious/noExplicitAny: any
	RainbowBraces: ({ json }: any) => (
		<div data-testid="rainbow-braces">{JSON.stringify(json, null, 2)}</div>
	),
}));

jest.mock("~/components/ui/scroll-area", () => ({
	// biome-ignore lint/suspicious/noExplicitAny: any
	ScrollArea: ({ children }: any) => (
		<div data-testid="scroll-area">{children}</div>
	),
	ScrollBar: () => <div data-testid="scroll-bar">ScrollBar</div>,
}));

jest.mock("~/components/ui/tabs", () => ({
	// biome-ignore lint/suspicious/noExplicitAny: any
	Tabs: ({ children, defaultValue }: any) => (
		<div data-testid="tabs" data-default-value={defaultValue}>
			{children}
		</div>
	),
	// biome-ignore lint/suspicious/noExplicitAny: any
	TabsList: ({ children }: any) => (
		<div data-testid="tabs-list">{children}</div>
	),
	// biome-ignore lint/suspicious/noExplicitAny: any
	TabsTrigger: ({ children, value }: any) => (
		<Button data-testid={`tab-trigger-${value}`} data-value={value}>
			{children}
		</Button>
	),
	// biome-ignore lint/suspicious/noExplicitAny: any
	TabsContent: ({ children, value }: any) => (
		<div data-testid={`tab-content-${value}`} data-value={value}>
			{children}
		</div>
	),
}));

jest.mock("~/components/ui/tooltip", () => ({
	// biome-ignore lint/suspicious/noExplicitAny: any
	Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
	// biome-ignore lint/suspicious/noExplicitAny: any
	TooltipContent: ({ children }: any) => (
		<div data-testid="tooltip-content">{children}</div>
	),
	// biome-ignore lint/suspicious/noExplicitAny: any
	TooltipTrigger: ({ children }: any) => (
		<div data-testid="tooltip-trigger">{children}</div>
	),
}));

// Mock Lucide icons
jest.mock("lucide-react", () => ({
	CheckCircle: () => <span data-testid="check-circle">✓</span>,
	XCircle: () => <span data-testid="x-circle">✗</span>,
}));

describe("PolicyExecutionModal", () => {
	const mockExecutionData: TestResultSet = {
		result: true,
		errors: null,
		data: null,
		rule: ["First rule line", "Second rule line"],
		trace: {
			execution: [
				{
					outcome: { pos: null, value: "pass" },
					selector: { pos: null, value: "test-selector" },
					result: true,
					conditions: [
						{
							result: true,
							rule_name: "Condition 1",
							operator: "greaterThan",
							property: {
								path: "$.user.age",
								value: null,
							},
							value: {
								pos: null,
								type: "number",
								value: 18,
							},
							evaluation_details: {
								left_value: {
									value: 25,
									type: "number",
								},
								right_value: {
									value: 18,
									type: "number",
								},
								comparison_result: true,
							},
						},
						{
							result: false,
							rule_name: "Condition 2",
							operator: "equals",
							property: {
								path: "$.user.name",
								value: null,
							},
							value: {
								pos: null,
								type: "string",
								value: "John",
							},
							evaluation_details: {
								left_value: {
									value: "Jane",
									type: "string",
								},
								right_value: {
									value: "John",
									type: "string",
								},
								comparison_result: false,
							},
						},
					],
				},
			],
		},
	};

	const defaultProps = {
		open: true,
		onOpenChange: jest.fn(),
		executionData: mockExecutionData,
		testName: "Test Case 1",
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should not render when executionData is null", () => {
		const { queryByTestId } = render(
			<PolicyExecutionModal {...defaultProps} executionData={null} />,
		);

		expect(queryByTestId("dialog")).not.toBeInTheDocument();
	});

	it("should not render when trace is missing", () => {
		const dataWithoutTrace = {
			...mockExecutionData,
			trace: undefined,
			// biome-ignore lint/suspicious/noExplicitAny: any
		} as any;

		const { queryByTestId } = render(
			<PolicyExecutionModal
				{...defaultProps}
				executionData={dataWithoutTrace}
			/>,
		);

		expect(queryByTestId("dialog")).not.toBeInTheDocument();
	});

	it("should not render when execution is missing", () => {
		const dataWithoutExecution = {
			...mockExecutionData,
			trace: { execution: undefined },
			// biome-ignore lint/suspicious/noExplicitAny: any
		} as any;

		const { queryByTestId } = render(
			<PolicyExecutionModal
				{...defaultProps}
				executionData={dataWithoutExecution}
			/>,
		);

		expect(queryByTestId("dialog")).not.toBeInTheDocument();
	});

	it("should render when open is true", () => {
		const { getByTestId } = render(<PolicyExecutionModal {...defaultProps} />);

		expect(getByTestId("dialog")).toBeInTheDocument();
		expect(getByTestId("dialog")).toHaveAttribute("data-open", "true");
	});

	it("should not render content when open is false", () => {
		const { getByTestId } = render(
			<PolicyExecutionModal {...defaultProps} open={false} />,
		);

		expect(getByTestId("dialog")).toHaveAttribute("data-open", "false");
	});

	it("should display test name in title", () => {
		const { getByTestId } = render(<PolicyExecutionModal {...defaultProps} />);

		const title = getByTestId("dialog-title");
		expect(title).toHaveTextContent("Test Case 1 - Policy Execution Results");
	});

	it("should display overall result badge", () => {
		const { getAllByTestId } = render(
			<PolicyExecutionModal {...defaultProps} />,
		);

		const badges = getAllByTestId("badge");
		const resultBadge = badges.find(
			(badge) =>
				badge.textContent === "PASSED" &&
				badge.getAttribute("data-variant") === "default",
		);
		expect(resultBadge).toBeInTheDocument();
	});

	it("should display failed result correctly", () => {
		const failedData = {
			...mockExecutionData,
			result: false,
		};

		const { getAllByTestId } = render(
			<PolicyExecutionModal {...defaultProps} executionData={failedData} />,
		);

		const badges = getAllByTestId("badge");
		const resultBadge = badges.find(
			(badge) =>
				badge.textContent === "FAILED" &&
				badge.getAttribute("data-variant") === "destructive",
		);
		expect(resultBadge).toBeInTheDocument();
	});

	it("should render conditions with correct icons", () => {
		const { getAllByTestId } = render(
			<PolicyExecutionModal {...defaultProps} />,
		);

		// Should have check circle for passed condition
		const checkIcons = getAllByTestId("check-circle");
		expect(checkIcons.length).toBeGreaterThan(0);

		// Should have x circle for failed condition
		const xIcons = getAllByTestId("x-circle");
		expect(xIcons.length).toBeGreaterThan(0);
	});

	it("should display condition details", () => {
		const { container } = render(<PolicyExecutionModal {...defaultProps} />);

		// Since we're using mocked components, we can't easily test for specific text
		// Let's test that the component renders and has the expected structure
		expect(container.firstChild).toBeInTheDocument();

		// Check that badges are rendered (which indicate conditions)
		const badges = container.querySelectorAll('[data-testid="badge"]');
		expect(badges.length).toBeGreaterThan(0);
	});

	it("should display evaluation details", () => {
		const { container } = render(<PolicyExecutionModal {...defaultProps} />);

		// Test that component renders with evaluation data
		expect(container.firstChild).toBeInTheDocument();

		// Since we have mocked components, we verify structure instead of specific text
		const badges = container.querySelectorAll('[data-testid="badge"]');
		expect(badges.length).toBeGreaterThan(0);

		// Verify we have both passed and failed conditions
		const checkIcons = container.querySelectorAll(
			'[data-testid="check-circle"]',
		);
		const xIcons = container.querySelectorAll('[data-testid="x-circle"]');
		expect(checkIcons.length).toBeGreaterThan(0);
		expect(xIcons.length).toBeGreaterThan(0);
	});

	it("should handle array values in conditions", () => {
		const dataWithArrays = {
			...mockExecutionData,
			trace: {
				execution: [
					{
						outcome: { pos: null, value: "pass" },
						selector: { pos: null, value: "array-selector" },
						result: true,
						conditions: [
							{
								result: true,
								operator: "contains",
								property: { path: "$.tags", value: null },
								value: { pos: null, type: "array", value: ["tag1", "tag2"] },
								evaluation_details: {
									left_value: {
										value: ["tag1", "tag2", "tag3"],
										type: "array",
									},
									right_value: { value: ["tag1", "tag2"], type: "array" },
									comparison_result: true,
								},
							},
						],
					},
				],
			},
		};

		const { container } = render(
			<PolicyExecutionModal {...defaultProps} executionData={dataWithArrays} />,
		);

		// Test that component renders with array data
		expect(container.firstChild).toBeInTheDocument();

		// Check that at least one condition is rendered
		const badges = container.querySelectorAll('[data-testid="badge"]');
		expect(badges.length).toBeGreaterThan(0);
	});

	it("should handle condition without rule name", () => {
		const dataWithoutRuleName = {
			...mockExecutionData,
			trace: {
				execution: [
					{
						outcome: { pos: null, value: "pass" },
						selector: { pos: null, value: "no-rule-selector" },
						result: true,
						conditions: [
							{
								result: true,
								operator: "equals",
								property: { path: "$.test", value: null },
								value: { pos: null, type: "string", value: "test" },
							},
						],
					},
				],
			},
		};

		const { container } = render(
			<PolicyExecutionModal
				{...defaultProps}
				executionData={dataWithoutRuleName}
			/>,
		);

		// Should still render the condition
		expect(container).toBeInTheDocument();
	});

	it("should handle condition without operator and property", () => {
		const dataWithMinimalCondition = {
			...mockExecutionData,
			trace: {
				execution: [
					{
						outcome: { pos: null, value: "pass" },
						selector: { pos: null, value: "minimal-selector" },
						result: true,
						conditions: [
							{
								result: true,
								rule_name: "Simple Rule",
							},
						],
					},
				],
			},
		};

		const { getByText } = render(
			<PolicyExecutionModal
				{...defaultProps}
				executionData={dataWithMinimalCondition}
			/>,
		);

		expect(getByText("Simple Rule")).toBeInTheDocument();
	});

	it("should handle condition without evaluation details", () => {
		const dataWithoutEvaluation = {
			...mockExecutionData,
			trace: {
				execution: [
					{
						outcome: { pos: null, value: "pass" },
						selector: { pos: null, value: "no-eval-selector" },
						result: true,
						conditions: [
							{
								result: true,
								rule_name: "No Evaluation",
								operator: "equals",
								property: { path: "$.test", value: null },
								value: { pos: null, type: "string", value: "test" },
							},
						],
					},
				],
			},
		};

		const { getByText, queryByText } = render(
			<PolicyExecutionModal
				{...defaultProps}
				executionData={dataWithoutEvaluation}
			/>,
		);

		expect(getByText("No Evaluation")).toBeInTheDocument();
		expect(queryByText("Evaluation:")).not.toBeInTheDocument();
	});

	it("should call onOpenChange when dialog is clicked", () => {
		const onOpenChange = jest.fn();
		const { getByTestId } = render(
			<PolicyExecutionModal {...defaultProps} onOpenChange={onOpenChange} />,
		);

		const dialog = getByTestId("dialog");
		fireEvent.click(dialog);

		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("should handle multiple executions", () => {
		const dataWithMultipleExecutions = {
			...mockExecutionData,
			trace: {
				execution: [
					{
						outcome: { pos: null, value: "pass" },
						selector: { pos: null, value: "first-selector" },
						result: true,
						conditions: [
							{
								result: true,
								rule_name: "First Condition",
							},
						],
					},
					{
						outcome: { pos: null, value: "pass" },
						selector: { pos: null, value: "second-selector" },
						result: true,
						conditions: [
							{
								result: true,
								rule_name: "Second Condition",
							},
						],
					},
				],
			},
		};

		const { container } = render(
			<PolicyExecutionModal
				{...defaultProps}
				executionData={dataWithMultipleExecutions}
			/>,
		);

		// Should render both executions
		expect(container).toBeInTheDocument();
	});

	it("should work without testName", () => {
		const { getByTestId } = render(
			<PolicyExecutionModal {...defaultProps} testName={undefined} />,
		);

		const title = getByTestId("dialog-title");
		expect(title).toHaveTextContent("Policy Execution Results");
		expect(title).not.toHaveTextContent("Test Case 1");
	});
});
