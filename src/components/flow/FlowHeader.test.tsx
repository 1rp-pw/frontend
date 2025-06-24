import { render } from "@testing-library/react";
import { FlowHeader } from "./FlowHeader";

// Mock the child components
jest.mock("~/components/flow/publsh", () => ({
	PublishFlow: () => <div data-testid="publish-flow">Publish Flow</div>,
}));

jest.mock("~/components/flow/save", () => ({
	SaveFlow: () => <div data-testid="save-flow">Save Flow</div>,
}));

// Mock Next.js Link
jest.mock("next/link", () => {
	return ({ children, href }: { children: React.ReactNode; href: string }) => (
		<a href={href}>{children}</a>
	);
});

describe("FlowHeader", () => {
	it("should render with flow name", () => {
		const { getByText } = render(<FlowHeader name="My Test Flow" />);

		expect(getByText("My Test Flow")).toBeInTheDocument();
	});

	it("should render default title when name is empty", () => {
		const { getByText } = render(<FlowHeader name="" />);

		expect(getByText("Flow Editor")).toBeInTheDocument();
	});

	it("should show back button when baseId is provided", () => {
		const { container } = render(
			<FlowHeader name="Test Flow" baseId="flow-123" />,
		);

		const link = container.querySelector('a[href="/flow/flow-123"]');
		expect(link).toBeInTheDocument();
	});

	it("should not show back button when baseId is not provided", () => {
		const { container } = render(<FlowHeader name="Test Flow" />);

		const backButton = container.querySelector('a[href*="/flow/"]');
		expect(backButton).not.toBeInTheDocument();
	});

	it("should show save and publish buttons when not readonly", () => {
		const { getByTestId } = render(
			<FlowHeader name="Test Flow" readonly={false} />,
		);

		expect(getByTestId("save-flow")).toBeInTheDocument();
		expect(getByTestId("publish-flow")).toBeInTheDocument();
	});

	it("should hide save and publish buttons when readonly", () => {
		const { queryByTestId } = render(
			<FlowHeader name="Test Flow" readonly={true} />,
		);

		expect(queryByTestId("save-flow")).not.toBeInTheDocument();
		expect(queryByTestId("publish-flow")).not.toBeInTheDocument();
	});

	it("should show save and publish buttons by default (when readonly is undefined)", () => {
		const { getByTestId } = render(<FlowHeader name="Test Flow" />);

		expect(getByTestId("save-flow")).toBeInTheDocument();
		expect(getByTestId("publish-flow")).toBeInTheDocument();
	});

	it("should have proper styling classes", () => {
		const { container } = render(<FlowHeader name="Test Flow" />);

		const header = container.querySelector("header");
		expect(header?.classList.contains("flex")).toBe(true);
		expect(header?.classList.contains("border-b")).toBe(true);
		expect(header?.classList.contains("bg-card")).toBe(true);

		const title = container.querySelector("h1");
		expect(title?.classList.contains("font-bold")).toBe(true);
		expect(title?.classList.contains("text-xl")).toBe(true);
	});

	it("should render all components together correctly", () => {
		const { getByText, getByTestId, container } = render(
			<FlowHeader
				name="Complete Test Flow"
				baseId="flow-456"
				readonly={false}
			/>,
		);

		// Check title
		expect(getByText("Complete Test Flow")).toBeInTheDocument();

		// Check back button
		const link = container.querySelector('a[href="/flow/flow-456"]');
		expect(link).toBeInTheDocument();

		// Check action buttons
		expect(getByTestId("save-flow")).toBeInTheDocument();
		expect(getByTestId("publish-flow")).toBeInTheDocument();
	});
});
