"use client";

import {
	addEdge,
	Background,
	type Connection,
	Controls,
	type Edge,
	MiniMap,
	type Node,
	type NodeTypes,
	ReactFlow,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import {Save, FolderOpen, Play} from "lucide-react";
import {useCallback, useEffect, useMemo} from "react";
import {FlowContext} from "~/components/flow/flow-context";
import {CustomNode} from "~/components/flow/nodes/custom-node";
import {PolicyNode} from "~/components/flow/nodes/policy-node";
import {ReturnNode} from "~/components/flow/nodes/return-node";
import {StartNode} from "~/components/flow/nodes/start-node";
import {Button} from "~/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "~/components/ui/card";
import {Input} from "~/components/ui/input";
import {Label} from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "~/components/ui/tabs";
import {useFlowSearch} from "~/hooks/use-flow-search";
import {useFlowStore} from "~/lib/state/flow";
import type {CustomNodeData, PolicyNodeData, ReturnNodeData, StartNodeData, FlowNodeData, FlowEdgeData} from "~/lib/types";

import "@xyflow/react/dist/style.css";

const initialNodes: Node[] = [
	{
		id: "start-1",
		type: "start",
		position: { x: 100, y: 100 },
		data: {
			id: "start-1",
			type: "start" as const,
			label: "Start",
			jsonData: '{"example": "data"}',
			policyId: "",
			policyName: "",
		} satisfies StartNodeData,
	},
];

const initialEdges: Edge[] = [];

export default function FlowEditor() {
	const {
		flowSpec,
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
	} = useFlowStore();
	
	const { flows, searchFlows } = useFlowSearch();
	
	const [nodes, setNodes, onNodesChange] = useNodesState(
		storeNodes.map(node => ({
			id: node.id,
			type: node.type,
			position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 }, // Default positioning
			data: node,
		}))
	);
	const [edges, setEdges, onEdgesChange] = useEdgesState(
		storeEdges.map(edge => ({
			...edge,
			style: edge.style || {},
			labelStyle: edge.labelStyle || {},
		}))
	);

	// Sync store changes to React Flow
	useEffect(() => {
		const flowNodes = storeNodes.map(node => ({
			id: node.id,
			type: node.type,
			position: nodes.find(n => n.id === node.id)?.position || { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
			data: node,
		}));
		
		const flowEdges = storeEdges.map(edge => ({
			...edge,
			style: edge.style || {},
			labelStyle: edge.labelStyle || {},
		}));
		
		setNodes(flowNodes);
		setEdges(flowEdges);
	}, [storeNodes, storeEdges, setNodes, setEdges]);
	
	// Sync React Flow changes to store
	useEffect(() => {
		const flowNodes: FlowNodeData[] = nodes.map(node => node.data as FlowNodeData);
		const flowEdges: FlowEdgeData[] = edges.map(edge => ({
			id: edge.id,
			source: edge.source,
			target: edge.target,
			sourceHandle: edge.sourceHandle || undefined,
			targetHandle: edge.targetHandle || undefined,
			label: edge.label || undefined,
			style: edge.style,
			labelStyle: edge.labelStyle,
		}));
		
		updateNodesAndEdges(flowNodes, flowEdges);
	}, [nodes, edges, updateNodesAndEdges]);

	const nodeTypes: NodeTypes = useMemo(
		() => ({
			start: StartNode,
			policy: PolicyNode,
			return: ReturnNode,
			custom: CustomNode,
		}),
		[],
	);

	const onConnect = useCallback(
		(params: Connection) => {
			const edge: Edge = {
				...params,
				id: `edge-${params.source}-${params.target}`,
				label: params.sourceHandle === "true" ? "True" : "False",
				style: {
					stroke: params.sourceHandle === "true" ? "#22c55e" : "#ef4444",
					strokeWidth: 2,
				},
				labelStyle: {
					fill: params.sourceHandle === "true" ? "#22c55e" : "#ef4444",
					fontWeight: 600,
				},
			};
			setEdges((eds) => addEdge(edge, eds));
		},
		[setEdges],
	);


	const addConnectedNode = useCallback(
		(
			sourceNodeId: string,
			outputType: "true" | "false",
			targetType: "return" | "policy" | "custom" = "return",
		) => {
			const targetId = `${targetType}-${Date.now()}`;

			// Find source node to position the new node relative to it
			const sourceNode = nodes.find((n) => n.id === sourceNodeId);
			if (!sourceNode) return;

			const position = {
				x: sourceNode.position.x + 320, // Position to the right
				y: sourceNode.position.y + (outputType === "true" ? -50 : 50), // Offset up/down for true/false
			};

			let data: PolicyNodeData | ReturnNodeData | CustomNodeData;

			switch (targetType) {
				case "policy":
					data = {
						id: targetId,
						type: "policy" as const,
						label: "Policy",
						policyId: "",
						policyName: "",
					} satisfies PolicyNodeData;
					break;
				case "return":
					data = {
						id: targetId,
						type: "return" as const,
						label: "Return",
						returnValue: outputType === "true",
					} satisfies ReturnNodeData;
					break;
				case "custom":
					data = {
						id: targetId,
						type: "custom" as const,
						label: "Custom",
						outcome: "",
					} satisfies CustomNodeData;
					break;
			}

			const newNode: Node = {
				id: targetId,
				type: targetType,
				position,
				data,
			};

			const newEdge: Edge = {
				id: `edge-${sourceNodeId}-${targetId}`,
				source: sourceNodeId,
				target: targetId,
				sourceHandle: outputType,
				label: outputType === "true" ? "True" : "False",
				style: {
					stroke: outputType === "true" ? "#22c55e" : "#ef4444",
					strokeWidth: 2,
				},
				labelStyle: {
					fill: outputType === "true" ? "#22c55e" : "#ef4444",
					fontWeight: 600,
				},
			};

			setNodes((nds) => nds.concat(newNode));
			setEdges((eds) => eds.concat(newEdge));
		},
		[nodes, setNodes, setEdges],
	);

	const changeNodeType = useCallback(
		(nodeId: string, newType: "return" | "policy" | "custom") => {
			setNodes((nds) =>
				nds.map((node) => {
					if (node.id !== nodeId) return node;

					let newData: PolicyNodeData | ReturnNodeData | CustomNodeData;

					switch (newType) {
						case "policy":
							newData = {
								id: nodeId,
								type: "policy" as const,
								label: "Policy",
								policyId: "",
								policyName: "",
							} satisfies PolicyNodeData;
							break;
						case "return":
							newData = {
								id: nodeId,
								type: "return" as const,
								label: "Return",
								returnValue: true,
							} satisfies ReturnNodeData;
							break;
						case "custom":
							newData = {
								id: nodeId,
								type: "custom" as const,
								label: "Custom",
								outcome: "",
							} satisfies CustomNodeData;
							break;
					}

					return {
						...node,
						type: newType,
						data: newData,
					};
				}),
			);
		},
		[setNodes],
	);

	const getConnectedNodes = useCallback(
		(nodeId: string) => {
			return edges.reduce(
				(acc, edge) => {
					if (edge.source === nodeId) {
						if (edge.sourceHandle === "true") {
							acc.true = edge.target;
						} else if (edge.sourceHandle === "false") {
							acc.false = edge.target;
						}
					}
					return acc;
				},
				{} as { true?: string; false?: string },
			);
		},
		[edges],
	);

	const deleteNode = useCallback(
		(nodeId: string) => {
			// Prevent deleting the start node
			if (nodeId === "start-1") return;

			// Remove the node
			setNodes((nds) => nds.filter((node) => node.id !== nodeId));
			
			// Remove all edges connected to this node
			setEdges((eds) => 
				eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
			);
		},
		[setNodes, setEdges],
	);

	const handleSaveFlow = useCallback(async () => {
		const result = await saveFlow();
		if (result.success) {
			console.log("Flow saved successfully", result.returnId);
		} else {
			console.error("Failed to save flow:", result.error);
		}
	}, [saveFlow]);

	const handleLoadFlow = useCallback(async (flowId: string) => {
		const result = await getFlow(flowId);
		if (result.success) {
			console.log("Flow loaded successfully");
		} else {
			console.error("Failed to load flow:", result.error);
		}
	}, [getFlow]);

	const handleTestFlow = useCallback(async () => {
		// Find start node and get its JSON data
		const startNode = storeNodes.find(node => node.type === "start");
		if (!startNode) {
			console.error("No start node found");
			return;
		}

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

	const clearFlow = useCallback(() => {
		reset();
	}, [reset]);

	return (
		<div className="flex h-screen flex-col bg-background text-foreground">
			<header className="flex border-border border-b bg-card px-6 py-4">
				<div className="flex w-full items-center justify-between">
					<div className="flex items-center gap-4">
						<h1 className="font-bold text-xl">Flow Editor</h1>
						<div className="flex items-center gap-2">
							<Label htmlFor="flow-name" className="text-sm font-medium">Name:</Label>
							<Input
								id="flow-name"
								value={name}
								onChange={(e) => setFlowName(e.target.value)}
								placeholder="Flow name"
								className="w-48 text-sm"
							/>
						</div>
						{id && (
							<div className="text-sm text-muted-foreground">
								ID: {id}
							</div>
						)}
					</div>
					<div className="flex items-center gap-2">
						<div className="flex items-center gap-2">
							<Label htmlFor="load-flow" className="text-sm font-medium">Load:</Label>
							<Select onValueChange={handleLoadFlow}>
								<SelectTrigger id="load-flow" className="w-48 text-sm">
									<SelectValue placeholder="Select flow..." />
								</SelectTrigger>
								<SelectContent>
									{flows.map((flow) => (
										<SelectItem key={flow.id} value={flow.id}>
											{flow.name}
										</SelectItem>
									))}
									{flows.length === 0 && (
										<SelectItem value="no-flows" disabled>
											No flows found
										</SelectItem>
									)}
								</SelectContent>
							</Select>
							<Button
								onClick={() => searchFlows()}
								variant="outline"
								size="sm"
							>
								<FolderOpen className="h-4 w-4" />
							</Button>
						</div>
						<Button 
							onClick={handleTestFlow} 
							variant="outline" 
							size="sm"
							disabled={isTestRunning}
						>
							<Play className="mr-2 h-4 w-4" />
							{isTestRunning ? "Testing..." : "Test Flow"}
						</Button>
						<Button 
							onClick={handleSaveFlow} 
							variant="default" 
							size="sm"
							disabled={isLoading}
						>
							<Save className="mr-2 h-4 w-4" />
							{isLoading ? "Saving..." : "Save Flow"}
						</Button>
						<Button onClick={clearFlow} variant="secondary" size="sm">
							New Flow
						</Button>
					</div>
				</div>
				{error && (
					<div className="mt-2 text-sm text-destructive">
						Error: {error}
					</div>
				)}
			</header>

			<main className="relative flex-1 bg-muted/10">
				<FlowContext.Provider
					value={{ addConnectedNode, changeNodeType, getConnectedNodes, deleteNode }}
				>
					<ReactFlow
						nodes={nodes}
						edges={edges}
						onNodesChange={onNodesChange}
						onEdgesChange={onEdgesChange}
						onConnect={onConnect}
						nodeTypes={nodeTypes}
						fitView
						attributionPosition="top-right"
					>
						<Background />
						<Controls />
						<MiniMap
							nodeStrokeColor={(n) => {
								switch (n.type) {
									case "start":
										return "#22c55e";
									case "policy":
										return "#3b82f6";
									case "return":
										return n.data.returnValue ? "#22c55e" : "#ef4444";
									case "custom":
										return "#a855f7";
									default:
										return "#555";
								}
							}}
							nodeColor={(n) => {
								switch (n.type) {
									case "start":
										return "#dcfce7";
									case "policy":
										return "#dbeafe";
									case "return":
										return n.data.returnValue ? "#dcfce7" : "#fee2e2";
									case "custom":
										return "#f3e8ff";
									default:
										return "#f3f4f6";
								}
							}}
						/>
					</ReactFlow>
				</FlowContext.Provider>
			</main>

			<footer className="border-border border-t bg-card px-6 py-4">
				<Card className="rounded-lg border-border bg-card shadow-sm">
					<CardHeader className="pb-3">
						<CardTitle className="font-medium text-sm">Flow Designer</CardTitle>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="instructions" className="w-full">
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="instructions">Instructions</TabsTrigger>
								<TabsTrigger value="test-results">Test Results</TabsTrigger>
							</TabsList>
							<TabsContent value="instructions" className="space-y-2 text-muted-foreground text-xs">
								<p>
									<strong className="font-medium text-foreground">Building Flows:</strong> Start with the green Start Node, then click "Add True" or "Add False" to create connected nodes
								</p>
								<p>
									<strong className="font-medium text-foreground">Node Types:</strong> Return nodes (True/False), Policy nodes (execute another policy), or Custom nodes (custom outcome)
								</p>
								<p>
									<strong className="font-medium text-foreground">Testing:</strong> Enter JSON test data in the Start node, then click "Test Flow" to execute the flow with that data
								</p>
								<p>
									<strong className="font-medium text-foreground">Saving & Loading:</strong> Name your flow and click "Save Flow" to store it. Use the Load dropdown to select and load existing flows
								</p>
								<p>
									<strong className="font-medium text-foreground">Deleting Nodes:</strong> Click the X button in the top-right corner of any node (except Start node) to remove it
								</p>
							</TabsContent>
							<TabsContent value="test-results" className="space-y-3">
								{testResult ? (
									<div className="space-y-2 text-xs">
										<div className="grid grid-cols-2 gap-4">
											<div>
												<Label className="font-medium text-foreground">Final Outcome:</Label>
												<div className={`font-medium ${typeof testResult.finalOutcome === 'boolean' 
													? (testResult.finalOutcome ? 'text-green-600' : 'text-red-600')
													: 'text-blue-600'
												}`}>
													{typeof testResult.finalOutcome === 'boolean' 
														? (testResult.finalOutcome ? 'TRUE' : 'FALSE')
														: testResult.finalOutcome
													}
												</div>
											</div>
											<div>
												<Label className="font-medium text-foreground">Execution Path:</Label>
												<div className="text-muted-foreground">
													{testResult.executionPath.join(' → ')}
												</div>
											</div>
										</div>
										<div>
											<Label className="font-medium text-foreground">Final Node:</Label>
											<div className="text-muted-foreground">
												{testResult.nodeName} ({testResult.nodeId})
											</div>
										</div>
										{testResult.errors && testResult.errors.length > 0 && (
											<div>
												<Label className="font-medium text-destructive">Errors:</Label>
												<div className="space-y-1">
													{testResult.errors.map((error, index) => (
														<div key={index} className="text-destructive text-xs">
															• {error}
														</div>
													))}
												</div>
											</div>
										)}
									</div>
								) : (
									<div className="text-muted-foreground text-xs">
										{isTestRunning ? (
											<div className="flex items-center gap-2">
												<div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
												Running flow test...
											</div>
										) : (
											"No test results yet. Click 'Test Flow' to execute the flow with the Start node's JSON data."
										)}
									</div>
								)}
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>
			</footer>
		</div>
	);
}
