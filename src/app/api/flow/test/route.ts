import { NextResponse } from "next/server";
import { env } from "~/env";
import type { FlowEdgeData, FlowNodeData } from "~/lib/types";
import { flowToYaml } from "~/lib/utils/flow-to-yaml";

interface FlowTestRequest {
	testData: object;
	nodes: FlowNodeData[];
	edges: FlowEdgeData[];
}

interface ServerFlowTestResponse {
	result: boolean | string;
	nodeResponse?: Array<{
		result: boolean | string;
		trace?: unknown;
		rule?: string[];
		data?: unknown;
		error?: string | null;
	}>;
}

interface FlowTestResult {
	nodeId: string;
	nodeName: string;
	result: boolean | string;
	executionPath: string[];
	finalOutcome: boolean | string;
	errors?: string[];
	nodeResponses?: Array<{
		result: boolean | string;
		trace?: unknown;
		rule?: string[];
		data?: unknown;
		error?: string | null;
	}>;
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

		// Generate YAML representation of the flow
		const yaml = flowToYaml(nodes, edges);

		// Send to API server for execution
		const response = await fetch(`${env.API_SERVER}/flow/test`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				data: testData,
				flow: yaml,
			}),
			cache: "no-store",
		});

		//console.info("req", JSON.stringify({ data: testData, flow: yaml }));

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return NextResponse.json(
				{ error: errorData.message || `Server error: ${response.status}` },
				{ status: response.status },
			);
		}

		const serverResult: ServerFlowTestResponse = await response.json();

		// Map server response to our FlowTestResult format
		const mappedResult: FlowTestResult = {
			nodeId: startNode.id,
			nodeName: startNode.label || "Start",
			result: serverResult.result,
			executionPath: [], // Could be extracted from nodeResponse if needed
			finalOutcome: serverResult.result,
			errors:
				serverResult.nodeResponse
					?.filter((nr) => nr.error)
					.map((nr) => nr.error as string) || [],
			nodeResponses: serverResult.nodeResponse || [],
		};

		return NextResponse.json(mappedResult, { status: 200 });
	} catch (error) {
		console.error("Error testing flow:", error);
		return NextResponse.json({ error: "Failed to test flow" }, { status: 500 });
	}
}
