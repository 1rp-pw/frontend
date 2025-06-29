export const numberColor = "text-orange-500";
export const dateColor = "text-orange-700";
export const objectColor = "text-blue-500";
export const commentColor = "text-gray-400";
export const selectorColor = "text-green-500";
export const functionColor = "text-purple-500";
export const referenceColor = "text-teal-500"; // Color for references (e.g., "passes the practical driving test" in if clause)
export const referencedColor = "text-fuchsia-500"; // Color for definitions that ARE referenced elsewhere
export const labelColor = "text-yellow-500";
export const labelReferenceColor = "text-yellow-700";
export const falseColor = "text-red-500";
export const trueColor = "text-emerald-500";

// Label predicates that can follow label references
const LABEL_PREDICATES = [
	"clears",
	"succeeds",
	"qualifies",
	"passes",
	"meets requirements",
	"satisfies",
	"is valid",
	"is approved",
	"has passed",
	"is authorized",
	"is sanctioned",
	"is certified",
	"is permitted",
	"is legitimate",
	"is satisfied",
];

export const highlightText = (text: string) => {
	// Escape &, <, >
	let html = text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");

	// Step 1: Find all defined rules (action parts) and their full definition lines
	const lines = html.split("\n");
	const allDefinedRuleActions = new Set<string>(); // All unique action parts
	// Maps original full definition line to its action part
	const definitionLineToActionMap = new Map<string, string>();
	// Track labeled rules (e.g., "driver. A **driver** passes the age test")
	const labeledRules = new Map<string, string>(); // label -> action

	lines.forEach((line) => {
		const trimmedLine = line.trim();
		// Patterns to match:
		// 1. With labels: "bob. A **Person** gets a full driving license"
		// 2. Without labels: "A **Person** passes the practical driving test"
		const matchWithLabel = line.match(/^([\w.]+)\.\s+A\s+\*\*\w+\*\*\s+(.+)$/);
		const matchWithoutLabel = line.match(/^(A\s+\*\*\w+\*\*\s+)(.+)$/);

		if (matchWithLabel?.[1] && matchWithLabel[2] !== undefined) {
			const label = matchWithLabel[1];
			const ruleAction = matchWithLabel[2].trim();
			allDefinedRuleActions.add(ruleAction);
			definitionLineToActionMap.set(trimmedLine, ruleAction);
			labeledRules.set(label, ruleAction);
		} else if (matchWithoutLabel && matchWithoutLabel[2] !== undefined) {
			const ruleAction = matchWithoutLabel[2].trim();
			allDefinedRuleActions.add(ruleAction);
			definitionLineToActionMap.set(trimmedLine, ruleAction);
		}
	});

	// Step 2: Determine which defined rules are actually referenced elsewhere
	// We need to iterate through the *entire text* again to find references.
	const rulesWithExternalReferences = new Set<string>(); // Actions that are referenced

	lines.forEach((currentLine) => {
		const trimmedCurrentLine = currentLine.trim();
		const actionPartOfCurrentDefinition =
			definitionLineToActionMap.get(trimmedCurrentLine);

		// For each defined rule, check if it's referenced in this line
		for (const definedAction of allDefinedRuleActions) {
			// Create a regex for the defined action to find its occurrences
			const escapedDefinedAction = definedAction.replace(
				/[.*+?^${}()|[\]\\]/g,
				"\\$&",
			);
			const referencePattern = new RegExp(
				`\\b(${escapedDefinedAction})\\b`,
				"gi",
			);

			// Find all matches in the current line
			// biome-ignore lint/suspicious/noImplicitAnyLet: its fine
			let match;
			// biome-ignore lint/suspicious/noAssignInExpressions: its fine
			while ((match = referencePattern.exec(currentLine)) !== null) {
				const matchedText = match[1];

				// This is the crucial check: Is this match NOT the action part of its own definition line?
				// If the current line is a definition line, and the matched text is its exact action part,
				// then it's not an "external" reference.
				if (
					!(
						actionPartOfCurrentDefinition &&
						matchedText === actionPartOfCurrentDefinition
					)
				) {
					rulesWithExternalReferences.add(definedAction);
				}
			}
		}

		// Also check for label references (§label or $label) in this line
		// Include optional predicates in the pattern
		const predicatePatternForDetection = LABEL_PREDICATES.map((p) =>
			p.replace(/\s+/g, "\\s+"),
		).join("|");
		const labelReferencePattern = new RegExp(
			`[§$]([\\w.]+)(?:\\s+(?:${predicatePatternForDetection}))?`,
			"g",
		);
		// biome-ignore lint/suspicious/noImplicitAnyLet: its fine
		let labelMatch;
		// biome-ignore lint/suspicious/noAssignInExpressions: its fine
		while ((labelMatch = labelReferencePattern.exec(currentLine)) !== null) {
			const referencedLabel = labelMatch[1];
			// If this label has a corresponding rule, mark that rule as referenced
			if (referencedLabel && labeledRules.has(referencedLabel)) {
				const labeledAction = labeledRules.get(referencedLabel);
				if (labeledAction) {
					rulesWithExternalReferences.add(labeledAction);
				}
			}
		}
	});

	// Step 3: Create a placeholder system to protect HTML tags
	const placeholders: string[] = [];
	let placeholderIndex = 0;

	// Helper function to create a placeholder
	const createPlaceholder = (content: string) => {
		const placeholder = `\x00PLACEHOLDER${placeholderIndex}\x00`;
		placeholders[placeholderIndex] = content;
		placeholderIndex++;
		return placeholder;
	};

	// Step 4: Apply highlighting based on our pre-analysis
	const processedHtmlLines: string[] = [];

	lines.forEach((originalLine) => {
		let lineHtml = originalLine; // Start with the original (escaped) line content
		const trimmedOriginalLine = originalLine.trim();

		// Determine if this line is a definition line and get its action part
		const actionPartOfThisDefinition =
			definitionLineToActionMap.get(trimmedOriginalLine);
		const isDefinitionLine = !!actionPartOfThisDefinition;

		// First, apply highlighting for the "referenced" definitions
		if (isDefinitionLine && actionPartOfThisDefinition) {
			// Check if this specific definition's action part is referenced elsewhere
			if (rulesWithExternalReferences.has(actionPartOfThisDefinition)) {
				// This definition's action part needs the `referencedColor`
				const escapedAction = actionPartOfThisDefinition.replace(
					/[.*+?^${}()|[\]\\]/g,
					"\\$&",
				);
				// This regex ensures we only target the action part *within its definition structure*
				const definitionActionPattern = new RegExp(
					`^(?:[\\w.]+\\.\\s+)?A\\s+\\*\\*\\w+\\*\\*\\s+(${escapedAction})$`,
				);

				lineHtml = lineHtml.replace(
					definitionActionPattern,
					(_match, actionPart) => {
						// Re-extract the prefix for this specific line's format to rebuild correctly
						const prefixMatch = originalLine.match(
							/^(?:[\w.]+\.\s+)?A\s+\*\*\w+\*\*(\s+)?/,
						);
						const prefix = prefixMatch ? prefixMatch[0] : "";
						return `${prefix}${createPlaceholder(`<span class="${referencedColor}">${actionPart}</span>`)}`;
					},
				);
			}
		}

		// Now, apply highlighting for ALL references (including those that are not definitions,
		// or those that are definitions but not themselves 'referencedColor')
		// We need to iterate over all *potential* references
		for (const definedAction of allDefinedRuleActions) {
			const escapedDefinedAction = definedAction.replace(
				/[.*+?^${}()|[\]\\]/g,
				"\\$&",
			);
			const generalReferencePattern = new RegExp(
				`\\b(${escapedDefinedAction})\\b`,
				"gi",
			);

			lineHtml = lineHtml.replace(generalReferencePattern, (match, p1) => {
				// A placeholder check: If this match is already a placeholder, don't re-wrap it.
				if (match.startsWith("\x00PLACEHOLDER") && match.endsWith("\x00")) {
					return match; // Already processed
				}

				// IMPORTANT: If this match is the *exact* action part of the *current definition line*,
				// AND that definition was *not* identified as 'rulesWithExternalReferences',
				// THEN it should NOT be highlighted as a reference.
				if (
					isDefinitionLine &&
					p1 === actionPartOfThisDefinition &&
					// biome-ignore lint/style/noNonNullAssertion: its fine
					!rulesWithExternalReferences.has(actionPartOfThisDefinition!)
				) {
					return match; // This is a definition that is NOT referenced, keep it unhighlighted.
				}

				// Otherwise, it's a true reference (or a definition that was referenced, which is already handled above)
				// If it was already highlighted as a `referencedColor` definition, it will have a placeholder.
				// The above check handles the case where it's a definition that *isn't* referenced.
				// So, anything remaining is a reference.
				return createPlaceholder(
					`<span class="${referenceColor}">${match}</span>`,
				);
			});
		}

		processedHtmlLines.push(lineHtml);
	});

	html = processedHtmlLines.join("\n"); // Reassemble the lines

	// Step 5: Apply all other static highlighting rules
	// These should be run *after* the rule-based highlighting to avoid interference.

	// Highlight dates (before numbers to take precedence)
	// Matches date(yyyy-mm-dd) format
	html = html.replace(/\bdate\(\d{4}-\d{2}-\d{2}\)/g, (match) => {
		return createPlaceholder(`<span class="${dateColor}">${match}</span>`);
	});
	// Matches plain yyyy-mm-dd format
	html = html.replace(/\b\d{4}-\d{2}-\d{2}\b/g, (match) => {
		return createPlaceholder(`<span class="${dateColor}">${match}</span>`);
	});

	// Highlight numbers
	html = html.replace(/\b(\d+)\b/g, (_match, p1) => {
		return createPlaceholder(`<span class="${numberColor}">${p1}</span>`);
	});
	html = html.replace(/\b((?:year|day|week|month)s?)\b/g, (_match, p1) => {
		return createPlaceholder(`<span class="${numberColor}">${p1}</span>`);
	});

	// highlight bools
	html = html.replace(/\b(false)\b/g, (_match, p1) => {
		return createPlaceholder(`<span class="${falseColor}">${p1}</span>`);
	});
	html = html.replace(/\b(true)\b/g, (_match, p1) => {
		return createPlaceholder(`<span class="${trueColor}">${p1}</span>`);
	});

	// Highlight comparison phrases (functions)
	const comparisonPhrases = [
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
		"is older than",
		"is younger than",
		"is in",
		"is not in",
		"is within",
		"contains",
	];
	const escapedPhrases = comparisonPhrases.map((phrase) =>
		phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
	);
	const phrasePattern = new RegExp(`\\b(${escapedPhrases.join("|")})\\b`, "g");
	html = html.replace(phrasePattern, (match) => {
		return createPlaceholder(`<span class="${functionColor}">${match}</span>`);
	});

	// Highlight labels (ending with .) at the start of a line followed by space and "A"
	// This needs careful placement. If the line structure is "LABEL. A **Object** Action",
	// we want to highlight LABEL.
	// This regex should still work on the HTML string with placeholders as it looks for raw text structure.
	html = html.replace(/^([\w.]+\.)(\s+)(?=A\s)/gm, (_match, p1, p2) => {
		// We captured the label and the spaces separately, so return both
		return `${createPlaceholder(`<span class="${labelColor}">${p1}</span>`)}${p2}`;
	});

	// Highlight lines starting with # (comments)
	html = html.replace(/(^#.*$)/gm, (match) => {
		return createPlaceholder(`<span class="${commentColor}">${match}</span>`);
	});

	// Highlight double asterisks (objects) - non-greedy
	html = html.replace(/(\*\*.+?\*\*)/g, (match) => {
		return createPlaceholder(`<span class="${objectColor}">${match}</span>`);
	});

	// Highlight double underscores (selectors) - non-greedy
	html = html.replace(/(__.+?__)/g, (match) => {
		return createPlaceholder(`<span class="${selectorColor}">${match}</span>`);
	});

	// Highlight label references (§label or $label) with optional predicates
	// Create regex pattern for label references with optional predicates
	const predicatePattern = LABEL_PREDICATES.map((p) =>
		p.replace(/\s+/g, "\\s+"),
	).join("|");
	const labelWithPredicateRegex = new RegExp(
		`[§$]([\\w.]+)(?:\\s+(${predicatePattern}))?`,
		"g",
	);

	html = html.replace(
		labelWithPredicateRegex,
		(match, labelName, _predicate) => {
			// Check if this label has a corresponding rule
			if (labeledRules.has(labelName)) {
				return createPlaceholder(
					`<span class="${labelReferenceColor}">${match}</span>`,
				);
			}
			return match; // Don't highlight if no matching label exists
		},
	);

	// Step 6: Replace all placeholders with their actual HTML
	placeholders.forEach((placeholder, i) => {
		if (placeholder !== undefined && placeholder !== "") {
			html = html.replace(`\x00PLACEHOLDER${i}\x00`, placeholder);
		}
	});

	//console.info("highlighted", html);

	return html;
};
