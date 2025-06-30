"use client";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { highlightText } from "~/components/ui/highlight";

interface EditorProps {
	rule: string;
	onChange: (rule: string) => void;
	disabled?: boolean;
	placeholder?: string;
}

export function Editor({ rule, onChange, disabled = false }: EditorProps) {
	const editorRef = useRef<HTMLPreElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const lineNumbersRef = useRef<HTMLDivElement>(null);
	const [lineCount, setLineCount] = useState(0);

	useEffect(() => {
		const lines = rule.split("\n").length;
		setLineCount(lines);
	}, [rule]);

	// Sync scroll position between textarea, highlighted view, and line numbers
	const syncScroll = () => {
		if (editorRef.current && textareaRef.current && lineNumbersRef.current) {
			editorRef.current.scrollTop = textareaRef.current.scrollTop;
			editorRef.current.scrollLeft = textareaRef.current.scrollLeft;
			lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
		}
	};

	// Go to line function
	const goToLine = (lineNumber: number) => {
		if (!textareaRef.current) return;

		const lines = rule.split("\n");
		const targetLine = Math.max(1, Math.min(lineNumber, lines.length));
		let position = 0;

		// Calculate position of the target line
		for (let i = 0; i < targetLine - 1; i++) {
			const line = lines[i];
			if (line !== undefined) {
				position += line.length + 1; // +1 for newline
			}
		}

		// Set cursor position and focus
		textareaRef.current.setSelectionRange(position, position);
		textareaRef.current.focus();

		// Scroll to make the line visible (approximate)
		const lineHeight = 24; // Approximate line height in pixels
		const scrollPosition = (targetLine - 1) * lineHeight - 100; // Offset to center line
		textareaRef.current.scrollTop = Math.max(0, scrollPosition);
		syncScroll();
	};

	// Handle keyboard shortcuts
	const handleKeyDown = (e: React.KeyboardEvent) => {
		// Tab key handling
		if (e.key === "Tab") {
			e.preventDefault();
			const target = e.target as HTMLTextAreaElement;
			const start = target.selectionStart;
			const end = target.selectionEnd;

			// Insert tab at cursor position
			const newRule = `${rule.substring(0, start)}  ${rule.substring(end)}`;
			onChange(newRule);

			// Move cursor after the inserted tab
			setTimeout(() => {
				if (textareaRef.current) {
					textareaRef.current.selectionStart =
						textareaRef.current.selectionEnd = start + 2;
				}
			}, 0);
		}

		// Ctrl/Cmd + G for go to line
		if ((e.ctrlKey || e.metaKey) && e.key === "g") {
			e.preventDefault();
			const lineNumberStr = prompt("Go to line:");
			if (lineNumberStr) {
				const lineNumber = Number.parseInt(lineNumberStr, 10);
				if (!Number.isNaN(lineNumber)) {
					goToLine(lineNumber);
				}
			}
		}
	};

	return (
		<div className="relative flex h-full w-full font-mono text-sm">
			{/* Line numbers */}
			<div
				ref={lineNumbersRef}
				className="pointer-events-none absolute top-0 left-0 z-20 h-full overflow-hidden border-zinc-700 border-r bg-zinc-900/50 text-right text-zinc-500"
				title={`${lineCount} lines, ${rule.length} characters`}
			>
				<div className="p-4 pr-3">
					{Array.from({ length: lineCount }, (_, i) => (
						<div key={`line-${i + 1}`} className="leading-6">
							{i + 1}
						</div>
					))}
				</div>
			</div>

			{/* Main editor area with offset for line numbers */}
			<div className="relative h-full w-full" style={{ marginLeft: "60px" }}>
				<textarea
					ref={textareaRef}
					value={rule}
					onChange={(e) => onChange(e.target.value)}
					onScroll={syncScroll}
					onKeyDown={handleKeyDown}
					spellCheck="false"
					className="absolute inset-0 z-10 h-full w-full resize-none bg-transparent p-4 text-transparent caret-white outline-none"
					style={{ caretColor: "white" }}
					disabled={disabled}
				/>
				<pre
					ref={editorRef}
					className="pointer-events-none absolute inset-0 h-full w-full overflow-auto whitespace-pre-wrap bg-zinc-900 p-4 text-zinc-300"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: its free text
					dangerouslySetInnerHTML={{ __html: highlightText(rule) }}
				/>
			</div>
		</div>
	);
}
