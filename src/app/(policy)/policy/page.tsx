"use client";

import { FilePlusIcon, PlayIcon } from "lucide-react";
import { useEffect } from "react";
import { Editor } from "~/components/editor/editor";
import { SavePolicy } from "~/components/editor/save";
import { SchemaBuilder } from "~/components/editor/schema/builder";
import { TestForm } from "~/components/editor/test/form";
import { TestList } from "~/components/editor/test/list";
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
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

			<main className="grid flex-1 grid-cols-2 grid-rows-[1fr_1fr] gap-1 overflow-auto p-1">
				<div className="flex flex-col overflow-hidden rounded-md border border-zinc-700 bg-zinc-800">
					<div className="bg-zinc-700 px-4 py-2 font-medium text-sm">
						Policy Text
					</div>
					<div className="flex-1 overflow-auto p-4">
						<Editor rule={rule} onChange={setPolicyRule} />
					</div>
				</div>

				<div className="flex flex-col overflow-hidden rounded-md border border-zinc-700 bg-zinc-800">
					<div className="bg-zinc-700 px-4 py-2 font-medium text-sm">
						Test Editor
					</div>
					<div className="flex-1 overflow-auto p-4">
						{currentTest ? (
							<TestForm
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
			</main>
		</div>
	);
}
