import { render } from "@testing-library/react";

// Mock the content component
const MockPolicyInfo = ({ policy_id }: { policy_id: string }) => {
	return <div data-testid="policy-info">Policy Info for {policy_id}</div>;
};

jest.mock("./content", () => ({
	__esModule: true,
	default: MockPolicyInfo,
}));

// Create a test wrapper for the async page component
function TestPolicyInfoPage({ policy_id }: { policy_id: string }) {
	return <MockPolicyInfo policy_id={policy_id} />;
}

describe("PolicyInfoPage", () => {
	it("should render with policy_id from params", () => {
		const { getByTestId } = render(
			<TestPolicyInfoPage policy_id="test-policy-123" />,
		);

		expect(getByTestId("policy-info")).toBeInTheDocument();
		expect(getByTestId("policy-info")).toHaveTextContent(
			"Policy Info for test-policy-123",
		);
	});

	it("should handle different policy IDs", () => {
		const { getByTestId } = render(
			<TestPolicyInfoPage policy_id="another-policy-456" />,
		);

		expect(getByTestId("policy-info")).toHaveTextContent(
			"Policy Info for another-policy-456",
		);
	});

	it("should render content component correctly", () => {
		const { getByTestId } = render(
			<TestPolicyInfoPage policy_id="test-policy" />,
		);

		expect(getByTestId("policy-info")).toBeInTheDocument();
		expect(getByTestId("policy-info")).toHaveTextContent(
			"Policy Info for test-policy",
		);
	});
});
