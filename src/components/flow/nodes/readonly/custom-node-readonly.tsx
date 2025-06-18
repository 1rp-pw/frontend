"use client";

import { Handle, type NodeProps, Position } from "@xyflow/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import type { CustomNodeData } from "~/lib/types";

export function CustomNodeReadonly({ data }: NodeProps) {
	const outcome = (data as unknown as CustomNodeData).outcome || "";

	return (
		<Card className="min-h-28 w-56 rounded-xl border border-border bg-card shadow-sm">
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center justify-between font-medium text-sm">
					<div className="flex items-center gap-2">
						<div className="h-3 w-3 rounded-full bg-purple-500" />
						Custom Node
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="space-y-2">
					<div>
						<Label className="font-medium text-xs">Outcome:</Label>
						<div className="rounded bg-gray-100 p-2 text-gray-600 text-xs">
							{outcome || "No outcome set"}
						</div>
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
