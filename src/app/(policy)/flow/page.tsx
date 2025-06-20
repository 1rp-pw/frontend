"use client";

import { useCallback, useEffect } from "react";
import { FlowEditor } from "~/components/flow/FlowEditor";
import { FlowFooter } from "~/components/flow/FlowFooter";
import { FlowHeader } from "~/components/flow/FlowHeader";
import { FlowTestList } from "~/components/flow/FlowTestList";
import { FlowTestPanel } from "~/components/flow/FlowTestPanel";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "~/components/ui/resizable";
import { useFlowStore } from "~/lib/state/flow";
import type { FlowEdgeData, FlowNodeData } from "~/lib/types";
import { flowToYaml } from "~/lib/utils/flow-to-yaml";

export default function FlowPage() {
	const {
		nodes: storeNodes,
		edges: storeEdges,
		name,
		id,
		updateNodesAndEdges,
		saveFlow,
		reset,
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
	} = useFlowStore();

	// Run initial validation when component loads
	useEffect(() => {
		validateFlow();
	}, [validateFlow]);

	// Handle node and edge changes from the FlowEditor
	const handleNodesChange = useCallback(
		(newNodes: FlowNodeData[]) => {
			updateNodesAndEdges(newNodes, storeEdges);
			// Trigger validation after nodes change
			setTimeout(() => validateFlow(), 0);
		},
		[storeEdges, updateNodesAndEdges, validateFlow],
	);

	const handleEdgesChange = useCallback(
		(newEdges: FlowEdgeData[]) => {
			updateNodesAndEdges(storeNodes, newEdges);
			// Trigger validation after edges change
			setTimeout(() => validateFlow(), 0);
		},
		[storeNodes, updateNodesAndEdges, validateFlow],
	);

	// Handler functions for header
	const handleSaveFlow = useCallback(async () => {
		const result = await saveFlow();
		if (result.success) {
			console.log("Flow saved successfully", result.returnId);
		} else {
			console.error("Failed to save flow:", result.error);
		}
	}, [saveFlow]);

	const handleRunCurrentTest = useCallback(async () => {
		if (currentTest) {
			await runTest(currentTest.id);
		}
	}, [currentTest, runTest]);

	// Generate YAML preview
	const yamlPreview = flowToYaml(storeNodes, storeEdges);

	return (
		<div className="flex h-screen flex-col bg-background text-foreground">
			<FlowHeader
				name={name}
				id={id}
				onSaveFlow={handleSaveFlow}
				onNewFlow={reset}
			/>

			<ResizablePanelGroup direction="vertical" className="flex-1">
				<ResizablePanel defaultSize={75} minSize={50}>
					<main className="h-full bg-muted/10">
						<ResizablePanelGroup direction="horizontal">
							<ResizablePanel defaultSize={70} minSize={50}>
								<FlowEditor
									nodes={storeNodes}
									edges={storeEdges}
									onNodesChange={handleNodesChange}
									onEdgesChange={handleEdgesChange}
									validationResult={validationResult}
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
