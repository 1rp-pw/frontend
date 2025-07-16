"use client";

import {
	addEdge,
	Background,
	type Connection,
	Controls,
	type Edge,
	MiniMap,
	type NodeTypes,
	ReactFlow,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlowContext } from "~/components/flow/flow-context";
import { CustomNode } from "~/components/flow/nodes/custom-node";
import { PolicyNode } from "~/components/flow/nodes/policy-node";
import { ReturnNode } from "~/components/flow/nodes/return-node";
import { StartNode } from "~/components/flow/nodes/start-node";
import type {
	CustomNodeData,
	FlowEdgeData,
	FlowNodeData,
	NodeOperationLog,
	PolicyNodeData,
	ReturnNodeData,
} from "~/lib/types";

import "@xyflow/react/dist/style.css";

interface FlowEditorProps {
	nodes: FlowNodeData[];
	edges: FlowEdgeData[];
	onNodesChange?: (nodes: FlowNodeData[]) => void;
	onEdgesChange?: (edges: FlowEdgeData[]) => void;
	validationResult?: { unterminatedNodes: string[] } | null;
	onOperationLog?: (log: NodeOperationLog) => void;
}

export function FlowEditor({
	nodes: initialNodes,
	edges: initialEdges,
	onNodesChange: onNodesChangeCallback,
	onEdgesChange: onEdgesChangeCallback,
	validationResult,
	onOperationLog,
}: FlowEditorProps) {
	const onNodesChangeRef = useRef(onNodesChangeCallback);
	const onEdgesChangeRef = useRef(onEdgesChangeCallback);

	// Update refs when callbacks change
	useEffect(() => {
		onNodesChangeRef.current = onNodesChangeCallback;
	}, [onNodesChangeCallback]);

	useEffect(() => {
		onEdgesChangeRef.current = onEdgesChangeCallback;
	}, [onEdgesChangeCallback]);
	const [nodes, setNodes, onNodesChange] = useNodesState(
		initialNodes.map((node, index) => ({
			id: node.id,
			type: node.type,
			position: node.position || {
				x: 100 + (index % 3) * 350,
				y: 100 + Math.floor(index / 3) * 200,
			},
			data: node,
		})),
	);

	// Create a custom type that ensures style and labelStyle are always defined
	type RequiredStyleEdge = Edge & {
		style: Record<string, unknown>;
		labelStyle: Record<string, unknown>;
	};

	const [edges, setEdges, onEdgesChange] = useEdgesState<RequiredStyleEdge>(
		initialEdges.map((edge) => ({
			...edge,
			style: edge.style || {},
			labelStyle: edge.labelStyle || {},
		})) as RequiredStyleEdge[],
	);

	const nodeTypes: NodeTypes = useMemo(
		() => ({
			start: StartNode,
			policy: PolicyNode,
			return: ReturnNode,
			custom: CustomNode,
		}),
		[],
	);

	// Helper function to add operation logs
	const addOperationLog = useCallback(
		(log: Omit<NodeOperationLog, "id" | "timestamp">) => {
			const newLog: NodeOperationLog = {
				...log,
				id: `log-${Date.now()}-${Math.random()}`,
				timestamp: new Date(),
			};
			onOperationLog?.(newLog);
		},
		[onOperationLog],
	);

	const onConnect = useCallback(
		(params: Connection) => {
			if (!params.source || !params.target) return;

			const edge: RequiredStyleEdge = {
				...params,
				id: `edge-${params.source}-${params.target}`,
				source: params.source,
				target: params.target,
				sourceHandle: params.sourceHandle || undefined,
				targetHandle: params.targetHandle || undefined,
				label: params.sourceHandle === "true" ? "True" : "False",
				style: {
					stroke: params.sourceHandle === "true" ? "#22c55e" : "#ef4444",
					strokeWidth: 2,
				},
				labelStyle: {
					fill: params.sourceHandle === "true" ? "#22c55e" : "#ef4444",
					fontWeight: 600,
				},
			} as RequiredStyleEdge;
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
				x: 100 + sourceNode.position.x + 320,
				y: sourceNode.position.y,
			};

			if (outputType === "true") {
				position.y -= 125;
			} else {
				position.y += 175;
			}

			let data: PolicyNodeData | ReturnNodeData | CustomNodeData;

			switch (targetType) {
				case "policy":
					data = {
						id: targetId,
						type: "policy" as const,
						label: "Policy",
						policyId: "",
						policyName: "",
						calledPath: outputType === "true",
						data: null,
						position: {
							x: position.x,
							y: position.y,
						},
					} satisfies PolicyNodeData;
					break;
				case "return":
					data = {
						id: targetId,
						type: "return" as const,
						label: `Return ${outputType === "true" ? "True" : "False"}`,
						returnValue: outputType === "true",
						data: null,
						position: {
							x: position.x,
							y: position.y,
						},
					} satisfies ReturnNodeData;
					break;
				case "custom":
					data = {
						id: targetId,
						type: "custom" as const,
						label: "Custom",
						outcome: "",
						calledPath: outputType === "true",
						data: null,
						position: {
							x: position.x,
							y: position.y,
						},
					} satisfies CustomNodeData;
					break;
			}

			const newNode = {
				id: targetId,
				type: targetType,
				position,
				data, // This entire object becomes the 'data' prop in the component
			};

			const newEdge: RequiredStyleEdge = {
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
			} as RequiredStyleEdge;

			setNodes((nds) => nds.concat(newNode));
			setEdges((eds) => eds.concat(newEdge));

			// Log the node creation
			addOperationLog({
				operation: "create",
				nodeId: targetId,
				nodeType: targetType,
				details: {
					nodeData: data,
					from: outputType,
				},
			});
		},
		[nodes, setNodes, setEdges, addOperationLog],
	);

	const changeNodeType = useCallback(
		(nodeId: string, newType: "return" | "policy" | "custom") => {
			setNodes((nds) =>
				nds.map((node) => {
					if (node.id !== nodeId) return node;

					let newData: PolicyNodeData | ReturnNodeData | CustomNodeData;

					// Preserve calledPath from policy or custom nodes, or derive from return node
					const currentCalledPath =
						node.type === "policy"
							? (node.data as PolicyNodeData).calledPath
							: node.type === "custom"
								? (node.data as CustomNodeData).calledPath
								: node.type === "return"
									? (node.data as ReturnNodeData).returnValue
									: undefined;

					switch (newType) {
						case "policy": {
							// Preserve existing policy data if converting from policy
							const existingPolicyId =
								node.type === "policy"
									? (node.data as PolicyNodeData).policyId
									: "";
							const existingPolicyName =
								node.type === "policy"
									? (node.data as PolicyNodeData).policyName
									: "";

							newData = {
								id: nodeId,
								type: "policy" as const,
								label: "Policy",
								policyId: existingPolicyId || "",
								policyName: existingPolicyName || "",
								calledPath: currentCalledPath,
								data: null,
								position: {
									x: node.position.x,
									y: node.position.y,
								},
							} satisfies PolicyNodeData;
							break;
						}
						case "return": {
							// Preserve the return value if converting from another return node
							const currentReturnValue =
								node.type === "return"
									? (node.data as unknown as ReturnNodeData).returnValue
									: true;
							newData = {
								id: nodeId,
								type: "return" as const,
								label: `Return ${currentReturnValue ? "True" : "False"}`,
								returnValue: currentReturnValue,
								data: null,
								position: {
									x: node.position.x,
									y: node.position.y,
								},
							} satisfies ReturnNodeData;
							break;
						}
						case "custom":
							newData = {
								id: nodeId,
								type: "custom" as const,
								label: "Custom",
								outcome: "",
								calledPath: currentCalledPath,
								data: null,
								position: {
									x: node.position.x,
									y: node.position.y,
								},
							} satisfies CustomNodeData;
							break;
					}

					// Log the type change
					addOperationLog({
						operation: "typeChange",
						nodeId,
						nodeType: newType,
						details: {
							from: {
								type: node.type,
								data: node.data,
							},
							to: {
								type: newType,
								data: newData,
							},
						},
					});

					return {
						...node,
						type: newType,
						data: newData,
					};
				}),
			);
		},
		[setNodes, addOperationLog],
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

			// Find all child nodes (nodes that have this node as their source)
			const findAllDescendants = (currentNodeId: string): string[] => {
				const children: string[] = [];
				const childEdges = edges.filter(
					(edge) => edge.source === currentNodeId,
				);

				for (const edge of childEdges) {
					children.push(edge.target);
					// Recursively find descendants of this child
					children.push(...findAllDescendants(edge.target));
				}

				return children;
			};

			// Get all nodes to delete (current node + all descendants)
			const nodesToDelete = new Set([nodeId, ...findAllDescendants(nodeId)]);

			// Collect information about all nodes being deleted
			const deletedNodesInfo = nodes
				.filter((node) => nodesToDelete.has(node.id))
				.map((node) => ({
					nodeId: node.id,
					nodeType: node.type,
					nodeData: node.data,
				}));

			// Find the primary node being deleted
			const primaryNode = nodes.find((node) => node.id === nodeId);
			if (primaryNode) {
				// Log the deletion with cascaded deletions info
				addOperationLog({
					operation: "delete",
					nodeId,
					nodeType: primaryNode.type,
					details: {
						nodeData: primaryNode.data,
						cascadedDeletions: deletedNodesInfo.filter(
							(n) => n.nodeId !== nodeId,
						),
					},
				});
			}

			// Remove all nodes in the deletion set
			setNodes((nds) => nds.filter((node) => !nodesToDelete.has(node.id)));

			// Remove all edges connected to any of the deleted nodes
			setEdges((eds) =>
				eds.filter(
					(edge) =>
						!nodesToDelete.has(edge.source) && !nodesToDelete.has(edge.target),
				),
			);
		},
		[edges, nodes, setNodes, setEdges, addOperationLog],
	);

	// Notify parent of changes
	useEffect(() => {
		if (onNodesChangeRef.current) {
			const flowNodes: FlowNodeData[] = nodes.map(
				(node) => node.data as FlowNodeData,
			);
			onNodesChangeRef.current(flowNodes);
		}
	}, [nodes]);

	useEffect(() => {
		if (onEdgesChangeRef.current) {
			const flowEdges: FlowEdgeData[] = edges.map((edge) => ({
				id: edge.id,
				source: edge.source,
				target: edge.target,
				sourceHandle: edge.sourceHandle || undefined,
				targetHandle: edge.targetHandle || undefined,
				label: typeof edge.label === "string" ? edge.label : undefined,
				style: edge.style as Record<string, unknown>,
				labelStyle: edge.labelStyle as Record<string, unknown>,
			}));
			onEdgesChangeRef.current(flowEdges);
		}
	}, [edges]);

	const onNodeValueChange = useCallback(
		(
			nodeId: string,
			nodeType: string,
			oldValue: any,
			newValue: any,
			field: string,
		) => {
			addOperationLog({
				operation: "update",
				nodeId,
				nodeType,
				details: {
					from: { [field]: oldValue },
					to: { [field]: newValue },
				},
			});
		},
		[addOperationLog],
	);

	return (
		<FlowContext.Provider
			value={{
				addConnectedNode,
				changeNodeType,
				getConnectedNodes,
				deleteNode,
				onNodeValueChange,
			}}
		>
			<ReactFlow
				nodes={nodes.map((node) => ({
					...node,
					className: validationResult?.unterminatedNodes.includes(node.id)
						? "ring-2 ring-destructive ring-offset-2"
						: "",
				}))}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				nodeTypes={nodeTypes}
				fitView
				attributionPosition="top-right"
				colorMode={"system"}
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
	);
}
