import { create } from "zustand";
import type {
	FlowEdgeData,
	FlowNodeData,
	FlowSpec,
	FlowTest,
} from "~/lib/types";
import { flowToFlatYaml, flowToYaml } from "~/lib/utils/flow-to-yaml";
import {
	type FlowValidationResult,
	validateFlowTermination,
} from "~/lib/utils/flow-validation";

export interface FlowTestResult {
	result: boolean | string;
	finalOutcome: boolean | string;
	executionPath: string[];
	nodeResponses: Array<{
		nodeId: string;
		nodeType: string;
		response: {
			result: boolean | string;
			trace?: {
				execution?: Array<{
					conditions: unknown[];
					outcome: {
						value: string;
						pos?: unknown;
					};
					result: boolean;
					selector: {
						value: string;
						pos?: unknown;
					};
				}>;
			};
			rule?: string[];
			data?: unknown;
			error?: string | null;
		};
	}>;
	errors?: string[];
}

interface FlowStore {
	// Flow spec management
	flowSpec: FlowSpec | null;
	nodes: FlowNodeData[];
	edges: FlowEdgeData[];
	name: string;
	id: string | null;

	// Actions
	setFlowSpec: (spec: FlowSpec) => void;
	updateFlowSpec: (updates: Partial<FlowSpec>) => void;
	setFlowName: (name: string) => void;
	setFlowId: (id: string) => void;
	setNodes: (nodes: FlowNodeData[]) => void;
	setEdges: (edges: FlowEdgeData[]) => void;
	updateNodesAndEdges: (nodes: FlowNodeData[], edges: FlowEdgeData[]) => void;

	// API operations
	saveFlow: () => Promise<{
		success: boolean;
		returnId?: string;
		version?: number;
		error?: string;
	}>;
	getFlow: (flowId?: string) => Promise<{
		success: boolean;
		error?: string;
	}>;

	// Test management
	tests: FlowTest[];
	currentTest: FlowTest | null;
	createTest: () => void;
	saveTest: (
		data: string,
		name: string,
		expectedOutcome?: string | boolean,
	) => void;
	selectTest: (test: FlowTest | null) => void;
	deleteTest: (testId: string) => void;
	updateTestResult: (testId: string, result: FlowTestResult) => void;

	// Test execution
	testFlow: (testData: object) => Promise<{
		success: boolean;
		result?: FlowTestResult;
		error?: string;
	}>;
	runTest: (testId: string) => Promise<void>;
	runAllTests: () => Promise<void>;
	isTestRunning: boolean;
	testResult: FlowTestResult | null;
	testData: string;
	setTestData: (data: string) => void;

	// Validation
	validateFlow: () => FlowValidationResult;
	validationResult: FlowValidationResult | null;

	// Loading states
	isLoading: boolean;
	error: string | null;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;

	// Reset
	reset: () => void;
}

const createDefaultFlowSpec = (): FlowSpec => ({
	id: "",
	baseId: "",
	name: "New Flow",
	description: "A new flow diagram",
	tags: ["flow"],
	nodes: [
		{
			id: "start-1",
			type: "start" as const,
			label: "Start",
			position: { x: 100, y: 100 },
			data: null,
			policyId: "",
			policyName: "",
		} as FlowNodeData,
	],
	edges: [],
	version: 1,
	draft: true,
	status: "draft",
	createdAt: new Date(),
	updatedAt: new Date(),
	hasDraft: true,
	flow: "",
	error: null,
});

const defaultTests: FlowTest[] = [
	{
		id: "default-1",
		name: "Test 1",
		data: '{\n  "example": "data",\n  "value": 123\n}',
		expectedOutcome: true,
		created: true,
		createdAt: new Date(),
	},
];

export const useFlowStore = create<FlowStore>((set, get) => {
	const defaultSpec = createDefaultFlowSpec();

	return {
		flowSpec: defaultSpec,
		nodes: defaultSpec.nodes,
		edges: defaultSpec.edges,
		name: defaultSpec.name,
		id: defaultSpec.id || null,

		// Test management state
		tests: defaultTests,
		currentTest: defaultTests[0] || null,

		// Test execution state
		isTestRunning: false,
		testResult: null,
		testData: defaultTests[0]?.data || '{\n  "example": "data"\n}',

		// Validation state
		validationResult: null,

		// Flow spec management
		setFlowSpec: (spec) => {
			set({
				flowSpec: spec,
				nodes: spec.nodes,
				edges: spec.edges,
				name: spec.name,
				id: spec.id || null,
			});
		},

		updateFlowSpec: (updates) => {
			const current = get().flowSpec;
			if (!current) return;

			const updatedSpec: FlowSpec = {
				...current,
				...updates,
				updatedAt: new Date(),
			};

			set({
				flowSpec: updatedSpec,
				nodes: updatedSpec.nodes,
				edges: updatedSpec.edges,
				name: updatedSpec.name,
				id: updatedSpec.id || null,
			});
		},

		setFlowName: (name) => {
			get().updateFlowSpec({ name });
		},

		setFlowId: (id) => {
			get().updateFlowSpec({ id });
		},

		setNodes: (nodes) => {
			get().updateFlowSpec({ nodes });
			set({ nodes });
		},

		setEdges: (edges) => {
			get().updateFlowSpec({ edges });
			set({ edges });
		},

		updateNodesAndEdges: (nodes, edges) => {
			get().updateFlowSpec({ nodes, edges });
			set({ nodes, edges });
		},

		isLoading: false,
		error: null,
		setLoading: (loading) => set({ isLoading: loading }),
		setError: (error) => set({ error }),
		setTestData: (data) => set({ testData: data }),

		// Test management
		createTest: () => {
			const { tests } = get();
			const newTest: FlowTest = {
				id: `test-${Date.now()}`,
				name: `Test ${tests.length + 1}`,
				data: '{\n  "example": "data"\n}',
				expectedOutcome: true,
				created: false,
				createdAt: new Date(),
			};
			set({ currentTest: newTest, testData: newTest.data });
		},

		saveTest: (data, name, expectedOutcome = true) => {
			const { currentTest, tests } = get();
			if (!currentTest) return;

			let updatedTest: FlowTest;

			if (currentTest.created) {
				// Update existing test
				updatedTest = {
					...currentTest,
					data,
					name,
					expectedOutcome,
				};
				const updatedTests = tests.map((t) =>
					t.id === currentTest.id ? updatedTest : t,
				);
				set({ tests: updatedTests, currentTest: updatedTest });
			} else {
				// Create new test
				updatedTest = {
					...currentTest,
					data,
					name,
					expectedOutcome,
					created: true,
				};
				set({
					tests: [...tests, updatedTest],
					currentTest: updatedTest,
				});
			}
		},

		selectTest: (test) => {
			console.log("Selecting test:", test);
			set({
				currentTest: test,
				testData: test?.data || '{\n  "example": "data"\n}',
			});
		},

		deleteTest: (testId) => {
			const { tests, currentTest } = get();
			const updatedTests = tests.filter((t) => t.id !== testId);
			const newCurrentTest =
				currentTest?.id === testId ? updatedTests[0] || null : currentTest;
			set({
				tests: updatedTests,
				currentTest: newCurrentTest,
				testData: newCurrentTest?.data || '{\n  "example": "data"\n}',
			});
		},

		updateTestResult: (testId, result) => {
			const { tests } = get();
			const updatedTests = tests.map((test) => {
				if (test.id === testId) {
					return {
						...test,
						lastRun: new Date(),
						result,
					};
				}
				return test;
			});
			set({ tests: updatedTests });
		},

		runTest: async (testId) => {
			const { tests, testFlow } = get();
			const test = tests.find((t) => t.id === testId);
			if (!test) return;

			try {
				const testData = JSON.parse(test.data);
				const result = await testFlow(testData);
				if (result.success && result.result) {
					get().updateTestResult(testId, result.result);
				}
			} catch (error) {
				console.error("Failed to run test:", error);
			}
		},

		runAllTests: async () => {
			const { tests, runTest } = get();
			const promises = tests
				.filter((t) => t.created)
				.map((test) => runTest(test.id));
			await Promise.all(promises);
		},

		validateFlow: () => {
			const { nodes, edges } = get();
			const validationResult = validateFlowTermination(nodes, edges);
			set({ validationResult });
			return validationResult;
		},

		testFlow: async (testData: object) => {
			const { nodes, edges } = get();

			set({ isTestRunning: true, testResult: null, error: null });

			try {
				const response = await fetch("/api/flow/test", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						testData,
						nodes,
						edges,
					}),
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					const error = errorData.message || `Server error: ${response.status}`;
					set({
						isTestRunning: false,
						error,
					});
					return {
						success: false,
						error,
					};
				}

				const result = await response.json();

				set({
					isTestRunning: false,
					testResult: result,
					error: null,
				});

				return {
					success: true,
					result,
				};
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Failed to test flow";
				set({
					isTestRunning: false,
					error: errorMessage,
				});
				return {
					success: false,
					error: errorMessage,
				};
			}
		},

		getFlow: async (flowId?: string) => {
			const currentId = flowId || get().id;

			if (!currentId) {
				const error = "No Flow ID";
				set({ error });
				return {
					success: false,
					error: "No flow ID provided",
				};
			}

			set({
				isLoading: true,
				error: null,
			});

			try {
				const response = await fetch(`/api/flow?id=${currentId}`, {
					method: "GET",
					headers: { "Content-Type": "application/json" },
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					const error = errorData.message || `Server error: ${response.status}`;
					set({
						isLoading: false,
						error,
					});
					return {
						success: false,
						error: errorData.message || `Server error: ${response.status}`,
					};
				}

				const result = await response.json();

				// Convert API response to FlowSpec
				const flowSpec: FlowSpec = {
					id: result.id,
					baseId: result.baseId,
					name: result.name,
					description: result.description,
					tags: result.tags,
					nodes:
						typeof result.nodes === "string"
							? JSON.parse(result.nodes)
							: result.nodes,
					edges:
						typeof result.edges === "string"
							? JSON.parse(result.edges)
							: result.edges,
					tests: result.tests
						? typeof result.tests === "string"
							? JSON.parse(result.tests)
							: result.tests
						: [],
					version: result.version || 1,
					createdAt: new Date(result.createdAt || Date.now()),
					updatedAt: new Date(result.updatedAt || Date.now()),
					status: result.status,
					draft: result.status === "draft",
					hasDraft: result.hasDraft,
					flow: result.flow || result.yaml || "",
					error: null,
				};

				console.log("Loading flow tests from API:", flowSpec.tests);

				set({
					flowSpec: flowSpec,
					nodes: flowSpec.nodes,
					edges: flowSpec.edges,
					tests: flowSpec.tests || [],
					name: flowSpec.name,
					id: flowSpec.id,
					isLoading: false,
					error: null,
				});

				// Auto-select the first test if there are any tests
				const tests = flowSpec.tests || [];
				if (tests.length > 0 && tests[0]) {
					get().selectTest(tests[0]);
				}

				return {
					success: true,
				};
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Failed to get flow";
				set({
					isLoading: false,
					error: errorMessage,
				});
				return {
					success: false,
					error: error instanceof Error ? error.message : "Failed to get flow",
				};
			}
		},

		saveFlow: async (): Promise<{
			success: boolean;
			returnId?: string;
			version?: number;
			error?: string;
		}> => {
			const { flowSpec, nodes, edges, id, validateFlow } = get();

			if (!flowSpec) {
				return {
					success: false,
					error: "No flow spec available",
				};
			}

			// Validate flow before saving
			const validation = validateFlow();
			if (!validation.isValid) {
				return {
					success: false,
					error: `Flow validation failed: ${validation.errors.join(", ")}`,
				};
			}

			// Update the flowSpec with current nodes, edges, and tests before saving
			const { tests } = get();
			const updatedFlowSpec = {
				...flowSpec,
				nodes,
				edges,
				tests,
				updatedAt: new Date(),
			};

			console.info("Saving flow", updatedFlowSpec);

			try {
				// Generate YAML representations
				const yamlNested = flowToYaml(nodes, edges);
				const yamlFlat = flowToFlatYaml(nodes, edges);

				const apiData = {
					name: updatedFlowSpec.name,
					description: updatedFlowSpec.description,
					tags: updatedFlowSpec.tags,
					nodes: updatedFlowSpec.nodes,
					edges: updatedFlowSpec.edges,
					tests: updatedFlowSpec.tests,
					yaml: yamlNested,
					yamlFlat: yamlFlat,
					id: id || undefined,
					version: updatedFlowSpec.version,
					status: updatedFlowSpec.status,
					baseId: updatedFlowSpec.baseId,
				};

				console.info("Saving flow to API", apiData);

				const response = await fetch("/api/flow", {
					method: flowSpec.id ? "PUT" : "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(apiData),
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					return {
						success: false,
						error: errorData.message || `Server error: ${response.status}`,
					};
				}

				const result = await response.json();
				if (result.id) {
					get().updateFlowSpec({ id: result.id });
					if (result.version) {
						return {
							success: true,
							returnId: result.id,
							version: result.version,
						};
					}

					return {
						success: true,
						returnId: result.id,
					};
				}

				return {
					success: true,
				};
			} catch (error) {
				return {
					success: false,
					error: error instanceof Error ? error.message : "Failed to save flow",
				};
			}
		},

		reset: () => {
			const defaultSpec = createDefaultFlowSpec();
			set({
				flowSpec: defaultSpec,
				nodes: defaultSpec.nodes,
				edges: defaultSpec.edges,
				name: defaultSpec.name,
				id: defaultSpec.id || null,
				tests: defaultTests,
				currentTest: defaultTests[0] || null,
				isLoading: false,
				error: null,
				isTestRunning: false,
				testResult: null,
				testData: defaultTests[0]?.data || '{\n  "example": "data"\n}',
				validationResult: null,
			});
		},
	};
});
