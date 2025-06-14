"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import type { FlowTestResult } from "~/lib/state/flow";
import type { FlowValidationResult } from "~/lib/utils/flow-validation";

interface FlowFooterProps {
	validationResult: FlowValidationResult | null;
	testResult: FlowTestResult | null;
	isTestRunning: boolean;
	yamlPreview: string;
}

export function FlowFooter({
	validationResult,
	testResult,
	isTestRunning,
	yamlPreview,
}: FlowFooterProps) {
	return (
		<footer className="border-border border-t bg-card px-6 py-4">
			<Card className="rounded-lg border-border bg-card shadow-sm">
				<CardHeader className="pb-3">
					<CardTitle className="font-medium text-sm">Flow Designer</CardTitle>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="instructions" className="w-full">
						<TabsList className="grid w-full grid-cols-4">
							<TabsTrigger value="instructions">Instructions</TabsTrigger>
							<TabsTrigger value="validation">Validation</TabsTrigger>
							<TabsTrigger value="test-results">Test Results</TabsTrigger>
							<TabsTrigger value="yaml-preview">YAML Preview</TabsTrigger>
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

						<TabsContent value="test-results" className="space-y-3">
							<FlowTestResults
								testResult={testResult}
								isTestRunning={isTestRunning}
							/>
						</TabsContent>

						<TabsContent value="yaml-preview" className="space-y-3">
							<FlowYamlPreview yaml={yamlPreview} />
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</footer>
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

function FlowTestResults({
	testResult,
	isTestRunning,
}: {
	testResult: FlowTestResult | null;
	isTestRunning: boolean;
}) {
	if (!testResult) {
		return (
			<div className="text-muted-foreground text-xs">
				{isTestRunning ? (
					<div className="flex items-center gap-2">
						<div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
						Running flow test...
					</div>
				) : (
					"No test results yet. Click 'Test Flow' to execute the flow with the Start node's JSON data."
				)}
			</div>
		);
	}

	return (
		<div className="space-y-2 text-xs">
			<div className="grid grid-cols-2 gap-4">
				<div>
					<Label className="font-medium text-foreground">Final Outcome:</Label>
					<div
						className={`font-medium ${
							typeof testResult.finalOutcome === "boolean"
								? testResult.finalOutcome
									? "text-green-600"
									: "text-red-600"
								: "text-blue-600"
						}`}
					>
						{typeof testResult.finalOutcome === "boolean"
							? testResult.finalOutcome
								? "TRUE"
								: "FALSE"
							: testResult.finalOutcome}
					</div>
				</div>
				<div>
					<Label className="font-medium text-foreground">Execution Path:</Label>
					<div className="text-muted-foreground">
						{testResult.executionPath.join(" → ")}
					</div>
				</div>
			</div>
			<div>
				<Label className="font-medium text-foreground">Final Node:</Label>
				<div className="text-muted-foreground">
					{testResult.nodeName} ({testResult.nodeId})
				</div>
			</div>
			{testResult.errors && testResult.errors.length > 0 && (
				<div>
					<Label className="font-medium text-destructive">Errors:</Label>
					<div className="space-y-1">
						{testResult.errors.map((error, index) => {
							const i = index;
							return (
								<div key={i} className="text-destructive text-xs">
									• {error}
								</div>
							);
						})}
					</div>
				</div>
			)}
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
