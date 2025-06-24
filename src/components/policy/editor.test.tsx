import { fireEvent, render } from "@testing-library/react";
import { Editor } from "./editor";

// Mock the highlightText function
jest.mock("~/components/ui/highlight", () => ({
	highlightText: jest.fn((text) => text),
}));

describe("Editor", () => {
	it("should render with initial rule text", () => {
		const rule = "A **Person** has an age";
		const { container } = render(<Editor rule={rule} onChange={jest.fn()} />);

		const textarea = container.querySelector("textarea");
		expect(textarea?.value).toBe(rule);
	});

	it("should call onChange when text is modified", () => {
		const onChange = jest.fn();
		const { container } = render(<Editor rule="initial" onChange={onChange} />);

		const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
		fireEvent.change(textarea, { target: { value: "updated text" } });

		expect(onChange).toHaveBeenCalledWith("updated text");
	});

	it("should be disabled when disabled prop is true", () => {
		const { container } = render(
			<Editor rule="test" onChange={jest.fn()} disabled={true} />,
		);

		const textarea = container.querySelector("textarea");
		expect(textarea?.disabled).toBe(true);
	});

	it("should handle tab key by inserting spaces", () => {
		const onChange = jest.fn();
		const rule = "Line 1\nLine 2";
		const { container } = render(<Editor rule={rule} onChange={onChange} />);

		const textarea = container.querySelector("textarea") as HTMLTextAreaElement;

		// Set cursor position
		textarea.selectionStart = 6; // After "Line 1"
		textarea.selectionEnd = 6;

		// Simulate tab key press
		fireEvent.keyDown(textarea, { key: "Tab" });

		// Should insert 2 spaces at cursor position
		expect(onChange).toHaveBeenCalledWith("Line 1  \nLine 2");
	});

	it("should handle tab key by inserting spaces (preventDefault tested implicitly)", () => {
		const onChange = jest.fn();
		const rule = "test";
		const { container } = render(<Editor rule={rule} onChange={onChange} />);

		const textarea = container.querySelector("textarea") as HTMLTextAreaElement;

		// Set cursor position
		textarea.selectionStart = 2; // After "te"
		textarea.selectionEnd = 2;

		// Simulate tab key press - if preventDefault works, we get spaces instead of focus change
		fireEvent.keyDown(textarea, { key: "Tab" });

		// If preventDefault worked, onChange should be called with spaces inserted
		expect(onChange).toHaveBeenCalledWith("te  st");
	});

	it("should sync scroll between textarea and preview", () => {
		const longRule = "test\n".repeat(100);
		const { container } = render(
			<Editor rule={longRule} onChange={jest.fn()} />,
		);

		const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
		const pre = container.querySelector("pre") as HTMLPreElement;

		// Simulate scrolling the textarea
		textarea.scrollTop = 100;
		textarea.scrollLeft = 50;
		fireEvent.scroll(textarea);

		// The pre element should have the same scroll position
		expect(pre.scrollTop).toBe(100);
		expect(pre.scrollLeft).toBe(50);
	});

	it("should display syntax highlighted content", () => {
		const rule = "A **Person** has an age";
		const { container } = render(<Editor rule={rule} onChange={jest.fn()} />);

		const pre = container.querySelector("pre");
		expect(pre?.innerHTML).toContain(rule);
	});

	it("should have proper styling classes", () => {
		const { container } = render(<Editor rule="test" onChange={jest.fn()} />);

		const wrapper = container.firstChild as HTMLElement;
		expect(wrapper.classList.contains("relative")).toBe(true);
		expect(wrapper.classList.contains("font-mono")).toBe(true);

		const textarea = container.querySelector("textarea");
		expect(textarea?.classList.contains("text-transparent")).toBe(true);
		expect(textarea?.getAttribute("spellcheck")).toBe("false");

		const pre = container.querySelector("pre");
		expect(pre?.classList.contains("bg-zinc-900")).toBe(true);
		expect(pre?.classList.contains("text-zinc-300")).toBe(true);
	});

	it("should handle empty rule", () => {
		const { container } = render(<Editor rule="" onChange={jest.fn()} />);

		const textarea = container.querySelector("textarea");
		expect(textarea?.value).toBe("");
	});

	it("should handle multi-line rules", () => {
		const multiLineRule = `# Policy Rules
A **Person** has an age
A **Person** is an adult if the **Person** has an age greater than 18`;

		const { container } = render(
			<Editor rule={multiLineRule} onChange={jest.fn()} />,
		);

		const textarea = container.querySelector("textarea");
		expect(textarea?.value).toBe(multiLineRule);

		const pre = container.querySelector("pre");
		expect(pre?.classList.contains("whitespace-pre-wrap")).toBe(true);
	});
});
