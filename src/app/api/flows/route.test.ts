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

describe("/api/flows", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("GET", () => {
		it("should fetch flows successfully", async () => {
			const mockFlows = [
				{ id: "flow-1", name: "Flow 1", status: "published" },
				{ id: "flow-2", name: "Flow 2", status: "draft" },
			];

			mockFetch.mockResolvedValue({
				ok: true,
				json: jest.fn().mockResolvedValue(mockFlows),
			} as unknown as Response);

			const response = await GET();
			const responseData = await response.json();

			expect(mockFetch).toHaveBeenCalledWith(`${env.API_SERVER}/flows`, {
				method: "GET",
				cache: "no-store",
			});
			expect(responseData).toEqual(mockFlows);
			expect(response.status).toBe(200);
		});

		it("should handle HTTP errors", async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 404,
			} as unknown as Response);

			const response = await GET();
			const responseData = await response.json();

			expect(response.status).toBe(500);
			expect(responseData).toEqual({ error: "Failed to fetch flows" });
		});

		it("should handle network errors", async () => {
			mockFetch.mockRejectedValue(new Error("Network error"));

			const response = await GET();
			const responseData = await response.json();

			expect(response.status).toBe(500);
			expect(responseData).toEqual({ error: "Failed to fetch flows" });
		});
	});
});
