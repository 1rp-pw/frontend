"use client";

import type React from "react";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Handle, type NodeProps, Position } from "reactflow";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import type { NodeData } from "~/lib/types";

export function InputNode({ id, data, isConnectable }: NodeProps<NodeData>) {
	const [jsonData, setJsonData] = useState(
		data.jsonData || '{\n  "key": "value"\n}',
	);
	const [policyId, setPolicyId] = useState(data.policyId || "");

	const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newValue = e.target.value;
		setJsonData(newValue);
		data.jsonData = newValue;
	};

	const handlePolicyIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		setPolicyId(newValue);
		data.policyId = newValue;
	};

	return (
		<Card className="w-[300px]">
			<CardHeader className="p-4 pb-2">
				<CardTitle className="text-md">Input Data</CardTitle>
			</CardHeader>
			<CardContent className="p-4 pt-0">
				<div className="space-y-3">
					<div className="space-y-1">
						<Label htmlFor={`json-${id}`}>JSON Data</Label>
						<Textarea
							id={`json-${id}`}
							value={jsonData}
							onChange={handleJsonChange}
							className="min-h-[100px] font-mono text-sm"
						/>
					</div>
					<div className="space-y-1">
						<Label htmlFor={`policy-id-${id}`}>Policy ID</Label>
						<Input
							id={`service-id-${id}`}
							value={policyId}
							onChange={handlePolicyIdChange}
							placeholder="Enter policy ID"
						/>
					</div>
					<div className="mt-4 flex gap-2">
						<Button
							variant="outline"
							size="sm"
							className="flex-1 border-green-500 hover:bg-green-50 hover:text-green-700"
							onClick={() =>
								window.dispatchEvent(
									new CustomEvent("add-path", {
										detail: { nodeId: id, condition: "true" },
									}),
								)
							}
						>
							<Plus className="mr-2 h-4 w-4" /> True Path
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="flex-1 border-red-500 hover:bg-red-50 hover:text-red-700"
							onClick={() =>
								window.dispatchEvent(
									new CustomEvent("add-path", {
										detail: { nodeId: id, condition: "false" },
									}),
								)
							}
						>
							<Plus className="mr-2 h-4 w-4" /> False Path
						</Button>
					</div>
				</div>
			</CardContent>
			<Handle
				type="source"
				position={Position.Bottom}
				id="source"
				isConnectable={isConnectable}
				className="h-3 w-3 bg-primary"
			/>
		</Card>
	);
}
