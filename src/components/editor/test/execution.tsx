"use client";
import { CheckCircle, XCircle } from "lucide-react";
import type { JSX } from "react";
import { Badge } from "~/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import type { TestResultSet } from "~/lib/state/policy";

interface PolicyExecutionModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	executionData: TestResultSet | null;
	testName?: string;
}

export function PolicyExecutionModal({
	open,
	onOpenChange,
	executionData,
	testName,
}: PolicyExecutionModalProps) {
	if (!executionData) return null;

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const getValueFromPath = (path: string, obj: any): any => {
		if (!path.startsWith("$.")) return null;
		const cleanPath = path.substring(2); // Remove '$.'
		return cleanPath.split(".").reduce((current, key) => current?.[key], obj);
	};

	// Extract all property paths from the execution trace to build a mapping
	const getPropertyPathsFromTrace = () => {
		const pathMap = new Map<string, string>();

		for (const execution of executionData.trace.execution) {
			for (const condition of execution.conditions) {
				if (condition.property?.path) {
					// Extract the property name from the path
					const pathParts = condition.property.path.split(".");
					const propertyName = pathParts[pathParts.length - 1] || "";
					pathMap.set(propertyName.toLowerCase(), condition.property.path);
				}
			}
		}

		return pathMap;
	};

	const propertyPaths = getPropertyPathsFromTrace();

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const renderCondition = (condition: any, index: number) => {
		return (
			<div key={index} className="mb-3 rounded-lg border p-4">
				<div className="mb-2 flex items-center gap-2">
					{condition.result ? (
						<CheckCircle className="h-4 w-4 text-green-500" />
					) : (
						<XCircle className="h-4 w-4 text-red-500" />
					)}
					<Badge variant={condition.result ? "default" : "destructive"}>
						{condition.result ? "PASSED" : "FAILED"}
					</Badge>
				</div>

				{condition.rule_name && (
					<div className="mb-2">
						<strong>Rule:</strong> {condition.rule_name}
						{condition.referenced_rule_outcome && (
							<div className="text-muted-foreground text-sm">
								Outcome: {condition.referenced_rule_outcome}
							</div>
						)}
					</div>
				)}

				{condition.operator && condition.property && (
					<div className="mb-2">
						<strong>Condition:</strong> {condition.property.path}{" "}
						{condition.operator.replace(/([A-Z])/g, " $1")}{" "}
						{condition.value?.value}
					</div>
				)}

				{condition.evaluation_details && (
					<div className="rounded bg-muted p-3 text-sm">
						<div>
							<strong>Evaluation:</strong>
						</div>
						<div>
							User Data (Left): {condition.evaluation_details.left_value.value}{" "}
							({condition.evaluation_details.left_value.type})
						</div>
						<div>
							Control Text (Right):{" "}
							{condition.evaluation_details.right_value.value} (
							{condition.evaluation_details.right_value.type})
						</div>
						<div>
							Result:{" "}
							{condition.evaluation_details.comparison_result
								? "TRUE"
								: "FALSE"}
						</div>
					</div>
				)}
			</div>
		);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			{/* biome-ignore lint/nursery/useSortedClasses: <explanation> */}
			<DialogContent className="max-w-none w-[90vw] max-h-[80vh] min-w-[600px] min-h-[500px] sm:max-w-none md:max-w-none lg:max-w-none xl:max-w-6xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						{testName && <span>{testName} - </span>}
						Policy Execution Results
						<Badge variant={executionData.result ? "default" : "destructive"}>
							{executionData.result ? "PASSED" : "FAILED"}
						</Badge>
					</DialogTitle>
					<DialogDescription className="flex items-center gap-2">
						Summary of the execution
					</DialogDescription>
				</DialogHeader>

				<Tabs defaultValue="ast" className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="ast">Execution Trace (AST)</TabsTrigger>
						<TabsTrigger value="text">Policy Text</TabsTrigger>
					</TabsList>

					<TabsContent value="ast" className="mt-4">
						<ScrollArea className="h-[60vh] min-h-[400px] w-full">
							<div className="space-y-4">
								<div className="mb-4">
									<h3 className="mb-2 font-semibold text-lg">Input Data</h3>
									<pre className="overflow-x-auto rounded bg-muted p-3 text-sm">
										{JSON.stringify(executionData.data, null, 2)}
									</pre>
								</div>

								{executionData.trace.execution.map((execution, execIndex) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
									<div key={execIndex} className="rounded-lg border p-4">
										<div className="mb-3 flex items-center gap-2">
											<h3 className="font-semibold text-lg">
												Rule Execution {execIndex + 1}
											</h3>
											{execution.result ? (
												<CheckCircle className="h-5 w-5 text-green-500" />
											) : (
												<XCircle className="h-5 w-5 text-red-500" />
											)}
										</div>

										<div className="mb-3">
											<strong>Outcome:</strong> {execution.outcome.value}
										</div>

										<div className="mb-3">
											<strong>Selector:</strong> {execution.selector.value}
										</div>

										<div>
											<strong>Conditions:</strong>
											<div className="mt-2 space-y-2">
												{execution.conditions.map((condition, condIndex) =>
													renderCondition(condition, condIndex),
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						</ScrollArea>
					</TabsContent>

					<TabsContent value="text" className="mt-4">
						<ScrollArea className="h-[60vh] min-h-[400px] w-full bg-muted">
							<div className="space-y-2 text-sm leading-relaxed">
								{executionData.text.map((line, index) => {
									// Process and render the line with tooltips
									const renderLineWithTooltips = (text: string) => {
										const parts: (string | JSX.Element)[] = [];
										let lastIndex = 0;

										// First pass: handle **Entity** patterns
										const entityRegex = /\*\*(.*?)\*\*/g;
										// biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
										let entityMatch;
										const entityMatches: Array<{
											match: string;
											captured: string;
											start: number;
											end: number;
										}> = [];

										// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
										while ((entityMatch = entityRegex.exec(text)) !== null) {
											entityMatches.push({
												match: entityMatch[0],
												captured: entityMatch[1] || "",
												start: entityMatch.index,
												end: entityMatch.index + entityMatch[0].length,
											});
										}

										// Second pass: handle __property__ patterns
										const propertyRegex = /__(.*?)__/g;
										// biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
										let propertyMatch;
										const propertyMatches: Array<{
											match: string;
											captured: string;
											start: number;
											end: number;
										}> = [];

										while (
											// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
											(propertyMatch = propertyRegex.exec(text)) !== null
										) {
											propertyMatches.push({
												match: propertyMatch[0],
												captured: propertyMatch[1] || "",
												start: propertyMatch.index,
												end: propertyMatch.index + propertyMatch[0].length,
											});
										}

										// Combine and sort all matches by position
										const allMatches = [
											...entityMatches.map((m) => ({
												...m,
												type: "entity" as const,
											})),
											...propertyMatches.map((m) => ({
												...m,
												type: "property" as const,
											})),
										].sort((a, b) => a.start - b.start);

										// Build the parts array
										allMatches.forEach((match, idx) => {
											const idb = idx;
											// Add text before this match
											if (lastIndex < match.start) {
												parts.push(text.slice(lastIndex, match.start));
											}

											if (match.type === "entity") {
												// Handle **Entity** pattern
												let foundPath = null;
												let foundValue = null;

												for (const execution of executionData.trace.execution) {
													if (
														execution.selector.value.toLowerCase() ===
														match.captured.toLowerCase()
													) {
														const entityPath = `$.${match.captured.toLowerCase()}`;
														foundValue = getValueFromPath(
															entityPath,
															executionData.data,
														);
														if (
															foundValue !== null &&
															foundValue !== undefined
														) {
															foundPath = entityPath;
															break;
														}
													}
												}

												if (
													foundPath &&
													foundValue !== null &&
													foundValue !== undefined
												) {
													parts.push(
														<Tooltip key={`entity-${idb}`}>
															<TooltipTrigger asChild>
																<span className="cursor-help font-bold text-blue-600 underline decoration-dotted hover:text-blue-800">
																	{match.match}
																</span>
															</TooltipTrigger>
															<TooltipContent>
																<div className="text-sm">
																	<div>
																		<strong>Path:</strong> {foundPath}
																	</div>
																	<div>
																		<strong>Value:</strong>
																	</div>
																	<pre className="mt-1 max-w-xs overflow-auto rounded p-2 text-xs">
																		{JSON.stringify(foundValue, null, 2)}
																	</pre>
																</div>
															</TooltipContent>
														</Tooltip>,
													);
												} else {
													parts.push(
														<span key={`entity-${idb}`} className="font-bold">
															{match.match}
														</span>,
													);
												}
											} else {
												// Handle __property__ pattern
												const normalized = match.captured
													.toLowerCase()
													.replace(/\s+/g, "");
												let foundPath = null;
												let foundValue = null;

												if (propertyPaths.has(normalized)) {
													foundPath = propertyPaths.get(normalized);
													foundValue = getValueFromPath(
														// biome-ignore lint/style/noNonNullAssertion: <explanation>
														foundPath!,
														executionData.data,
													);
												} else {
													for (const [key, path] of propertyPaths.entries()) {
														if (
															key.includes(normalized) ||
															normalized.includes(key)
														) {
															foundPath = path;
															foundValue = getValueFromPath(
																path,
																executionData.data,
															);
															break;
														}
													}
												}

												if (
													foundPath &&
													foundValue !== null &&
													foundValue !== undefined
												) {
													parts.push(
														<Tooltip key={`property-${idb}`}>
															<TooltipTrigger asChild>
																<span className="cursor-help text-purple-600 italic underline decoration-dotted hover:text-purple-800">
																	{match.match}
																</span>
															</TooltipTrigger>
															<TooltipContent>
																<div className="text-sm">
																	<div>
																		<strong>Path:</strong> {foundPath}
																	</div>
																	<div>
																		<strong>Value:</strong>
																	</div>
																	<pre className="mt-1 max-w-xs overflow-auto rounded p-2 text-xs">
																		{JSON.stringify(foundValue, null, 2)}
																	</pre>
																</div>
															</TooltipContent>
														</Tooltip>,
													);
												} else {
													parts.push(
														<span key={`property-${idb}`} className="italic">
															{match.match}
														</span>,
													);
												}
											}

											lastIndex = match.end;
										});

										// Add remaining text
										if (lastIndex < text.length) {
											parts.push(text.slice(lastIndex));
										}

										return parts.length > 0 ? parts : [text];
									};

									return (
										<div
											// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
											key={index}
											className="mb-2 rounded p-2 transition-colors hover:bg-muted/50"
										>
											{renderLineWithTooltips(line)}
										</div>
									);
								})}
							</div>
						</ScrollArea>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
