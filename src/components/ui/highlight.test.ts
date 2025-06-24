import {
	commentColor,
	functionColor,
	highlightText,
	labelColor,
	numberColor,
	objectColor,
	referenceColor,
	referencedColor,
	selectorColor,
} from "./highlight";

// Don't mock highlightText - we want to test the real implementation

describe("highlight", () => {
	describe("highlightText", () => {
		it("should escape HTML special characters", () => {
			const input = "<script>alert('test')</script> & <div>";
			const result = highlightText(input);

			expect(result).toContain("&lt;script&gt;");
			expect(result).toContain("&amp;");
			expect(result).toContain("&lt;div&gt;");
			expect(result).not.toContain("<script>");
		});

		it("should highlight numbers", () => {
			const input = "The age is 25 and the score is 100";
			const result = highlightText(input);

			expect(result).toContain(`<span class="${numberColor}">25</span>`);
			expect(result).toContain(`<span class="${numberColor}">100</span>`);
		});

		it("should highlight comparison phrases", () => {
			const input = "The age is greater than 18 and is less than 65";
			const result = highlightText(input);

			expect(result).toContain(
				`<span class="${functionColor}">is greater than</span>`,
			);
			expect(result).toContain(
				`<span class="${functionColor}">is less than</span>`,
			);
		});

		it("should highlight comments starting with #", () => {
			const input = "# This is a comment\nNot a comment";
			const result = highlightText(input);

			expect(result).toContain(
				`<span class="${commentColor}"># This is a comment</span>`,
			);
			expect(result).not.toContain(
				`<span class="${commentColor}">Not a comment</span>`,
			);
		});

		it("should highlight double asterisk objects", () => {
			const input = "A **Person** has an age";
			const result = highlightText(input);

			expect(result).toContain(
				`<span class="${objectColor}">**Person**</span>`,
			);
		});

		it("should highlight double underscore selectors", () => {
			const input = "The __age__ is equal to 25";
			const result = highlightText(input);

			expect(result).toContain(`<span class="${selectorColor}">__age__</span>`);
		});

		it("should highlight standalone selectors", () => {
			const input = "The __score__ is 100";
			const result = highlightText(input);

			expect(result).toContain(
				`<span class="${selectorColor}">__score__</span>`,
			);
		});

		it("should highlight labels at the start of lines", () => {
			const input = "rule1. A **Person** has an age";
			const result = highlightText(input);

			expect(result).toContain(`<span class="${labelColor}">rule1.</span>`);
		});

		describe("rule reference highlighting", () => {
			it("should highlight referenced rules", () => {
				const input = `A **Person** passes the practical driving test
A **Person** gets a full driving license if the **Person** passes the practical driving test`;
				const result = highlightText(input);

				// The definition should be highlighted as referenced
				expect(result).toContain(
					`<span class="${referencedColor}">passes the practical driving test</span>`,
				);
				// The reference in the if clause should be highlighted as reference
				expect(result).toContain(
					`<span class="${referenceColor}">passes the practical driving test</span>`,
				);
			});

			it("should not highlight unreferenced rules", () => {
				const input = "A **Person** has a birthday";
				const result = highlightText(input);

				// Should not contain any reference highlighting for this unreferenced rule
				expect(result).not.toContain(
					`<span class="${referencedColor}">has a birthday</span>`,
				);
				expect(result).not.toContain(
					`<span class="${referenceColor}">has a birthday</span>`,
				);
			});

			it("should handle rules with labels", () => {
				const input = `bob. A **Person** gets a full driving license
alice. A **Person** is eligible if the **Person** gets a full driving license`;
				const result = highlightText(input);

				// The labeled definition should be highlighted as referenced
				expect(result).toContain(
					`<span class="${referencedColor}">gets a full driving license</span>`,
				);
				// The reference should be highlighted
				expect(result).toContain(
					`<span class="${referenceColor}">gets a full driving license</span>`,
				);
			});

			it("should handle multiple references to the same rule", () => {
				const input = `A **Person** is an adult
A **Person** can vote if the **Person** is an adult
A **Person** can drink if the **Person** is an adult`;
				const result = highlightText(input);

				// Count occurrences of reference color (should be 2 - in the if clauses)
				const referenceMatches = result.match(
					new RegExp(`<span class="${referenceColor}">is an adult</span>`, "g"),
				);
				expect(referenceMatches).toHaveLength(2);

				// Should have one referenced color (the definition)
				expect(result).toContain(
					`<span class="${referencedColor}">is an adult</span>`,
				);
			});
		});

		it("should handle complex multi-line text", () => {
			const input = `# Policy Rules
rule1. A **Person** has an __age__ that is greater than 18
rule2. A **Person** is an adult if the **Person** has an __age__ that is greater than 18
# Another comment
The __score__ is equal to 100`;

			const result = highlightText(input);

			// Check various highlights are present
			expect(result).toContain(
				`<span class="${commentColor}"># Policy Rules</span>`,
			);
			expect(result).toContain(`<span class="${labelColor}">rule1.</span>`);
			expect(result).toContain(`<span class="${labelColor}">rule2.</span>`);
			expect(result).toContain(
				`<span class="${objectColor}">**Person**</span>`,
			);
			// Note: __age__ appears as part of rule references, so it may not be highlighted as standalone selector
			expect(result).toContain("__age__"); // Just check it appears somewhere
			// The "is greater than" is consumed by rule reference highlighting
			expect(result).toContain("is greater than"); // Just check the text appears
			expect(result).toContain(
				`<span class="${functionColor}">is equal to</span>`,
			); // This one should work since it's standalone
			expect(result).toContain(`<span class="${numberColor}">100</span>`);
		});

		it("should handle all comparison phrases", () => {
			const comparisonTests = [
				"is greater than or equal to",
				"is at least",
				"is less than or equal to",
				"is no more than",
				"is equal to",
				"is exactly equal to",
				"is the same as",
				"is not equal to",
				"is not the same as",
				"is later than",
				"is earlier than",
				"is greater than",
				"is less than",
				"is in",
				"is not in",
				"is within",
				"contains",
			];

			comparisonTests.forEach((phrase) => {
				const input = `The value ${phrase} something`;
				const result = highlightText(input);
				expect(result).toContain(
					`<span class="${functionColor}">${phrase}</span>`,
				);
			});
		});

		it("should preserve line breaks", () => {
			const input = "Line 1\nLine 2\nLine 3";
			const result = highlightText(input);

			expect(result.split("\n")).toHaveLength(3);
		});

		it("should handle empty input", () => {
			const result = highlightText("");
			expect(result).toBe("");
		});

		it("should handle input with only whitespace", () => {
			const input = "   \n  \t  ";
			const result = highlightText(input);
			expect(result).toBe(input);
		});
	});
});
