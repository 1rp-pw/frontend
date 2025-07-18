"use client";

import { FilePlusIcon, PlayIcon } from "lucide-react";
import { useEffect } from "react";
import { Editor } from "~/components/policy/editor";
import { SavePolicy } from "~/components/policy/save";
import { SchemaBuilder } from "~/components/policy/schema/builder";
import { TestList } from "~/components/policy/test/list";
import { TabbedTestForm } from "~/components/policy/test/tabbed-form";
import { Button } from "~/components/ui/button";
import { usePolicyStore } from "~/lib/state/policy";

export default function IDEPage() {
	const {
		schema,
		tests,
		currentTest,
		rule,
		setSchema,
		setPolicyRule,
		createTest,
		saveTest,
		selectTest,
		deleteTest,
		runTest,
		repairTest,
		runAllTests,
		reset,
	} = usePolicyStore();

	// biome-ignore lint/correctness/useExhaustiveDependencies: at launch
	useEffect(() => {
		reset();
	}, []);

	return (
		<div className="flex h-screen flex-col bg-zinc-900 text-zinc-100">
			<header className="flex border-zinc-700 border-b p-4">
				<h1 className="font-bold text-xl">Policy Maker</h1>
				<div className={"ml-auto flex items-center gap-1"}>
					<SavePolicy />
				</div>
			</header>

			<main className="grid flex-1 grid-cols-2 gap-1 overflow-hidden p-1">
				{/* Left Column - Equal heights */}
				<div className="grid grid-rows-2 gap-1 overflow-hidden">
					<div className="flex flex-col overflow-hidden rounded-md border border-zinc-700 bg-zinc-800">
						<div className="flex items-center justify-between bg-zinc-700 px-4 py-2">
							<span className="font-medium text-sm">Policy Text</span>
							<span className="text-xs text-zinc-400">
								Ctrl+G to go to line
							</span>
						</div>
						<div className="flex-1 overflow-hidden">
							<Editor rule={rule} onChange={setPolicyRule} />
						</div>
					</div>

					<div className="flex flex-col overflow-hidden rounded-md border border-zinc-700 bg-zinc-800">
						<div className="bg-zinc-700 px-4 py-2 font-medium text-sm">
							Schema Builder
						</div>
						<div className="flex-1 overflow-auto p-4">
							<SchemaBuilder
								schema={schema}
								setSchema={setSchema}
								newImportAllowed={true}
							/>
						</div>
					</div>
				</div>

				{/* Right Column - Test Editor taller, Test List shorter */}
				<div className="grid grid-rows-[2.4fr_1fr] gap-1 overflow-hidden">
					<div className="flex flex-col overflow-hidden rounded-md border border-zinc-700 bg-zinc-800">
						<div className="bg-zinc-700 px-4 py-2 font-medium text-sm">
							Test Editor
						</div>
						<div className="flex-1 overflow-auto p-4">
							{currentTest ? (
								<TabbedTestForm
									schema={schema}
									currentTest={currentTest}
									onSaveTest={saveTest}
								/>
							) : (
								<div className={"content-around object-center text-center"}>
									Select a test or create a new one
								</div>
							)}
						</div>
					</div>

					<div className="flex flex-col overflow-hidden rounded-md border border-zinc-700 bg-zinc-800">
						<div className="flex items-center justify-between bg-zinc-700 px-4 py-2 font-medium text-sm">
							<span>Tests</span>
							<Button
								variant={"secondary"}
								onClick={runAllTests}
								className={"rounded px-2 py-1 text-xs"}
								disabled={tests.length === 0}
							>
								<PlayIcon />
								Run All
							</Button>
							<Button
								variant="secondary"
								onClick={createTest}
								className="rounded px-2 py-1 text-xs"
								disabled={Object.keys(schema.properties).length === 0}
							>
								<FilePlusIcon />
								New Test
							</Button>
						</div>
						<div className="flex-1 overflow-auto">
							<TestList
								tests={tests}
								currentTest={currentTest}
								onSelectTest={selectTest}
								onDeleteTest={deleteTest}
								onRunTest={runTest}
								onRepairTest={repairTest}
							/>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
