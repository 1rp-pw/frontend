"use client";

import { CheckCircle, Loader2, Play, Save, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import type { FlowTest } from "~/lib/types";
import { cn } from "~/lib/utils";

interface FlowTestPanelProps {
	testData: string;
	currentTest: FlowTest | null;
	isRunning: boolean;
	testResult: {
		nodeId: string;
		nodeName: string;
		result: boolean | string;
		executionPath: string[];
		finalOutcome: boolean | string;
		errors?: string[];
	} | null;
	error: string | null;
	onTestDataChange: (data: string) => void;
	onRunTest: () => void;
	onSaveTest: (
		data: string,
		name: string,
		expectedOutcome: string | boolean,
	) => void;
}

export function FlowTestPanel({
	testData,
	currentTest,
	isRunning,
	testResult,
	error,
	onTestDataChange,
	onRunTest,
	onSaveTest,
}: FlowTestPanelProps) {
	const [jsonError, setJsonError] = useState<string | null>(null);
	const [testName, setTestName] = useState(currentTest?.name || "");
	const [expectedOutcome, setExpectedOutcome] = useState<string>(
		currentTest?.expectedOutcome?.toString() || "true",
	);

	// Update local state when currentTest changes
	useEffect(() => {
		setTestName(currentTest?.name || "");
		setExpectedOutcome(currentTest?.expectedOutcome?.toString() || "true");
	}, [currentTest]);

	const handleDataChange = (value: string) => {
		onTestDataChange(value);

		// Validate JSON
		if (value.trim()) {
			try {
				JSON.parse(value);
				setJsonError(null);
			} catch (e) {
				setJsonError("Invalid JSON format");
			}
		} else {
			setJsonError(null);
		}
	};

	const handleSave = () => {
		if (isValid && testName.trim()) {
			// Convert string to boolean if it's "true" or "false", otherwise keep as string
			const processedOutcome =
				expectedOutcome === "true"
					? true
					: expectedOutcome === "false"
						? false
						: expectedOutcome;
			onSaveTest(testData, testName, processedOutcome);
		}
	};

	const isValid = !jsonError && testData.trim() !== "";

	return (
		<Card className="flex h-full flex-col rounded-none p-4">
			<div className="mb-4 flex items-center justify-between">
				<div>
					<h3 className="font-semibold text-lg">Test Editor</h3>
					<p className="text-muted-foreground text-sm">
						{currentTest ? `Editing: ${currentTest.name}` : "Create a new test"}
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						onClick={handleSave}
						disabled={!isValid || !testName.trim()}
						size="sm"
						variant="outline"
					>
						<Save className="mr-2 h-4 w-4" />
						Save
					</Button>
					<Button
						onClick={onRunTest}
						disabled={!isValid || isRunning}
						size="sm"
					>
						{isRunning ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Running...
							</>
						) : (
							<>
								<Play className="mr-2 h-4 w-4" />
								Run
							</>
						)}
					</Button>
				</div>
			</div>

			<div className="flex flex-1 flex-col gap-4 overflow-hidden">
				<div className="shrink-0 space-y-4">
					<div>
						<Label htmlFor="test-name" className="mb-2 block">
							Test Name
						</Label>
						<Input
							id="test-name"
							value={testName}
							onChange={(e) => setTestName(e.target.value)}
							placeholder="Enter test name"
							className="text-sm"
						/>
					</div>
					<div>
						<Label htmlFor="expected-outcome" className="mb-2 block">
							Expected Outcome
						</Label>
						<Input
							id="expected-outcome"
							value={expectedOutcome}
							onChange={(e) => setExpectedOutcome(e.target.value)}
							placeholder="true, false, or custom value like 'beep'"
							className="text-sm"
						/>
						<p className="mt-1 text-muted-foreground text-xs">
							Enter true/false for boolean results or a custom string value
						</p>
					</div>
				</div>
				<div className="flex min-h-0 flex-1 flex-col">
					<Label htmlFor="test-data" className="mb-2 block shrink-0">
						JSON Test Data
					</Label>
					<Textarea
						id="test-data"
						value={testData}
						onChange={(e) => handleDataChange(e.target.value)}
						placeholder='{\n  "example": "data",\n  "nested": {\n    "value": 123\n  }\n}'
						className={cn(
							"min-h-32 flex-1 font-mono text-sm",
							jsonError && "border-destructive focus:ring-destructive",
						)}
					/>
					{jsonError && (
						<p className="mt-2 shrink-0 text-destructive text-sm">
							{jsonError}
						</p>
					)}
				</div>

				{error && (
					<div className="rounded-md border border-destructive/20 bg-destructive/10 p-3">
						<p className="text-destructive text-sm">{error}</p>
					</div>
				)}

				{/*{testResult && (*/}
				{/*	<div className="max-h-64 shrink-0 space-y-3 overflow-y-auto rounded-md border p-4">*/}
				{/*		<div className="flex items-center justify-between">*/}
				{/*			<h4 className="font-semibold">Test Result</h4>*/}
				{/*			{(() => {*/}
				{/*				const expectedOutcome = currentTest?.expectedOutcome;*/}
				{/*				const actualOutcome = testResult.finalOutcome;*/}
				{/*				const testPassed = expectedOutcome === actualOutcome;*/}

				{/*				return (*/}
				{/*					<Badge variant={testPassed ? "default" : "destructive"}>*/}
				{/*						{testPassed ? (*/}
				{/*							<>*/}
				{/*								<CheckCircle className="mr-1 h-3 w-3" />*/}
				{/*								Passed*/}
				{/*							</>*/}
				{/*						) : (*/}
				{/*							<>*/}
				{/*								<XCircle className="mr-1 h-3 w-3" />*/}
				{/*								Failed*/}
				{/*							</>*/}
				{/*						)}*/}
				{/*					</Badge>*/}
				{/*				);*/}
				{/*			})()}*/}
				{/*		</div>*/}

				{/*		<div className="space-y-2">*/}
				{/*			<div className="grid grid-cols-2 gap-4">*/}
				{/*				<div>*/}
				{/*					<p className="font-medium text-muted-foreground text-sm">*/}
				{/*						Expected*/}
				{/*					</p>*/}
				{/*					<p className="font-mono text-sm">*/}
				{/*						{currentTest?.expectedOutcome?.toString() || "N/A"}*/}
				{/*					</p>*/}
				{/*				</div>*/}
				{/*				<div>*/}
				{/*					<p className="font-medium text-muted-foreground text-sm">*/}
				{/*						Actual*/}
				{/*					</p>*/}
				{/*					<p className="font-mono text-sm">*/}
				{/*						{testResult.finalOutcome?.toString()}*/}
				{/*					</p>*/}
				{/*				</div>*/}
				{/*			</div>*/}

				{/*			<div>*/}
				{/*				<p className="font-medium text-muted-foreground text-sm">*/}
				{/*					Final Node*/}
				{/*				</p>*/}
				{/*				<p className="text-sm">*/}
				{/*					{testResult.nodeName} ({testResult.nodeId})*/}
				{/*				</p>*/}
				{/*			</div>*/}

				{/*			<div>*/}
				{/*				<p className="font-medium text-muted-foreground text-sm">*/}
				{/*					Execution Path*/}
				{/*				</p>*/}
				{/*				<div className="mt-1 flex flex-wrap gap-1">*/}
				{/*					{testResult?.executionPath?.map((step) => (*/}
				{/*						<Badge key={step} variant="outline" className="text-xs">*/}
				{/*							{step}*/}
				{/*						</Badge>*/}
				{/*					))}*/}
				{/*				</div>*/}
				{/*			</div>*/}

				{/*			{testResult.errors && testResult.errors.length > 0 && (*/}
				{/*				<div>*/}
				{/*					<p className="font-medium text-muted-foreground text-sm">*/}
				{/*						Errors*/}
				{/*					</p>*/}
				{/*					<ul className="mt-1 list-inside list-disc">*/}
				{/*						{testResult.errors.map((error) => (*/}
				{/*							<li key={error} className="text-destructive text-sm">*/}
				{/*								{error}*/}
				{/*							</li>*/}
				{/*						))}*/}
				{/*					</ul>*/}
				{/*				</div>*/}
				{/*			)}*/}
				{/*		</div>*/}
				{/*	</div>*/}
				{/*)}*/}
			</div>
		</Card>
	);
}
