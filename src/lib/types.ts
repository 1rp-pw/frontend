export interface PolicySpec {
	baseId: string;
	id: string;
	name: string;
	rule: string;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
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
}

export interface ReturnNodeData extends FlowNodeData {
	type: "return";
	returnValue: boolean;
}

export interface CustomNodeData extends FlowNodeData {
	type: "custom";
	outcome: string;
}

export type FlowNode =
	| StartNodeData
	| PolicyNodeData
	| ReturnNodeData
	| CustomNodeData;

export interface FlowSpec {
	baseId: string;
	id: string;
	name: string;
	description?: string;
	tags?: string[];
	nodes: FlowNodeData[];
	edges: FlowEdgeData[];
	version: number | string;
	draft: boolean;
	status: string;
	createdAt: Date;
	updatedAt: Date;
	lastPublishedAt?: Date;
	hasDraft: boolean;
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
		nodeResponse: Array<{
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
