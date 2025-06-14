"use client";

import { useCallback } from "react";
import { FlowEditor } from "~/components/flow/FlowEditor";
import { FlowFooter } from "~/components/flow/FlowFooter";
import { FlowHeader } from "~/components/flow/FlowHeader";
import { useFlowSearch } from "~/hooks/use-flow-search";
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
		setFlowName,
		saveFlow,
		getFlow,
		reset,
		isLoading,
		error,
		testFlow,
		isTestRunning,
		testResult,
		validationResult,
	} = useFlowStore();

	const { flows, searchFlows } = useFlowSearch();
	// Handle node and edge changes from the FlowEditor
	const handleNodesChange = useCallback(
		(newNodes: FlowNodeData[]) => {
			updateNodesAndEdges(newNodes, storeEdges);
		},
		[storeEdges, updateNodesAndEdges],
	);

	const handleEdgesChange = useCallback(
		(newEdges: FlowEdgeData[]) => {
			updateNodesAndEdges(storeNodes, newEdges);
		},
		[storeNodes, updateNodesAndEdges],
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

	const handleLoadFlow = useCallback(
		async (flowId: string) => {
			const result = await getFlow(flowId);
			if (result.success) {
				console.log("Flow loaded successfully");
			} else {
				console.error("Failed to load flow:", result.error);
			}
		},
		[getFlow],
	);

	const handleTestFlow = useCallback(async () => {
		const startNode = storeNodes.find((node) => node.type === "start");
		if (!startNode) {
			console.error("No start node found");
			return;
		}

		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const startData = startNode as any;
		let testData: object;

		try {
			testData = JSON.parse(startData.jsonData || "{}");
		} catch (error) {
			console.error("Invalid JSON in start node:", error);
			return;
		}

		const result = await testFlow(testData);
		if (result.success) {
			console.log("Flow test completed:", result.result);
		} else {
			console.error("Flow test failed:", result.error);
		}
	}, [storeNodes, testFlow]);

	// Generate YAML preview
	const yamlPreview = flowToYaml(storeNodes, storeEdges);

	const isSaveDisabled =
		isLoading || (validationResult && !validationResult.isValid);

	return (
		<div className="flex h-screen flex-col bg-background text-foreground">
			<FlowHeader
				name={name}
				id={id}
				flows={flows}
				isLoading={isLoading}
				isSaveDisabled={isSaveDisabled}
				isTestRunning={isTestRunning}
				error={error}
				validationResult={validationResult}
				onNameChange={setFlowName}
				onLoadFlow={handleLoadFlow}
				onSearchFlows={searchFlows}
				onTestFlow={handleTestFlow}
				onSaveFlow={handleSaveFlow}
				onNewFlow={reset}
			/>

			<main className="relative flex-1 bg-muted/10">
				<FlowEditor
					nodes={storeNodes}
					edges={storeEdges}
					onNodesChange={handleNodesChange}
					onEdgesChange={handleEdgesChange}
					validationResult={validationResult}
				/>
			</main>

			<FlowFooter
				validationResult={validationResult}
				testResult={testResult}
				isTestRunning={isTestRunning}
				yamlPreview={yamlPreview}
			/>
		</div>
	);
}
