"use client";

import { Handle, type NodeProps, Position } from "@xyflow/react";
import { X } from "lucide-react";
import { useFlowContext } from "~/components/flow/flow-context";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import type { ReturnNodeData } from "~/lib/types";

export function ReturnNode({ data, id }: NodeProps) {
	const returnValue = (data as unknown as ReturnNodeData).returnValue;
	const { changeNodeType, deleteNode } = useFlowContext();

	const bgColor = returnValue
		? "bg-green-50 border-green-500"
		: "bg-red-50 border-red-500";
	const dotColor = returnValue ? "bg-green-500" : "bg-red-500";

	return (
		<Card className="min-h-24 w-48 rounded-xl border border-border bg-card shadow-sm">
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center justify-between font-medium text-sm">
					<div className="flex items-center gap-2">
						<div className={`h-3 w-3 ${dotColor} rounded-full`} />
						Return Node
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
				<div className="space-y-2">
					<div>
						<Label className="font-medium text-xs">Return Value:</Label>
						<div
							className={`font-bold text-sm ${returnValue ? "text-green-600" : "text-red-600"}`}
						>
							{returnValue ? "TRUE" : "FALSE"}
						</div>
					</div>
					<div className="text-muted-foreground text-xs">
						This node returns {returnValue ? "true" : "false"} when reached
					</div>
				</div>

				{/* Node Type Conversion */}
				<div className="border-border border-t pt-3">
					<Label className="font-medium text-xs">Change to:</Label>
					<div className="mt-1 flex gap-1">
						<Button
							size="sm"
							variant="outline"
							onClick={() => changeNodeType(id, "policy")}
							className="flex-1 text-xs"
						>
							Policy
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={() => changeNodeType(id, "custom")}
							className="flex-1 text-xs"
						>
							Custom
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
		</Card>
	);
}
