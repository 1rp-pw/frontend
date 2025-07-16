"use client";

import { Card, CardContent } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import type { NodeOperationLog } from "~/lib/types";
import type { FlowValidationResult } from "~/lib/utils/flow-validation";

interface FlowFooterProps {
	validationResult: FlowValidationResult | null;
	yamlPreview: string;
	operationLogs?: NodeOperationLog[];
}

export function FlowFooter({
	validationResult,
	yamlPreview,
	operationLogs = [],
}: FlowFooterProps) {
	return (
		<div className="h-full overflow-auto border-border border-t bg-card p-4">
			<Card className="h-full rounded-lg border-border bg-card shadow-sm">
				<CardContent className="h-[calc(100%-4rem)] overflow-auto">
					<Tabs defaultValue="instructions" className="w-full">
						<TabsList className="grid w-full grid-cols-4">
							<TabsTrigger value="instructions">Instructions</TabsTrigger>
							<TabsTrigger value="validation">Validation</TabsTrigger>
							<TabsTrigger value="yaml-preview">YAML Preview</TabsTrigger>
							<TabsTrigger value="operation-log">Operation Log</TabsTrigger>
						</TabsList>

						<TabsContent
							value="instructions"
							className="space-y-2 text-muted-foreground text-xs"
						>
							<FlowInstructions />
						</TabsContent>

						<TabsContent value="validation" className="space-y-3">
							<FlowValidation validationResult={validationResult} />
						</TabsContent>

						<TabsContent value="yaml-preview" className="space-y-3">
							<FlowYamlPreview yaml={yamlPreview} />
						</TabsContent>

						<TabsContent value="operation-log" className="space-y-3">
							<FlowOperationLog logs={operationLogs} />
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}

function FlowInstructions() {
	return (
		<>
			<p>
				<strong className="font-medium text-foreground">Building Flows:</strong>{" "}
				Start with the green Start Node, then click "Add True" or "Add False" to
				create connected nodes
			</p>
			<p>
				<strong className="font-medium text-foreground">Node Types:</strong>{" "}
				Return nodes (True/False), Policy nodes (execute another policy), or
				Custom nodes (custom outcome)
			</p>
			<p>
				<strong className="font-medium text-foreground">Testing:</strong> Enter
				JSON test data in the Start node, then click "Test Flow" to execute the
				flow with that data
			</p>
			<p>
				<strong className="font-medium text-foreground">
					Saving & Loading:
				</strong>{" "}
				Name your flow and click "Save Flow" to store it. Use the Load dropdown
				to select and load existing flows
			</p>
			<p>
				<strong className="font-medium text-foreground">Deleting Nodes:</strong>{" "}
				Click the X button in the top-right corner of any node (except Start
				node) to remove it
			</p>
		</>
	);
}

function FlowValidation({
	validationResult,
}: {
	validationResult: FlowValidationResult | null;
}) {
	if (!validationResult) {
		return (
			<div className="text-muted-foreground text-xs">
				Flow validation will run automatically as you edit
			</div>
		);
	}

	return (
		<div className="space-y-2 text-xs">
			<div className="flex items-center gap-2">
				<div
					className={`h-3 w-3 rounded-full ${
						validationResult.isValid ? "bg-green-500" : "bg-red-500"
					}`}
				/>
				<Label className="font-medium text-foreground">
					Flow Status: {validationResult.isValid ? "Valid" : "Invalid"}
				</Label>
			</div>
			{validationResult.isValid ? (
				<div className="text-green-600">
					✓ All paths lead to terminal nodes (return or custom)
				</div>
			) : (
				<div className="space-y-2">
					<div className="font-medium text-destructive">Issues found:</div>
					<ul className="space-y-1">
						{validationResult.errors.map((error, index) => {
							const i = index;
							return (
								<li key={i} className="text-destructive">
									• {error}
								</li>
							);
						})}
					</ul>
					{validationResult.unterminatedNodes.length > 0 && (
						<div className="mt-2">
							<div className="font-medium text-muted-foreground">
								Problematic nodes:
							</div>
							<div className="text-muted-foreground text-xs">
								{validationResult.unterminatedNodes.join(", ")}
							</div>
						</div>
					)}
				</div>
			)}
			<div className="mt-2 border-t pt-2 text-muted-foreground">
				<strong>Requirements:</strong>
				<ul className="mt-1 space-y-1">
					<li>• Every Start and Policy node must have a Policy ID</li>
					<li>
						• Every Start and Policy node must have both TRUE and FALSE paths
					</li>
					<li>• All paths must end at a Return or Custom node</li>
					<li>• No circular references allowed</li>
					<li>• All nodes must be connected to the flow</li>
				</ul>
			</div>
		</div>
	);
}

function FlowYamlPreview({ yaml }: { yaml: string }) {
	return (
		<div className="space-y-2">
			<Label className="font-medium text-foreground text-xs">
				YAML Representation:
			</Label>
			<div className="text-muted-foreground text-xs">
				This YAML will be sent to the server alongside the flow data when saving
			</div>
			<pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">
				<code>{yaml}</code>
			</pre>
		</div>
	);
}

function FlowOperationLog({ logs }: { logs: NodeOperationLog[] }) {
	const formatNodeInfo = (nodeType: string, nodeData: any) => {
		switch (nodeType) {
			case "start":
				return nodeData?.policyId
					? `policy: ${nodeData.policyId}`
					: "no policy set";
			case "policy":
				return nodeData?.policyId
					? `policy: ${nodeData.policyId}`
					: "no policy set";
			case "return":
				return `returns: ${nodeData?.returnValue === true ? "true" : "false"}`;
			case "custom":
				return nodeData?.outcome
					? `outcome: ${nodeData.outcome}`
					: "no outcome set";
			default:
				return "";
		}
	};

	if (logs.length === 0) {
		return (
			<div className="text-muted-foreground text-xs">
				No operations recorded yet. Operations will appear here as you create,
				update, delete, or change node types.
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<Label className="font-medium text-foreground text-xs">
					Operation History
				</Label>
				<span className="text-muted-foreground text-xs">
					Showing {Math.min(50, logs.length)} of {logs.length} operations
				</span>
			</div>
			<div className="max-h-64 space-y-2 overflow-y-auto">
				{logs
					.slice(-50)
					.reverse()
					.map((log) => (
						<div
							key={log.id}
							className="rounded border bg-muted/50 p-2 text-xs"
						>
							<div className="space-y-1">
								<div className="flex items-start justify-between">
									<div className="font-medium">
										{log.operation === "create" && "➕ Created"}
										{log.operation === "update" && "✏️ Updated"}
										{log.operation === "delete" && "🗑️ Deleted"}
										{log.operation === "typeChange" && "🔄 Type Changed"}{" "}
										{log.nodeType} node
									</div>
									<div className="whitespace-nowrap text-muted-foreground">
										{new Date(log.timestamp).toLocaleTimeString()}
									</div>
								</div>
								<div className="text-muted-foreground">
									{log.operation === "create" && (
										<span>Created from {log.details.from} path</span>
									)}
									{log.operation === "update" && (
										<span>
											{Object.keys(log.details.from || {})[0]}:{" "}
											{Object.values(log.details.from || {})[0] || "empty"} →{" "}
											{Object.values(log.details.to || {})[0]}
										</span>
									)}
									{log.operation === "delete" && (
										<div>
											<div className="font-medium">
												{formatNodeInfo(log.nodeType, log.details.nodeData)}
											</div>
											{log.details.cascadedDeletions &&
												log.details.cascadedDeletions.length > 0 && (
													<div className="mt-1">
														<div>
															Also deleted{" "}
															{log.details.cascadedDeletions.length} child
															node(s):
														</div>
														<ul className="mt-1 ml-4">
															{log.details.cascadedDeletions.map((child) => (
																<li key={child.nodeId}>
																	• {child.nodeType}:{" "}
																	{formatNodeInfo(
																		child.nodeType,
																		child.nodeData,
																	)}
																</li>
															))}
														</ul>
													</div>
												)}
										</div>
									)}
									{log.operation === "typeChange" &&
										log.details.from &&
										log.details.to && (
											<div>
												<div>
													From {log.details.from.type}:{" "}
													{formatNodeInfo(
														log.details.from.type,
														log.details.from.data,
													)}
												</div>
												<div>
													To {log.details.to.type}:{" "}
													{formatNodeInfo(
														log.details.to.type,
														log.details.to.data,
													)}
												</div>
											</div>
										)}
								</div>
							</div>
						</div>
					))}
			</div>
		</div>
	);
}
