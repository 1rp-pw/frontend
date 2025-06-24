import type { FlowEdgeData, FlowNodeData } from "~/lib/types";
import { validateFlowTermination } from "./flow-validation";

describe("flow-validation", () => {
	describe("validateFlowTermination", () => {
		it("should validate a simple valid flow", () => {
			const nodes = [
				{
					id: "start-1",
					type: "start",
					label: "Start",
					position: { x: 0, y: 0 },
					data: null,
					policyId: "policy-123",
				},
				{
					id: "return-1",
					type: "return",
					label: "Return True",
					position: { x: 200, y: 0 },
					data: null,
					returnValue: true,
				},
				{
					id: "return-2",
					type: "return",
					label: "Return False",
					position: { x: 200, y: 100 },
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
				{
					id: "e2",
					source: "start-1",
					target: "return-2",
					sourceHandle: "false",
				},
			];

			const result = validateFlowTermination(nodes, edges);

			expect(result.isValid).toBe(true);
			expect(result.errors).toEqual([]);
			expect(result.unterminatedNodes).toEqual([]);
		});

		it("should detect missing start node", () => {
			const nodes = [
				{
					id: "policy-1",
					type: "policy",
					label: "Policy",
					position: { x: 0, y: 0 },
					data: null,
					policyId: "policy-123",
				},
			] as unknown as FlowNodeData[];

			const edges: FlowEdgeData[] = [];

			const result = validateFlowTermination(nodes, edges);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("No start node found in the flow");
		});

		it("should detect missing policy ID", () => {
			const nodes = [
				{
					id: "start-1",
					type: "start",
					label: "Start",
					position: { x: 0, y: 0 },
					data: null,
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

			const edges: FlowEdgeData[] = [];

			const result = validateFlowTermination(nodes, edges);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain(
				'start node "start-1" must have a Policy ID',
			);
			expect(result.unterminatedNodes).toContain("start-1");
		});

		it("should detect missing true/false paths", () => {
			const nodes = [
				{
					id: "start-1",
					type: "start",
					label: "Start",
					position: { x: 0, y: 0 },
					data: null,
					policyId: "policy-123",
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

			const edges: FlowEdgeData[] = [
				{
					id: "e1",
					source: "start-1",
					target: "return-1",
					sourceHandle: "true",
				},
			];

			const result = validateFlowTermination(nodes, edges);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain(
				'start node "start-1" is missing a FALSE path',
			);
			expect(result.unterminatedNodes).toContain("start-1");
		});

		it("should detect circular references", () => {
			const nodes = [
				{
					id: "start-1",
					type: "start",
					label: "Start",
					position: { x: 0, y: 0 },
					data: null,
					policyId: "policy-123",
				},
				{
					id: "policy-1",
					type: "policy",
					label: "Policy",
					position: { x: 200, y: 0 },
					data: null,
					policyId: "policy-456",
				},
			] as unknown as FlowNodeData[];

			const edges: FlowEdgeData[] = [
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
				{
					id: "e3",
					source: "start-1",
					target: "policy-1",
					sourceHandle: "false",
				},
				{
					id: "e4",
					source: "policy-1",
					target: "start-1",
					sourceHandle: "false",
				},
			];

			const result = validateFlowTermination(nodes, edges);

			expect(result.isValid).toBe(false);
			expect(
				result.errors.some((error) =>
					error.includes("Circular reference detected"),
				),
			).toBe(true);
		});

		it("should detect orphaned nodes", () => {
			const nodes = [
				{
					id: "start-1",
					type: "start",
					label: "Start",
					position: { x: 0, y: 0 },
					data: null,
					policyId: "policy-123",
				},
				{
					id: "return-1",
					type: "return",
					label: "Return True",
					position: { x: 200, y: 0 },
					data: null,
					returnValue: true,
				},
				{
					id: "return-2",
					type: "return",
					label: "Return False",
					position: { x: 200, y: 100 },
					data: null,
					returnValue: false,
				},
				{
					id: "orphan-1",
					type: "policy",
					label: "Orphaned Policy",
					position: { x: 400, y: 0 },
					data: null,
					policyId: "policy-orphan",
				},
			] as unknown as FlowNodeData[];

			const edges: FlowEdgeData[] = [
				{
					id: "e1",
					source: "start-1",
					target: "return-1",
					sourceHandle: "true",
				},
				{
					id: "e2",
					source: "start-1",
					target: "return-2",
					sourceHandle: "false",
				},
			];

			const result = validateFlowTermination(nodes, edges);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain(
				'Node "orphan-1" is not connected to the flow',
			);
			expect(result.unterminatedNodes).toContain("orphan-1");
		});

		it("should validate custom terminal nodes", () => {
			const nodes = [
				{
					id: "start-1",
					type: "start",
					label: "Start",
					position: { x: 0, y: 0 },
					data: null,
					policyId: "policy-123",
				},
				{
					id: "custom-1",
					type: "custom",
					label: "Custom Outcome",
					position: { x: 200, y: 0 },
					data: null,
					outcome: "custom-result",
				},
				{
					id: "return-1",
					type: "return",
					label: "Return False",
					position: { x: 200, y: 100 },
					data: null,
					returnValue: false,
				},
			] as unknown as FlowNodeData[];

			const edges: FlowEdgeData[] = [
				{
					id: "e1",
					source: "start-1",
					target: "custom-1",
					sourceHandle: "true",
				},
				{
					id: "e2",
					source: "start-1",
					target: "return-1",
					sourceHandle: "false",
				},
			];

			const result = validateFlowTermination(nodes, edges);

			expect(result.isValid).toBe(true);
			expect(result.errors).toEqual([]);
		});

		it("should detect referenced node not found", () => {
			const nodes = [
				{
					id: "start-1",
					type: "start",
					label: "Start",
					position: { x: 0, y: 0 },
					data: null,
					policyId: "policy-123",
				},
			] as unknown as FlowNodeData[];

			const edges: FlowEdgeData[] = [
				{
					id: "e1",
					source: "start-1",
					target: "nonexistent-node",
					sourceHandle: "true",
				},
			];

			const result = validateFlowTermination(nodes, edges);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain(
				'Referenced node "nonexistent-node" not found',
			);
		});

		it("should handle complex multi-level flow", () => {
			const nodes = [
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
					label: "Policy 1",
					position: { x: 200, y: 0 },
					data: null,
					policyId: "policy-1",
				},
				{
					id: "policy-2",
					type: "policy",
					label: "Policy 2",
					position: { x: 200, y: 100 },
					data: null,
					policyId: "policy-2",
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
			] as unknown as FlowNodeData[];

			const edges: FlowEdgeData[] = [
				{
					id: "e1",
					source: "start-1",
					target: "policy-1",
					sourceHandle: "true",
				},
				{
					id: "e2",
					source: "start-1",
					target: "policy-2",
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
					target: "return-2",
					sourceHandle: "false",
				},
				{
					id: "e5",
					source: "policy-2",
					target: "return-1",
					sourceHandle: "true",
				},
				{
					id: "e6",
					source: "policy-2",
					target: "return-2",
					sourceHandle: "false",
				},
			];

			const result = validateFlowTermination(nodes, edges);

			expect(result.isValid).toBe(true);
			expect(result.errors).toEqual([]);
			expect(result.unterminatedNodes).toEqual([]);
		});
	});
});
