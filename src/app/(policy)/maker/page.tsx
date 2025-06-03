"use client";

import { FilePlusIcon, PlayIcon } from "lucide-react";
import { Editor } from "~/components/editor/editor";
import { TestForm } from "~/components/editor/test/form";
import { TestList } from "~/components/editor/test/list";
import { SchemaBuilder } from "~/components/editor/schema/builder";
import { Button } from "~/components/ui/button";
import { useTestStore } from "~/lib/state/maker";

interface Outcome {
	passed: boolean;
	ran: boolean;
}
interface Test {
	id: string;
	name: string;
	data: object;
	createdAt: Date;
	outcome: Outcome;
}

async function runTestLive(
	test: Test,
	schema: object,
	policyText: string,
) {
	test.outcome.ran = true;

	try {
		const dataSet = {
			data: test.data,
			rule: policyText,
		};

		const response = await fetch("/api/test", {
			method: "POST",
			body: JSON.stringify(dataSet),
		});

		if (!response.ok) {
			test.outcome.passed = false;
		}

		const resp = await response.json();
		console.info("response", resp);

		test.outcome.passed = resp.result === true;
	} catch (e) {
		test.outcome.ran = false;
	}
}

export default function IDEPage() {
	const {
		schema,
		tests,
		currentTest,
		policyText,
		setSchema,
		setPolicyText,
		createTest,
		saveTest,
		selectTest,
		deleteTest,
		runTest,
		repairTest,
		runAllTests,
	} = useTestStore();

	// @ts-ignore
	// @ts-ignore
	return (
		<div className="flex h-screen flex-col bg-zinc-900 text-zinc-100">
			<header className="flex border-zinc-700 border-b p-4">
				<h1 className="font-bold text-xl">Policy Maker</h1>
				<div className={"ml-auto flex items-center gap-1"}>
					<Button className={"rounded text-sm"}>Save Policy</Button>
				</div>
			</header>

			<main className="grid flex-1 grid-cols-2 grid-rows-[1fr_1fr] gap-1 overflow-auto p-1">
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
						Test Editor
					</div>
					<div className="flex-1 overflow-auto p-4">
						{currentTest ? (
							<TestForm
								schema={schema}
								currentTest={currentTest}
								onSaveTest={saveTest}
							/>
						): (
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
						<SchemaBuilder schema={schema} setSchema={setSchema} />
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
