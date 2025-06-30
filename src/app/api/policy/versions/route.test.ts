import { NextRequest } from "next/server";
import { env } from "~/env";
import { GET } from "./route";

// Mock dependencies
jest.mock("~/env", () => ({
	env: {
		API_SERVER: "https://test-api.example.com",
	},
}));

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe("/api/policy/versions", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("GET", () => {
		it("should fetch policy versions successfully", async () => {
			const mockVersions = [
				{
					id: "version-1",
					baseId: "policy-123",
					version: "1.0",
					status: "published",
					createdAt: "2023-01-01",
				},
				{
					id: "version-2",
					baseId: "policy-123",
					version: "1.1",
					status: "draft",
					createdAt: "2023-01-02",
				},
			];

			mockFetch.mockResolvedValue({
				ok: true,
				json: jest.fn().mockResolvedValue(mockVersions),
			} as unknown as Response);

			const url = new URL(
				"http://localhost:3000/api/policy/versions?policy_id=policy-123",
			);
			const request = new NextRequest(url);

			const response = await GET(request);
			const responseData = await response.json();

			expect(mockFetch).toHaveBeenCalledWith(
				`${env.API_SERVER}/policy/policy-123/versions`,
			);
			// Expect sorted versions (newest first)
			expect(responseData).toEqual([
				{
					id: "version-2",
					baseId: "policy-123",
					version: "1.1",
					status: "draft",
					createdAt: "2023-01-02",
				},
				{
					id: "version-1",
					baseId: "policy-123",
					version: "1.0",
					status: "published",
					createdAt: "2023-01-01",
				},
			]);
			expect(response.status).toBe(200);
		});

		it("should handle API error responses", async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 404,
				statusText: "Not Found",
				json: jest.fn().mockResolvedValue({ error: "Not found" }),
			} as unknown as Response);

			const url = new URL(
				"http://localhost:3000/api/policy/versions?policy_id=policy-123",
			);
			const request = new NextRequest(url);

			const response = await GET(request);
			const responseData = await response.json();

			expect(response.status).toBe(404);
			expect(responseData).toEqual({ error: "Failed to fetch versions" });
		});

		it("should handle empty versions array", async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: jest.fn().mockResolvedValue([]),
			} as unknown as Response);

			const url = new URL(
				"http://localhost:3000/api/policy/versions?policy_id=policy-123",
			);
			const request = new NextRequest(url);

			const response = await GET(request);
			const responseData = await response.json();

			expect(response.status).toBe(200);
			expect(responseData).toEqual([]);
		});

		it("should handle missing policy_id parameter", async () => {
			const url = new URL("http://localhost:3000/api/policy/versions");
			const request = new NextRequest(url);

			const _response = await GET(request);

			expect(mockFetch).toHaveBeenCalledWith(
				`${env.API_SERVER}/policy/null/versions`,
			);
		});

		it("should handle fetch errors", async () => {
			mockFetch.mockRejectedValue(new Error("Network error"));

			const url = new URL(
				"http://localhost:3000/api/policy/versions?policy_id=policy-123",
			);
			const request = new NextRequest(url);

			const response = await GET(request);
			const responseData = await response.json();

			expect(response.status).toBe(500);
			expect(responseData).toHaveProperty("error");
		});
	});
});
