"use client";
import { CheckCircle, XCircle } from "lucide-react";
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
import type { FlowTestResult } from "~/lib/state/flow";

interface FlowExecutionModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	executionData: FlowTestResult | null;
	testName?: string;
	expectedOutcome?: string | boolean;
}

export function FlowExecutionModal({
	open,
	onOpenChange,
	executionData,
	testName,
	expectedOutcome,
}: FlowExecutionModalProps) {
	const [selectedNodeIndex, setSelectedNodeIndex] = useState(0);

	// Show modal even without execution data, but with a message
	const hasExecutionData = (executionData?.nodeResponses?.length ?? 0) > 0;

	const testPassed = executionData?.result === expectedOutcome;
	const nodeResponses = executionData?.nodeResponses || [];
	const selectedNode = nodeResponses[selectedNodeIndex];

	// Build execution path from nodeResponse data
	const executionPath = nodeResponses.map(
		(node, index) => `${node.nodeType}-${index + 1}`,
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] min-h-[600px] w-[90vw] min-w-[800px] max-w-none sm:max-w-none md:max-w-none lg:max-w-none xl:max-w-7xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						{testName && <span>{testName} - </span>}
						Flow Execution Results
						<Badge variant={testPassed ? "default" : "destructive"}>
							{testPassed ? "PASSED" : "FAILED"}
						</Badge>
					</DialogTitle>
					<DialogDescription className="flex items-center gap-2">
						Expected: {String(expectedOutcome)} | Actual:{" "}
						{String(executionData?.result || "N/A")}
					</DialogDescription>
				</DialogHeader>

				<div className="flex h-[65vh] min-h-[500px] gap-4">
					{hasExecutionData ? (
						<>
							{/* Node List - Left Panel */}
							<div className="w-1/3 min-w-[300px] border-r pr-4">
								<h3 className="mb-3 font-semibold">
									Execution Path ({nodeResponses.length} nodes)
								</h3>
								<ScrollArea className="h-full pb-5">
									<div className="space-y-2">
										{executionPath.map((nodeName, index) => {
											const nodeResponse = nodeResponses[index];
											const hasError = nodeResponse?.response?.error;
											const nodeResult = nodeResponse?.response?.result;
											const idx = index;

											return (
												<button
													key={`node-${idx}-${nodeName}`}
													type="button"
													onClick={() => setSelectedNodeIndex(index)}
													className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 ${
														selectedNodeIndex === index
															? "border-primary bg-muted"
															: "border-border"
													}`}
												>
													<div className="mb-2 flex items-center gap-2">
														{hasError ? (
															<XCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
														) : (
															<CheckCircle
																className={`h-4 w-4 flex-shrink-0 ${
																	nodeResult ? "text-green-500" : "text-red-500"
																}`}
															/>
														)}
														<span className="font-medium">
															{nodeResponse?.nodeType || "Unknown"} (
															{nodeResponse?.nodeId || "Unknown"})
														</span>
													</div>
													<div className="text-muted-foreground text-sm">
														<div className="truncate">
															<strong>Result:</strong>{" "}
															{String(nodeResult || "N/A")}
														</div>
														{hasError && (
															<div className="mt-1 text-destructive text-xs">
																Error occurred
															</div>
														)}
													</div>
												</button>
											);
										})}
									</div>
								</ScrollArea>
							</div>

							{/* Node Detail - Right Panel */}
							<div className="flex-1">
								<Tabs defaultValue="details" className="h-full">
									<TabsList className="grid w-full grid-cols-4">
										<TabsTrigger value="details">Node Details</TabsTrigger>
										<TabsTrigger value="trace">Execution Trace</TabsTrigger>
										<TabsTrigger value="rule">Policy Rule</TabsTrigger>
										<TabsTrigger value="raw">Raw Output</TabsTrigger>
									</TabsList>

									<TabsContent
										value="details"
										className="mt-4 h-[calc(100%-3rem)]"
									>
										{selectedNode && (
											<ScrollArea className="h-full">
												<div className="space-y-4">
													<div className="rounded-lg border p-4">
														<div className="mb-3 flex items-center gap-2">
															<h3 className="font-semibold text-lg">
																{selectedNode.nodeType} Node
															</h3>
															{selectedNode.response.error ? (
																<XCircle className="h-5 w-5 text-red-500" />
															) : (
																<CheckCircle
																	className={`h-5 w-5 ${
																		selectedNode.response.result
																			? "text-green-500"
																			: "text-red-500"
																	}`}
																/>
															)}
														</div>

														<div className="mb-3">
															<strong>Node ID:</strong> {selectedNode.nodeId}
														</div>

														<div className="mb-3">
															<strong>Node Type:</strong>{" "}
															{selectedNode.nodeType}
														</div>

														<div className="mb-3">
															<strong>Result:</strong>{" "}
															{String(selectedNode.response.result)}
														</div>

														{selectedNode.response.error && (
															<div className="rounded bg-destructive/10 p-3 text-destructive">
																<strong>Error:</strong>{" "}
																{selectedNode.response.error}
															</div>
														)}

														{selectedNode.response.data ? (
															<div className="mt-4">
																<strong>Input Data:</strong>
																<ScrollArea className="mt-2 h-48 w-full rounded border bg-muted">
																	<pre className="p-3 text-sm">
																		<RainbowBraces
																			json={
																				selectedNode.response.data as object
																			}
																			className="text-sm"
																		/>
																	</pre>
																	<ScrollBar orientation="horizontal" />
																	<ScrollBar orientation="vertical" />
																</ScrollArea>
															</div>
														) : null}
													</div>
												</div>
											</ScrollArea>
										)}
									</TabsContent>

									<TabsContent
										value="trace"
										className="mt-4 h-[calc(100%-3rem)]"
									>
										<ScrollArea className="h-full">
											{selectedNode?.response?.trace?.execution ? (
												<div className="space-y-4">
													<h3 className="font-semibold text-lg">
														Policy Execution Trace
													</h3>
													{selectedNode.response.trace.execution.map(
														(execution, index) => {
															const execIdx = index;
															return (
																<div
																	key={`exec-${execIdx}`}
																	className="rounded-lg border p-4"
																>
																	<div className="mb-3 flex items-center gap-2">
																		{execution.result ? (
																			<CheckCircle className="h-4 w-4 text-green-500" />
																		) : (
																			<XCircle className="h-4 w-4 text-red-500" />
																		)}
																		<Badge
																			variant={
																				execution.result
																					? "default"
																					: "destructive"
																			}
																		>
																			{execution.result ? "PASSED" : "FAILED"}
																		</Badge>
																	</div>

																	<div className="mb-3">
																		<strong>Outcome:</strong>{" "}
																		{execution.outcome.value}
																	</div>

																	<div className="mb-3">
																		<strong>Selector:</strong>{" "}
																		{execution.selector.value}
																	</div>

																	<div>
																		<strong>Conditions:</strong>
																		<div className="mt-2 space-y-2">
																			{execution.conditions.map(
																				(condition, condIndex) => {
																					const ci = condIndex;
																					return (
																						<div
																							key={`cond-${ci}`}
																							className="rounded bg-muted/50 p-3 text-sm"
																						>
																							<pre className="whitespace-pre-wrap">
																								{JSON.stringify(
																									condition,
																									null,
																									2,
																								)}
																							</pre>
																						</div>
																					);
																				},
																			)}
																		</div>
																	</div>
																</div>
															);
														},
													)}
												</div>
											) : (
												<div className="text-muted-foreground">
													No execution trace available for this node
												</div>
											)}
										</ScrollArea>
									</TabsContent>

									<TabsContent
										value="rule"
										className="mt-4 h-[calc(100%-3rem)]"
									>
										<ScrollArea className="h-full rounded bg-muted p-2">
											{selectedNode?.response?.rule &&
											selectedNode.response.rule.length > 0 ? (
												<div className="space-y-2 text-sm leading-relaxed">
													{selectedNode.response.rule.map((line, index) => {
														const lineIdx = index;
														return (
															<div
																key={`rule-line-${lineIdx}`}
																className="mb-0 whitespace-pre-wrap p-1 transition-colors hover:bg-muted/50"
															>
																<span className="pr-2 text-red-700">
																	{index + 1}.
																</span>{" "}
																{line}
															</div>
														);
													})}
												</div>
											) : (
												<div className="text-muted-foreground">
													No policy rule available for this node
												</div>
											)}
										</ScrollArea>
									</TabsContent>

									<TabsContent value="raw" className="mt-4 h-[calc(100%-3rem)]">
										<div className="h-full">
											<h3 className="mb-2 font-semibold text-lg">
												Raw Flow Execution Data
											</h3>
											<ScrollArea className="h-[calc(100%-2rem)] w-full max-w-[32vw] rounded border bg-muted">
												<pre className="p-3 text-sm">
													<RainbowBraces
														json={executionData || {}}
														className="text-sm"
													/>
												</pre>
												<ScrollBar orientation="horizontal" />
												<ScrollBar orientation="vertical" />
											</ScrollArea>
										</div>
									</TabsContent>
								</Tabs>
							</div>
						</>
					) : (
						<div className="flex h-[65vh] min-h-[500px] items-center justify-center">
							<div className="text-center text-muted-foreground">
								<h3 className="mb-2 font-semibold text-lg">
									No Execution Data
								</h3>
								<p className="text-sm">
									This test hasn't been run yet or execution data is not
									available.
								</p>
								<p className="mt-1 text-xs">
									Run the test to see detailed execution results.
								</p>
							</div>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
