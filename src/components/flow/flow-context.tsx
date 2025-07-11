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
}

export const FlowContext = createContext<FlowContextType | null>(null);

export function useFlowContext() {
	const context = useContext(FlowContext);
	if (!context) {
		throw new Error("useFlowContext must be used within a FlowProvider");
	}
	return context;
}
