import type { FlowNodeData, FlowEdgeData } from "~/lib/types";

interface YamlNode {
	id: string;
	type: string;
	policyId?: string;
	returnValue?: boolean | string;
	true?: string;
	false?: string;
}

export function flowToYaml(nodes: FlowNodeData[], edges: FlowEdgeData[]): string {
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
		return "# No start node found\n";
	}

	// Build YAML structure
	const yamlLines: string[] = ["flow:"];
	
	// Process nodes recursively starting from start node
	const processedNodes = new Set<string>();
	
	function processNode(nodeId: string, indent: number = 1): void {
		if (processedNodes.has(nodeId)) {
			return; // Avoid infinite loops
		}
		processedNodes.add(nodeId);
		
		const node = nodes.find(n => n.id === nodeId);
		if (!node) return;
		
		const indentStr = "  ".repeat(indent);
		const nodeData = node as any;
		
		// Add node to YAML
		yamlLines.push(`${indentStr}- id: ${node.id}`);
		yamlLines.push(`${indentStr}  type: ${node.type}`);
		
		// Add type-specific properties
		switch (node.type) {
			case "start":
			case "policy":
				if (nodeData.policyId) {
					yamlLines.push(`${indentStr}  policyId: ${nodeData.policyId}`);
				}
				if (nodeData.policyName) {
					yamlLines.push(`${indentStr}  policyName: "${nodeData.policyName}"`);
				}
				break;
			case "return":
				yamlLines.push(`${indentStr}  returnValue: ${nodeData.returnValue}`);
				break;
			case "custom":
				yamlLines.push(`${indentStr}  outcome: "${nodeData.outcome || ''}"`);
				break;
		}
		
		// Add connections
		const connections = adjacencyMap[node.id];
		if (connections) {
			if (connections.true) {
				const trueNode = nodes.find(n => n.id === connections.true);
				if (trueNode) {
					yamlLines.push(`${indentStr}  onTrue:`);
					processNode(connections.true, indent + 2);
				}
			}
			if (connections.false) {
				const falseNode = nodes.find(n => n.id === connections.false);
				if (falseNode) {
					yamlLines.push(`${indentStr}  onFalse:`);
					processNode(connections.false, indent + 2);
				}
			}
		}
	}
	
	// Start processing from the start node
	yamlLines.push("  start:");
	processNode(startNode.id, 2);
	
	// Add metadata
	yamlLines.push("\nmetadata:");
	yamlLines.push(`  totalNodes: ${nodes.length}`);
	yamlLines.push(`  totalEdges: ${edges.length}`);
	yamlLines.push(`  timestamp: ${new Date().toISOString()}`);
	
	return yamlLines.join("\n");
}

// Alternative flat structure for simpler parsing
export function flowToFlatYaml(nodes: FlowNodeData[], edges: FlowEdgeData[]): string {
	const yamlLines: string[] = ["flow:"];
	
	// List all nodes
	yamlLines.push("  nodes:");
	nodes.forEach(node => {
		const nodeData = node as any;
		yamlLines.push(`    - id: ${node.id}`);
		yamlLines.push(`      type: ${node.type}`);
		
		switch (node.type) {
			case "start":
			case "policy":
				if (nodeData.policyId) {
					yamlLines.push(`      policyId: ${nodeData.policyId}`);
				}
				if (nodeData.policyName) {
					yamlLines.push(`      policyName: "${nodeData.policyName}"`);
				}
				break;
			case "return":
				yamlLines.push(`      returnValue: ${nodeData.returnValue}`);
				break;
			case "custom":
				yamlLines.push(`      outcome: "${nodeData.outcome || ''}"`);
				break;
		}
	});
	
	// List all edges
	yamlLines.push("  edges:");
	edges.forEach(edge => {
		yamlLines.push(`    - from: ${edge.source}`);
		yamlLines.push(`      to: ${edge.target}`);
		yamlLines.push(`      condition: ${edge.sourceHandle || 'default'}`);
		if (edge.label) {
			yamlLines.push(`      label: "${edge.label}"`);
		}
	});
	
	return yamlLines.join("\n");
}