"use client";

import * as Diff from "diff";
import { useEffect, useId, useRef, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import type { PolicySpec } from "~/lib/types";

interface DiffModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	versions: PolicySpec[];
	currentVersion: PolicySpec;
}

type DiffType = "policy-text" | "schema" | "tests";

// Helper component for side-by-side diff with highlighting
function SideBySideDiff({
	oldText,
	newText,
}: {
	oldText: string;
	newText: string;
}) {
	const leftScrollRef = useRef<HTMLDivElement>(null);
	const rightScrollRef = useRef<HTMLDivElement>(null);

	// Synchronize scrolling between left and right panels
	useEffect(() => {
		const leftEl = leftScrollRef.current?.querySelector(
			"[data-radix-scroll-area-viewport]",
		);
		const rightEl = rightScrollRef.current?.querySelector(
			"[data-radix-scroll-area-viewport]",
		);

		if (!leftEl || !rightEl) return;

		let isScrolling = false;

		const syncScroll = (source: Element, target: Element) => {
			if (isScrolling) return;
			isScrolling = true;
			target.scrollTop = source.scrollTop;
			requestAnimationFrame(() => {
				isScrolling = false;
			});
		};

		const handleLeftScroll = () => syncScroll(leftEl, rightEl);
		const handleRightScroll = () => syncScroll(rightEl, leftEl);

		leftEl.addEventListener("scroll", handleLeftScroll);
		rightEl.addEventListener("scroll", handleRightScroll);

		return () => {
			leftEl.removeEventListener("scroll", handleLeftScroll);
			rightEl.removeEventListener("scroll", handleRightScroll);
		};
	}, []);

	// Calculate line-by-line diff
	const changes = Diff.diffLines(oldText, newText);

	// Build arrays of lines with their diff status
	const leftLines: {
		text: string;
		status: "removed" | "unchanged" | "placeholder";
	}[] = [];
	const rightLines: {
		text: string;
		status: "added" | "unchanged" | "placeholder";
	}[] = [];

	changes.forEach((part) => {
		const lines = part.value
			.split("\n")
			.filter(
				(_, index, array) => index < array.length - 1 || array[index] !== "",
			);

		if (part.removed) {
			lines.forEach((line) => {
				leftLines.push({ text: line, status: "removed" });
				rightLines.push({ text: "", status: "placeholder" });
			});
		} else if (part.added) {
			lines.forEach((line) => {
				leftLines.push({ text: "", status: "placeholder" });
				rightLines.push({ text: line, status: "added" });
			});
		} else {
			lines.forEach((line) => {
				leftLines.push({ text: line, status: "unchanged" });
				rightLines.push({ text: line, status: "unchanged" });
			});
		}
	});

	const getLineClassName = (status: string) => {
		switch (status) {
			case "removed":
				return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200";
			case "added":
				return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200";
			case "placeholder":
				return "bg-gray-50 dark:bg-gray-900/20";
			default:
				return "";
		}
	};

	return (
		<div className="grid h-full grid-cols-2 gap-4">
			<div ref={leftScrollRef}>
				<h4 className="mb-2 font-medium text-sm">Previous Version</h4>
				<ScrollArea className="h-[65vh] rounded-md border bg-muted/10">
					<div className="font-mono text-sm">
						{leftLines.map((line, index) => (
							<div
								key={`left-${index}-${line.text.substring(0, 30)}`}
								className={`whitespace-pre-wrap px-3 py-0.5 ${getLineClassName(line.status)}`}
							>
								{line.status === "placeholder"
									? "\u00A0"
									: line.text || "\u00A0"}
							</div>
						))}
					</div>
				</ScrollArea>
			</div>

			<div ref={rightScrollRef}>
				<h4 className="mb-2 font-medium text-sm">Current Version</h4>
				<ScrollArea className="h-[65vh] rounded-md border bg-muted/10">
					<div className="font-mono text-sm">
						{rightLines.map((line, index) => (
							<div
								key={`right-${index}-${line.text.substring(0, 30)}`}
								className={`whitespace-pre-wrap px-3 py-0.5 ${getLineClassName(line.status)}`}
							>
								{line.status === "placeholder"
									? "\u00A0"
									: line.text || "\u00A0"}
							</div>
						))}
					</div>
				</ScrollArea>
			</div>
		</div>
	);
}

export function DiffModal({
	open,
	onOpenChange,
	versions,
	currentVersion,
}: DiffModalProps) {
	const [compareWithId, setCompareWithId] = useState<string>("");
	const [diffType, setDiffType] = useState<DiffType>("policy-text");
	const selectId = useId();

	// Filter out the current version from comparison options
	const compareOptions = versions.filter((v) => v.id !== currentVersion.id);

	// Get the selected comparison version
	const compareVersion = versions.find((v) => v.id === compareWithId);

	const renderDiff = () => {
		if (!compareVersion) {
			return (
				<div className="flex h-64 items-center justify-center text-muted-foreground">
					Please select a version to compare with
				</div>
			);
		}

		const renderContent = () => {
			switch (diffType) {
				case "policy-text":
					return (
						<div className="h-full">
							<div className="mb-4 flex items-center justify-between">
								<h3 className="font-semibold text-lg">
									Policy Text Comparison
								</h3>
								<div className="flex gap-4 text-sm">
									<span className="flex items-center gap-1">
										<div className="h-3 w-3 rounded border border-red-300 bg-red-100 dark:border-red-700 dark:bg-red-900/30" />
										Removed
									</span>
									<span className="flex items-center gap-1">
										<div className="h-3 w-3 rounded border border-green-300 bg-green-100 dark:border-green-700 dark:bg-green-900/30" />
										Added
									</span>
								</div>
							</div>
							<SideBySideDiff
								oldText={compareVersion.rule}
								newText={currentVersion.rule}
							/>
						</div>
					);
				case "schema":
					return (
						<div className="h-full">
							<div className="mb-4 flex items-center justify-between">
								<h3 className="font-semibold text-lg">
									Data Model (Schema) Comparison
								</h3>
								<div className="flex gap-4 text-sm">
									<span className="flex items-center gap-1">
										<div className="h-3 w-3 rounded border border-red-300 bg-red-100 dark:border-red-700 dark:bg-red-900/30" />
										Removed
									</span>
									<span className="flex items-center gap-1">
										<div className="h-3 w-3 rounded border border-green-300 bg-green-100 dark:border-green-700 dark:bg-green-900/30" />
										Added
									</span>
								</div>
							</div>
							<SideBySideDiff
								oldText={JSON.stringify(
									JSON.parse(compareVersion.schema),
									null,
									2,
								)}
								newText={JSON.stringify(
									JSON.parse(currentVersion.schema),
									null,
									2,
								)}
							/>
						</div>
					);
			}
		};

		return renderContent();
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] min-h-[600px] w-[90vw] min-w-[800px] max-w-none sm:max-w-none md:max-w-none lg:max-w-none xl:max-w-7xl">
				<DialogHeader>
					<DialogTitle>Compare Policy Versions</DialogTitle>
					<DialogDescription>
						Comparing {compareVersion?.version || "version"} with{" "}
						{currentVersion.version || "current version"}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="flex items-center gap-4">
						<div className="flex-1">
							<Label htmlFor={selectId}>Compare with version</Label>
							<Select value={compareWithId} onValueChange={setCompareWithId}>
								<SelectTrigger id={selectId}>
									<SelectValue placeholder="Select a version to compare" />
								</SelectTrigger>
								<SelectContent>
									{compareOptions.map((version) => (
										<SelectItem key={version.id} value={version.id}>
											{version.version ||
												`Draft (${new Date(version.createdAt).toLocaleDateString()})`}{" "}
											- {version.status}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<Tabs
						value={diffType}
						onValueChange={(v) => setDiffType(v as DiffType)}
						className="h-full"
					>
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="policy-text">Policy Text</TabsTrigger>
							<TabsTrigger value="schema">Data Model</TabsTrigger>
						</TabsList>
						<TabsContent value={diffType} className="mt-4 h-full">
							{renderDiff()}
						</TabsContent>
					</Tabs>
				</div>
			</DialogContent>
		</Dialog>
	);
}
