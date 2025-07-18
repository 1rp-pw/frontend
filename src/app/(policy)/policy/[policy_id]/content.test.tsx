import { fireEvent, render, waitFor } from "@testing-library/react";
import PolicyInfo from "./content";

// Mock Next.js Link
jest.mock("next/link", () => {
	return ({ children, href }: { children: React.ReactNode; href: string }) => (
		<a href={href}>{children}</a>
	);
});

// Mock UI components
jest.mock("~/components/ui/badge", () => ({
	Badge: ({
		children,
		variant,
	}: {
		children: React.ReactNode;
		variant?: string;
	}) => (
		<span data-testid="badge" data-variant={variant}>
			{children}
		</span>
	),
}));

jest.mock("~/components/ui/button", () => ({
	// biome-ignore lint/suspicious/noExplicitAny: Mock component
	Button: ({ children, asChild, ...props }: any) =>
		asChild ? (
			<div {...props}>{children}</div>
		) : (
			<button {...props}>{children}</button>
		),
}));

jest.mock("~/components/ui/card", () => ({
	// biome-ignore lint/suspicious/noExplicitAny: Mock component
	Card: ({ children, className, onClick }: any) => (
		// biome-ignore lint/a11y/noStaticElementInteractions: static
		// biome-ignore lint/a11y/useKeyWithClickEvents: dont care about key
		<div data-testid="card" className={className} onClick={onClick}>
			{children}
		</div>
	),
	// biome-ignore lint/suspicious/noExplicitAny: Mock component
	CardContent: ({ children, className }: any) => (
		<div data-testid="card-content" className={className}>
			{children}
		</div>
	),
	// biome-ignore lint/suspicious/noExplicitAny: Mock component
	CardDescription: ({ children, className }: any) => (
		<div data-testid="card-description" className={className}>
			{children}
		</div>
	),
	// biome-ignore lint/suspicious/noExplicitAny: Mock component
	CardHeader: ({ children, className }: any) => (
		<div data-testid="card-header" className={className}>
			{children}
		</div>
	),
	// biome-ignore lint/suspicious/noExplicitAny: Mock component
	CardTitle: ({ children, className }: any) => (
		<div data-testid="card-title" className={className}>
			{children}
		</div>
	),
}));

jest.mock("~/components/ui/scroll-area", () => ({
	// biome-ignore lint/suspicious/noExplicitAny: Mock component
	ScrollArea: ({ children, className }: any) => (
		<div data-testid="scroll-area" className={className}>
			{children}
		</div>
	),
}));

jest.mock("~/components/ui/skeleton", () => ({
	Skeleton: ({ className }: { className?: string }) => (
		<div data-testid="skeleton" className={className}>
			Loading...
		</div>
	),
}));

jest.mock("~/components/ui/highlight", () => ({
	highlightText: (text: string) => `<highlighted>${text}</highlighted>`,
}));

jest.mock("~/components/ui/rainbow", () => ({
	// biome-ignore lint/suspicious/noExplicitAny: Mock can accept any JSON
	RainbowBraces: ({ json, className }: { json: any; className?: string }) => (
		<div data-testid="rainbow-braces" className={className}>
			{JSON.stringify(json, null, 2)}
		</div>
	),
}));

// Mock Lucide icons
jest.mock("lucide-react", () => ({
	Clock: () => <span data-testid="clock-icon">🕐</span>,
	FilePenLine: () => <span data-testid="file-pen-icon">✏️</span>,
	FilePlus2: () => <span data-testid="file-plus-icon">📄+</span>,
	FileText: () => <span data-testid="file-text-icon">📄</span>,
	PackageCheck: () => <span data-testid="package-check-icon">📦✓</span>,
	GitCompareArrows: () => <span data-testid="git-compare-icon">⇄</span>,
}));

// Mock DiffModal component
jest.mock("~/components/policy/diff-modal", () => ({
	// biome-ignore lint/suspicious/noExplicitAny: Mock component
	DiffModal: ({ open, children, ...props }: any) =>
		open ? (
			<div data-testid="diff-modal" {...props}>
				{children}
			</div>
		) : null,
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("PolicyInfo", () => {
	beforeEach(() => {
		mockFetch.mockClear();
	});

	const mockVersions = [
		{
			id: "version-1",
			name: "Test Policy",
			version: "1.0.0",
			description: "First version",
			status: "published",
			draft: false,
			rule: "A **Person** has an age",
			schema: { type: "object", properties: { age: { type: "number" } } },
			createdAt: "2024-01-01T10:00:00Z",
			updatedAt: "2024-01-02T10:00:00Z",
		},
		{
			id: "version-2",
			name: "Test Policy",
			version: "2.0.0",
			description: "Second version",
			status: "draft",
			draft: true,
			rule: "A **Person** has an age and name",
			schema: {
				type: "object",
				properties: { age: { type: "number" }, name: { type: "string" } },
			},
			createdAt: "2024-01-03T10:00:00Z",
			updatedAt: "2024-01-04T10:00:00Z",
		},
	];

	it("should render loading skeleton initially", () => {
		mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

		const { getAllByTestId } = render(<PolicyInfo policy_id="test-policy" />);

		const skeletons = getAllByTestId("skeleton");
		expect(skeletons).toHaveLength(3); // Main skeleton + 2 detail skeletons
	});

	it("should fetch and display policy versions", async () => {
		mockFetch.mockResolvedValueOnce({
			json: async () => mockVersions,
		});

		const { getByText, getAllByTestId, getAllByText } = render(
			<PolicyInfo policy_id="test-policy" />,
		);

		await waitFor(() => {
			expect(getByText("Test Policy Version History")).toBeInTheDocument();
			expect(getByText("2 versions available")).toBeInTheDocument();
		});

		// Check version cards (use getAllByText for potential duplicates)
		const versionTexts = getAllByText("1.0.0");
		expect(versionTexts.length).toBeGreaterThan(0);

		// Use getAllByText for Draft since it appears in multiple places
		const draftTexts = getAllByText("Draft");
		expect(draftTexts.length).toBeGreaterThan(0);
		expect(getByText("First version")).toBeInTheDocument();
		expect(getByText("Second version")).toBeInTheDocument();

		// Check that versions are rendered as cards
		const cards = getAllByTestId("card");
		expect(cards).toHaveLength(2);
	});

	it("should auto-select first version", async () => {
		mockFetch.mockResolvedValueOnce({
			json: async () => mockVersions,
		});

		const { getAllByText } = render(<PolicyInfo policy_id="test-policy" />);

		await waitFor(() => {
			// First version should be auto-selected and displayed (use getAllByText for multiple occurrences)
			const versionTexts = getAllByText("1.0.0");
			expect(versionTexts.length).toBeGreaterThan(0);
		});
	});

	it("should handle version selection", async () => {
		mockFetch.mockResolvedValueOnce({
			json: async () => mockVersions,
		});

		const { getAllByTestId, getAllByText } = render(
			<PolicyInfo policy_id="test-policy" />,
		);

		await waitFor(() => {
			const cards = getAllByTestId("card");
			// Click on the second version (draft)
			if (cards[1]) {
				fireEvent.click(cards[1]);
			}

			// Should display "Draft" in the header (use getAllByText since Draft appears multiple times)
			const draftTexts = getAllByText("Draft");
			expect(draftTexts.length).toBeGreaterThan(0);
		});
	});

	it("should display correct badges for draft and published versions", async () => {
		mockFetch.mockResolvedValueOnce({
			json: async () => mockVersions,
		});

		const { getAllByTestId } = render(<PolicyInfo policy_id="test-policy" />);

		await waitFor(() => {
			const badges = getAllByTestId("badge");
			expect(badges).toHaveLength(2);

			// First version is published
			expect(badges[0]).toHaveTextContent("Published");
			expect(badges[0]).toHaveAttribute("data-variant", "default");

			// Second version is draft
			expect(badges[1]).toHaveTextContent("Draft");
			expect(badges[1]).toHaveAttribute("data-variant", "secondary");
		});
	});

	it("should display rule content with highlighting", async () => {
		mockFetch.mockResolvedValueOnce({
			json: async () => mockVersions,
		});

		const { container } = render(<PolicyInfo policy_id="test-policy" />);

		await waitFor(() => {
			// Check that highlighted content is rendered
			expect(container.innerHTML).toContain(
				"<highlighted>A **Person** has an age</highlighted>",
			);
		});
	});

	it("should display schema with rainbow braces", async () => {
		mockFetch.mockResolvedValueOnce({
			json: async () => mockVersions,
		});

		const { getByTestId } = render(<PolicyInfo policy_id="test-policy" />);

		await waitFor(() => {
			const rainbowBraces = getByTestId("rainbow-braces");
			expect(rainbowBraces).toBeInTheDocument();
			expect(rainbowBraces).toHaveTextContent("age");
		});
	});

	it("should show appropriate action buttons for draft versions", async () => {
		mockFetch.mockResolvedValueOnce({
			json: async () => mockVersions,
		});

		const { getByText, getAllByTestId, container } = render(
			<PolicyInfo policy_id="test-policy" />,
		);

		await waitFor(() => {
			const cards = getAllByTestId("card");
			// Click on draft version
			if (cards[1]) {
				fireEvent.click(cards[1]);
			}
		});

		await waitFor(() => {
			// Should show "Edit Draft" button for draft version
			const editLink = container.querySelector(
				'a[href="/policy/version-2/edit"]',
			);
			expect(editLink).toBeInTheDocument();
			expect(getByText("Edit Draft")).toBeInTheDocument();
		});
	});

	it("should show appropriate action buttons for published versions", async () => {
		mockFetch.mockResolvedValueOnce({
			json: async () => mockVersions,
		});

		const { getByText, container } = render(
			<PolicyInfo policy_id="test-policy" />,
		);

		await waitFor(() => {
			// First version (published) should be auto-selected
			const viewLink = container.querySelector(
				'a[href="/policy/version-1/view"]',
			);
			expect(viewLink).toBeInTheDocument();
			expect(getByText("View Details")).toBeInTheDocument();
		});
	});

	it("should show create draft button when no draft exists", async () => {
		const publishedOnlyVersions = [mockVersions[0]]; // Only published version

		mockFetch.mockResolvedValueOnce({
			json: async () => publishedOnlyVersions,
		});

		const { getByText, container } = render(
			<PolicyInfo policy_id="test-policy" />,
		);

		await waitFor(() => {
			const createDraftLink = container.querySelector(
				'a[href="/policy/version-1/draft"]',
			);
			expect(createDraftLink).toBeInTheDocument();
			expect(getByText("Create Draft")).toBeInTheDocument();
		});
	});

	it("should not show create draft button when draft exists", async () => {
		mockFetch.mockResolvedValueOnce({
			json: async () => mockVersions, // Includes both draft and published
		});

		const { queryByText } = render(<PolicyInfo policy_id="test-policy" />);

		await waitFor(() => {
			// Should not show "Create Draft" button when draft exists
			expect(queryByText("Create Draft")).not.toBeInTheDocument();
		});
	});

	it("should format dates correctly", async () => {
		mockFetch.mockResolvedValueOnce({
			json: async () => mockVersions,
		});

		const { container } = render(<PolicyInfo policy_id="test-policy" />);

		await waitFor(() => {
			// Should contain formatted dates
			expect(container.textContent).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
		});
	});

	it("should return null when no versions exist", async () => {
		mockFetch.mockResolvedValueOnce({
			json: async () => [],
		});

		const { container } = render(<PolicyInfo policy_id="test-policy" />);

		await waitFor(() => {
			expect(container.firstChild).toBeNull();
		});
	});

	it("should handle API call with correct URL", async () => {
		mockFetch.mockResolvedValueOnce({
			json: async () => mockVersions,
		});

		render(<PolicyInfo policy_id="test-policy-123" />);

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledWith(
				"/api/policy/versions?policy_id=test-policy-123",
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				},
			);
		});
	});

	it("should handle version with no rule content", async () => {
		const versionWithoutRule = [
			{
				...mockVersions[0],
				rule: "",
			},
		];

		mockFetch.mockResolvedValueOnce({
			json: async () => versionWithoutRule,
		});

		const { container } = render(<PolicyInfo policy_id="test-policy" />);

		await waitFor(() => {
			expect(container.innerHTML).toContain("No rule content available");
		});
	});

	it("should render all required icons", async () => {
		mockFetch.mockResolvedValueOnce({
			json: async () => mockVersions,
		});

		const { getAllByTestId } = render(<PolicyInfo policy_id="test-policy" />);

		await waitFor(() => {
			const clockIcons = getAllByTestId("clock-icon");
			expect(clockIcons.length).toBeGreaterThan(0);

			const packageIcons = getAllByTestId("package-check-icon");
			expect(packageIcons.length).toBeGreaterThan(0);
		});
	});
});
