"use client";

import { FilePlusIcon, PlayIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Editor } from "~/components/editor/editor";
import { SavePolicy } from "~/components/editor/save";
import { SchemaBuilder } from "~/components/editor/schema/builder";
import { TestForm } from "~/components/editor/test/form";
import { TestList } from "~/components/editor/test/list";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { usePolicyStore } from "~/lib/state/policy";

export default function Maker({ policy_id }: { policy_id: string }) {
	const {
		schema,
		tests,
		currentTest,
		name,
		rule,
		isLoading,
		error,
		setSchema,
		setPolicyRule,
		createTest,
		saveTest,
		selectTest,
		deleteTest,
		runTest,
		repairTest,
		runAllTests,
		getPolicy,
	} = usePolicyStore();

	// Check if all tests have been run and passed
	const createdTests = tests.filter((test) => test.created);
	const allTestsPassed =
		createdTests.length > 0 &&
		createdTests.every(
			(test) => test.outcome.ran && test.outcome.status === "passed",
		);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const loadPolicy = async () => {
			await getPolicy(policy_id);
		};
		loadPolicy();
	}, [policy_id]);

	if (isLoading) {
		return (
			<div className="flex h-screen flex-col bg-zinc-900 text-zinc-100">
				<div className="flex flex-1 items-center justify-center">
					<Skeleton />
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex h-screen flex-col bg-zinc-900 text-zinc-100">
				<div className="flex flex-1 items-center justify-center">
					Something has gone wrong {error}
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-screen flex-col bg-zinc-900 text-zinc-100">
			<header className="flex border-zinc-700 border-b p-4">
				<h1 className="font-bold text-xl">{name}</h1>
				<div className={"ml-auto flex items-center gap-1"}>
					<SavePolicy />
					{!allTestsPassed ? (
						<Tooltip>
							<TooltipTrigger asChild>
								<span>
									<Button
										disabled={!allTestsPassed}
										className={
											!allTestsPassed ? "cursor-not-allowed opacity-50" : ""
										}
									>
										Publish Policy
									</Button>
								</span>
							</TooltipTrigger>
							<TooltipContent>
								<p>All tests must be run and passed before publishing</p>
							</TooltipContent>
						</Tooltip>
					) : (
						<Button>Publish Policy</Button>
					)}
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
							newImportAllowed={false}
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
