"use client";

import { Loader2, Play, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { JsonEditor } from "~/components/ui/json-editor";
import { Label } from "~/components/ui/label";
import type { FlowTest } from "~/lib/types";

interface FlowTestPanelProps {
	testData: string;
	currentTest: FlowTest | null;
	isRunning: boolean;
	testResult: {
		result: boolean | string;
		finalOutcome: boolean | string;
		executionPath: string[];
		nodeResponses: Array<{
			nodeId: string;
			nodeType: string;
			response: {
				result: boolean | string;
				trace?: unknown;
				rule?: string[];
				data?: unknown;
				error?: string | null;
			};
		}>;
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
			} catch (_) {
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
							name="test-name"
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
							name="expected-outcome"
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
					<JsonEditor
						value={testData}
						onChange={handleDataChange}
						placeholder='{\n  "example": "data",\n  "nested": {\n    "value": 123\n  }\n}'
						className="flex-1"
					/>
				</div>

				{error && (
					<div className="rounded-md border border-destructive/20 bg-destructive/10 p-3">
						<p className="text-destructive text-sm">{error}</p>
					</div>
				)}
			</div>
		</Card>
	);
}
