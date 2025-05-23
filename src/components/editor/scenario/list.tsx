"use client";

import { FileTextIcon, PlayIcon, TrashIcon } from "lucide-react";
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

interface Scenario {
	id: string;
	name: string;
	// biome-ignore lint/suspicious/noExplicitAny: it could be any data since its generated
	data: any;
	createdAt: Date;
}

interface ScenarioListProps {
	scenarios: Scenario[];
	currentScenario: Scenario | null;
	onSelectScenario: (scenario: Scenario) => void;
	onDeleteScenario: (scenarioId: string) => void;
}

export function ScenarioList({
	scenarios,
	currentScenario,
	onSelectScenario,
	onDeleteScenario,
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
					// biome-ignore lint/a11y/useKeyWithClickEvents: just makes it easier
					<li
						key={scenario.id}
						className={`cursor-pointer px-4 py-3 hover:bg-zinc-700 ${
							currentScenario?.id === scenario.id ? "bg-zinc-700" : ""
						}`}
						onClick={() => onSelectScenario(scenario)}
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
							<Button
								variant={"ghost"}
								size={"icon"}
								onClick={(e) => {
									e.stopPropagation();
								}}
								className={
									"h-6 w-6 cursor-pointer text-zinc-400 hover:text-green-400"
								}
							>
								<PlayIcon />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="h-6 w-6 cursor-pointer text-zinc-400 hover:text-red-400"
								onClick={() => handleDeleteScenario(scenario)}
							>
								<TrashIcon />
							</Button>
						</div>
					</li>
				))}
			</ul>

			<AlertDialog open={deleteScenarioDialogOpen} onClose={onDeleteScenario}>
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
