"use client";

import type React from "react";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactFlow, {
	MiniMap,
	Controls,
	Background,
	useNodesState,
	useEdgesState,
	addEdge,
	type Connection,
	type Edge,
	type Node,
	type NodeTypes,
	type EdgeTypes,
	Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { Play, Plus, Save } from "lucide-react";
import type { ReactFlowInstance } from "reactflow";
import { CustomEdge } from "~/components/flow/edges/custom";
import { ActionNode } from "~/components/flow/nodes/action";
import { InputNode } from "~/components/flow/nodes/input";
import { Button } from "~/components/ui/button";
import type { NodeData } from "~/lib/types";

const nodeTypes: NodeTypes = {
	input: InputNode,
	action: ActionNode,
};

const edgeTypes: EdgeTypes = {
	custom: CustomEdge,
};

export default function FlowBuilder() {
	const reactFlowWrapper = useRef<HTMLDivElement>(null);
	const [nodes, setNodes, onNodesChange] = useNodesState([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState([]);
	const [reactFlowInstance, setReactFlowInstance] =
		useState<ReactFlowInstance | null>(null);

	const onConnect = useCallback(
		(params: Connection | Edge) =>
			setEdges((eds) => addEdge({ ...params, type: "custom" }, eds)),
		[setEdges],
	);

	const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = "move";
	}, []);

	const addInputNode = useCallback(() => {
		if (!reactFlowInstance) return;

		const position = reactFlowInstance.project({
			x: 100,
			y: 100,
		});

		const newNode: Node<NodeData> = {
			id: `input-${Date.now()}`,
			type: "input",
			position,
			data: {
				jsonData: '{\n  "key": "value"\n}',
				policyId: "",
				label: "Input Node",
			},
		};

		setNodes((nds) => nds.concat(newNode));
	}, [reactFlowInstance, setNodes]);

	const addActionNode = useCallback(
		(sourceNodeId: string, condition: "true" | "false") => {
			if (!reactFlowInstance) return;

			const sourceNode = nodes.find((node) => node.id === sourceNodeId);
			if (!sourceNode) return;

			const position = {
				x: sourceNode.position.x + (condition === "true" ? -150 : 150),
				y: sourceNode.position.y + 150,
			};

			const newNodeId = `action-${Date.now()}`;
			const newNode: Node<NodeData> = {
				id: newNodeId,
				type: "action",
				position,
				data: {
					actionType: "return",
					outcome: condition,
					nextPolicyId: "",
					customOutcome: "",
					label: `Action Node (${condition})`,
					parentNodeId: sourceNodeId,
					condition,
				},
			};

			const newEdge: Edge = {
				id: `edge-${sourceNodeId}-${newNodeId}`,
				source: sourceNodeId,
				target: newNodeId,
				type: "custom",
				data: { condition },
				label: condition,
			};

			setNodes((nds) => nds.concat(newNode));
			setEdges((eds) => eds.concat(newEdge));
		},
		[reactFlowInstance, nodes, setNodes, setEdges],
	);

	useEffect(() => {
		const handleAddPath = (event: CustomEvent) => {
			const { nodeId, condition } = event.detail;
			addActionNode(nodeId, condition);
		};

		window.addEventListener("add-path", handleAddPath as EventListener);
		return () => {
			window.removeEventListener("add-path", handleAddPath as EventListener);
		};
	}, [addActionNode]);

	const saveFlow = () => {
		if (nodes.length === 0) return;

		const flow = { nodes, edges };
		localStorage.setItem("flowData", JSON.stringify(flow));
		alert("Flow saved successfully!");
	};

	const runFlow = () => {
		if (nodes.length === 0) return;
		alert("Flow execution would start here with the input data");
		// In a real implementation, this would execute the flow logic
	};

	return (
		<div className="h-[80vh] w-full rounded-lg border" ref={reactFlowWrapper}>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onInit={setReactFlowInstance}
				onDragOver={onDragOver}
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				fitView
			>
				<Controls />
				<MiniMap />
				<Background />
				<Panel position="top-right">
					<div className="flex gap-2">
						<Button
							onClick={addInputNode}
							variant="outline"
							size="sm"
							className={"cursor-pointer"}
						>
							<Plus className="mr-2 h-4 w-4" /> Add Input
						</Button>
						<Button
							onClick={saveFlow}
							variant="outline"
							size="sm"
							className={"cursor-pointer"}
						>
							<Save className="mr-2 h-4 w-4" /> Save
						</Button>
						<Button
							onClick={runFlow}
							variant="default"
							size="sm"
							className={"cursor-pointer"}
						>
							<Play className="mr-2 h-4 w-4" /> Run
						</Button>
					</div>
				</Panel>
			</ReactFlow>
		</div>
	);
}
