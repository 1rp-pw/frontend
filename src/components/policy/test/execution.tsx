"use client";
import { CheckCircle, CopyIcon, XCircle } from "lucide-react";
import type { JSX } from "react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { RainbowBraces } from "~/components/ui/rainbow";
import { ScrollArea, ScrollBar } from "~/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import type { TestResultSet } from "~/lib/state/policy";
import {Button} from "~/components/ui/button";

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
	const [selectedExecutionIndex, setSelectedExecutionIndex] = useState(0);

	if (!executionData) return null;
	if (!executionData.trace) return null;
	if (!executionData.trace.execution) return null;

	// biome-ignore lint/suspicious/noExplicitAny: can be anything
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
	const selectedExecution =
		executionData.trace.execution[selectedExecutionIndex];

	// biome-ignore lint/suspicious/noExplicitAny: can be anything
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
						{Array.isArray(condition.value?.value)
							? `[${condition.value.value.join(", ")}]`
							: condition.value?.value}
					</div>
				)}

				{condition.evaluation_details && (
					<div className="rounded bg-muted p-3 text-sm">
						<div>
							<strong>Evaluation:</strong>
						</div>
						<div>
							User Data (Left):{" "}
							{Array.isArray(condition.evaluation_details.left_value.value)
								? `[${condition.evaluation_details.left_value.value.join(", ")}]`
								: condition.evaluation_details.left_value.value}{" "}
							({condition.evaluation_details.left_value.type})
						</div>
						<div>
							Control Text (Right):{" "}
							{Array.isArray(condition.evaluation_details.right_value.value)
								? `[${condition.evaluation_details.right_value.value.join(", ")}]`
								: condition.evaluation_details.right_value.value}{" "}
							({condition.evaluation_details.right_value.type})
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
			<DialogContent className="max-h-[90vh] min-h-[600px] w-[90vw] min-w-[800px] max-w-none sm:max-w-none md:max-w-none lg:max-w-none xl:max-w-7xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						{testName && <span>{testName} - </span>}
						Policy Execution Results
						<Badge variant={executionData.result ? "default" : "destructive"}>
							{executionData.result ? "PASSED" : "FAILED"}
						</Badge>
					</DialogTitle>
					<DialogDescription className="flex items-center gap-2">
						Select a rule execution to view details
					</DialogDescription>
				</DialogHeader>

				<div className="flex h-[65vh] min-h-[500px] gap-4">
					{/* Execution List - Left Panel */}
					<div className="w-1/3 min-w-[300px] border-r pr-4">
						<h3 className="mb-3 font-semibold">Rule Executions</h3>
						<ScrollArea className="h-full pb-5">
							<div className="space-y-2">
								{executionData.trace.execution.map((execution, index) => (
									<button
										// biome-ignore lint/suspicious/noArrayIndexKey: ignore
										key={index}
										type="button"
										onClick={() => setSelectedExecutionIndex(index)}
										className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 ${
											selectedExecutionIndex === index
												? "border-primary bg-muted"
												: "border-border"
										}`}
									>
										<div className="mb-2 flex items-center gap-2">
											{execution.result ? (
												<CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500" />
											) : (
												<XCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
											)}
											<span className="font-medium">Rule {index + 1}</span>
										</div>
										<div className="text-muted-foreground text-sm">
											<div className="truncate">
												<strong>Selector:</strong> {execution.selector.value}
											</div>
											<div className="truncate">
												<strong>Outcome:</strong> {execution.outcome.value}
											</div>
											<div className="mt-1 text-xs">
												{execution.conditions.length} condition
												{execution.conditions.length !== 1 ? "s" : ""}
											</div>
										</div>
									</button>
								))}
							</div>
						</ScrollArea>
					</div>

					{/* Execution Detail - Right Panel */}
					<div className="flex-1">
						<Tabs defaultValue="conditions" className="h-full">
							<TabsList className="grid w-full grid-cols-4">
								<TabsTrigger value="conditions">Conditions</TabsTrigger>
								<TabsTrigger value="data">Input Data</TabsTrigger>
								<TabsTrigger value="text">Policy Text</TabsTrigger>
								<TabsTrigger value="raw">Raw Output</TabsTrigger>
							</TabsList>

							<TabsContent
								value="conditions"
								className="mt-4 h-[calc(100%-3rem)]"
							>
								{selectedExecution && (
									<ScrollArea className="h-full">
										<div className="space-y-4">
											<div className="rounded-lg border p-4">
												<div className="mb-3 flex items-center gap-2">
													<h3 className="font-semibold text-lg">
														Rule Execution {selectedExecutionIndex + 1}
													</h3>
													{selectedExecution.result ? (
														<CheckCircle className="h-5 w-5 text-green-500" />
													) : (
														<XCircle className="h-5 w-5 text-red-500" />
													)}
												</div>

												<div className="mb-3">
													<strong>Outcome:</strong>{" "}
													{selectedExecution.outcome.value}
												</div>

												<div className="mb-3">
													<strong>Selector:</strong>{" "}
													{selectedExecution.selector.value}
												</div>

												<div>
													<strong>Conditions:</strong>
													<div className="mt-2 space-y-2">
														{selectedExecution.conditions.map(
															(condition, condIndex) =>
																renderCondition(condition, condIndex),
														)}
													</div>
												</div>
											</div>
										</div>
									</ScrollArea>
								)}
							</TabsContent>

							<TabsContent value="data" className="mt-4 h-[calc(100%-3rem)]">
								<ScrollArea className="h-full">
									<div>
										<h3 className="mb-2 font-semibold text-lg">Input Data</h3>
										<pre className="overflow-x-auto rounded bg-muted p-3 text-sm">
											<RainbowBraces
												json={executionData.data}
												className={"text-sm"}
											/>
										</pre>
									</div>
								</ScrollArea>
							</TabsContent>

							<TabsContent value="text" className="mt-4 h-[calc(100%-3rem)]">
								<ScrollArea className="h-full rounded bg-muted p-2">
									<div className="space-y-2 text-sm leading-relaxed">
										{executionData.rule.map((line, index) => {
											// Process and render the line with tooltips
											const renderLineWithTooltips = (text: string) => {
												const parts: (string | JSX.Element)[] = [];
												let lastIndex = 0;

												// First pass: handle **Entity** patterns
												const entityRegex = /\*\*(.*?)\*\*/g;
												// biome-ignore lint/suspicious/noImplicitAnyLet: need to set this outside
												let entityMatch;
												const entityMatches: Array<{
													match: string;
													captured: string;
													start: number;
													end: number;
												}> = [];

												while (
													// biome-ignore lint/suspicious/noAssignInExpressions: this is not a mistype
													(entityMatch = entityRegex.exec(text)) !== null
												) {
													entityMatches.push({
														match: entityMatch[0],
														captured: entityMatch[1] || "",
														start: entityMatch.index,
														end: entityMatch.index + entityMatch[0].length,
													});
												}

												// Second pass: handle __property__ patterns
												const propertyRegex = /__(.*?)__/g;
												// biome-ignore lint/suspicious/noImplicitAnyLet: its fine
												let propertyMatch;
												const propertyMatches: Array<{
													match: string;
													captured: string;
													start: number;
													end: number;
												}> = [];

												while (
													// biome-ignore lint/suspicious/noAssignInExpressions: its fine
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

														for (const execution of executionData.trace
															.execution) {
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
																				<RainbowBraces
																					json={foundValue}
																					className={"text-xs"}
																				/>
																			</pre>
																		</div>
																	</TooltipContent>
																</Tooltip>,
															);
														} else {
															parts.push(
																<span
																	key={`entity-${idb}`}
																	className="font-bold"
																>
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
																// biome-ignore lint/style/noNonNullAssertion: its fine
																foundPath!,
																executionData.data,
															);
														} else {
															for (const [
																key,
																path,
															] of propertyPaths.entries()) {
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
																				<RainbowBraces
																					json={foundValue}
																					className={"text-xs"}
																				/>
																			</pre>
																		</div>
																	</TooltipContent>
																</Tooltip>,
															);
														} else {
															parts.push(
																<span
																	key={`property-${idb}`}
																	className="italic"
																>
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

											const i = index;
											return (
												<div
													key={i}
													className="mb-0 whitespace-pre-wrap p-1 transition-colors hover:bg-muted/50"
												>
													<span className={"pr-2 text-red-700"}>{i + 1}.</span>{" "}
													{renderLineWithTooltips(line)}
												</div>
											);
										})}
									</div>
								</ScrollArea>
							</TabsContent>

							<TabsContent value="raw" className="mt-4 h-[calc(100%-3rem)]">
								<div className="h-full">
									<div className="flex items-center justify-between">
										<h3 className="mb-2 font-semibold text-lg">
											Raw Policy Execution Data
										</h3>
										<Button
											variant="outline"
											size="sm"
											onClick={() => {
												navigator.clipboard.writeText(JSON.stringify(executionData, null, 2));
											}}
											className="h-7 px-2"
										>
											<CopyIcon className="h-3 w-3" />
											Copy Execution
										</Button>
									</div>
									<ScrollArea className="h-[calc(100%-2rem)] max-w-[32vw] rounded border bg-muted">
										<pre className="p-3 text-sm">
											<RainbowBraces json={executionData} className="text-sm" />
										</pre>
										<ScrollBar orientation="horizontal" />
										<ScrollBar orientation="vertical" />
									</ScrollArea>
								</div>
							</TabsContent>
						</Tabs>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
