"use client";

import { type FC, type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "~/lib/utils";
import { debugLineCount } from "~/lib/utils/debug-line-count";

interface LineNumbersProps {
	content: string;
	className?: string;
	lineNumberClassName?: string;
	contentClassName?: string;
	startingLineNumber?: number;
	renderContent?: (content: string) => ReactNode;
	onLineClick?: (lineNumber: number) => void;
}

export const LineNumbers: FC<LineNumbersProps> = ({
	content,
	className,
	lineNumberClassName,
	contentClassName,
	startingLineNumber = 1,
	renderContent,
	onLineClick,
}) => {
	const [lineCount, setLineCount] = useState(0);
	const contentRef = useRef<HTMLDivElement>(null);
	const lineNumbersRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const lines = content.split("\n").length;
		setLineCount(lines);

		// Debug logging for line count issues
		if (process.env.NODE_ENV === "development") {
			// Check for the specific 110 vs 127 issue
			if (lines === 110) {
				debugLineCount(content, 127);
			}
		}
	}, [content]);

	const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
		if (lineNumbersRef.current && contentRef.current) {
			lineNumbersRef.current.scrollTop = (e.target as HTMLDivElement).scrollTop;
		}
	};

	const handleLineClick = (lineNumber: number) => {
		if (onLineClick) {
			onLineClick(lineNumber);
		}
	};

	return (
		<div className={cn("flex h-full font-mono text-sm", className)}>
			{/* Line numbers column */}
			<div
				ref={lineNumbersRef}
				className={cn(
					"flex-shrink-0 select-none overflow-hidden border-zinc-700 border-r bg-zinc-900/50 text-right text-zinc-500",
					lineNumberClassName,
				)}
				title={`${lineCount} lines, ${content.length} characters`}
			>
				<div className="p-4 pr-3">
					{Array.from({ length: lineCount }, (_, i) => {
						const lineNum = i + startingLineNumber;
						return onLineClick ? (
							<button
								key={`line-${lineNum}`}
								type="button"
								className="block w-full cursor-pointer text-left leading-6 hover:text-zinc-300"
								onClick={() => handleLineClick(lineNum)}
							>
								{lineNum}
							</button>
						) : (
							<div key={`line-${lineNum}`} className="leading-6">
								{lineNum}
							</div>
						);
					})}
				</div>
			</div>

			{/* Content column */}
			<div
				ref={contentRef}
				className={cn("flex-1 overflow-auto", contentClassName)}
				onScroll={handleScroll}
			>
				{renderContent ? (
					<div className="p-4">{renderContent(content)}</div>
				) : (
					<pre className="whitespace-pre-wrap p-4">{content}</pre>
				)}
			</div>
		</div>
	);
};

LineNumbers.displayName = "LineNumbers";
