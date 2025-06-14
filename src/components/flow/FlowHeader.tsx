"use client";

import { FolderOpen, Play, Save } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import type { FlowValidationResult } from "~/lib/utils/flow-validation";

interface FlowHeaderProps {
	name: string;
	id: string | null;
	flows: Array<{ id: string; name: string }>;
	isLoading: boolean;
	isSaveDisabled: boolean | null;
	isTestRunning: boolean;
	error: string | null;
	validationResult: FlowValidationResult | null;
	onNameChange: (name: string) => void;
	onLoadFlow: (flowId: string) => void;
	onSearchFlows: () => void;
	onTestFlow: () => void;
	onSaveFlow: () => void;
	onNewFlow: () => void;
}

export function FlowHeader({
	name,
	id,
	flows,
	isLoading,
	isSaveDisabled,
	isTestRunning,
	error,
	validationResult,
	onNameChange,
	onLoadFlow,
	onSearchFlows,
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
					<div className="flex items-center gap-2">
						<Label htmlFor="flow-name" className="font-medium text-sm">
							Name:
						</Label>
						<Input
							id="flow-name"
							value={name}
							onChange={(e) => onNameChange(e.target.value)}
							placeholder="Flow name"
							className="w-48 text-sm"
						/>
					</div>
					{id && <div className="text-muted-foreground text-sm">ID: {id}</div>}
				</div>
				<div className="flex items-center gap-2">
					<div className="flex items-center gap-2">
						<Label htmlFor="load-flow" className="font-medium text-sm">
							Load:
						</Label>
						<Select onValueChange={onLoadFlow}>
							<SelectTrigger id="load-flow" className="w-48 text-sm">
								<SelectValue placeholder="Select flow..." />
							</SelectTrigger>
							<SelectContent>
								{flows.map((flow) => (
									<SelectItem key={flow.id} value={flow.id}>
										{flow.name}
									</SelectItem>
								))}
								{flows.length === 0 && (
									<SelectItem value="no-flows" disabled>
										No flows found
									</SelectItem>
								)}
							</SelectContent>
						</Select>
						<Button onClick={onSearchFlows} variant="outline" size="sm">
							<FolderOpen className="h-4 w-4" />
						</Button>
					</div>
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
