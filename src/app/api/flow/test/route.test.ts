import { env } from "~/env";
import type { FlowEdgeData, FlowNodeData } from "~/lib/types";
import { flowToYaml } from "~/lib/utils/flow-to-yaml";
import { POST } from "./route";

// Mock dependencies
jest.mock("~/env", () => ({
	env: {
		API_SERVER: "https://test-api.example.com",
	},
}));

jest.mock("~/lib/utils/flow-to-yaml");
const mockFlowToYaml = flowToYaml as jest.MockedFunction<typeof flowToYaml>;

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe("/api/flow/test", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockFlowToYaml.mockReturnValue("test-yaml-flow");
	});

	describe("POST", () => {
		const mockNodes = [
			{
				id: "start-1",
				type: "start",
				label: "Start Node",
				position: { x: 0, y: 0 },
				data: null,
				policyId: "policy-123",
			},
			{
				id: "policy-1",
				type: "policy",
				label: "Policy Node",
				position: { x: 100, y: 0 },
				data: null,
				policyId: "policy-123",
			},
		] as unknown as FlowNodeData[];

		const mockEdges: FlowEdgeData[] = [
			{
				id: "e1",
				source: "start-1",
				target: "policy-1",
				sourceHandle: "true",
			},
		];

		it("should execute flow test successfully", async () => {
			const testData = { userId: "user-123", action: "read" };

			const serverResponse = {
				result: true,
				nodeResponse: [
					{
						result: true,
						trace: { executionTime: 50 },
						rule: ["rule1", "rule2"],
						data: { processed: true },
						error: null,
					},
				],
			};

			mockFetch.mockResolvedValue({
				ok: true,
				json: jest.fn().mockResolvedValue(serverResponse),
			} as unknown as Response);

			const request = new Request("http://localhost:3000/api/flow/test", {
				method: "POST",
				body: JSON.stringify({
					testData,
					nodes: mockNodes,
					edges: mockEdges,
				}),
				headers: { "Content-Type": "application/json" },
			});
			const response = await POST(request);
			const responseData = await response.json();

			expect(mockFlowToYaml).toHaveBeenCalledWith(mockNodes, mockEdges);
			expect(mockFetch).toHaveBeenCalledWith(`${env.API_SERVER}/flow/test`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					data: testData,
					flow: "test-yaml-flow",
				}),
				cache: "no-store",
			});

			expect(responseData).toEqual({
				nodeId: "start-1",
				nodeName: "Start Node",
				result: true,
				executionPath: [],
				finalOutcome: true,
				errors: [],
				nodeResponses: serverResponse.nodeResponse,
			});
			expect(response.status).toBe(200);
		});

		it("should handle flows without start node", async () => {
			const nodesWithoutStart = [
				{
					id: "policy-1",
					type: "policy",
					label: "Policy Node",
					position: { x: 0, y: 0 },
					data: null,
				},
			] as unknown as FlowNodeData[];

			const request = new Request("http://localhost:3000/api/flow/test", {
				method: "POST",
				body: JSON.stringify({
					testData: {},
					nodes: nodesWithoutStart,
					edges: [],
				}),
			});

			const response = await POST(request);
			const responseData = await response.json();

			expect(response.status).toBe(400);
			expect(responseData).toEqual({ error: "No start node found in flow" });
		});

		it("should handle server errors", async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 500,
				json: jest.fn().mockResolvedValue({ message: "Internal server error" }),
			} as unknown as Response);

			const request = new Request("http://localhost:3000/api/flow/test", {
				method: "POST",
				body: JSON.stringify({
					testData: {},
					nodes: mockNodes,
					edges: mockEdges,
				}),
			});

			const response = await POST(request);
			const responseData = await response.json();

			expect(response.status).toBe(500);
			expect(responseData).toEqual({ error: "Internal server error" });
		});

		it("should handle server errors with no message", async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 404,
				json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
			} as unknown as Response);

			const request = new Request("http://localhost:3000/api/flow/test", {
				method: "POST",
				body: JSON.stringify({
					testData: {},
					nodes: mockNodes,
					edges: mockEdges,
				}),
			});

			const response = await POST(request);
			const responseData = await response.json();

			expect(response.status).toBe(404);
			expect(responseData).toEqual({ error: "Server error: 404" });
		});

		it("should extract errors from node responses", async () => {
			const serverResponse = {
				result: false,
				nodeResponse: [
					{
						result: false,
						error: "Policy validation failed",
					},
					{
						result: true,
						error: null,
					},
					{
						result: false,
						error: "Access denied",
					},
				],
			};

			mockFetch.mockResolvedValue({
				ok: true,
				json: jest.fn().mockResolvedValue(serverResponse),
			} as unknown as Response);

			const request = new Request("http://localhost:3000/api/flow/test", {
				method: "POST",
				body: JSON.stringify({
					testData: {},
					nodes: mockNodes,
					edges: mockEdges,
				}),
			});

			const response = await POST(request);
			const responseData = await response.json();

			expect(responseData.errors).toEqual([
				"Policy validation failed",
				"Access denied",
			]);
		});

		it("should handle network errors", async () => {
			mockFetch.mockRejectedValue(new Error("Network error"));

			const request = new Request("http://localhost:3000/api/flow/test", {
				method: "POST",
				body: JSON.stringify({
					testData: {},
					nodes: mockNodes,
					edges: mockEdges,
				}),
			});

			const response = await POST(request);
			const responseData = await response.json();

			expect(response.status).toBe(500);
			expect(responseData).toEqual({ error: "Failed to test flow" });
		});
	});
});