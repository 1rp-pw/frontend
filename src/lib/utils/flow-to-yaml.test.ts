import type { FlowEdgeData, FlowNodeData } from "~/lib/types";
import { flowToFlatYaml, flowToYaml } from "./flow-to-yaml";

describe("flow-to-yaml", () => {
	const mockNodes = [
		{
			id: "start-1",
			type: "start",
			label: "Start Node",
			position: { x: 0, y: 0 },
			data: null,
			policyId: "policy-start",
			policyName: "Start Policy",
		},
		{
			id: "policy-1",
			type: "policy",
			label: "Policy Node",
			position: { x: 200, y: 0 },
			data: null,
			policyId: "policy-123",
			policyName: "Access Policy",
		},
		{
			id: "return-1",
			type: "return",
			label: "Return True",
			position: { x: 400, y: 0 },
			data: null,
			returnValue: true,
		},
		{
			id: "return-2",
			type: "return",
			label: "Return False",
			position: { x: 400, y: 100 },
			data: null,
			returnValue: false,
		},
		{
			id: "custom-1",
			type: "custom",
			label: "Custom Outcome",
			position: { x: 400, y: 200 },
			data: null,
			outcome: "custom-result",
		},
	] as unknown as FlowNodeData[];

	const mockEdges: FlowEdgeData[] = [
		{
			id: "e1",
			source: "start-1",
			target: "policy-1",
			sourceHandle: "true",
		},
		{
			id: "e2",
			source: "start-1",
			target: "return-2",
			sourceHandle: "false",
		},
		{
			id: "e3",
			source: "policy-1",
			target: "return-1",
			sourceHandle: "true",
		},
		{
			id: "e4",
			source: "policy-1",
			target: "custom-1",
			sourceHandle: "false",
			label: "Access Denied",
		},
	];

	describe("flowToYaml", () => {
		it("should generate hierarchical YAML for a simple flow", () => {
			const simpleNodes = [
				{
					id: "start-1",
					type: "start",
					label: "Start",
					position: { x: 0, y: 0 },
					data: null,
					policyId: "policy-start",
				},
				{
					id: "return-1",
					type: "return",
					label: "Return",
					position: { x: 200, y: 0 },
					data: null,
					returnValue: true,
				},
			] as unknown as FlowNodeData[];

			const simpleEdges: FlowEdgeData[] = [
				{
					id: "e1",
					source: "start-1",
					target: "return-1",
					sourceHandle: "true",
				},
			];

			const yaml = flowToYaml(simpleNodes, simpleEdges);

			expect(yaml).toContain("flow:");
			expect(yaml).toContain("start:");
			expect(yaml).toContain("- id: start-1");
			expect(yaml).toContain("type: start");
			expect(yaml).toContain("policyId: policy-start");
			expect(yaml).toContain("onTrue:");
			expect(yaml).toContain("- id: return-1");
			expect(yaml).toContain("type: return");
			expect(yaml).toContain("returnValue: true");
			expect(yaml).toContain("metadata:");
			expect(yaml).toContain("totalNodes: 2");
			expect(yaml).toContain("totalEdges: 1");
			expect(yaml).toContain("timestamp:");
		});

		it("should handle flows without start node", () => {
			const nodesWithoutStart = [
				{
					id: "policy-1",
					type: "policy",
					label: "Policy",
					position: { x: 0, y: 0 },
					data: null,
					policyId: "policy-123",
				},
			] as unknown as FlowNodeData[];

			const yaml = flowToYaml(nodesWithoutStart, []);

			expect(yaml).toBe("# No start node found\n");
		});

		it("should generate complete YAML for complex flow", () => {
			const yaml = flowToYaml(mockNodes, mockEdges);

			expect(yaml).toContain("flow:");
			expect(yaml).toContain("start:");
			expect(yaml).toContain('policyName: "Start Policy"');
			expect(yaml).toContain('policyName: "Access Policy"');
			expect(yaml).toContain("onTrue:");
			expect(yaml).toContain("onFalse:");
			expect(yaml).toContain('outcome: "custom-result"');
			expect(yaml).toContain("metadata:");
			expect(yaml).toContain("totalNodes: 5");
			expect(yaml).toContain("totalEdges: 4");
		});

		it("should handle nodes without policy names", () => {
			const nodesWithoutNames = [
				{
					id: "start-1",
					type: "start",
					label: "Start",
					position: { x: 0, y: 0 },
					data: null,
					policyId: "policy-start",
				},
				{
					id: "return-1",
					type: "return",
					label: "Return",
					position: { x: 200, y: 0 },
					data: null,
					returnValue: false,
				},
			] as unknown as FlowNodeData[];

			const edges: FlowEdgeData[] = [
				{
					id: "e1",
					source: "start-1",
					target: "return-1",
					sourceHandle: "true",
				},
			];

			const yaml = flowToYaml(nodesWithoutNames, edges);

			expect(yaml).toContain("policyId: policy-start");
			expect(yaml).not.toContain("policyName:");
			expect(yaml).toContain("returnValue: false");
		});

		it("should handle custom nodes with empty outcome", () => {
			const customNodes = [
				{
					id: "start-1",
					type: "start",
					label: "Start",
					position: { x: 0, y: 0 },
					data: null,
					policyId: "policy-start",
				},
				{
					id: "custom-1",
					type: "custom",
					label: "Custom",
					position: { x: 200, y: 0 },
					data: null,
				},
			] as unknown as FlowNodeData[];

			const edges: FlowEdgeData[] = [
				{
					id: "e1",
					source: "start-1",
					target: "custom-1",
					sourceHandle: "true",
				},
			];

			const yaml = flowToYaml(customNodes, edges);

			expect(yaml).toContain('outcome: ""');
		});

		it("should prevent infinite loops in circular flows", () => {
			const circularNodes = [
				{
					id: "start-1",
					type: "start",
					label: "Start",
					position: { x: 0, y: 0 },
					data: null,
					policyId: "policy-start",
				},
				{
					id: "policy-1",
					type: "policy",
					label: "Policy",
					position: { x: 200, y: 0 },
					data: null,
					policyId: "policy-123",
				},
			] as unknown as FlowNodeData[];

			const circularEdges: FlowEdgeData[] = [
				{
					id: "e1",
					source: "start-1",
					target: "policy-1",
					sourceHandle: "true",
				},
				{
					id: "e2",
					source: "policy-1",
					target: "start-1",
					sourceHandle: "true",
				},
			];

			const yaml = flowToYaml(circularNodes, circularEdges);

			// Should not hang and should complete successfully
			expect(yaml).toContain("flow:");
			expect(yaml).toContain("start:");
			expect(yaml).toContain("metadata:");
		});
	});

	describe("flowToFlatYaml", () => {
		it("should generate flat YAML structure", () => {
			const yaml = flowToFlatYaml(mockNodes, mockEdges);

			expect(yaml).toContain("flow:");
			expect(yaml).toContain("nodes:");
			expect(yaml).toContain("edges:");
			expect(yaml).toContain("- id: start-1");
			expect(yaml).toContain("type: start");
			expect(yaml).toContain("policyId: policy-start");
			expect(yaml).toContain('policyName: "Start Policy"');
			expect(yaml).toContain("- from: start-1");
			expect(yaml).toContain("to: policy-1");
			expect(yaml).toContain("condition: true");
		});

		it("should handle edges with labels", () => {
			const edgesWithLabels: FlowEdgeData[] = [
				{
					id: "e1",
					source: "start-1",
					target: "policy-1",
					sourceHandle: "true",
					label: "Success Path",
				},
			];

			const yaml = flowToFlatYaml(mockNodes.slice(0, 2), edgesWithLabels);

			expect(yaml).toContain('label: "Success Path"');
		});

		it("should handle edges without sourceHandle", () => {
			const edgesWithoutHandle: FlowEdgeData[] = [
				{
					id: "e1",
					source: "start-1",
					target: "policy-1",
				},
			];

			const yaml = flowToFlatYaml(mockNodes.slice(0, 2), edgesWithoutHandle);

			expect(yaml).toContain("condition: default");
		});

		it("should include all node types in flat format", () => {
			const yaml = flowToFlatYaml(mockNodes, mockEdges);

			expect(yaml).toContain("type: start");
			expect(yaml).toContain("type: policy");
			expect(yaml).toContain("type: return");
			expect(yaml).toContain("type: custom");
			expect(yaml).toContain("returnValue: true");
			expect(yaml).toContain("returnValue: false");
			expect(yaml).toContain('outcome: "custom-result"');
		});

		it("should handle empty nodes and edges", () => {
			const yaml = flowToFlatYaml([], []);

			expect(yaml).toContain("flow:");
			expect(yaml).toContain("nodes:");
			expect(yaml).toContain("edges:");
			expect(yaml).not.toContain("- id:");
			expect(yaml).not.toContain("- from:");
		});
	});
});
