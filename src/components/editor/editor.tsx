"use client";
import type React from "react";
import { useRef } from "react";
import { highlightText } from "~/components/ui/highlight";

interface EditorProps {
	rule: string;
	onChange: (rule: string) => void;
	disabled?: boolean;
}

export function Editor({ rule, onChange, disabled = false }: EditorProps) {
	const editorRef = useRef<HTMLPreElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

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
	};

	return (
		<div className="relative h-full w-full font-mono text-sm">
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
	);
}
