"use client";

import {
	CircleAlertIcon,
	CircleCheckIcon,
	CircleXIcon,
	FileTextIcon,
	Loader2Icon,
	PlayIcon,
	RefreshCwIcon,
	TrashIcon,
	TriangleAlertIcon,
	CheckIcon,
	XIcon,
} from "lucide-react";
import { useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import type { Scenario, ScenarioStatus } from "~/lib/state/maker";

interface ScenarioListProps {
	scenarios: Scenario[];
	currentScenario: Scenario | null;
	onSelectScenario: (scenario: Scenario) => void;
	onDeleteScenario: (scenarioId: string) => void;
	onRunScenario: (scenarioId: string) => Promise<void>;
	onRepairScenario: (scenarioId: string) => void;
}

export function ScenarioList({
															 scenarios,
															 currentScenario,
															 onSelectScenario,
															 onDeleteScenario,
															 onRunScenario,
															 onRepairScenario,
														 }: ScenarioListProps) {
	const [scenarioInfo, setScenarioInfo] = useState<Scenario | null>();
	const [deleteScenarioDialogOpen, setDeleteScenarioDialogOpen] =
		useState(false);

	const handleDeleteScenario = (scenario: Scenario | null) => {
		setScenarioInfo(scenario);
		setDeleteScenarioDialogOpen(true);
	};

	const confirmDeleteScenario = () => {
		if (scenarioInfo === null) {
			return;
		}
		const scenarioId = scenarioInfo?.id || "";

		setDeleteScenarioDialogOpen(false);
		onDeleteScenario(scenarioId);
	};

	const getStatusIcon = (status: ScenarioStatus) => {
		switch (status) {
			case "not-run":
				return <CircleAlertIcon className="h-5 w-5 text-zinc-400" />;
			case "running":
				return <Loader2Icon className="h-5 w-5 animate-spin text-blue-400" />;
			case "passed":
				return <CircleCheckIcon className="h-5 w-5 text-green-400" />;
			case "failed":
				return <CircleXIcon className="h-5 w-5 text-red-400" />;
			case "invalid":
				return <TriangleAlertIcon className="h-5 w-5 text-amber-400" />;
		}
	};

	const getStatusBadge = (status: ScenarioStatus) => {
		switch (status) {
			case "not-run":
				return (
					<Badge variant={"secondary"} className={"text-xs"}>
						Not Run
					</Badge>
				);
			case "running":
				return (
					<Badge
						variant={"secondary"}
						className={"bg-blue-500/20 text-blue-300 text-xs"}
					>
						Running
					</Badge>
				);
			case "passed":
				return (
					<Badge
						variant={"secondary"}
						className={"bg-green-500/20 text-green-300 text-xs"}
					>
						Passed
					</Badge>
				);
			case "failed":
				return (
					<Badge
						variant={"secondary"}
						className={"bg-red-500/20 text-red-300 text-xs"}
					>
						Failed
					</Badge>
				);
			case "invalid":
				return (
					<Badge
						variant={"secondary"}
						className={"bg-amber-500/20 text-amber-300 text-xs"}
					>
						Invalid
					</Badge>
				);
		}
	};

	const getExpectPassBadge = (expectPass: boolean) => {
		return expectPass ? (
			<Badge
				variant="outline"
				className="text-xs border-green-500/30 bg-green-500/10 text-green-400"
				title="Expects test to pass"
			>
				<CheckIcon className="h-3 w-3 mr-1" />
				Expect Pass
			</Badge>
		) : (
			<Badge
				variant="outline"
				className="text-xs border-red-500/30 bg-red-500/10 text-red-400"
				title="Expects test to fail"
			>
				<XIcon className="h-3 w-3 mr-1" />
				Expect Fail
			</Badge>
		);
	};

	const validScenarios = scenarios.filter(
		(s) => s.outcome.status !== "invalid",
	);
	const invalidScenarios = scenarios.filter(
		(s) => s.outcome.status === "invalid",
	);

	if (scenarios.length === 0) {
		return (
			<div className="p-4 text-center text-zinc-500">
				<FileTextIcon className="mx-auto mb-2 h-8 w-8 opacity-50" />
				<p className="text-sm">No scenarios created yet</p>
				<p className="mt-1 text-xs">
					Build a schema first, then create a new scenario
				</p>
			</div>
		);
	}

	const renderScenario = (scenario: Scenario) => (
		<li
			key={scenario.id}
			className={`cursor-pointer px-4 py-3 hover:bg-zinc-700 ${
				currentScenario?.id === scenario.id ? "bg-zinc-700" : ""
			}`}
			onClick={() => onSelectScenario(scenario)}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onSelectScenario(scenario);
				}
			}}
		>
			<div className="flex items-center justify-between">
				<div className="flex flex-1 items-center gap-2">
					<FileTextIcon className="h-4 w-4 text-zinc-400" />
					<div className="flex-1">
						<div className="flex items-center gap-2 flex-wrap">
							<span className="font-medium text-sm">{scenario.name}</span>
							{getStatusBadge(scenario.outcome.status || "not-run")}
							{getExpectPassBadge(scenario.expectPass)}
						</div>
						<div className="text-xs text-zinc-500">
							{scenario.createdAt.toLocaleDateString()}{" "}
							{scenario.createdAt.toLocaleTimeString()}
						</div>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{getStatusIcon(scenario.outcome.status || "not-run")}

					{scenario.outcome.status === "invalid" && onRepairScenario ? (
						<Button
							variant="ghost"
							size="icon"
							onClick={(e) => {
								e.stopPropagation();
								onRepairScenario(scenario.id);
							}}
							className="h-6 w-6 text-zinc-400 hover:text-amber-400"
							title="Repair scenario to match current schema"
						>
							<RefreshCwIcon className="h-4 w-4" />
						</Button>
					) : (
						<Button
							variant="ghost"
							size="icon"
							onClick={(e) => {
								e.stopPropagation();
								onRunScenario(scenario.id);
							}}
							className="h-6 w-6 text-zinc-400 hover:text-green-400"
							disabled={
								scenario.outcome.status === "running" ||
								scenario.outcome.status === "invalid"
							}
							title={
								scenario.outcome.status === "invalid"
									? "Repair scenario first"
									: "Run scenario"
							}
						>
							<PlayIcon className="h-4 w-4" />
						</Button>
					)}

					<Button
						variant="ghost"
						size="icon"
						className="h-6 w-6 text-zinc-400 hover:text-red-400"
						onClick={(e) => {
							e.stopPropagation();
							handleDeleteScenario(scenario);
						}}
						disabled={scenario.outcome.status === "running"}
					>
						<TrashIcon className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</li>
	);

	return (
		<div className={"w-full"}>
			{validScenarios.length > 0 && (
				<div>
					<ul className={"divide-y divide-zinc-700"}>
						{validScenarios.map(renderScenario)}
					</ul>
				</div>
			)}
			{invalidScenarios.length > 0 && (
				<div className={"mt-4"}>
					<div
						className={
							"flex items-center gap-2 border-amber-500/20 border-t bg-amber-500/10 px-4 py-2"
						}
					>
						<TriangleAlertIcon className="h-4 w-4" />
						<span className={"font-medium text-amber-300 text-sm"}>
							Schema Changed - Scenarios need repair
						</span>
					</div>
					<ul className={"divide-y divide-zinc-700"}>
						{invalidScenarios.map(renderScenario)}
					</ul>
				</div>
			)}

			<AlertDialog open={deleteScenarioDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="text-sm">
							Are you sure you want to delete ?
						</AlertDialogTitle>
						<AlertDialogDescription>
							Delete {scenarioInfo?.name}?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							onClick={() => setDeleteScenarioDialogOpen(false)}
							className={"cursor-pointer"}
						>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDeleteScenario}
							className={"cursor-pointer"}
						>
							Confirm
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}