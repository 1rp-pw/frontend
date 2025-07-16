export interface PolicySpec {
	baseId: string;
	id: string;
	name: string;
	rule: string;
	// biome-ignore lint/suspicious/noExplicitAny: can be anything
	schema: any;
	schemaVersion: string;
	version: number | string;
	draft: boolean;
	createdAt: Date;
	updatedAt: Date;
	lastPublishedAt?: Date;
	status: string;
	description?: string;
	tags?: string[];
	hasDraft: boolean;
	error: string | null;
}

export interface PolicyVersion {
	version: number;
	spec: PolicySpec;
	createdAt: Date;
	changelog?: string;
}

export interface PolicyWithVersions {
	id: string;
	currentVersion: number;
	versions: PolicyVersion[];
	metadata: {
		totalVersions: number;
		createdAt: Date;
		lastModified: Date;
	};
}

export const PROPERTY_TYPES = [
	{ value: "string", label: "String" },
	{ value: "number", label: "Number" },
	{ value: "boolean", label: "Boolean" },
	{ value: "object", label: "Object" },
	{ value: "array", label: "Array" },
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number]["value"];

export interface FlowNodeData extends Record<string, unknown> {
	id: string;
	type: "start" | "policy" | "return" | "custom";
	label: string;
	position: {
		x: number;
		y: number;
	};
}

export interface StartNodeData extends FlowNodeData {
	type: "start";
	policyId: string;
	policyName?: string;
}

export interface PolicyNodeData extends FlowNodeData {
	type: "policy";
	policyId: string;
	policyName?: string;
	calledPath?: boolean;
}

export interface ReturnNodeData extends FlowNodeData {
	type: "return";
	returnValue: boolean;
}

export interface CustomNodeData extends FlowNodeData {
	type: "custom";
	outcome: string;
	calledPath?: boolean;
}

export type FlowNode =
	| StartNodeData
	| PolicyNodeData
	| ReturnNodeData
	| CustomNodeData;

export interface NodeOperationLog {
	id: string;
	timestamp: Date;
	operation: "create" | "update" | "delete" | "typeChange";
	nodeId: string;
	nodeType: string;
	details: {
		// biome-ignore lint/suspicious/noExplicitAny: details can be anything
		from?: any;
		// biome-ignore lint/suspicious/noExplicitAny: details can be anything
		to?: any;
		cascadedDeletions?: Array<{
			nodeId: string;
			nodeType: string;
			// biome-ignore lint/suspicious/noExplicitAny: node data can be anything
			nodeData: any;
		}>;
		// biome-ignore lint/suspicious/noExplicitAny: node data can be anything
		nodeData?: any;
	};
}

export interface FlowSpec {
	baseId: string;
	id: string;
	name: string;
	description?: string;
	tags?: string[];
	nodes: FlowNodeData[];
	edges: FlowEdgeData[];
	tests?: FlowTest[];
	version: number | string;
	draft: boolean;
	status: string;
	createdAt: Date;
	updatedAt: Date;
	lastPublishedAt?: Date;
	hasDraft: boolean;
	flow: string;
	error: string | null;
}

export interface FlowEdgeData {
	id: string;
	source: string;
	target: string;
	sourceHandle?: string;
	targetHandle?: string;
	label?: string;
	style?: Record<string, unknown>;
	labelStyle?: Record<string, unknown>;
}

export interface FlowVersion {
	version: number;
	spec: FlowSpec;
	createdAt: Date;
	changelog?: string;
}

export interface FlowWithVersions {
	id: string;
	currentVersion: number;
	versions: FlowVersion[];
	metadata: {
		totalVersions: number;
		createdAt: Date;
		lastModified: Date;
	};
}

export interface FlowTest {
	id: string;
	name: string;
	data: string; // JSON string
	expectedOutcome: string | boolean; // Can be true, false, or custom string like "beep"
	created: boolean;
	createdAt: Date;
	lastRun?: Date;
	result?: {
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
	};
}
