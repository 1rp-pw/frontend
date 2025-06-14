"use client";

import { Play, Save } from "lucide-react";
import { Button } from "~/components/ui/button";
import type { FlowValidationResult } from "~/lib/utils/flow-validation";

interface FlowHeaderProps {
	name: string;
	id: string | null;
	isLoading: boolean;
	isSaveDisabled: boolean | null;
	isTestRunning: boolean;
	error: string | null;
	validationResult: FlowValidationResult | null;
	onNameChange: (name: string) => void;
	onLoadFlow: (flowId: string) => void;
	onTestFlow: () => void;
	onSaveFlow: () => void;
	onNewFlow: () => void;
}

export function FlowHeader({
	isLoading,
	isSaveDisabled,
	isTestRunning,
	error,
	validationResult,
	onTestFlow,
	onSaveFlow,
	onNewFlow,
}: FlowHeaderProps) {
	const saveDisabled = isSaveDisabled === null ? false : isSaveDisabled;

	return (
		<header className="flex border-border border-b bg-card px-6 py-4">
			<div className="flex w-full items-center justify-between">
				<div className="flex items-center gap-4">
					<h1 className="font-bold text-xl">Flow Editor</h1>
				</div>
				<div className="flex items-center gap-2">
					<Button
						onClick={onTestFlow}
						variant="outline"
						size="sm"
						disabled={isTestRunning}
					>
						<Play className="mr-2 h-4 w-4" />
						{isTestRunning ? "Testing..." : "Test Flow"}
					</Button>
					<Button
						onClick={onSaveFlow}
						variant="default"
						size="sm"
						disabled={saveDisabled}
						title={
							validationResult && !validationResult.isValid
								? validationResult.errors.join("\n")
								: "Save flow"
						}
					>
						<Save className="mr-2 h-4 w-4" />
						{isLoading ? "Saving..." : "Save Flow"}
					</Button>
					<Button onClick={onNewFlow} variant="secondary" size="sm">
						New Flow
					</Button>
				</div>
			</div>
			{(error || (validationResult && !validationResult.isValid)) && (
				<FlowValidationStatus
					error={error}
					validationResult={validationResult}
				/>
			)}
		</header>
	);
}

export function FlowValidationStatus({
	error,
	validationResult,
}: {
	error: string | null;
	validationResult: FlowValidationResult | null;
}) {
	return (
		<div className="mt-2 flex flex-col gap-1">
			{error && <div className="text-destructive text-sm">Error: {error}</div>}
			{validationResult && !validationResult.isValid && (
				<div className="text-sm text-warning">
					<strong>Validation Issues:</strong>
					<ul className="mt-1 list-inside list-disc">
						{validationResult.errors.map((err, index) => {
							const i = index;
							return (
								<li key={i} className="text-xs">
									{err}
								</li>
							);
						})}
					</ul>
				</div>
			)}
		</div>
	);
}
