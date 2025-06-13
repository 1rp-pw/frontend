export interface NodeData {
	label?: string;

	// Input node data
	jsonData?: string;
	policyId?: string;

	// Action node data
	actionType?: "return" | "policy" | "custom";
	outcome?: string;
	nextPolicyId?: string;
	customOutcome?: string;
	parentNodeId?: string;
	condition?: "true" | "false";
}

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
