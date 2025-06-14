import { create } from "zustand";
import type { FlowSpec, FlowNodeData, FlowEdgeData } from "~/lib/types";

export interface FlowTestResult {
	nodeId: string;
	nodeName: string;
	result: boolean | string;
	executionPath: string[];
	finalOutcome: boolean | string;
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
	getFlow: (
		flowId?: string,
		version?: string,
	) => Promise<{
		success: boolean;
		error?: string;
	}>;
	
	// Test execution
	testFlow: (testData: object) => Promise<{
		success: boolean;
		result?: FlowTestResult;
		error?: string;
	}>;
	isTestRunning: boolean;
	testResult: FlowTestResult | null;
	
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
			jsonData: '{"example": "data"}',
			policyId: "",
			policyName: "",
		}
	],
	edges: [],
	version: 1,
	draft: true,
	status: "draft",
	createdAt: new Date(),
	updatedAt: new Date(),
	hasDraft: true,
});

export const useFlowStore = create<FlowStore>((set, get) => {
	const defaultSpec = createDefaultFlowSpec();

	return {
		flowSpec: defaultSpec,
		nodes: defaultSpec.nodes,
		edges: defaultSpec.edges,
		name: defaultSpec.name,
		id: defaultSpec.id || null,
		
		// Test execution state
		isTestRunning: false,
		testResult: null,

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

		getFlow: async (flowId?: string, version?: string) => {
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
				let response;

				if (version) {
					response = await fetch(
						`/api/flow?id=${currentId}&version=${version}`,
						{
							method: "GET",
							headers: { "Content-Type": "application/json" },
						},
					);
				} else {
					response = await fetch(`/api/flow?id=${currentId}`, {
						method: "GET",
						headers: { "Content-Type": "application/json" },
					});
				}

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
					nodes: JSON.parse(result.nodes),
					edges: JSON.parse(result.edges),
					version: result.version || 1,
					createdAt: new Date(result.createdAt || Date.now()),
					updatedAt: new Date(result.updatedAt || Date.now()),
					status: result.status,
					draft: result.status === "draft",
					hasDraft: result.hasDraft,
				};

				set({
					flowSpec: flowSpec,
					nodes: flowSpec.nodes,
					edges: flowSpec.edges,
					name: flowSpec.name,
					id: flowSpec.id,
					isLoading: false,
					error: null,
				});

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
					error:
						error instanceof Error ? error.message : "Failed to get flow",
				};
			}
		},

		saveFlow: async (): Promise<{
			success: boolean;
			returnId?: string;
			version?: number;
			error?: string;
		}> => {
			const { flowSpec, nodes, edges, id } = get();

			if (!flowSpec) {
				return {
					success: false,
					error: "No flow spec available",
				};
			}

			// Update the flowSpec with current nodes and edges before saving
			const updatedFlowSpec = {
				...flowSpec,
				nodes,
				edges,
				updatedAt: new Date(),
			};

			try {
				const apiData = {
					name: updatedFlowSpec.name,
					description: updatedFlowSpec.description,
					tags: updatedFlowSpec.tags,
					nodes: updatedFlowSpec.nodes,
					edges: updatedFlowSpec.edges,
					id: id || undefined,
					version: updatedFlowSpec.version,
					status: updatedFlowSpec.status,
					baseId: updatedFlowSpec.baseId,
				};

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
					error:
						error instanceof Error ? error.message : "Failed to save flow",
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
				isLoading: false,
				error: null,
				isTestRunning: false,
				testResult: null,
			});
		},
	};
});