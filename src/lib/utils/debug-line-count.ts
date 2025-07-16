/**
 * Debug utility to help diagnose line count discrepancies
 */
export function debugLineCount(content: string, expectedLines?: number) {
	const lines = content.split("\n");
	const actualLines = lines.length;

	// Find last non-empty line
	let lastNonEmptyLine = -1;
	for (let i = lines.length - 1; i >= 0; i--) {
		const line = lines[i];
		if (line && line.trim() !== "") {
			lastNonEmptyLine = i;
			break;
		}
	}

	const trailingEmptyLines = actualLines - lastNonEmptyLine - 1;

	const info = {
		totalLines: actualLines,
		expectedLines: expectedLines || "not specified",
		lastNonEmptyLine: lastNonEmptyLine + 1,
		trailingEmptyLines: trailingEmptyLines,
		contentLength: content.length,
		endsWithNewline: content.endsWith("\n"),
		firstLine: lines[0] || "",
		lastLine: lines[lines.length - 1] || "",
		lastNonEmptyContent: lines[lastNonEmptyLine] || "",
	};

	// if (expectedLines && actualLines !== expectedLines) {
	// 	console.warn("[Line Count Debug] Mismatch detected:", info);
	//
	// 	// Check for common issues
	// 	if (actualLines === 110 && expectedLines === 127) {
	// 		console.warn(
	// 			"[Line Count Debug] Common issue: 110 lines instead of 127. This might indicate API truncation.",
	// 		);
	// 	}
	//
	// 	// Show sample of lines around common cutoff points
	// 	if (actualLines >= 110) {
	// 		console.log("[Line Count Debug] Lines around 110:", {
	// 			line108: lines[107],
	// 			line109: lines[108],
	// 			line110: lines[109],
	// 			line111: lines[110] || "undefined (past end)",
	// 		});
	// 	}
	// } else {
	// 	console.log("[Line Count Debug]:", info);
	// }

	return info;
}

// Export a window function for easy debugging in browser console
declare global {
	interface Window {
		debugLineCount: typeof debugLineCount;
	}
}

if (typeof window !== "undefined") {
	window.debugLineCount = debugLineCount;
}
