"use client";

import { Handle, type NodeProps, Position } from "@xyflow/react";
import { Plus, Search } from "lucide-react";
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
import { Textarea } from "~/components/ui/textarea";
import { usePolicySearch } from "~/hooks/use-policy-search";
import type { StartNodeData } from "~/lib/types";

export function StartNode({ data, id }: NodeProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [jsonData, setJsonData] = useState(
		(data as unknown as StartNodeData).jsonData || "{}",
	);
	const [policyId, setPolicyId] = useState(
		(data as unknown as StartNodeData).policyId || "",
	);
	const [policyName, setPolicyName] = useState(
		(data as unknown as StartNodeData).policyName || "",
	);
	const [showPolicySearch, setShowPolicySearch] = useState(false);
	const { policies, isLoading, searchPolicies } = usePolicySearch();
	const { addConnectedNode, getConnectedNodes } = useFlowContext();
	const connectedNodes = getConnectedNodes(id);

	const handleSave = () => {
		// Update node data
		(data as unknown as StartNodeData).jsonData = jsonData;
		(data as unknown as StartNodeData).policyId = policyId;
		(data as unknown as StartNodeData).policyName = policyName;
		setIsEditing(false);
	};

	const handleCancel = () => {
		setJsonData((data as unknown as StartNodeData).jsonData || "{}");
		setPolicyId((data as unknown as StartNodeData).policyId || "");
		setPolicyName((data as unknown as StartNodeData).policyName || "");
		setIsEditing(false);
	};

	return (
		<Card className="min-h-48 w-96 rounded-xl border border-border bg-card shadow-sm">
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-sm font-medium">
					<div className="h-3 w-3 rounded-full bg-green-500" />
					Start Node
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{!isEditing ? (
					<div className="space-y-2">
						<div>
							<Label className="text-xs font-medium">JSON Data:</Label>
							<div className="max-h-20 overflow-y-auto rounded-md bg-muted p-2 text-xs text-muted-foreground">
								{jsonData || "{}"}
							</div>
						</div>
						<div>
							<Label className="text-xs font-medium">Policy:</Label>
							<div className="text-xs text-muted-foreground">
								{policyName || policyId || "Not selected"}
							</div>
						</div>
						<Button
							size="sm"
							variant="outline"
							onClick={() => setIsEditing(true)}
							className="w-full"
						>
							Edit
						</Button>
					</div>
				) : (
					<div className="space-y-3">
						<div>
							<Label htmlFor={`json-${id}`} className="text-xs font-medium">
								JSON Data
							</Label>
							<Textarea
								id={`json-${id}`}
								value={jsonData}
								onChange={(e) => setJsonData(e.target.value)}
								placeholder='{"key": "value"}'
								className="min-h-20 text-xs"
							/>
						</div>
						<div>
							<Label className="text-xs font-medium">Policy Selection</Label>
							<div className="space-y-2">
								<div className="flex gap-2">
									<Input
										value={policyId}
										onChange={(e) => setPolicyId(e.target.value)}
										placeholder="Policy ID"
										className="text-xs"
									/>
									<Button
										size="sm"
										variant="outline"
										onClick={() => setShowPolicySearch(!showPolicySearch)}
										disabled={!policyId.trim()}
									>
										<Search className="h-3 w-3" />
									</Button>
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
								className="text-xs"
							>
								Cancel
							</Button>
						</div>
					</div>
				)}

				{/* True/False Action Buttons */}
				<div className="space-y-2 border-t border-border pt-3">
					<div className="grid grid-cols-2 gap-2">
						<Button
							size="sm"
							variant={connectedNodes.true ? "default" : "outline"}
							onClick={() => addConnectedNode(id, "true")}
							className="w-full text-xs"
							disabled={!!connectedNodes.true}
						>
							<Plus className="mr-1 h-3 w-3" />
							{connectedNodes.true ? "True Connected" : "Add True"}
						</Button>
						<Button
							size="sm"
							variant={connectedNodes.false ? "secondary" : "outline"}
							onClick={() => addConnectedNode(id, "false")}
							className="w-full text-xs"
							disabled={!!connectedNodes.false}
						>
							<Plus className="mr-1 h-3 w-3" />
							{connectedNodes.false ? "False Connected" : "Add False"}
						</Button>
					</div>
				</div>
			</CardContent>

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
