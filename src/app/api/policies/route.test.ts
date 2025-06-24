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

describe("/api/policies", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("GET", () => {
		it("should fetch policies without search", async () => {
			const mockPolicies = [
				{ id: "policy-1", name: "Policy 1", rule: "test rule 1" },
				{ id: "policy-2", name: "Policy 2", rule: "test rule 2" },
			];

			mockFetch.mockResolvedValue({
				json: jest.fn().mockResolvedValue(mockPolicies),
			} as unknown as Response);

			const url = new URL("http://localhost:3000/api/policies");
			const request = new NextRequest(url);

			const response = await GET(request);
			const responseData = await response.json();

			expect(mockFetch).toHaveBeenCalledWith(`${env.API_SERVER}/policies`);
			expect(responseData).toEqual(mockPolicies);
			expect(response.status).toBe(200);
		});

		it("should fetch policies with search parameter", async () => {
			const mockPolicies = [
				{ id: "policy-1", name: "User Policy", rule: "user access rule" },
			];

			mockFetch.mockResolvedValue({
				json: jest.fn().mockResolvedValue(mockPolicies),
			} as unknown as Response);

			const url = new URL("http://localhost:3000/api/policies?search=user");
			const request = new NextRequest(url);

			const response = await GET(request);
			const responseData = await response.json();

			expect(mockFetch).toHaveBeenCalledWith(
				`${env.API_SERVER}/policies?search=${encodeURIComponent("user")}`,
			);
			expect(responseData).toEqual(mockPolicies);
			expect(response.status).toBe(200);
		});

		it("should handle empty results", async () => {
			mockFetch.mockResolvedValue({
				json: jest.fn().mockResolvedValue([]),
			} as unknown as Response);

			const url = new URL("http://localhost:3000/api/policies");
			const request = new NextRequest(url);

			const response = await GET(request);
			const responseData = await response.json();

			expect(responseData).toEqual({});
			expect(response.status).toBe(200);
		});

		it("should handle search with special characters", async () => {
			const searchTerm = "test & search";
			mockFetch.mockResolvedValue({
				json: jest.fn().mockResolvedValue([]),
			} as unknown as Response);

			const url = new URL(
				`http://localhost:3000/api/policies?search=${encodeURIComponent(searchTerm)}`,
			);
			const request = new NextRequest(url);

			const _response = await GET(request);

			expect(mockFetch).toHaveBeenCalledWith(
				`${env.API_SERVER}/policies?search=${encodeURIComponent(searchTerm)}`,
			);
		});

		it("should handle fetch errors", async () => {
			mockFetch.mockRejectedValue(new Error("Network error"));

			const url = new URL("http://localhost:3000/api/policies");
			const request = new NextRequest(url);

			const response = await GET(request);
			const responseData = await response.json();

			expect(response.status).toBe(500);
			expect(responseData).toHaveProperty("error");
		});
	});
});
