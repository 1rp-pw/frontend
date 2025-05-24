"use client";

import { useState } from "react";
import { Editor } from "~/components/editor/editor";
import { ScenarioForm } from "~/components/editor/scenario/form";
import { ScenarioList } from "~/components/editor/scenario/list";
import { SchemaBuilder } from "~/components/editor/schema/builder";
import { Button } from "~/components/ui/button";
import {Outdent} from "lucide-react";

interface Outcome {
	passed: boolean;
	ran: boolean;
}
interface Scenario {
	id: string;
	name: string;
	// biome-ignore lint/suspicious/noExplicitAny: stuff
	data: any;
	createdAt: Date;
	outcome: Outcome;
}

// biome-ignore lint/suspicious/noExplicitAny: schema could be anything
async function runScenarioLive(scenario: Scenario, schema: any, policyText: string) {
	scenario.outcome.ran = true;

	try {
		const dataSet = {
			data: scenario.data,
			rule: policyText
		}

		const response = await fetch("/api/scenario", {
			method: "POST",
			body: JSON.stringify(dataSet),
		})

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
	// biome-ignore lint/suspicious/noExplicitAny: stuff
	const [schema, setSchema] = useState<any>({
		type: "object",
		properties: {},
		required: [],
	});

	const [scenarios, setScenarios] = useState<Scenario[]>([]);
	const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
	const [policyText, setPolicyText] = useState(
		"# Driving Test Rules\nA **Person** gets a full driving license\n if the __age__ of the **Person** is greater than or equal to 17\n and the **Person** passes the practical driving test\n and the **Person** passes the eye test.\n\nA **Person** passes the practical driving test\n if the __driving test score__ of the **Person** is greater than or equal to 60.",
	);

	const createNewScenario = () => {
		const newScenario: Scenario = {
			id: Date.now().toString(),
			name: `Scenario ${scenarios.length + 1}`,
			data: {},
			createdAt: new Date(),
			outcome: {
				passed: false,
				ran: false,
			}
		};
		setCurrentScenario(newScenario);
	};

	// biome-ignore lint/suspicious/noExplicitAny: stuff
	const saveScenario = (scenarioData: any, name?: string) => {
		if (currentScenario) {
			const updatedScenario = {
				...currentScenario,
				data: scenarioData,
				name: name || currentScenario.name,
			};

			const existingIndex = scenarios.findIndex(
				(s) => s.id === currentScenario.id,
			);
			if (existingIndex >= 0) {
				const updatedScenarios = [...scenarios];
				updatedScenarios[existingIndex] = updatedScenario;
				setScenarios(updatedScenarios);
			} else {
				setScenarios([...scenarios, updatedScenario]);
			}
			setCurrentScenario(updatedScenario);
		}
	};

	const selectScenario = (scenario: Scenario) => {
		setCurrentScenario(scenario);
	};

	const runScenario = (scenario: Scenario) => {
		runScenarioLive(scenario, schema, policyText);
	}

	const deleteScenario = (scenarioId: string) => {
		setScenarios(scenarios.filter((s) => s.id !== scenarioId));
		if (currentScenario?.id === scenarioId) {
			setCurrentScenario(null);
		}
	};

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
					<div className="flex items-center justify-between bg-zinc-700 px-4 py-2 font-medium text-sm">
						<span>Scenarios</span>
						<Button
							variant="secondary"
							onClick={createNewScenario}
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
			</main>
		</div>
	);
}
