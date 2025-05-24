"use client";

import {
	CircleAlertIcon,
	CircleCheckIcon,
	CircleXIcon,
	FileTextIcon,
	Loader2Icon,
	PlayIcon,
	TrashIcon,
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
import { Button } from "~/components/ui/button";
import type { Scenario, ScenarioStatus } from "~/lib/state/maker";

interface ScenarioListProps {
	scenarios: Scenario[];
	currentScenario: Scenario | null;
	onSelectScenario: (scenario: Scenario) => void;
	onDeleteScenario: (scenarioId: string) => void;
	onRunScenario: (scenarioId: string) => Promise<void>;
}

export function ScenarioList({
	scenarios,
	currentScenario,
	onSelectScenario,
	onDeleteScenario,
	onRunScenario,
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
		}
	};

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

	return (
		<div className="w-full">
			<ul className="divide-y divide-zinc-700">
				{scenarios.map((scenario) => (
					<li
						key={scenario.id}
						className={`cursor-pointer px-4 py-3 hover:bg-zinc-700 ${
							currentScenario?.id === scenario.id ? "bg-zinc-700" : ""
						}`}
						onClick={() => onSelectScenario(scenario)}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault(); // Prevent scrolling when space is pressed
								onSelectScenario(scenario);
							}
						}}
					>
						<div className="flex items-center justify-between">
							<div className="flex flex-1 items-center gap-2">
								<FileTextIcon className="h-4 w-4 text-zinc-400" />
								<div className="flex-1">
									<span className="font-medium text-sm">{scenario.name}</span>
									<div className="text-xs text-zinc-500">
										{scenario.createdAt.toLocaleDateString()}{" "}
										{scenario.createdAt.toLocaleTimeString()}
									</div>
								</div>
							</div>
							<div className="flex items-center gap-2">
								{getStatusIcon(scenario.outcome.status || "not-run")}
								<Button
									variant={"ghost"}
									size={"icon"}
									onClick={(e) => {
										e.stopPropagation();
										onRunScenario(scenario.id);
									}}
									className={"h-6 w-6 text-zinc-400 hover:text-green-400"}
									disabled={scenario.outcome.status === "running"}
								>
									<PlayIcon />
								</Button>
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
									<TrashIcon />
								</Button>
							</div>
						</div>
					</li>
				))}
			</ul>

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
