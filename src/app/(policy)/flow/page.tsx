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
import {useCallback, useMemo} from "react";
import {FlowContext} from "~/components/flow/flow-context";
import {CustomNode} from "~/components/flow/nodes/custom-node";
import {PolicyNode} from "~/components/flow/nodes/policy-node";
import {ReturnNode} from "~/components/flow/nodes/return-node";
import {StartNode} from "~/components/flow/nodes/start-node";
import {Button} from "~/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "~/components/ui/card";
import type {CustomNodeData, PolicyNodeData, ReturnNodeData, StartNodeData,} from "~/lib/types";

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
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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

	const clearFlow = useCallback(() => {
		setNodes(initialNodes);
		setEdges(initialEdges);
	}, [setNodes, setEdges]);

	return (
		<div className="flex h-screen flex-col bg-background text-foreground">
			<header className="flex border-border border-b bg-card px-6 py-4">
				<div className="flex w-full items-center justify-between">
					<h1 className="font-bold text-xl">Flow Editor</h1>
					<Button onClick={clearFlow} variant="secondary" size="sm">
						Clear Flow
					</Button>
				</div>
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
						<CardTitle className="font-medium text-sm">Instructions</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-muted-foreground text-xs">
						<p>
							<strong className="font-medium text-foreground">Building Flows:</strong> Start with the green Start Node, then click "Add True" or "Add False" to create connected nodes
						</p>
						<p>
							<strong className="font-medium text-foreground">Node Types:</strong> Return nodes (True/False), Policy nodes (execute another policy), or Custom nodes (custom outcome)
						</p>
						<p>
							<strong className="font-medium text-foreground">Converting Nodes:</strong> Use "Change to" buttons on terminal nodes to switch between Return, Policy, and Custom types
						</p>
						<p>
							<strong className="font-medium text-foreground">Policy Search:</strong> Type a Policy ID then click the search icon to browse available policies
						</p>
					</CardContent>
				</Card>
			</footer>
		</div>
	);
}
