"use client";

import { useEffect, useRef, useState } from "react";
import { RainbowBraces } from "~/components/ui/rainbow";
import { cn } from "~/lib/utils";

interface JsonEditorProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
}

export function JsonEditor({
	value,
	onChange,
	placeholder = "",
	className = "",
	disabled = false,
}: JsonEditorProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const highlightRef = useRef<HTMLDivElement>(null);
	const [parsedJson, setParsedJson] = useState<object | null>(null);
	const [parseError, setParseError] = useState<string | null>(null);

	// Parse JSON for highlighting
	useEffect(() => {
		if (!value.trim()) {
			setParsedJson(null);
			setParseError(null);
			return;
		}

		try {
			const parsed = JSON.parse(value);
			setParsedJson(parsed);
			setParseError(null);
		} catch (_) {
			setParsedJson(null);
			setParseError("Invalid JSON");
		}
	}, [value]);

	// Sync scroll between textarea and highlight overlay
	const handleScroll = () => {
		if (textareaRef.current && highlightRef.current) {
			highlightRef.current.scrollTop = textareaRef.current.scrollTop;
			highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
		}
	};

	// Handle textarea changes
	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		onChange(e.target.value);
	};

	return (
		<div className={cn("relative", className)}>
			<div className="relative">
				{/* Syntax highlighting overlay */}
				<div
					ref={highlightRef}
					className="pointer-events-none absolute inset-0 overflow-hidden rounded-md border border-transparent bg-transparent p-3 font-mono text-sm"
					style={{
						color: "transparent",
						whiteSpace: "pre-wrap",
						wordWrap: "break-word",
					}}
				>
					{parsedJson && !parseError ? (
						<RainbowBraces json={parsedJson} className="text-sm" />
					) : (
						// Show plain text when JSON is invalid
						<div className="whitespace-pre-wrap text-foreground opacity-70">
							{value || placeholder}
						</div>
					)}
				</div>

				{/* Actual textarea */}
				<textarea
					ref={textareaRef}
					value={value}
					onChange={handleChange}
					onScroll={handleScroll}
					placeholder={placeholder}
					disabled={disabled}
					className={cn(
						"relative z-10 min-h-32 w-full resize-none rounded-md border border-input bg-background/50 p-3 font-mono text-sm text-transparent caret-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
						parseError && "border-destructive focus:ring-destructive",
					)}
					style={{
						whiteSpace: "pre-wrap",
						wordWrap: "break-word",
					}}
				/>
			</div>

			{/* Error message */}
			{parseError && (
				<p className="mt-2 text-destructive text-sm">{parseError}</p>
			)}
		</div>
	);
}
