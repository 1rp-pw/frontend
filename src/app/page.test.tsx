import { render, waitFor } from "@testing-library/react";
import Page from "./page";

// Mock Next.js Link
jest.mock("next/link", () => {
	return ({ children, href }: { children: React.ReactNode; href: string }) => (
		<a href={href}>{children}</a>
	);
});

// Mock the skeleton component
jest.mock("~/components/ui/skeleton", () => ({
	Skeleton: ({ className }: { className?: string }) => (
		<div className={className} data-testid="skeleton">
			Loading...
		</div>
	),
}));

// Mock the table components
jest.mock("~/components/ui/table", () => ({
	Table: ({ children }: { children: React.ReactNode }) => (
		<table data-testid="table">{children}</table>
	),
	TableHeader: ({ children }: { children: React.ReactNode }) => (
		<thead>{children}</thead>
	),
	TableBody: ({ children }: { children: React.ReactNode }) => (
		<tbody>{children}</tbody>
	),
	TableRow: ({ children }: { children: React.ReactNode }) => (
		<tr>{children}</tr>
	),
	TableHead: ({ children }: { children: React.ReactNode }) => (
		<th>{children}</th>
	),
	TableCell: ({ children }: { children: React.ReactNode }) => (
		<td>{children}</td>
	),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("PolicyList Page", () => {
	beforeEach(() => {
		mockFetch.mockClear();
	});

	it("should render loading skeletons initially", () => {
		mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

		const { getAllByTestId } = render(<Page />);

		const skeletons = getAllByTestId("skeleton");
		expect(skeletons.length).toBeGreaterThanOrEqual(2); // At least 2 main skeletons
	});

	it("should fetch and display policies and flows", async () => {
		const mockPolicies = [
			{
				baseId: "policy-1",
				name: "Test Policy",
				createdAt: "2024-01-01T10:00:00Z",
				updatedAt: "2024-01-02T10:00:00Z",
				lastPublishedAt: "2024-01-03T10:00:00Z",
				hasDraft: true,
			},
		];

		const mockFlows = [
			{
				baseId: "flow-1",
				name: "Test Flow",
				createdAt: "2024-01-01T11:00:00Z",
				updatedAt: "2024-01-02T11:00:00Z",
				lastPublishedAt: "2024-01-03T11:00:00Z",
				hasDraft: false,
			},
		];

		mockFetch
			.mockResolvedValueOnce({
				json: async () => mockPolicies,
			})
			.mockResolvedValueOnce({
				json: async () => mockFlows,
			});

		const { getByText, getAllByTestId } = render(<Page />);

		// Wait for data to load and skeletons to disappear
		await waitFor(
			() => {
				expect(getByText("Test Policy")).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);

		await waitFor(
			() => {
				expect(getByText("Test Flow")).toBeInTheDocument();
			},
			{ timeout: 3000 },
		);

		// Check that section headers are present
		expect(getByText("Policies")).toBeInTheDocument();
		expect(getByText("Flows")).toBeInTheDocument();

		// Check policy data
		expect(getByText("Yes")).toBeInTheDocument(); // hasDraft

		// Check flow data
		expect(getByText("No")).toBeInTheDocument(); // hasDraft

		// Verify tables are rendered
		const tables = getAllByTestId("table");
		expect(tables).toHaveLength(2);
	});

	it("should handle policy fetch errors", async () => {
		const consoleSpy = jest.spyOn(console, "error").mockImplementation();

		mockFetch
			.mockResolvedValueOnce({
				json: async () => ({ error: "Policy fetch failed" }),
			})
			.mockResolvedValueOnce({
				json: async () => [],
			});

		render(<Page />);

		await waitFor(() => {
			expect(consoleSpy).toHaveBeenCalledWith(
				"loadPoliciesError",
				"Policy fetch failed",
			);
		});

		consoleSpy.mockRestore();
	});

	it("should handle flow fetch errors", async () => {
		const consoleSpy = jest.spyOn(console, "error").mockImplementation();

		mockFetch
			.mockResolvedValueOnce({
				json: async () => [],
			})
			.mockResolvedValueOnce({
				json: async () => ({ error: "Flow fetch failed" }),
			});

		render(<Page />);

		await waitFor(() => {
			expect(consoleSpy).toHaveBeenCalledWith(
				"loadFlowsError",
				"Flow fetch failed",
			);
		});

		consoleSpy.mockRestore();
	});

	it("should handle network errors", async () => {
		mockFetch
			.mockRejectedValueOnce(new Error("Network error"))
			.mockRejectedValueOnce(new Error("Network error"));

		render(<Page />);

		// Component should handle errors gracefully without crashing
		await waitFor(() => {
			// Should still render the component structure
			expect(document.querySelector("div")).toBeInTheDocument();
		});
	});

	it("should display 'Not Published Yet' for invalid publish dates", async () => {
		const mockPolicies = [
			{
				baseId: "policy-1",
				name: "Test Policy",
				createdAt: "2024-01-01T10:00:00Z",
				updatedAt: "2024-01-02T10:00:00Z",
				lastPublishedAt: "0001-01-01T00:00:00Z", // Invalid date
				hasDraft: false,
			},
		];

		mockFetch
			.mockResolvedValueOnce({
				json: async () => mockPolicies,
			})
			.mockResolvedValueOnce({
				json: async () => [],
			});

		const { getByText } = render(<Page />);

		await waitFor(() => {
			expect(getByText("Not Published Yet")).toBeInTheDocument();
		});
	});

	it("should format dates correctly", async () => {
		const mockPolicies = [
			{
				baseId: "policy-1",
				name: "Test Policy",
				createdAt: "2024-01-01T10:00:00Z",
				updatedAt: "2024-01-02T10:00:00Z",
				lastPublishedAt: "2024-01-03T10:00:00Z",
				hasDraft: false,
			},
		];

		mockFetch
			.mockResolvedValueOnce({
				json: async () => mockPolicies,
			})
			.mockResolvedValueOnce({
				json: async () => [],
			});

		const { container } = render(<Page />);

		await waitFor(() => {
			// Should contain formatted date text (actual format depends on locale)
			expect(container.textContent).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
		});
	});

	it("should not render sections when no data exists", async () => {
		mockFetch
			.mockResolvedValueOnce({
				json: async () => [],
			})
			.mockResolvedValueOnce({
				json: async () => [],
			});

		const { queryByText } = render(<Page />);

		await waitFor(() => {
			// Should not render section headers when no data
			expect(queryByText("Policies")).not.toBeInTheDocument();
			expect(queryByText("Flows")).not.toBeInTheDocument();
		});
	});

	it("should generate correct links for policies and flows", async () => {
		const mockPolicies = [
			{
				baseId: "policy-123",
				name: "Test Policy",
				createdAt: "2024-01-01T10:00:00Z",
				updatedAt: "2024-01-02T10:00:00Z",
				lastPublishedAt: "2024-01-03T10:00:00Z",
				hasDraft: false,
			},
		];

		const mockFlows = [
			{
				baseId: "flow-456",
				name: "Test Flow",
				createdAt: "2024-01-01T11:00:00Z",
				updatedAt: "2024-01-02T11:00:00Z",
				lastPublishedAt: "2024-01-03T11:00:00Z",
				hasDraft: false,
			},
		];

		mockFetch
			.mockResolvedValueOnce({
				json: async () => mockPolicies,
			})
			.mockResolvedValueOnce({
				json: async () => mockFlows,
			});

		const { container } = render(<Page />);

		await waitFor(() => {
			const policyLinks = container.querySelectorAll(
				'a[href="/policy/policy-123"]',
			);
			const flowLinks = container.querySelectorAll('a[href="/flow/flow-456"]');

			expect(policyLinks.length).toBeGreaterThan(0);
			expect(flowLinks.length).toBeGreaterThan(0);
		});
	});
});
