"use client";

import { Editor } from "~/components/editor/editor";
import { ScenarioForm } from "~/components/editor/scenario/form";
import { ScenarioList } from "~/components/editor/scenario/list";
import { SchemaBuilder } from "~/components/editor/schema/builder";
import { Button } from "~/components/ui/button";
import { useScenarioStore } from "~/lib/state/maker";

interface Outcome {
	passed: boolean;
	ran: boolean;
}
interface Scenario {
	id: string;
	name: string;
	data: object;
	createdAt: Date;
	outcome: Outcome;
}

async function runScenarioLive(
	scenario: Scenario,
	schema: object,
	policyText: string,
) {
	scenario.outcome.ran = true;

	try {
		const dataSet = {
			data: scenario.data,
			rule: policyText,
		};

		const response = await fetch("/api/scenario", {
			method: "POST",
			body: JSON.stringify(dataSet),
		});

		if (!response.ok) {
			scenario.outcome.passed = false;
		}

		const resp = await response.json();
		console.info("response", resp);

		scenario.outcome.passed = resp.result === true;
	} catch (e) {
		scenario.outcome.ran = false;
	}
}

export default function IDEPage() {
	const {
		schema,
		scenarios,
		currentScenario,
		policyText,
		setSchema,
		setPolicyText,
		createScenario,
		saveScenario,
		selectScenario,
		deleteScenario,
		runScenario,
		repairScenario,
		// runAllScenarios
	} = useScenarioStore();

	return (
		<div className="flex h-screen flex-col bg-zinc-900 text-zinc-100">
			<header className="flex border-zinc-700 border-b p-4">
				<h1 className="font-bold text-xl">Policy Maker</h1>
				<div className={"ml-auto flex items-center gap-1"}>
					<Button className={"rounded text-sm"}>Save Policy</Button>
				</div>
			</header>

			<main className="grid flex-1 grid-cols-2 grid-rows-2 gap-1 p-1">
				<div className="flex flex-col overflow-hidden rounded-md border border-zinc-700 bg-zinc-800">
					<div className="bg-zinc-700 px-4 py-2 font-medium text-sm">
						Policy Text
					</div>
					<div className="flex-1 overflow-auto p-4">
						<Editor text={policyText} onChange={setPolicyText} />
					</div>
				</div>

				<div className="flex flex-col overflow-hidden rounded-md border border-zinc-700 bg-zinc-800">
					<div className="bg-zinc-700 px-4 py-2 font-medium text-sm">
						Scenario Editor
					</div>
					<div className="flex-1 overflow-auto p-4">
						<ScenarioForm
							schema={schema}
							currentScenario={currentScenario}
							onSaveScenario={saveScenario}
						/>
					</div>
				</div>

				<div className="flex flex-col overflow-hidden rounded-md border border-zinc-700 bg-zinc-800">
					<div className="bg-zinc-700 px-4 py-2 font-medium text-sm">
						Schema Builder
					</div>
					<div className="flex-1 overflow-auto p-4">
						<SchemaBuilder schema={schema} setSchema={setSchema} />
					</div>
				</div>

				<div className="flex flex-col overflow-hidden rounded-md border border-zinc-700 bg-zinc-800">
					<div className="flex items-center justify-between bg-zinc-700 px-4 py-2 font-medium text-sm">
						<span>Scenarios</span>
						<Button
							variant="secondary"
							onClick={createScenario}
							className="rounded px-2 py-1 text-xs"
							disabled={Object.keys(schema.properties).length === 0}
						>
							New Scenario
						</Button>
					</div>
					<div className="flex-1 overflow-auto">
						<ScenarioList
							scenarios={scenarios}
							currentScenario={currentScenario}
							onSelectScenario={selectScenario}
							onDeleteScenario={deleteScenario}
							onRunScenario={runScenario}
							onRepairScenario={repairScenario}
						/>
					</div>
				</div>
			</main>
		</div>
	);
}
