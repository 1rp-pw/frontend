"use client";

import { useCallback, useEffect } from "react";
import { FlowFooter } from "~/components/flow/FlowFooter";
import { FlowHeader } from "~/components/flow/FlowHeader";
import { FlowTestList } from "~/components/flow/FlowTestList";
import { FlowTestPanel } from "~/components/flow/FlowTestPanel";
import { FlowVersionPreview } from "~/components/flow/FlowVersionPreview";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "~/components/ui/resizable";
import { Skeleton } from "~/components/ui/skeleton";
import { useFlowStore } from "~/lib/state/flow";
import { flowToYaml } from "~/lib/utils/flow-to-yaml";

export default function Maker({ flow_id }: { flow_id: string }) {
	const {
		nodes: storeNodes,
		edges: storeEdges,
		name,
		error,
		isTestRunning,
		testResult,
		testData,
		setTestData,
		tests,
		currentTest,
		createTest,
		saveTest,
		selectTest,
		deleteTest,
		runTest,
		runAllTests,
		validationResult,
		validateFlow,
		getFlow,
		isLoading,
	} = useFlowStore();

	// Run initial validation when component loads
	useEffect(() => {
		validateFlow();
	}, [validateFlow]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: dont need the others
	useEffect(() => {
		const loadFlow = async () => {
			await getFlow(flow_id);
		};
		loadFlow();
	}, [flow_id]);

	const handleRunCurrentTest = useCallback(async () => {
		if (currentTest) {
			await runTest(currentTest.id);
		}
	}, [currentTest, runTest]);

	// Generate YAML preview
	const yamlPreview = flowToYaml(storeNodes, storeEdges);

	if (isLoading) {
		return (
			<div className="flex h-screen flex-col bg-zinc-900 text-zinc-100">
				<div className="flex flex-1 items-center justify-center">
					<Skeleton />
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-screen flex-col bg-background text-foreground">
			<FlowHeader name={name} readonly={true} />

			<ResizablePanelGroup direction="vertical" className="flex-1">
				<ResizablePanel defaultSize={75} minSize={50}>
					<main className="h-full bg-muted/10">
						<ResizablePanelGroup direction="horizontal">
							<ResizablePanel defaultSize={70} minSize={50}>
								<FlowVersionPreview
									nodes={storeNodes}
									edges={storeEdges}
									className="h-full"
								/>
							</ResizablePanel>
							<ResizableHandle withHandle />
							<ResizablePanel defaultSize={30} minSize={25} maxSize={45}>
								<ResizablePanelGroup direction="vertical">
									<ResizablePanel defaultSize={40} minSize={30}>
										<FlowTestList
											tests={tests}
											currentTest={currentTest}
											onCreateTest={createTest}
											onSelectTest={selectTest}
											onDeleteTest={deleteTest}
											onRunTest={runTest}
											onRunAllTests={runAllTests}
											isRunning={isTestRunning}
											readonly={true}
										/>
									</ResizablePanel>
									<ResizableHandle withHandle />
									<ResizablePanel defaultSize={60} minSize={40}>
										<FlowTestPanel
											testData={testData}
											currentTest={currentTest}
											isRunning={isTestRunning}
											testResult={testResult}
											error={error}
											onTestDataChange={setTestData}
											onRunTest={handleRunCurrentTest}
											onSaveTest={saveTest}
											readonly={true}
										/>
									</ResizablePanel>
								</ResizablePanelGroup>
							</ResizablePanel>
						</ResizablePanelGroup>
					</main>
				</ResizablePanel>
				<ResizableHandle withHandle />
				<ResizablePanel defaultSize={25} minSize={15} maxSize={50}>
					<FlowFooter
						validationResult={validationResult}
						yamlPreview={yamlPreview}
					/>
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
