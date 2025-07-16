"use client";

import { Handle, type NodeProps, Position } from "@xyflow/react";
import { X } from "lucide-react";
import { useState } from "react";
import { useFlowContext } from "~/components/flow/flow-context";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { CustomNodeData } from "~/lib/types";

export function CustomNode({ data, id }: NodeProps<CustomNodeData>) {
	const [isEditing, setIsEditing] = useState(false);
	const [outcome, setOutcome] = useState(data.outcome || "");
	const { deleteNode, onNodeValueChange } = useFlowContext();

	const handleSave = () => {
		// Log value change
		if (data.outcome !== outcome) {
			onNodeValueChange(id, "custom", data.outcome, outcome, "outcome");
		}

		data.outcome = outcome;
		setIsEditing(false);
	};

	const handleCancel = () => {
		setOutcome(data.outcome || "");
		setIsEditing(false);
	};

	const calledPath = data.calledPath;
	console.info("CustomNode - calledPath:", calledPath, "full data:", data);
	const borderStyle =
		calledPath === true
			? "border-2 border-green-500"
			: calledPath === false
				? "border-2 border-red-500"
				: "border border-border";

	return (
		<Card
			className={`min-h-28 w-56 rounded-xl bg-card shadow-sm ${borderStyle}`}
		>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center justify-between font-medium text-sm">
					<div className="flex items-center gap-2">
						<div className="h-3 w-3 rounded-full bg-purple-500" />
						Custom Node
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
					<div className="space-y-2">
						<div>
							<Label className="font-medium text-xs">Outcome:</Label>
							{/** biome-ignore lint/a11y/noStaticElementInteractions: cleaner */}
							{/** biome-ignore lint/a11y/useKeyWithClickEvents: cleaner*/}
							<div
								className="cursor-context-menu rounded bg-gray-300 p-2 text-gray-600 text-xs"
								onClick={() => setIsEditing(true)}
							>
								{outcome || "No outcome set"}
							</div>
						</div>
					</div>
				) : (
					<div className="space-y-3">
						<div>
							<Label htmlFor={`outcome-${id}`} className="font-medium text-xs">
								Custom Outcome
							</Label>
							<Input
								id={`outcome-${id}`}
								value={outcome}
								onChange={(e) => setOutcome(e.target.value)}
								onKeyUp={(e) => {
									if (e.key === "Enter" || e.key === "Return") {
										handleSave();
									}
								}}
								placeholder="Enter custom outcome"
								className="text-xs"
							/>
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
			</CardContent>

			{/* Input handle */}
			<Handle
				type="target"
				position={Position.Left}
				style={{ background: "#555" }}
			/>
		</Card>
	);
}
