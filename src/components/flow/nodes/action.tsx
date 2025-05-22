"use client"

import type React from "react"

import { useState } from "react"
import { Handle, Position, type NodeProps, useReactFlow } from "reactflow"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Plus } from "lucide-react"
import type { NodeData } from "~/lib/types"

export function ActionNode({ id, data, isConnectable }: NodeProps<NodeData>) {
  const [actionType, setActionType] = useState(data.actionType || "return")
  const [outcome, setOutcome] = useState(data.outcome || "true")
  const [nextPolicyId, setNextPolicyId] = useState(data.nextPolicyId || "")
  const [customOutcome, setCustomOutcome] = useState(data.customOutcome || "")

  const { setNodes, setEdges, getNodes, getEdges } = useReactFlow()

  const handleActionTypeChange = (value: string) => {
    setActionType(value as "return" | "policy" | "custom")
    data.actionType = value as "return" | "policy" | "custom"
  }

  const handleNextPolicyIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setNextPolicyId(newValue)
    data.nextPolicyId = newValue
  }

  const handleCustomOutcomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setCustomOutcome(newValue)
    data.customOutcome = newValue
  }

  return (
    <Card className="w-[300px]">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-md">{data.condition === "true" ? "True Path" : "False Path"}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor={`action-type-${id}`}>Action Type</Label>
            <Select value={actionType} onValueChange={handleActionTypeChange}>
              <SelectTrigger id={`action-type-${id}`}>
                <SelectValue placeholder="Select action type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="return">Return Outcome</SelectItem>
                <SelectItem value="policy">New Policy</SelectItem>
                <SelectItem value="custom">Custom Outcome</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {actionType === "policy" && (
            <div className="space-y-1">
              <Label htmlFor={`next-policy-${id}`}>Next Policy ID</Label>
              <Input
                id={`next-policy-${id}`}
                value={nextPolicyId}
                onChange={handleNextPolicyIdChange}
                placeholder="Enter next service ID"
              />
            </div>
          )}

          {actionType === "custom" && (
            <div className="space-y-1">
              <Label htmlFor={`custom-outcome-${id}`}>Custom Outcome</Label>
              <Input
                id={`custom-outcome-${id}`}
                value={customOutcome}
                onChange={handleCustomOutcomeChange}
                placeholder="Enter custom outcome"
              />
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-green-500 hover:bg-green-50 hover:text-green-700 cursor-pointer"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("add-path", { detail: { nodeId: id, condition: "true" } }))
              }
            >
              <Plus className="mr-2 h-4 w-4" /> True Path
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-red-500 hover:bg-red-50 hover:text-red-700 cursor-pointer"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("add-path", { detail: { nodeId: id, condition: "false" } }))
              }
            >
              <Plus className="mr-2 h-4 w-4" /> False Path
            </Button>
          </div>
        </div>
      </CardContent>
      <Handle
        type="target"
        position={Position.Top}
        id="target"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-primary"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-primary"
      />
    </Card>
  )
}
