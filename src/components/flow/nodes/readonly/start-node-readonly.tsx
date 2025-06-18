"use client";

import { Handle, type NodeProps, Position } from "@xyflow/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import type { StartNodeData } from "~/lib/types";

export function StartNodeReadonly({ data }: NodeProps) {
	const policyId = (data as unknown as StartNodeData)?.policyId || "";
	const policyName = (data as unknown as StartNodeData)?.policyName || "";

	return (
		<Card className="min-h-48 w-96 rounded-xl border border-border bg-card shadow-sm">
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 font-medium text-sm">
					<div className="h-3 w-3 rounded-full bg-green-500" />
					Start Node
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="space-y-2">
					<div>
						<Label className="font-medium text-xs">Policy:</Label>
						<div className="text-muted-foreground text-xs">
							{policyName || policyId || "Not selected"}
						</div>
					</div>
				</div>

				{/* True/False Labels */}
				<div className="space-y-2 border-border border-t pt-3">
					<div className="grid grid-cols-2 gap-2">
						<div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-center">
							<span className="font-medium text-green-700 text-xs">
								True Path
							</span>
						</div>
						<div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-center">
							<span className="font-medium text-red-700 text-xs">
								False Path
							</span>
						</div>
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
