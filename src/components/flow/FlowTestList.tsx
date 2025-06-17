"use client";

import { CheckCircle, Clock, Play, Plus, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import { FlowExecutionModal } from "~/components/flow/FlowExecutionModal";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import type { FlowTest } from "~/lib/types";
import { cn } from "~/lib/utils";

interface FlowTestListProps {
	tests: FlowTest[];
	currentTest: FlowTest | null;
	onCreateTest: () => void;
	onSelectTest: (test: FlowTest) => void;
	onDeleteTest: (testId: string) => void;
	onRunTest: (testId: string) => void;
	onRunAllTests: () => void;
	isRunning: boolean;
}

export function FlowTestList({
	tests,
	currentTest,
	onCreateTest,
	onSelectTest,
	onDeleteTest,
	onRunTest,
	onRunAllTests,
	isRunning,
}: FlowTestListProps) {
	const [executionModalOpen, setExecutionModalOpen] = useState(false);
	const [selectedTestForModal, setSelectedTestForModal] =
		useState<FlowTest | null>(null);

	const getTestStatus = (test: FlowTest) => {
		if (!test.result || !test.lastRun) {
			return { icon: Clock, label: "Not Run", variant: "secondary" as const };
		}

		// Compare expected outcome with actual result
		const actualOutcome = test.result.result;
		const expectedOutcome = test.expectedOutcome;

		// Handle both string and boolean comparisons
		const passed = actualOutcome === expectedOutcome;

		if (passed) {
			return {
				icon: CheckCircle,
				label: "Passed",
				variant: "default" as const,
			};
		}
		return { icon: XCircle, label: "Failed", variant: "destructive" as const };
	};

	return (
		<Card className="flex h-full flex-col rounded-none">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="text-base">Tests</CardTitle>
						<CardDescription className="text-xs">
							Manage and run flow tests
						</CardDescription>
					</div>
					<div className="flex gap-2">
						<Button
							size="sm"
							variant="outline"
							onClick={onRunAllTests}
							disabled={
								isRunning || tests.filter((t) => t.created).length === 0
							}
						>
							<Play className="mr-1 h-3 w-3" />
							Run All
						</Button>
						<Button size="sm" onClick={onCreateTest}>
							<Plus className="mr-1 h-3 w-3" />
							New Test
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent className="flex-1 p-0">
				<ScrollArea className="h-full">
					<div className="space-y-1 p-3">
						{tests.length === 0 ? (
							<div className="py-8 text-center text-muted-foreground text-sm">
								No tests yet. Create one to get started.
							</div>
						) : (
							tests.map((test) => {
								const status = getTestStatus(test);
								const StatusIcon = status.icon;
								const isSelected = currentTest?.id === test.id;
								const hasResult = test.result && test.lastRun;

								return (
									<div
										key={test.id}
										className={cn(
											"group flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-accent",
											isSelected && "border-primary bg-accent",
										)}
									>
										<div className="flex flex-1 items-center gap-3">
											<button
												type="button"
												onClick={() => {
													setSelectedTestForModal(test);
													setExecutionModalOpen(true);
												}}
												className="flex cursor-pointer items-center"
												title={
													hasResult
														? "View execution details"
														: "View test details"
												}
											>
												<StatusIcon
													className={cn(
														"h-4 w-4 cursor-pointer",
														status.variant === "default" &&
															"text-green-600 hover:text-green-700",
														status.variant === "destructive" &&
															"text-destructive hover:text-red-700",
														status.variant === "secondary" &&
															"text-muted-foreground hover:text-muted-foreground/80",
													)}
												/>
											</button>
											<button
												type="button"
												onClick={() => onSelectTest(test)}
												className="flex flex-1 items-center gap-3 text-left"
											>
												<div className="flex-1">
													<div className="font-medium text-sm">{test.name}</div>
													<div className="flex items-center gap-2 text-muted-foreground text-xs">
														<span>
															Expect: {test.expectedOutcome.toString()}
														</span>
														{test.lastRun && (
															<span>
																• Last run:{" "}
																{new Date(test.lastRun).toLocaleTimeString()}
															</span>
														)}
													</div>
												</div>
											</button>
										</div>
										<div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
											<Button
												size="sm"
												variant="ghost"
												onClick={() => onRunTest(test.id)}
												disabled={isRunning || !test.created}
											>
												<Play className="h-3 w-3" />
											</Button>
											<Button
												size="sm"
												variant="ghost"
												onClick={() => onDeleteTest(test.id)}
											>
												<Trash2 className="h-3 w-3" />
											</Button>
										</div>
									</div>
								);
							})
						)}
					</div>
				</ScrollArea>
			</CardContent>

			<FlowExecutionModal
				open={executionModalOpen}
				onOpenChange={setExecutionModalOpen}
				executionData={selectedTestForModal?.result || null}
				testName={selectedTestForModal?.name}
				expectedOutcome={selectedTestForModal?.expectedOutcome}
			/>
		</Card>
	);
}
