"use client";
import { useRef } from "react";
import type React from "react";
import { highlightText } from "~/components/editor/highlight";

interface EditorProps {
	text: string;
	onChange: (text: string) => void;
}

export function Editor({ text, onChange }: EditorProps) {
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
