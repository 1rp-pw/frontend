"use client";

import { ArrowBigLeft, CopyIcon, PlayIcon } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Editor } from "~/components/policy/editor";
import { SchemaBuilder } from "~/components/policy/schema/builder";
import { TestForm } from "~/components/policy/test/form";
import { TestList } from "~/components/policy/test/list";
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

	useEffect(() => {
		const loadPolicy = async () => {
			await getPolicy(policy_id);
		};
		loadPolicy();
	}, [policy_id, getPolicy]);

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
							navigator.clipboard.writeText(policy_id);
						}}
						className="h-7 px-2"
						title="Copy Policy ID"
					>
						<CopyIcon className="h-3 w-3" />
					</Button>
				</div>
			</header>

			<main className="grid flex-1 grid-cols-2 grid-rows-[1fr_1fr] gap-1 overflow-auto p-1">
				<div className="flex flex-col overflow-hidden rounded-md border border-zinc-700 bg-zinc-800">
					<div className="bg-zinc-700 px-4 py-2 font-medium text-sm">
						Policy Text
					</div>
					<div className="flex-1 overflow-auto p-4">
						<Editor rule={rule} onChange={setPolicyRule} disabled={true} />
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
								disabled={true}
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
							disabled={true}
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
					</div>
					<div className="flex-1 overflow-auto">
						<TestList
							tests={tests}
							currentTest={currentTest}
							onSelectTest={selectTest}
							onDeleteTest={deleteTest}
							onRunTest={runTest}
							onRepairTest={repairTest}
							disabled={true}
						/>
					</div>
				</div>
			</main>
		</div>
	);
}
