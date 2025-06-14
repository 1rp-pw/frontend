import { NextResponse } from "next/server";
import type { FlowEdgeData, FlowNodeData } from "~/lib/types";

interface FlowTestRequest {
	testData: object;
	nodes: FlowNodeData[];
	edges: FlowEdgeData[];
}

interface FlowTestResult {
	nodeId: string;
	nodeName: string;
	result: boolean | string;
	executionPath: string[];
	finalOutcome: boolean | string;
	errors?: string[];
}

export async function POST(request: Request) {
	try {
		const { testData, nodes, edges }: FlowTestRequest = await request.json();

		// Find the start node
		const startNode = nodes.find((node) => node.type === "start");
		if (!startNode) {
			return NextResponse.json(
				{ error: "No start node found in flow" },
				{ status: 400 },
			);
		}

		// Execute the flow locally
		const result = await executeFlow(testData, startNode, nodes, edges);

		return NextResponse.json(result, { status: 200 });
	} catch (error) {
		console.error("Error testing flow:", error);
		return NextResponse.json({ error: "Failed to test flow" }, { status: 500 });
	}
}

async function executeFlow(
	testData: object,
	startNode: FlowNodeData,
	nodes: FlowNodeData[],
	edges: FlowEdgeData[],
): Promise<FlowTestResult> {
	const executionPath: string[] = [];
	const errors: string[] = [];
	let currentNode = startNode;
	let iterations = 0;
	const maxIterations = 50; // Prevent infinite loops

	// Helper function to find next node
	const findNextNode = (
		nodeId: string,
		outputType: "true" | "false",
	): FlowNodeData | null => {
		const edge = edges.find(
			(e) => e.source === nodeId && e.sourceHandle === outputType,
		);
		if (!edge) return null;
		return nodes.find((n) => n.id === edge.target) || null;
	};

	// Helper function to execute policy (mock for now - would call real policy API)
	const executePolicy = async (
		policyId: string,
		data: object,
	): Promise<boolean> => {
		if (!policyId.trim()) {
			errors.push(`Empty policy ID in node ${currentNode.id}`);
			return false;
		}

		try {
			// This would make a real API call to test the policy
			// For now, we'll simulate based on policy ID pattern
			if (policyId.includes("test-pass")) return true;
			if (policyId.includes("test-fail")) return false;

			// Mock policy execution - in real implementation, this would call the policy API
			console.log(`Mock policy execution for ${policyId} with data:`, data);
			return Math.random() > 0.5; // Random result for demo
		} catch (error) {
			errors.push(`Failed to execute policy ${policyId}: ${error}`);
			return false;
		}
	};

	try {
		while (currentNode && iterations < maxIterations) {
			iterations++;
			executionPath.push(`${currentNode.type}:${currentNode.id}`);

			switch (currentNode.type) {
				case "start": {
					// Start node: execute the policy with test data
					// biome-ignore lint/suspicious/noExplicitAny: <explanation>
					const startData = currentNode as any;
					if (!startData.policyId) {
						errors.push("Start node has no policy ID specified");
						return {
							nodeId: currentNode.id,
							nodeName: currentNode.label,
							result: false,
							executionPath,
							finalOutcome: false,
							errors,
						};
					}

					const policyResult = await executePolicy(
						startData.policyId,
						testData,
					);
					const nextNode = findNextNode(
						currentNode.id,
						policyResult ? "true" : "false",
					);

					if (!nextNode) {
						return {
							nodeId: currentNode.id,
							nodeName: currentNode.label,
							result: policyResult,
							executionPath,
							finalOutcome: policyResult,
							errors: errors.length > 0 ? errors : undefined,
						};
					}

					currentNode = nextNode;
					break;
				}

				case "policy": {
					// Policy node: execute another policy
					// biome-ignore lint/suspicious/noExplicitAny: <explanation>
					const policyData = currentNode as any;
					const policyResult = await executePolicy(
						policyData.policyId,
						testData,
					);
					const nextNode = findNextNode(
						currentNode.id,
						policyResult ? "true" : "false",
					);

					if (!nextNode) {
						return {
							nodeId: currentNode.id,
							nodeName: currentNode.label,
							result: policyResult,
							executionPath,
							finalOutcome: policyResult,
							errors: errors.length > 0 ? errors : undefined,
						};
					}

					currentNode = nextNode;
					break;
				}

				case "return": {
					// Return node: terminal node with boolean result
					// biome-ignore lint/suspicious/noExplicitAny: <explanation>
					const returnData = currentNode as any;
					return {
						nodeId: currentNode.id,
						nodeName: currentNode.label,
						result: returnData.returnValue,
						executionPath,
						finalOutcome: returnData.returnValue,
						errors: errors.length > 0 ? errors : undefined,
					};
				}

				case "custom": {
					// Custom node: terminal node with custom outcome
					// biome-ignore lint/suspicious/noExplicitAny: <explanation>
					const customData = currentNode as any;
					return {
						nodeId: currentNode.id,
						nodeName: currentNode.label,
						result: customData.outcome || "custom_outcome",
						executionPath,
						finalOutcome: customData.outcome || "custom_outcome",
						errors: errors.length > 0 ? errors : undefined,
					};
				}

				default:
					errors.push(`Unknown node type: ${currentNode.type}`);
					return {
						nodeId: currentNode.id,
						nodeName: currentNode.label,
						result: false,
						executionPath,
						finalOutcome: false,
						errors,
					};
			}
		}

		if (iterations >= maxIterations) {
			errors.push(
				"Flow execution exceeded maximum iterations (possible infinite loop)",
			);
		}

		return {
			nodeId: currentNode?.id || "unknown",
			nodeName: currentNode?.label || "Unknown",
			result: false,
			executionPath,
			finalOutcome: false,
			errors,
		};
	} catch (error) {
		errors.push(`Flow execution error: ${error}`);
		return {
			nodeId: currentNode?.id || "unknown",
			nodeName: currentNode?.label || "Unknown",
			result: false,
			executionPath,
			finalOutcome: false,
			errors,
		};
	}
}
