"use client";

import { Handle, type NodeProps, Position } from "@xyflow/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import type { ReturnNodeData } from "~/lib/types";

export function ReturnNodeReadonly({ data }: NodeProps) {
	const returnValue = (data as unknown as ReturnNodeData).returnValue;

	const dotColor = returnValue ? "bg-green-500" : "bg-red-500";

	return (
		<Card className="min-h-24 w-48 rounded-xl border border-border bg-card shadow-sm">
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center justify-between font-medium text-sm">
					<div className="flex items-center gap-2">
						<div className={`h-3 w-3 ${dotColor} rounded-full`} />
						Return Node
					</div>
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
