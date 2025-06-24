import { act, renderHook } from "@testing-library/react";
import type { FlowEdgeData, FlowNodeData } from "~/lib/types";
import { useFlowStore } from "./flow";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock flow validation utilities
jest.mock("~/lib/utils/flow-validation", () => ({
	validateFlowTermination: jest.fn(() => ({
		isValid: true,
		errors: [],
		warnings: [],
	})),
}));

// Mock flow to YAML utilities
jest.mock("~/lib/utils/flow-to-yaml", () => ({
	flowToYaml: jest.fn(() => "mocked-yaml"),
	flowToFlatYaml: jest.fn(() => "mocked-flat-yaml"),
}));

describe("useFlowStore", () => {
	beforeEach(() => {
		mockFetch.mockClear();
		const { result } = renderHook(() => useFlowStore());
		act(() => {
			result.current.reset();
		});
	});

	describe("Initial State", () => {
		it("should initialize with default values", () => {
			const { result } = renderHook(() => useFlowStore());

			expect(result.current.flowSpec).toBeDefined();
			expect(result.current.name).toBe("New Flow");
			expect(result.current.nodes).toHaveLength(1);
			expect(result.current.nodes[0]?.type).toBe("start");
			expect(result.current.edges).toHaveLength(0);
			expect(result.current.tests).toHaveLength(1);
			expect(result.current.isLoading).toBe(false);
			expect(result.current.error).toBeNull();
		});

		it("should have default test", () => {
			const { result } = renderHook(() => useFlowStore());

			const test = result.current.tests[0];
			expect(test?.name).toBe("Test 1");
			expect(test?.expectedOutcome).toBe(true);
			expect(test?.created).toBe(true);
		});
	});

	describe("Flow Management", () => {
		it("should update flow name", () => {
			const { result } = renderHook(() => useFlowStore());

			act(() => {
				result.current.setFlowName("Updated Flow Name");
			});

			expect(result.current.name).toBe("Updated Flow Name");
			expect(result.current.flowSpec?.name).toBe("Updated Flow Name");
		});

		it("should update flow ID", () => {
			const { result } = renderHook(() => useFlowStore());

			act(() => {
				result.current.setFlowId("flow-123");
			});

			expect(result.current.id).toBe("flow-123");
			expect(result.current.flowSpec?.id).toBe("flow-123");
		});

		it("should update nodes", () => {
			const { result } = renderHook(() => useFlowStore());

			const newNodes: FlowNodeData[] = [
				{
					id: "start-1",
					type: "start",
					label: "Start",
					position: { x: 100, y: 100 },
					data: null,
					policyId: "",
					policyName: "",
				},
				{
					id: "custom-1",
					type: "custom",
					label: "Custom Node",
					position: { x: 200, y: 200 },
					// biome-ignore lint/suspicious/noExplicitAny: anything
					data: { outcome: "return" } as any,
					policyId: "",
					policyName: "",
				},
			];

			act(() => {
				result.current.setNodes(newNodes);
			});

			expect(result.current.nodes).toEqual(newNodes);
			expect(result.current.flowSpec?.nodes).toEqual(newNodes);
		});

		it("should update edges", () => {
			const { result } = renderHook(() => useFlowStore());

			const newEdges: FlowEdgeData[] = [
				{
					id: "edge-1",
					source: "start-1",
					target: "custom-1",
					sourceHandle: "right",
					targetHandle: "left",
				},
			];

			act(() => {
				result.current.setEdges(newEdges);
			});

			expect(result.current.edges).toEqual(newEdges);
			expect(result.current.flowSpec?.edges).toEqual(newEdges);
		});

		it("should update nodes and edges together", () => {
			const { result } = renderHook(() => useFlowStore());

			const newNodes: FlowNodeData[] = [
				{
					id: "start-1",
					type: "start",
					label: "Start",
					position: { x: 100, y: 100 },
					data: null,
					policyId: "",
					policyName: "",
				},
			];

			const newEdges: FlowEdgeData[] = [
				{
					id: "edge-1",
					source: "start-1",
					target: "end-1",
					sourceHandle: "right",
					targetHandle: "left",
				},
			];

			act(() => {
				result.current.updateNodesAndEdges(newNodes, newEdges);
			});

			expect(result.current.nodes).toEqual(newNodes);
			expect(result.current.edges).toEqual(newEdges);
		});
	});

	describe("Test Management", () => {
		it("should create a new test", () => {
			const { result } = renderHook(() => useFlowStore());

			act(() => {
				result.current.createTest();
			});

			expect(result.current.currentTest).toBeDefined();
			expect(result.current.currentTest?.name).toMatch(/Test \d+/);
			expect(result.current.currentTest?.created).toBe(false);
			expect(result.current.testData).toBe(result.current.currentTest?.data);
		});

		it("should save a new test", () => {
			const { result } = renderHook(() => useFlowStore());

			act(() => {
				result.current.createTest();
			});

			const testData = '{"example": "data"}';
			act(() => {
				result.current.saveTest(testData, "My Flow Test", "success");
			});

			expect(result.current.tests).toHaveLength(2); // 1 default + 1 new
			expect(result.current.currentTest?.name).toBe("My Flow Test");
			expect(result.current.currentTest?.data).toBe(testData);
			expect(result.current.currentTest?.expectedOutcome).toBe("success");
			expect(result.current.currentTest?.created).toBe(true);
		});

		it("should update existing test", () => {
			const { result } = renderHook(() => useFlowStore());
			const existingTest = result.current.tests[0];

			act(() => {
				// biome-ignore lint/style/noNonNullAssertion: null
				result.current.selectTest(existingTest!);
			});

			const newData = '{"updated": "data"}';
			act(() => {
				result.current.saveTest(newData, "Updated Test", false);
			});

			expect(result.current.tests).toHaveLength(1); // Still 1 test
			expect(result.current.currentTest?.name).toBe("Updated Test");
			expect(result.current.currentTest?.data).toBe(newData);
			expect(result.current.currentTest?.expectedOutcome).toBe(false);
		});

		it("should delete a test", () => {
			const { result } = renderHook(() => useFlowStore());
			const testToDelete = result.current.tests[0];

			act(() => {
				// biome-ignore lint/style/noNonNullAssertion: null
				result.current.deleteTest(testToDelete!.id);
			});

			expect(result.current.tests).toHaveLength(0);
			expect(result.current.currentTest).toBeNull();
		});

		it("should select a test", () => {
			const { result } = renderHook(() => useFlowStore());
			const testToSelect = result.current.tests[0];

			act(() => {
				// biome-ignore lint/style/noNonNullAssertion: null
				result.current.selectTest(testToSelect!);
			});

			expect(result.current.currentTest).toEqual(testToSelect);
			// biome-ignore lint/style/noNonNullAssertion: null
			expect(result.current.testData).toBe(testToSelect!.data);
		});

		it("should set test data", () => {
			const { result } = renderHook(() => useFlowStore());

			const newData = '{"new": "test data"}';
			act(() => {
				result.current.setTestData(newData);
			});

			expect(result.current.testData).toBe(newData);
		});

		it("should update test result", () => {
			const { result } = renderHook(() => useFlowStore());
			// biome-ignore lint/style/noNonNullAssertion: null
			const testId = result.current.tests[0]!.id;

			const mockResult = {
				result: true,
				finalOutcome: "success",
				executionPath: ["start-1", "end-1"],
				nodeResponses: [],
			};

			act(() => {
				result.current.updateTestResult(testId, mockResult);
			});

			// biome-ignore lint/style/noNonNullAssertion: null
			const updatedTest = result.current.tests.find((t) => t.id === testId)!;
			expect(updatedTest.result).toEqual(mockResult);
			expect(updatedTest.lastRun).toBeInstanceOf(Date);
		});
	});

	describe("Flow Validation", () => {
		it("should validate flow", () => {
			const { result } = renderHook(() => useFlowStore());

			act(() => {
				result.current.validateFlow();
			});

			expect(result.current.validationResult).toBeDefined();
			expect(result.current.validationResult?.isValid).toBe(true);
		});
	});

	describe("Test Execution", () => {
		it("should test flow successfully", async () => {
			const mockResult = {
				result: true,
				finalOutcome: "success",
				executionPath: ["start-1"],
				nodeResponses: [],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResult,
			});

			const { result } = renderHook(() => useFlowStore());

			// biome-ignore lint/suspicious/noExplicitAny: can be anything
			let testResult: any;
			await act(async () => {
				testResult = await result.current.testFlow({ example: "data" });
			});

			expect(testResult.success).toBe(true);
			expect(testResult.result).toEqual(mockResult);
			expect(result.current.testResult).toEqual(mockResult);
			expect(result.current.isTestRunning).toBe(false);
		});

		it("should handle test flow error", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
				json: async () => ({ message: "Server error" }),
			});

			const { result } = renderHook(() => useFlowStore());

			// biome-ignore lint/suspicious/noExplicitAny: can be anything
			let testResult: any;
			await act(async () => {
				testResult = await result.current.testFlow({ example: "data" });
			});

			expect(testResult.success).toBe(false);
			expect(testResult.error).toBe("Server error");
			expect(result.current.isTestRunning).toBe(false);
			expect(result.current.error).toBe("Server error");
		});

		it("should run individual test", async () => {
			const mockResult = {
				result: true,
				finalOutcome: "success",
				executionPath: ["start-1"],
				nodeResponses: [],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResult,
			});

			const { result } = renderHook(() => useFlowStore());
			// biome-ignore lint/style/noNonNullAssertion: null
			const testId = result.current.tests[0]!.id;

			await act(async () => {
				await result.current.runTest(testId);
			});

			// biome-ignore lint/style/noNonNullAssertion: null
			const updatedTest = result.current.tests.find((t) => t.id === testId)!;
			expect(updatedTest.result).toBeDefined();
		});

		it("should run all tests", async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					result: true,
					finalOutcome: "success",
					executionPath: [],
					nodeResponses: [],
				}),
			});

			const { result } = renderHook(() => useFlowStore());

			await act(async () => {
				await result.current.runAllTests();
			});

			expect(result.current.tests.every((t) => t.result !== undefined)).toBe(
				true,
			);
		});
	});

	describe("API Operations", () => {
		it("should save flow successfully", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					id: "saved-flow-id",
					version: 2,
				}),
			});

			const { result } = renderHook(() => useFlowStore());

			// biome-ignore lint/suspicious/noExplicitAny: can be anything
			let saveResult: any;
			await act(async () => {
				saveResult = await result.current.saveFlow();
			});

			expect(saveResult.success).toBe(true);
			expect(saveResult.returnId).toBe("saved-flow-id");
			expect(saveResult.version).toBe(2);
		});

		it("should handle save flow validation error", async () => {
			// Mock validation to fail
			const mockValidation = require("~/lib/utils/flow-validation");
			mockValidation.validateFlowTermination.mockReturnValue({
				isValid: false,
				errors: ["Flow has no termination"],
				warnings: [],
			});

			const { result } = renderHook(() => useFlowStore());

			// biome-ignore lint/suspicious/noExplicitAny: can be anything
			let saveResult: any;
			await act(async () => {
				saveResult = await result.current.saveFlow();
			});

			expect(saveResult.success).toBe(false);
			expect(saveResult.error).toContain("Flow validation failed");
		});

		it("should get flow successfully", async () => {
			const mockFlowData = {
				id: "flow-123",
				baseId: "base-123",
				name: "Test Flow",
				description: "Test description",
				tags: ["test"],
				nodes: JSON.stringify([]),
				edges: JSON.stringify([]),
				tests: JSON.stringify([]),
				version: 1,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				status: "draft",
				hasDraft: true,
				flow: "test-yaml",
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockFlowData,
			});

			const { result } = renderHook(() => useFlowStore());

			act(() => {
				result.current.setFlowId("flow-123");
			});

			// biome-ignore lint/suspicious/noExplicitAny: can be anything
			let getResult: any;
			await act(async () => {
				getResult = await result.current.getFlow();
			});

			expect(getResult.success).toBe(true);
			expect(result.current.flowSpec?.id).toBe("flow-123");
			expect(result.current.name).toBe("Test Flow");
		});
	});

	describe("Reset Functionality", () => {
		it("should reset store to default state", () => {
			const { result } = renderHook(() => useFlowStore());

			// Modify state
			act(() => {
				result.current.setFlowName("Modified Flow");
				result.current.createTest();
				result.current.setError("Some error");
			});

			// Reset
			act(() => {
				result.current.reset();
			});

			expect(result.current.name).toBe("New Flow");
			expect(result.current.tests).toHaveLength(1);
			expect(result.current.error).toBeNull();
			expect(result.current.isTestRunning).toBe(false);
		});
	});
});
