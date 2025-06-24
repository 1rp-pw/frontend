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
}));

// Mock environment variables
jest.mock("~/env", () => ({
	env: {
		API_SERVER: "http://localhost:3001",
	},
}));

import { POST } from "./route";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("/api/policy/test", () => {
	beforeEach(() => {
		mockFetch.mockClear();
	});

	describe("POST", () => {
		it("should execute policy test successfully", async () => {
			const testData = {
				data: {
					drivingTest: {
						person: { name: "John", dateOfBirth: "1990-01-01" },
						scores: { theory: { multipleChoice: 45, hazardPerception: 50 } },
					},
				},
				rule: "A driver passes if they score above 40",
			};

			const mockResponse = {
				error: null,
				result: true,
				trace: {
					execution: [
						{
							conditions: [],
							outcome: { value: "pass" },
							result: true,
							selector: { value: "driver" },
						},
					],
				},
				rule: ["A driver passes if they score above 40"],
				data: testData.data,
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const request = new Request("http://localhost:3000/api/policy/test", {
				method: "POST",
				body: JSON.stringify(testData),
				headers: { "Content-Type": "application/json" },
			});

			const response = await POST(request);
			const result = await response.json();

			expect(mockFetch).toHaveBeenCalledWith(
				"http://localhost:3001/run",
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify({
						data: testData.data,
						rule: testData.rule,
					}),
					cache: "no-store",
				}),
			);

			expect(response.status).toBe(200);
			expect(result).toEqual({
				errors: null,
				result: true,
				trace: mockResponse.trace,
				rule: mockResponse.rule,
				data: mockResponse.data,
			});
		});

		it("should handle policy test with errors", async () => {
			const testData = {
				data: { invalid: "data" },
				rule: "Invalid rule syntax",
			};

			const mockResponse = {
				error: "Parse error in rule",
				result: false,
				trace: null,
				rule: null,
				data: null,
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const request = new Request("http://localhost:3000/api/policy/test", {
				method: "POST",
				body: JSON.stringify(testData),
				headers: { "Content-Type": "application/json" },
			});

			const response = await POST(request);
			const result = await response.json();

			expect(response.status).toBe(200);
			expect(result).toEqual({
				errors: "Parse error in rule",
				result: false,
				trace: null,
				rule: null,
				data: null,
			});
		});

		it("should handle complex test data structures", async () => {
			const complexData = {
				data: {
					user: {
						profile: {
							age: 25,
							preferences: ["option1", "option2"],
							metadata: {
								lastLogin: "2023-12-01",
								active: true,
							},
						},
						permissions: {
							read: true,
							write: false,
							admin: false,
						},
					},
				},
				rule: "A user can access if they are active and have read permissions",
			};

			const mockResponse = {
				error: null,
				result: true,
				trace: {
					execution: [
						{
							conditions: [
								{
									property: {
										path: "user.profile.metadata.active",
										value: true,
									},
									result: true,
								},
								{
									property: { path: "user.permissions.read", value: true },
									result: true,
								},
							],
							outcome: { value: "allow" },
							result: true,
							selector: { value: "user" },
						},
					],
				},
				rule: [complexData.rule],
				data: complexData.data,
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const request = new Request("http://localhost:3000/api/policy/test", {
				method: "POST",
				body: JSON.stringify(complexData),
				headers: { "Content-Type": "application/json" },
			});

			const response = await POST(request);
			const result = await response.json();

			expect(response.status).toBe(200);
			expect(result.result).toBe(true);
			expect(result.trace.execution).toHaveLength(1);
		});

		it("should handle network errors", async () => {
			mockFetch.mockRejectedValueOnce(new Error("Network error"));

			const request = new Request("http://localhost:3000/api/policy/test", {
				method: "POST",
				body: JSON.stringify({ data: {}, rule: "" }),
				headers: { "Content-Type": "application/json" },
			});

			const response = await POST(request);
			const result = await response.json();

			expect(result).toEqual({ "Bad Request": { status: 500 } });
		});

		it("should handle malformed request body", async () => {
			const request = new Request("http://localhost:3000/api/policy/test", {
				method: "POST",
				body: "invalid json",
				headers: { "Content-Type": "application/json" },
			});

			const response = await POST(request);
			const result = await response.json();

			expect(result).toEqual({ "Bad Request": { status: 500 } });
		});

		it("should pass through all response fields correctly", async () => {
			const testData = {
				data: { testField: "value" },
				rule: "test rule",
			};

			const mockResponse = {
				error: "some error",
				result: false,
				trace: { execution: [] },
				rule: ["processed rule"],
				data: { processedData: true },
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const request = new Request("http://localhost:3000/api/policy/test", {
				method: "POST",
				body: JSON.stringify(testData),
				headers: { "Content-Type": "application/json" },
			});

			const response = await POST(request);
			const result = await response.json();

			expect(result).toEqual({
				errors: "some error",
				result: false,
				trace: { execution: [] },
				rule: ["processed rule"],
				data: { processedData: true },
			});
		});
	});
});
