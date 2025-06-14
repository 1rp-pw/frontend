import type { FlowNodeData, FlowEdgeData } from "~/lib/types";

export interface FlowValidationResult {
	isValid: boolean;
	errors: string[];
	unterminatedNodes: string[];
}

export function validateFlowTermination(
	nodes: FlowNodeData[],
	edges: FlowEdgeData[]
): FlowValidationResult {
	const errors: string[] = [];
	const unterminatedNodes: string[] = [];
	
	// Find all terminal node types
	const terminalNodeTypes = ["return", "custom"];
	
	// Build adjacency map
	const adjacencyMap: Record<string, { true?: string; false?: string }> = {};
	edges.forEach(edge => {
		if (!adjacencyMap[edge.source]) {
			adjacencyMap[edge.source] = {};
		}
		if (edge.sourceHandle === "true") {
			adjacencyMap[edge.source].true = edge.target;
		} else if (edge.sourceHandle === "false") {
			adjacencyMap[edge.source].false = edge.target;
		}
	});
	
	// Find start node
	const startNode = nodes.find(node => node.type === "start");
	if (!startNode) {
		errors.push("No start node found in the flow");
		return { isValid: false, errors, unterminatedNodes };
	}
	
	// Check each node that should have connections
	nodes.forEach(node => {
		// Terminal nodes don't need connections
		if (terminalNodeTypes.includes(node.type)) {
			return;
		}
		
		const connections = adjacencyMap[node.id];
		const nodeData = node as any;
		
		// Check for policy ID in start and policy nodes
		if (node.type === "start" || node.type === "policy") {
			if (!nodeData.policyId || nodeData.policyId.trim() === "") {
				errors.push(`${node.type} node "${node.id}" must have a Policy ID`);
				unterminatedNodes.push(node.id);
			}
			
			// Must have both true and false paths
			if (!connections || !connections.true) {
				errors.push(`${node.type} node "${node.id}" is missing a TRUE path`);
				unterminatedNodes.push(node.id);
			}
			if (!connections || !connections.false) {
				errors.push(`${node.type} node "${node.id}" is missing a FALSE path`);
				unterminatedNodes.push(node.id);
			}
		}
	});
	
	// Use DFS to check if all paths lead to terminal nodes
	function checkPathTermination(nodeId: string, visited: Set<string>): boolean {
		if (visited.has(nodeId)) {
			// Cycle detected
			errors.push(`Circular reference detected involving node "${nodeId}"`);
			return false;
		}
		
		const node = nodes.find(n => n.id === nodeId);
		if (!node) {
			errors.push(`Referenced node "${nodeId}" not found`);
			return false;
		}
		
		// If it's a terminal node, the path is valid
		if (terminalNodeTypes.includes(node.type)) {
			return true;
		}
		
		visited.add(nodeId);
		
		const connections = adjacencyMap[nodeId];
		if (!connections) {
			// Non-terminal node with no connections
			return false;
		}
		
		let allPathsValid = true;
		
		// Check true path
		if (connections.true) {
			const truePathValid = checkPathTermination(connections.true, new Set(visited));
			if (!truePathValid) {
				allPathsValid = false;
			}
		}
		
		// Check false path
		if (connections.false) {
			const falsePathValid = checkPathTermination(connections.false, new Set(visited));
			if (!falsePathValid) {
				allPathsValid = false;
			}
		}
		
		return allPathsValid;
	}
	
	// Start validation from the start node
	if (startNode) {
		const visited = new Set<string>();
		const isTerminated = checkPathTermination(startNode.id, visited);
		if (!isTerminated && errors.length === 0) {
			errors.push("Not all paths lead to terminal nodes");
		}
	}
	
	// Check for orphaned nodes (not connected to the flow)
	const reachableNodes = new Set<string>();
	function markReachable(nodeId: string) {
		if (reachableNodes.has(nodeId)) return;
		reachableNodes.add(nodeId);
		
		const connections = adjacencyMap[nodeId];
		if (connections) {
			if (connections.true) markReachable(connections.true);
			if (connections.false) markReachable(connections.false);
		}
	}
	
	if (startNode) {
		markReachable(startNode.id);
		
		nodes.forEach(node => {
			if (!reachableNodes.has(node.id) && node.id !== startNode.id) {
				errors.push(`Node "${node.id}" is not connected to the flow`);
				unterminatedNodes.push(node.id);
			}
		});
	}
	
	// Remove duplicates from unterminated nodes
	const uniqueUnterminatedNodes = [...new Set(unterminatedNodes)];
	
	return {
		isValid: errors.length === 0,
		errors,
		unterminatedNodes: uniqueUnterminatedNodes,
	};
}