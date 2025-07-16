"use client";

import { Handle, type NodeProps, Position } from "@xyflow/react";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { useFlowContext } from "~/components/flow/flow-context";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { usePolicySearch } from "~/hooks/use-policy-search";
import type { PolicyNodeData } from "~/lib/types";

export function PolicyNode({ data, id }: NodeProps) {
	const [isEditing, setIsEditing] = useState(false);
	const nodeData = data as PolicyNodeData;
	const [policyId, setPolicyId] = useState(nodeData?.policyId || "");
	const [policyName, setPolicyName] = useState(nodeData?.policyName || "");
	const [showPolicySearch, setShowPolicySearch] = useState(false);
	const { policies, isLoading } = usePolicySearch();
	const { addConnectedNode, getConnectedNodes, deleteNode, onNodeValueChange } =
		useFlowContext();
	const connectedNodes = getConnectedNodes(id);

	const handleSave = () => {
		if (!nodeData) {
			return;
		}

		// Log value changes
		if (nodeData.policyId !== policyId) {
			onNodeValueChange(id, "policy", nodeData?.policyId, policyId, "policyId");
		}
		if (nodeData.policyName !== policyName) {
			onNodeValueChange(
				id,
				"policy",
				nodeData.policyName,
				policyName,
				"policyName",
			);
		}

		nodeData.policyId = policyId;
		nodeData.policyName = policyName;
		setIsEditing(false);
	};

	const handleCancel = () => {
		setPolicyId(nodeData?.policyId || "");
		setPolicyName(nodeData?.policyName || "");
		setIsEditing(false);
	};

	const calledPath = nodeData?.calledPath;
	const borderStyle =
		calledPath === true
			? "border-2 border-green-500"
			: calledPath === false
				? "border-2 border-red-500"
				: "border border-border";

	return (
		<Card
			className={`min-h-32 w-96 rounded-xl bg-card shadow-sm ${borderStyle}`}
		>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center justify-between font-medium text-sm">
					<div className="flex items-center gap-2">
						<div className="h-3 w-3 rounded-full bg-blue-500" />
						Policy Node
					</div>
					<Button
						size="sm"
						variant="ghost"
						onClick={() => deleteNode(id)}
						className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
					>
						<X className="h-3 w-3" />
					</Button>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{!isEditing ? (
					// biome-ignore lint/a11y: intentionally using click-only
					<div
						className=" cursor-pointer space-y-2"
						onClick={() => setIsEditing(true)}
					>
						<Label className="font-medium text-xs">Policy:</Label>
						<div className="text-muted-foreground text-xs">
							{(policyName || policyId || "Not selected") as string}
						</div>
					</div>
				) : (
					<div className="space-y-3">
						<div>
							<Label className="font-medium text-xs">Policy Selection</Label>
							<div className="space-y-2">
								<div className="flex gap-2">
									<Input
										value={policyId as string}
										onChange={(e) => setPolicyId(e.target.value)}
										placeholder="Policy ID"
										className="text-xs"
										onKeyUp={(e) => {
											if (e.key === "Enter" || e.key === "Return") {
												handleSave();
											}
										}}
									/>
									{/*<Button*/}
									{/*	size="sm"*/}
									{/*	variant="outline"*/}
									{/*	onClick={() => setShowPolicySearch(!showPolicySearch)}*/}
									{/*	disabled={!policyId.trim()}*/}
									{/*>*/}
									{/*	<Search className="h-3 w-3" />*/}
									{/*</Button>*/}
								</div>
								{showPolicySearch && (
									<Select
										onValueChange={(value) => {
											const selectedPolicy = policies.find(
												(p) => p.id === value,
											);
											setPolicyId(value);
											setPolicyName(selectedPolicy?.name || `Policy ${value}`);
											setShowPolicySearch(false);
										}}
									>
										<SelectTrigger className="text-xs">
											<SelectValue
												placeholder={
													isLoading ? "Loading..." : "Search policies..."
												}
											/>
										</SelectTrigger>
										<SelectContent>
											{policies.map((policy) => (
												<SelectItem key={policy.id} value={policy.id}>
													{policy.name}
												</SelectItem>
											))}
											{policies.length === 0 && !isLoading && (
												<SelectItem value="no-policies" disabled>
													No policies found
												</SelectItem>
											)}
										</SelectContent>
									</Select>
								)}
							</div>
						</div>
						<div className="flex gap-2">
							<Button size="sm" onClick={handleSave} className="flex-1">
								Save
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={handleCancel}
								className="flex-1"
							>
								Cancel
							</Button>
						</div>
					</div>
				)}

				{/* True/False Action Buttons */}
				<div className="space-y-2 border-t pt-3">
					<div className="flex gap-2">
						<Button
							size="sm"
							variant={connectedNodes.true ? "default" : "outline"}
							onClick={() => addConnectedNode(id, "true")}
							className="flex-1 bg-green-500 text-white hover:bg-green-600"
							disabled={!!connectedNodes.true}
						>
							<Plus className="mr-1 h-3 w-3" />
							{connectedNodes.true ? "True Connected" : "Add True"}
						</Button>
						<Button
							size="sm"
							variant={connectedNodes.false ? "default" : "outline"}
							onClick={() => addConnectedNode(id, "false")}
							className="flex-1 bg-red-500 text-white hover:bg-red-600"
							disabled={!!connectedNodes.false}
						>
							<Plus className="mr-1 h-3 w-3" />
							{connectedNodes.false ? "False Connected" : "Add False"}
						</Button>
					</div>
				</div>
			</CardContent>

			{/* Input handle */}
			<Handle
				type="target"
				position={Position.Left}
				style={{ background: "#555" }}
			/>

			{/* Keep handles for visual connection lines but make them invisible */}
			<Handle
				type="source"
				position={Position.Right}
				id="true"
				style={{ opacity: 0, pointerEvents: "none" }}
			/>
			<Handle
				type="source"
				position={Position.Right}
				id="false"
				style={{ opacity: 0, pointerEvents: "none" }}
			/>
		</Card>
	);
}
