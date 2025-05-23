"use client";

import { useState } from "react";
import { Editor } from "~/components/editor/editor";
import { ScenarioForm } from "~/components/editor/scenario/form";
import { ScenarioList } from "~/components/editor/scenario/list";
import { SchemaBuilder } from "~/components/editor/schema/builder";

interface Scenario {
	id: string;
	name: string;
	// biome-ignore lint/suspicious/noExplicitAny: stuff
	data: any;
	createdAt: Date;
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
	const [plainText, setPlainText] = useState(
		"# Driving Test Rules\nA **Person** gets a full driving license\n if the __age__ of the **Person** is greater than or equal to 17\n and the **Person** passes the practical driving test\n and the **Person** passes the eye test.\n\nA **Person** passes the practical driving test\n if the __driving test score__ of the **Person** is greater than or equal to 60.",
	);

	const createNewScenario = () => {
		const newScenario: Scenario = {
			id: Date.now().toString(),
			name: `Scenario ${scenarios.length + 1}`,
			data: {},
			createdAt: new Date(),
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

	const deleteScenario = (scenarioId: string) => {
		setScenarios(scenarios.filter((s) => s.id !== scenarioId));
		if (currentScenario?.id === scenarioId) {
			setCurrentScenario(null);
		}
	};

	return (
		<div className="flex h-screen flex-col bg-zinc-900 text-zinc-100">
			<header className="border-zinc-700 border-b p-4">
				<h1 className="font-bold text-xl">Policy Maker</h1>
			</header>

			<main className="grid flex-1 grid-cols-2 grid-rows-2 gap-1 p-1">
				<div className="flex flex-col overflow-hidden rounded-md border border-zinc-700 bg-zinc-800">
					<div className="bg-zinc-700 px-4 py-2 font-medium text-sm">
						Policy Text
					</div>
					<div className="flex-1 overflow-auto p-4">
						<Editor text={plainText} onChange={setPlainText} />
					</div>
				</div>

				<div className="flex flex-col overflow-hidden rounded-md border border-zinc-700 bg-zinc-800">
					<div className="flex items-center justify-between bg-zinc-700 px-4 py-2 font-medium text-sm">
						<span>Scenarios</span>
						{/* biome-ignore lint/a11y/useButtonType: stuff */}
						<button
							onClick={createNewScenario}
							className="rounded bg-blue-600 px-2 py-1 text-xs hover:bg-blue-700"
							disabled={Object.keys(schema.properties).length === 0}
						>
							New Scenario
						</button>
					</div>
					<div className="flex-1 overflow-auto">
						<ScenarioList
							scenarios={scenarios}
							currentScenario={currentScenario}
							onSelectScenario={selectScenario}
							onDeleteScenario={deleteScenario}
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
						Scenario Form
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
