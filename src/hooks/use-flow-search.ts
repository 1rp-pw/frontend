import { useCallback, useEffect, useState } from "react";

interface FlowSearchResult {
	id: string;
	name: string;
	description?: string;
	status: string;
	createdAt: string;
	updatedAt: string;
}

export function useFlowSearch() {
	const [flows, setFlows] = useState<FlowSearchResult[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const searchFlows = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/flows");
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();
			setFlows(result || []);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to search flows";
			setError(errorMessage);
			setFlows([]);
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Auto-search on mount
	useEffect(() => {
		searchFlows();
	}, [searchFlows]);

	return {
		flows,
		isLoading,
		error,
		searchFlows,
	};
}
