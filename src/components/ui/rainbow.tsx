"use client";

import React from "react";
import {
	commentColor,
	functionColor,
	numberColor,
	objectColor,
	selectorColor,
} from "~/components/ui/highlight";

interface RainbowBracesProps {
	json: object | string;
	className?: string;
}

const BRACE_COLORS = [
	"text-red-400",
	"text-orange-400",
	"text-amber-400",
	"text-yellow-400",
	"text-lime-400",
	"text-green-400",
	"text-emerald-400",
	"text-teal-400",
	"text-cyan-400",
	"text-sky-400",
	"text-blue-400",
	"text-indigo-400",
	"text-violet-400",
	"text-purple-400",
	"text-fuchsia-400",
	"text-pink-400",
	"text-rose-400",
];

// Simple seeded random number generator for consistent results
const createSeededRandom = (seed: number) => {
	let state = seed;
	return () => {
		state = (state * 1664525 + 1013904223) % 4294967281;
		return state / 4294967281;
	};
};

const formatJsonWithRainbowBraces = (
	// biome-ignore lint/suspicious/noExplicitAny: its fine
	obj: any,
	indent = 0,
	braceCounter = { count: 0, random: createSeededRandom(12345) }, // Seeded for consistency
): React.ReactNode[] => {
	if (typeof obj === "string") {
		return [
			<span key="string" className={`${objectColor}`}>
				"{obj}"
			</span>,
		];
	}

	if (typeof obj === "number") {
		return [
			<span key="number" className={`${numberColor}`}>
				{obj}
			</span>,
		];
	}

	if (typeof obj === "boolean") {
		return [
			<span key="boolean" className={`${functionColor}`}>
				{obj.toString()}
			</span>,
		];
	}

	if (obj === null) {
		return [
			<span key="null" className={`${commentColor}`}>
				null
			</span>,
		];
	}

	if (Array.isArray(obj)) {
		// Get a random color for this brace pair
		const randomIndex = Math.floor(braceCounter.random() * BRACE_COLORS.length);
		const currentColor = BRACE_COLORS[randomIndex];

		if (obj.length === 0) {
			return [
				<span key="open" className={currentColor}>
					[
				</span>,
				<span key="close" className={currentColor}>
					]
				</span>,
			];
		}

		const elements: React.ReactNode[] = [];
		elements.push(
			<span key="open" className={currentColor}>
				[
			</span>,
		);
		elements.push(<br key="open-br" />);

		obj.forEach((item, index) => {
			const indentStr = "  ".repeat(indent + 1);
			const idx = index;
			elements.push(<span key={`indent-${idx}`}>{indentStr}</span>);
			elements.push(
				...formatJsonWithRainbowBraces(item, indent + 1, braceCounter),
			);

			if (index < obj.length - 1) {
				elements.push(
					<span key={`comma-${idx}`} className={`${commentColor}`}>
						,
					</span>,
				);
			}
			elements.push(<br key={`br-${idx}`} />);
		});

		const indentStr = "  ".repeat(indent);
		elements.push(<span key="close-indent">{indentStr}</span>);
		elements.push(
			<span key="close" className={currentColor}>
				]
			</span>,
		);

		return elements;
	}

	if (typeof obj === "object") {
		const keys = Object.keys(obj);

		// Get a random color for this brace pair
		const randomIndex = Math.floor(braceCounter.random() * BRACE_COLORS.length);
		const currentColor = BRACE_COLORS[randomIndex];

		if (keys.length === 0) {
			return [
				<span key="open" className={currentColor}>
					{"{"}
				</span>,
				<span key="close" className={currentColor}>
					{"}"}
				</span>,
			];
		}

		const elements: React.ReactNode[] = [];
		elements.push(
			<span key="open" className={currentColor}>
				{"{"}
			</span>,
		);
		elements.push(<br key="open-br" />);

		keys.forEach((key, index) => {
			const indentStr = "  ".repeat(indent + 1);
			const idx = index;
			elements.push(<span key={`indent-${idx}`}>{indentStr}</span>);
			elements.push(
				<span key={`key-${idx}`} className={`${selectorColor}`}>
					"{key}"
				</span>,
			);
			elements.push(
				<span key={`colon-${idx}`} className={`${commentColor}`}>
					:{" "}
				</span>,
			);
			elements.push(
				...formatJsonWithRainbowBraces(obj[key], indent + 1, braceCounter),
			);

			if (index < keys.length - 1) {
				elements.push(
					<span key={`comma-${idx}`} className={`${commentColor}`}>
						,
					</span>,
				);
			}
			elements.push(<br key={`br-${idx}`} />);
		});

		const indentStr = "  ".repeat(indent);
		elements.push(<span key="close-indent">{indentStr}</span>);
		elements.push(
			<span key="close" className={currentColor}>
				{"}"}
			</span>,
		);

		return elements;
	}

	return [<span key="unknown">{String(obj)}</span>];
};

export function RainbowBraces({ json, className = "" }: RainbowBracesProps) {
	// biome-ignore lint/suspicious/noImplicitAnyLet: its fine
	let jsonObj;
	try {
		if (typeof json === "string") {
			jsonObj = JSON.parse(json);
		} else {
			jsonObj = json;
		}
	} catch (_error) {
		jsonObj = json;
	}
	const formattedElements = formatJsonWithRainbowBraces(jsonObj);

	return (
		<pre className={`font-mono text-sm ${className}`}>
			<code>
				{formattedElements.map((element, index) =>
					// biome-ignore lint/suspicious/noArrayIndexKey: its fine
					React.cloneElement(element as React.ReactElement, { key: index }),
				)}
			</code>
		</pre>
	);
}
