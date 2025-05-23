"use client";
import { useRef } from "react";
import type React from "react";

interface EditorProps {
	text: string;
	onChange: (text: string) => void;
}

export function Editor({ text, onChange }: EditorProps) {
	const editorRef = useRef<HTMLPreElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const highlightText = (text: string) => {
		// Escape &, <, >
		let html = text
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");

		// First highlight numbers
		html = html.replace(
			/\b(\d+)\b/g,
			'<span class="text-orange-500">$1</span>',
		);

		// Highlight comparison phrases in purple
		const comparisonPhrases = [
			"is greater than or equal to",
			"is less than or equal to",
			"is equal to",
			"is not equal to",
			"is the same as",
			"is not the same as",
			"is later than",
			"is earlier than",
			"is greater than",
			"is less than",
			"is in",
			"is not in",
			"contains",
		];

		// Create a regex pattern from the phrases, escaping special characters
		const escapedPhrases = comparisonPhrases.map((phrase) =>
			phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
		);
		const phrasePattern = new RegExp(
			`\\b(${escapedPhrases.join("|")})\\b`,
			"g",
		);

		// Apply the highlighting
		html = html.replace(
			phrasePattern,
			'<span class="text-purple-500">$1</span>',
		);

		// Then highlight lines starting with # (comments) - grey
		html = html.replace(/(^#.*$)/gm, '<span class="text-gray-400">$1</span>');

		// Highlight double asterisks - blue (keep ** markers), non-greedy
		html = html.replace(
			/(\*\*.+?\*\*)/g,
			'<span class="text-blue-500">$1</span>',
		);

		// Highlight double underscores - green (keep __ markers), non-greedy
		html = html.replace(/(__.+?__)/g, '<span class="text-green-500">$1</span>');

		return html;
	};

	// Sync scroll position between textarea and highlighted view
	const syncScroll = () => {
		if (editorRef.current && textareaRef.current) {
			editorRef.current.scrollTop = textareaRef.current.scrollTop;
			editorRef.current.scrollLeft = textareaRef.current.scrollLeft;
		}
	};

	// Handle tab key
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Tab") {
			e.preventDefault();
			const target = e.target as HTMLTextAreaElement;
			const start = target.selectionStart;
			const end = target.selectionEnd;

			// Insert tab at cursor position
			const newText = `${text.substring(0, start)}  ${text.substring(end)}`;
			onChange(newText);

			// Move cursor after the inserted tab
			setTimeout(() => {
				if (textareaRef.current) {
					textareaRef.current.selectionStart =
						textareaRef.current.selectionEnd = start + 2;
				}
			}, 0);
		}
	};

	return (
		<div className="relative h-full w-full font-mono text-sm">
			<textarea
				ref={textareaRef}
				value={text}
				onChange={(e) => onChange(e.target.value)}
				onScroll={syncScroll}
				onKeyDown={handleKeyDown}
				spellCheck="false"
				className="absolute inset-0 z-10 h-full w-full resize-none bg-transparent p-4 text-transparent caret-white outline-none"
				style={{ caretColor: "white" }}
			/>
			<pre
				ref={editorRef}
				className="pointer-events-none absolute inset-0 h-full w-full overflow-auto whitespace-pre-wrap bg-zinc-900 p-4 text-zinc-300"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: its free text
				dangerouslySetInnerHTML={{ __html: highlightText(text) }}
			/>
		</div>
	);
}
