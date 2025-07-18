"use client";

import { ArrowBigLeft, CopyIcon, FilePlusIcon, PlayIcon } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";
import { Editor } from "~/components/policy/editor";
import { PublishPolicy } from "~/components/policy/publish";
import { SavePolicy } from "~/components/policy/save";
import { SchemaBuilder } from "~/components/policy/schema/builder";
import { TestList } from "~/components/policy/test/list";
import { TabbedTestForm } from "~/components/policy/test/tabbed-form";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
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
		policySpec,
	} = usePolicyStore();

	// Check if all tests have been run and passed
	const createdTests = tests.filter((test) => test.created);
	const _allTestsPassed =
		createdTests.length > 0 &&
		createdTests.every(
			(test) => test.outcome.ran && test.outcome.status === "passed",
		);

	// biome-ignore lint/correctness/useExhaustiveDependencies: dont need others
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
				<div className="flex items-center gap-2">
					{policySpec?.baseId && (
						<Button variant={"outline"} size={"sm"} asChild>
							<Link href={`/policy/${policySpec?.baseId}`}>
								<ArrowBigLeft className={"h-4 w-4"} />
							</Link>
						</Button>
					)}
					<h1 className="font-bold text-xl">{name}</h1>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							navigator.clipboard.writeText(policy_id).then(() => {
								toast("Policy ID copied to clipboard", {});
							});
						}}
						className="h-7 px-2"
						title="Copy Policy ID"
					>
						<CopyIcon className="h-3 w-3" />
					</Button>
				</div>
				<div className={"ml-auto flex items-center gap-1"}>
					<SavePolicy />
					<PublishPolicy />
				</div>
			</header>

			<main className="grid flex-1 grid-cols-2 gap-1 overflow-hidden p-1">
				<div className="grid grid-rows-2 gap-1 overflow-hidden">
					<div className="flex flex-col overflow-hidden rounded-md border border-zinc-700 bg-zinc-800">
						<div className="flex items-center justify-between bg-zinc-700 px-4 py-2">
							<span className="font-medium text-sm">Policy Text</span>
							<span className="text-xs text-zinc-400">
								Ctrl+G to go to line
							</span>
						</div>
						<div className="flex-1 overflow-auto p-4">
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
								newImportAllowed={false}
							/>
						</div>
					</div>
				</div>

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
