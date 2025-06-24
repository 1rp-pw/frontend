// Mock NextResponse first
jest.mock("next/server", () => ({
	NextResponse: {
		json: jest.fn((body, init) => ({
			status: init?.status || 200,
			statusText: init?.statusText || "OK",
			headers: new Map(Object.entries(init?.headers || {})),
			body: JSON.stringify(body),
			json: async () => body,
			text: async () => JSON.stringify(body),
			ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300,
			...init,
		})),
	},
	NextRequest: jest.fn().mockImplementation((url, options = {}) => ({
		url,
		method: options.method || "GET",
		headers: new Map(Object.entries(options.headers || {})),
		body: options.body,
		json: async () => JSON.parse(options.body || "{}"),
		text: async () => options.body || "",
		nextUrl: new URL(url),
		...options,
	})),
}));

// Mock environment variables
jest.mock("~/env", () => ({
	env: {
		API_SERVER: "http://localhost:3001",
	},
}));

import { GET, POST, PUT } from "./route";

const { NextRequest } = require("next/server");

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("/api/policy", () => {
	beforeEach(() => {
		mockFetch.mockClear();
	});

	describe("POST", () => {
		it("should create a new policy", async () => {
			const mockPolicyData = {
				name: "Test Policy",
				rule: "Test rule",
				tests: [],
				schema: { type: "object" },
			};

			const mockResponse = {
				id: "policy-123",
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const request = new Request("http://localhost:3000/api/policy", {
				method: "POST",
				body: JSON.stringify(mockPolicyData),
				headers: { "Content-Type": "application/json" },
			});

			const response = await POST(request);
			const result = await response.json();

			expect(mockFetch).toHaveBeenCalledWith(
				"http://localhost:3001/policy",
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify(mockPolicyData),
					cache: "no-store",
				}),
			);

			expect(response.status).toBe(200);
			expect(result).toEqual({ id: "policy-123" });
		});

		it("should handle POST errors", async () => {
			mockFetch.mockRejectedValueOnce(new Error("Network error"));

			const request = new Request("http://localhost:3000/api/policy", {
				method: "POST",
				body: JSON.stringify({ name: "Test" }),
				headers: { "Content-Type": "application/json" },
			});

			const response = await POST(request);

			expect(response.status).toBe(500);
		});
	});

	describe("PUT", () => {
		it("should update an existing policy", async () => {
			const mockUpdateData = {
				id: "policy-123",
				rule: "Updated rule",
				tests: [],
				schema: { type: "object" },
				name: "Updated Policy",
				version: 2,
				status: "draft",
				baseId: "base-123",
				description: "Updated description",
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({}),
			});

			const request = new Request("http://localhost:3000/api/policy", {
				method: "PUT",
				body: JSON.stringify(mockUpdateData),
				headers: { "Content-Type": "application/json" },
			});

			const response = await PUT(request);

			expect(mockFetch).toHaveBeenCalledWith(
				"http://localhost:3001/policy/policy-123",
				expect.objectContaining({
					method: "PUT",
					body: JSON.stringify({
						id: "policy-123",
						baseId: "base-123",
						rule: "Updated rule",
						tests: [],
						schema: { type: "object" },
						name: "Updated Policy",
						version: "2",
						status: "draft",
						description: "Updated description",
					}),
					cache: "no-store",
				}),
			);

			expect(response.status).toBe(200);
		});

		it("should handle version as empty string when not provided", async () => {
			const mockUpdateData = {
				id: "policy-123",
				rule: "Updated rule",
				tests: [],
				schema: { type: "object" },
				name: "Updated Policy",
				status: "draft",
				baseId: "base-123",
				description: "Updated description",
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({}),
			});

			const request = new Request("http://localhost:3000/api/policy", {
				method: "PUT",
				body: JSON.stringify(mockUpdateData),
				headers: { "Content-Type": "application/json" },
			});

			await PUT(request);

			const callArgs = mockFetch.mock.calls[0];
			const requestBody = JSON.parse(callArgs[1].body);
			expect(requestBody.version).toBe("");
		});

		it("should handle PUT errors", async () => {
			mockFetch.mockRejectedValueOnce(new Error("Network error"));

			const request = new Request("http://localhost:3000/api/policy", {
				method: "PUT",
				body: JSON.stringify({ id: "policy-123" }),
				headers: { "Content-Type": "application/json" },
			});

			const response = await PUT(request);

			expect(response.status).toBe(500);
		});
	});

	describe("GET", () => {
		it("should retrieve a policy by ID", async () => {
			const mockPolicyResponse = {
				id: "policy-123",
				baseId: "base-123",
				name: "Test Policy",
				rule: "Test rule",
				tests: JSON.stringify([]),
				schema: JSON.stringify({ type: "object" }),
				status: "draft",
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockPolicyResponse,
			});

			const url = new URL("http://localhost:3000/api/policy?id=policy-123");
			const request = new NextRequest(url);

			const response = await GET(request);
			const result = await response.json();

			expect(mockFetch).toHaveBeenCalledWith(
				"http://localhost:3001/policy/policy-123",
			);

			expect(response.status).toBe(200);
			expect(result).toEqual({
				id: "policy-123",
				baseId: "base-123",
				name: "Test Policy",
				rule: "Test rule",
				tests: JSON.stringify([]),
				schema: JSON.stringify({ type: "object" }),
				status: "draft",
			});
		});

		it("should handle GET when policy not found", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({}), // Empty response without id
			});

			const url = new URL("http://localhost:3000/api/policy?id=nonexistent");
			const request = new NextRequest(url);

			const response = await GET(request);
			const result = await response.json();

			expect(response.status).toBe(500);
			expect(result).toEqual({ error: "failed request" });
		});

		it("should handle GET errors", async () => {
			mockFetch.mockRejectedValueOnce(new Error("Network error"));

			const url = new URL("http://localhost:3000/api/policy?id=policy-123");
			const request = new NextRequest(url);

			const response = await GET(request);

			expect(response.status).toBe(500);
		});

		it("should extract ID from search params", async () => {
			const mockPolicyResponse = {
				id: "test-id",
				baseId: "base-id",
				name: "Test",
				rule: "rule",
				tests: "[]",
				schema: "{}",
				status: "draft",
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockPolicyResponse,
			});

			const url = new URL("http://localhost:3000/api/policy?id=test-id");
			const request = new NextRequest(url);

			await GET(request);

			expect(mockFetch).toHaveBeenCalledWith(
				"http://localhost:3001/policy/test-id",
			);
		});
	});
});
