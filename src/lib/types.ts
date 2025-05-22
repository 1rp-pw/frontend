export interface NodeData {
  label?: string

  // Input node data
  jsonData?: string
  policyId?: string

  // Action node data
  actionType?: "return" | "policy" | "custom"
  outcome?: string
  nextPolicyId?: string
  customOutcome?: string
  parentNodeId?: string
  condition?: "true" | "false"
}
