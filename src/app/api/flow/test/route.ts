import { NextResponse } from "next/server";
import type { FlowEdgeData, FlowNodeData } from "~/lib/types";
import { flowToYaml } from "~/lib/utils/flow-to-yaml";
import { env } from "~/env";

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

		// Generate YAML representation of the flow
		const yaml = flowToYaml(nodes, edges);
		console.info("yaml", yaml);

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

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return NextResponse.json(
				{ error: errorData.message || `Server error: ${response.status}` },
				{ status: response.status },
			);
		}

		const result = await response.json();
		return NextResponse.json(result, { status: 200 });
	} catch (error) {
		console.error("Error testing flow:", error);
		return NextResponse.json({ error: "Failed to test flow" }, { status: 500 });
	}
}
