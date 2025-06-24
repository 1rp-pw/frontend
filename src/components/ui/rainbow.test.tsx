import { render } from "@testing-library/react";
import {
	commentColor,
	functionColor,
	numberColor,
	objectColor,
	selectorColor,
} from "./highlight";
import { RainbowBraces } from "./rainbow";

describe("RainbowBraces", () => {
	it("should render simple string JSON", () => {
		const { container } = render(<RainbowBraces json="test string" />);
		const codeElement = container.querySelector("code");

		expect(codeElement?.textContent).toContain('"test string"');
		expect(
			container.querySelector(`.${objectColor.replace(/\s/g, ".")}`),
		).toBeTruthy();
	});

	it("should render number values", () => {
		const { container } = render(
			<RainbowBraces json={{ age: 25, score: 100 }} />,
		);

		expect(container.textContent).toContain("25");
		expect(container.textContent).toContain("100");
		expect(
			container.querySelectorAll(`.${numberColor.replace(/\s/g, ".")}`),
		).toHaveLength(2);
	});

	it("should render boolean values", () => {
		const { container } = render(
			<RainbowBraces json={{ active: true, disabled: false }} />,
		);

		expect(container.textContent).toContain("true");
		expect(container.textContent).toContain("false");
		expect(
			container.querySelectorAll(`.${functionColor.replace(/\s/g, ".")}`),
		).toHaveLength(2);
	});

	it("should render null values", () => {
		const { container } = render(<RainbowBraces json={{ value: null }} />);

		expect(container.textContent).toContain("null");
		expect(
			container.querySelector(`.${commentColor.replace(/\s/g, ".")}`),
		).toBeTruthy();
	});

	it("should render empty object", () => {
		const { container } = render(<RainbowBraces json={{}} />);

		expect(container.textContent).toBe("{}");
	});

	it("should render empty array", () => {
		const { container } = render(<RainbowBraces json={[]} />);

		expect(container.textContent).toBe("[]");
	});

	it("should render nested objects", () => {
		const json = {
			user: {
				name: "John",
				age: 30,
				address: {
					city: "New York",
					zip: 10001,
				},
			},
		};

		const { container } = render(<RainbowBraces json={json} />);

		expect(container.textContent).toContain("user");
		expect(container.textContent).toContain("name");
		expect(container.textContent).toContain("John");
		expect(container.textContent).toContain("address");
		expect(container.textContent).toContain("city");
		expect(container.textContent).toContain("New York");

		// Check for proper key highlighting
		const keyElements = container.querySelectorAll(
			`.${selectorColor.replace(/\s/g, ".")}`,
		);
		expect(keyElements.length).toBeGreaterThan(0);
	});

	it("should render arrays", () => {
		const json = {
			items: ["apple", "banana", "orange"],
			numbers: [1, 2, 3],
		};

		const { container } = render(<RainbowBraces json={json} />);

		expect(container.textContent).toContain("apple");
		expect(container.textContent).toContain("banana");
		expect(container.textContent).toContain("orange");
		expect(container.textContent).toContain("1");
		expect(container.textContent).toContain("2");
		expect(container.textContent).toContain("3");
	});

	it("should handle JSON string input", () => {
		const jsonString = '{"name": "Test", "value": 42}';
		const { container } = render(<RainbowBraces json={jsonString} />);

		expect(container.textContent).toContain("name");
		expect(container.textContent).toContain("Test");
		expect(container.textContent).toContain("value");
		expect(container.textContent).toContain("42");
	});

	it("should handle invalid JSON string gracefully", () => {
		const invalidJson = "not valid json";
		const { container } = render(<RainbowBraces json={invalidJson} />);

		// Should render the string as-is
		expect(container.textContent).toContain("not valid json");
	});

	it("should apply custom className", () => {
		const { container } = render(
			<RainbowBraces json={{}} className="custom-class" />,
		);
		const preElement = container.querySelector("pre");

		expect(preElement?.classList.contains("custom-class")).toBe(true);
		expect(preElement?.classList.contains("font-mono")).toBe(true);
		expect(preElement?.classList.contains("text-sm")).toBe(true);
	});

	it("should use consistent colors for braces (seeded random)", () => {
		// Render the same structure twice
		const json = { nested: { value: 1 } };

		const { container: container1 } = render(<RainbowBraces json={json} />);
		const { container: container2 } = render(<RainbowBraces json={json} />);

		// Get the brace elements from both renders
		const getBraceClasses = (container: Element) => {
			const spans = container.querySelectorAll("span");
			const braceSpans = Array.from(spans).filter(
				(span) => span.textContent === "{" || span.textContent === "}",
			);
			return braceSpans.map((span) => span.className);
		};

		const classes1 = getBraceClasses(container1);
		const classes2 = getBraceClasses(container2);

		// Should have the same classes in the same order
		expect(classes1).toEqual(classes2);
	});

	it("should render mixed data types", () => {
		const json = {
			string: "hello",
			number: 42,
			boolean: true,
			null: null,
			array: [1, "two", false],
			object: { nested: "value" },
		};

		const { container } = render(<RainbowBraces json={json} />);

		// Check all values are present
		expect(container.textContent).toContain("hello");
		expect(container.textContent).toContain("42");
		expect(container.textContent).toContain("true");
		expect(container.textContent).toContain("null");
		expect(container.textContent).toContain("two");
		expect(container.textContent).toContain("false");
		expect(container.textContent).toContain("nested");
		expect(container.textContent).toContain("value");
	});

	it("should include commas between object properties", () => {
		const json = { first: 1, second: 2, third: 3 };
		const { container } = render(<RainbowBraces json={json} />);

		// Count commas - should be 2 (between 3 properties)
		const commas = container.textContent?.match(/,/g);
		expect(commas).toHaveLength(2);
	});

	it("should include commas between array elements", () => {
		const json = ["a", "b", "c", "d"];
		const { container } = render(<RainbowBraces json={json} />);

		// Count commas - should be 3 (between 4 elements)
		const commas = container.textContent?.match(/,/g);
		expect(commas).toHaveLength(3);
	});

	it("should properly indent nested structures", () => {
		const json = {
			level1: {
				level2: {
					level3: "deep",
				},
			},
		};

		const { container } = render(<RainbowBraces json={json} />);
		const preElement = container.querySelector("pre");

		// Check that the text contains proper indentation (multiple spaces)
		expect(preElement?.innerHTML).toMatch(/\s{2,}/); // At least 2 spaces
		expect(preElement?.innerHTML).toMatch(/\s{4,}/); // At least 4 spaces for deeper nesting
	});
});
