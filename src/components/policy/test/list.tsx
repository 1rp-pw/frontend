"use client";

import {
	CheckIcon,
	CircleAlertIcon,
	CircleCheckIcon,
	CircleXIcon,
	FileTextIcon,
	Loader2Icon,
	PlayIcon,
	RefreshCwIcon,
	TrashIcon,
	TriangleAlertIcon,
	XIcon,
} from "lucide-react";
import { useState } from "react";
import { PolicyExecutionModal } from "~/components/policy/test/execution";
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
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import type { Test, TestStatus } from "~/lib/state/policy";

interface TestListProps {
	tests: Test[];
	currentTest: Test | null;
	onSelectTest: (test: Test) => void;
	onDeleteTest: (testId: string) => void;
	onRunTest: (testId: string) => Promise<void>;
	onRepairTest: (testId: string) => void;
	disabled?: boolean;
}

export function TestList({
	tests,
	currentTest,
	onSelectTest,
	onDeleteTest,
	onRunTest,
	onRepairTest,
	disabled = false,
}: TestListProps) {
	const [testInfo, setTestInfo] = useState<Test | null>();
	const [deleteTestDialogOpen, setDeleteTestDialogOpen] = useState(false);
	const [executionModalOpen, setExecutionModalOpen] = useState(false);

	const handleDeleteTest = (test: Test | null) => {
		setTestInfo(test);
		setDeleteTestDialogOpen(true);
	};

	const confirmDeleteTest = () => {
		if (testInfo === null) {
			return;
		}
		const testId = testInfo?.id || "";

		setDeleteTestDialogOpen(false);
		onDeleteTest(testId);
	};

	const getStatusIcon = (test: Test) => {
		switch (test.outcome.status) {
			case "running":
				return (
					<Button variant={null} size="icon">
						<Loader2Icon className="h-5 w-5 animate-spin text-blue-400" />
					</Button>
				);
			case "passed":
				return (
					<Button
						variant="ghost"
						size="icon"
						onClick={() => {
							setTestInfo(test);
							setExecutionModalOpen(true);
						}}
					>
						<CircleCheckIcon className="h-5 w-5 text-green-400" />
					</Button>
				);
			case "failed":
				return (
					<Button
						variant="ghost"
						size="icon"
						onClick={() => {
							setExecutionModalOpen(true);
							setTestInfo(test);
						}}
					>
						<CircleXIcon className="h-5 w-5 text-red-400" />
					</Button>
				);
			case "invalid":
				return (
					<Button variant={null} size="icon">
						<TriangleAlertIcon className="h-5 w-5 text-amber-400" />
					</Button>
				);
			default:
				return (
					<Button variant={null} size="icon">
						<CircleAlertIcon className="h-5 w-5 text-zinc-400" />
					</Button>
				);
		}
	};

	const getStatusBadge = (status: TestStatus) => {
		switch (status) {
			case "not-run":
				return (
					<Badge variant={"secondary"} className={"text-xs"}>
						Not Run
					</Badge>
				);
			case "running":
				return (
					<Badge
						variant={"secondary"}
						className={"bg-blue-500/20 text-blue-300 text-xs"}
					>
						Running
					</Badge>
				);
			case "passed":
				return (
					<Badge
						variant={"secondary"}
						className={"bg-green-500/20 text-green-300 text-xs"}
					>
						Passed
					</Badge>
				);
			case "failed":
				return (
					<Badge
						variant={"secondary"}
						className={"bg-red-500/20 text-red-300 text-xs"}
					>
						Failed
					</Badge>
				);
			case "invalid":
				return (
					<Badge
						variant={"secondary"}
						className={"bg-amber-500/20 text-amber-300 text-xs"}
					>
						Invalid
					</Badge>
				);
		}
	};

	const getExpectPassBadge = (expectPass: boolean) => {
		return expectPass ? (
			<Badge
				variant="outline"
				className="border-green-500/30 bg-green-500/10 text-green-400 text-xs"
				title="Expects test to pass"
			>
				<CheckIcon className="mr-1 h-3 w-3" />
				Expect Pass
			</Badge>
		) : (
			<Badge
				variant="outline"
				className="border-red-500/30 bg-red-500/10 text-red-400 text-xs"
				title="Expects test to fail"
			>
				<XIcon className="mr-1 h-3 w-3" />
				Expect Fail
			</Badge>
		);
	};

	const validTests = tests.filter((t) => t.outcome.status !== "invalid");
	const invalidTests = tests.filter((t) => t.outcome.status === "invalid");

	if (tests.length === 0) {
		return (
			<div className="p-4 text-center text-zinc-500">
				<FileTextIcon className="mx-auto mb-2 h-8 w-8 opacity-50" />
				<p className="text-sm">No tests created yet</p>
				<p className="mt-1 text-xs">
					Build a schema first, then create a new test
				</p>
			</div>
		);
	}

	const renderTest = (test: Test) => (
		<li
			key={test.id}
			className={`cursor-pointer px-4 py-3 hover:bg-zinc-700 ${
				currentTest?.id === test.id ? "bg-zinc-700" : ""
			}`}
			onClick={() => onSelectTest(test)}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onSelectTest(test);
				}
			}}
		>
			<div className="flex items-center justify-between">
				<div className="flex flex-1 items-center gap-2">
					<FileTextIcon className="h-4 w-4 text-zinc-400" />
					<div className="flex-1">
						<div className="flex flex-wrap items-center gap-2">
							<span className="font-medium text-sm">{test.name}</span>
							{getStatusBadge(test.outcome.status || "not-run")}
							{getExpectPassBadge(test.expectPass)}
						</div>
						<div className="text-xs text-zinc-500">
							{test.createdAt.toLocaleDateString()}{" "}
							{test.createdAt.toLocaleTimeString()}
						</div>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{getStatusIcon(test)}

					{test.outcome.status === "invalid" && onRepairTest ? (
						<Button
							variant="ghost"
							size="icon"
							onClick={(e) => {
								e.stopPropagation();
								if (test.id) {
									onRepairTest(test.id);
								}
							}}
							className="h-6 w-6 text-zinc-400 hover:text-amber-400"
							title="Repair test to match current schema"
						>
							<RefreshCwIcon className="h-4 w-4" />
						</Button>
					) : (
						<Button
							variant="ghost"
							size="icon"
							onClick={(e) => {
								e.stopPropagation();
								if (test.id) {
									onRunTest(test.id);
								}
							}}
							className="h-6 w-6 text-zinc-400 hover:text-green-400"
							disabled={
								test.outcome.status === "running" ||
								test.outcome.status === "invalid"
							}
							title={
								test.outcome.status === "invalid"
									? "Repair test first"
									: "Run test"
							}
						>
							<PlayIcon className="h-4 w-4" />
						</Button>
					)}

					{!disabled && (
						<Button
							variant="ghost"
							size="icon"
							className="h-6 w-6 text-zinc-400 hover:text-red-400"
							onClick={(e) => {
								e.stopPropagation();
								handleDeleteTest(test);
							}}
							disabled={test.outcome.status === "running"}
						>
							<TrashIcon className="h-4 w-4" />
						</Button>
					)}
				</div>
			</div>
		</li>
	);

	return (
		<div className={"w-full"}>
			{validTests.length > 0 && (
				<div>
					<ul className={"divide-y divide-zinc-700"}>
						{validTests.map(renderTest)}
					</ul>
				</div>
			)}
			{invalidTests.length > 0 && (
				<div className={"mt-4"}>
					<div
						className={
							"flex items-center gap-2 border-amber-500/20 border-t bg-amber-500/10 px-4 py-2"
						}
					>
						<TriangleAlertIcon className="h-4 w-4" />
						<span className={"font-medium text-amber-300 text-sm"}>
							Schema Changed - Tests need repair
						</span>
					</div>
					<ul className={"divide-y divide-zinc-700"}>
						{invalidTests.map(renderTest)}
					</ul>
				</div>
			)}

			<PolicyExecutionModal
				open={executionModalOpen}
				onOpenChange={setExecutionModalOpen}
				executionData={testInfo?.resultSet || null}
				testName={testInfo?.name}
			/>

			<AlertDialog open={deleteTestDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="text-sm">
							Are you sure you want to delete ?
						</AlertDialogTitle>
						<AlertDialogDescription>
							Delete {testInfo?.name}?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							onClick={() => setDeleteTestDialogOpen(false)}
							className={"cursor-pointer"}
						>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDeleteTest}
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
