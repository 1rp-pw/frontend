"use client";

import {
	Background,
	Controls,
	type Edge,
	MiniMap,
	type Node,
	type NodeTypes,
	ReactFlow,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import { useEffect, useMemo } from "react";
import {
	CustomNodeReadonly,
	PolicyNodeReadonly,
	ReturnNodeReadonly,
	StartNodeReadonly,
} from "~/components/flow/nodes/readonly";
import type { FlowEdgeData, FlowNodeData, ReturnNodeData } from "~/lib/types";

import "@xyflow/react/dist/style.css";

interface FlowVersionPreviewProps {
	nodes: FlowNodeData[] | string;
	edges: FlowEdgeData[] | string;
	className?: string;
}

export function FlowVersionPreview({
	nodes: initialNodes,
	edges: initialEdges,
	className = "",
}: FlowVersionPreviewProps) {
	// Parse nodes and edges if they're strings
	const parsedNodes = useMemo(() => {
		if (typeof initialNodes === "string") {
			try {
				return JSON.parse(initialNodes) as FlowNodeData[];
			} catch (error) {
				console.error("Failed to parse nodes:", error);
				return [];
			}
		}
		return initialNodes;
	}, [initialNodes]);

	const parsedEdges = useMemo(() => {
		if (typeof initialEdges === "string") {
			try {
				return JSON.parse(initialEdges) as FlowEdgeData[];
			} catch (error) {
				console.error("Failed to parse edges:", error);
				return [];
			}
		}
		return initialEdges;
	}, [initialEdges]);

	// Create a custom type that ensures style and labelStyle are always defined
	type RequiredStyleEdge = Edge & {
		style: Record<string, unknown>;
		labelStyle: Record<string, unknown>;
	};

	// Initialize nodes with positions
	const [nodes] = useNodesState(
		parsedNodes.map((node, index) => ({
			id: node.id,
			type: node.type,
			position: node.position || {
				x: 100 + (index % 3) * 350,
				y: 100 + Math.floor(index / 3) * 200,
			},
			data: node,
			// Make nodes non-draggable for readonly view
			draggable: false,
			connectable: false,
			deletable: false,
		})),
	);

	// Initialize edges with styles
	const [edges] = useEdgesState<RequiredStyleEdge>(
		parsedEdges.map((edge) => ({
			...edge,
			style: edge.style || {},
			labelStyle: edge.labelStyle || {},
			// Make edges non-updatable for readonly view
			updatable: false,
			deletable: false,
		})) as RequiredStyleEdge[],
	);

	// Define node types using readonly components
	const nodeTypes: NodeTypes = useMemo(
		() => ({
			start: StartNodeReadonly,
			policy: PolicyNodeReadonly,
			return: ReturnNodeReadonly,
			custom: CustomNodeReadonly,
		}),
		[],
	);

	// Auto-fit view when nodes change
	useEffect(() => {
		// Small delay to ensure ReactFlow has rendered
		const timer = setTimeout(() => {
			const fitViewButton = document.querySelector(
				".react-flow__controls-fitview",
			) as HTMLButtonElement;
			fitViewButton?.click();
		}, 100);
		return () => clearTimeout(timer);
	}, []);

	return (
		<div
			className={`h-full w-full rounded-lg border border-border bg-muted/10 ${className}`}
		>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				nodeTypes={nodeTypes}
				// Readonly settings
				nodesDraggable={false}
				nodesConnectable={false}
				nodesFocusable={false}
				edgesFocusable={false}
				elementsSelectable={false}
				zoomOnScroll={true}
				zoomOnPinch={true}
				panOnScroll={false}
				panOnDrag={true}
				preventScrolling={false}
				// Disable all interactions that would modify the flow
				onNodesChange={() => {}}
				onEdgesChange={() => {}}
				onConnect={() => {}}
				// Visual settings
				fitView
				fitViewOptions={{
					padding: 0.2,
					includeHiddenNodes: false,
				}}
				attributionPosition="top-right"
				colorMode="system"
			>
				<Background color="#000" gap={16} />
				<Controls
					showZoom={true}
					showFitView={true}
					showInteractive={false}
					position="bottom-right"
				/>
				<MiniMap
					position="bottom-left"
					className="!bg-background/50"
					nodeStrokeColor={(n: Node) => {
						switch (n.type) {
							case "start":
								return "#22c55e";
							case "policy":
								return "#3b82f6";
							case "return": {
								const data = n.data as ReturnNodeData;
								return data.returnValue ? "#22c55e" : "#ef4444";
							}
							case "custom":
								return "#a855f7";
							default:
								return "#555";
						}
					}}
					nodeColor={(n: Node) => {
						switch (n.type) {
							case "start":
								return "#dcfce7";
							case "policy":
								return "#dbeafe";
							case "return": {
								const data = n.data as ReturnNodeData;
								return data.returnValue ? "#dcfce7" : "#fee2e2";
							}
							case "custom":
								return "#f3e8ff";
							default:
								return "#f3f4f6";
						}
					}}
					maskColor="rgb(50, 50, 50, 0.8)"
				/>
			</ReactFlow>
		</div>
	);
}
