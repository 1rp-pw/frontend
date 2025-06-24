import { NextRequest } from "next/server";
import { env } from "~/env";
import { flowToYaml } from "~/lib/utils/flow-to-yaml";
import { GET, POST, PUT } from "./route";

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

describe("/api/flow", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockFlowToYaml.mockReturnValue("test-yaml");
	});

	describe("POST", () => {
		it("should create a flow successfully", async () => {
			const requestData = {
				name: "Test Flow",
				nodes: [{ id: "1", type: "start" }],
				edges: [{ id: "e1", source: "1", target: "2" }],
				tests: [{ id: "t1", name: "Test 1", result: true }],
			};

			const mockResponse = {
				json: jest.fn().mockResolvedValue({ id: "flow-123" }),
			};
			mockFetch.mockResolvedValue(mockResponse as unknown as Response);

			const request = new Request("http://localhost:3000/api/flow", {
				method: "POST",
				body: JSON.stringify(requestData),
				headers: { "Content-Type": "application/json" },
			});

			const response = await POST(request);
			const responseData = await response.json();

			expect(mockFlowToYaml).toHaveBeenCalledWith(
				requestData.nodes,
				requestData.edges,
			);
			expect(mockFetch).toHaveBeenCalledWith(`${env.API_SERVER}/flow`, {
				method: "POST",
				body: expect.stringContaining('"name":"Test Flow"'),
				cache: "no-store",
			});
			expect(responseData).toEqual({ id: "flow-123" });
			expect(response.status).toBe(200);
		});

		it("should handle errors during flow creation", async () => {
			mockFetch.mockRejectedValue(new Error("Network error"));

			const request = new Request("http://localhost:3000/api/flow", {
				method: "POST",
				body: JSON.stringify({ name: "Test", nodes: [], edges: [], tests: [] }),
			});

			const response = await POST(request);
			const responseData = await response.json();

			expect(response.status).toBe(500);
			expect(responseData).toHaveProperty("error");
		});
	});

	describe("PUT", () => {
		it("should update a flow successfully", async () => {
			const requestData = {
				id: "flow-123",
				name: "Updated Flow",
				description: "Updated description",
				tags: ["tag1"],
				nodes: [{ id: "1", type: "start" }],
				edges: [],
				tests: [],
				version: "1.0",
				status: "draft",
				baseId: "base-123",
			};

			mockFetch.mockResolvedValue({
				ok: true,
				json: jest.fn().mockResolvedValue({}),
			} as unknown as Response);

			const request = new Request("http://localhost:3000/api/flow", {
				method: "PUT",
				body: JSON.stringify(requestData),
			});

			const response = await PUT(request);

			expect(mockFlowToYaml).toHaveBeenCalledWith(
				requestData.nodes,
				requestData.edges,
			);
			expect(mockFetch).toHaveBeenCalledWith(
				`${env.API_SERVER}/flow/flow-123`,
				{
					method: "PUT",
					body: expect.stringContaining('"name":"Updated Flow"'),
					cache: "no-store",
				},
			);
			expect(response.status).toBe(200);
		});

		it("should handle errors during flow update", async () => {
			mockFetch.mockRejectedValue(new Error("Update failed"));

			const request = new Request("http://localhost:3000/api/flow", {
				method: "PUT",
				body: JSON.stringify({ id: "flow-123", nodes: [], edges: [] }),
			});

			const response = await PUT(request);

			expect(response.status).toBe(500);
		});
	});

	describe("GET", () => {
		it("should fetch a flow successfully", async () => {
			const mockFlowData = {
				id: "flow-123",
				baseId: "base-123",
				name: "Test Flow",
				description: "Test description",
				tags: ["test"],
				nodes: [],
				edges: [],
				status: "published",
				version: "1.0",
				createdAt: "2023-01-01",
				updatedAt: "2023-01-02",
				hasDraft: false,
				tests: [],
			};

			mockFetch.mockResolvedValue({
				json: jest.fn().mockResolvedValue(mockFlowData),
			} as unknown as Response);

			const url = new URL("http://localhost:3000/api/flow?id=flow-123");
			const request = new NextRequest(url);

			const response = await GET(request);
			const responseData = await response.json();

			expect(mockFetch).toHaveBeenCalledWith(`${env.API_SERVER}/flow/flow-123`);
			expect(responseData).toEqual(mockFlowData);
			expect(response.status).toBe(200);
		});

		it("should return 404 when flow not found", async () => {
			mockFetch.mockResolvedValue({
				json: jest.fn().mockResolvedValue({}),
			} as unknown as Response);

			const url = new URL("http://localhost:3000/api/flow?id=nonexistent");
			const request = new NextRequest(url);

			const response = await GET(request);
			const responseData = await response.json();

			expect(response.status).toBe(404);
			expect(responseData).toEqual({ error: "failed request" });
		});

		it("should handle fetch errors", async () => {
			mockFetch.mockRejectedValue(new Error("Fetch failed"));

			const url = new URL("http://localhost:3000/api/flow?id=flow-123");
			const request = new NextRequest(url);

			const response = await GET(request);

			expect(response.status).toBe(500);
		});
	});
});
