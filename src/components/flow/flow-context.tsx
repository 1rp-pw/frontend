"use client";

import { createContext, useContext } from "react";

export interface FlowContextType {
	addConnectedNode: (
		sourceNodeId: string,
		outputType: "true" | "false",
		targetType?: "return" | "policy" | "custom",
	) => void;
	changeNodeType: (
		nodeId: string,
		newType: "return" | "policy" | "custom",
	) => void;
	getConnectedNodes: (nodeId: string) => { true?: string; false?: string };
	deleteNode: (nodeId: string) => void;
	onNodeValueChange: (
		nodeId: string,
		nodeType: string,
		// biome-ignore lint/suspicious/noExplicitAny: value can be anything
		oldValue: any,
		// biome-ignore lint/suspicious/noExplicitAny: value can be anything
		newValue: any,
		field: string,
	) => void;
}

export const FlowContext = createContext<FlowContextType | null>(null);

export function useFlowContext() {
	const context = useContext(FlowContext);
	if (!context) {
		throw new Error("useFlowContext must be used within a FlowProvider");
	}
	return context;
}
