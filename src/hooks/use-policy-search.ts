"use client";

import { useCallback, useEffect, useState } from "react";
import type { PolicySpec } from "~/lib/types";

export function usePolicySearch() {
	const [policies, setPolicies] = useState<PolicySpec[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const searchPolicies = useCallback(async (query?: string) => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/policies");
			if (!response.ok) {
				throw new Error("Failed to fetch policies");
			}

			const data = await response.json();
			let filteredPolicies = data.policies || [];

			if (query?.trim()) {
				filteredPolicies = filteredPolicies.filter(
					(policy: PolicySpec) =>
						policy.name.toLowerCase().includes(query.toLowerCase()) ||
						policy.id.toLowerCase().includes(query.toLowerCase()) ||
						policy.description?.toLowerCase().includes(query.toLowerCase()),
				);
			}

			setPolicies(filteredPolicies);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch policies");
			setPolicies([]);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		searchPolicies();
	}, [searchPolicies]);

	return {
		policies,
		isLoading,
		error,
		searchPolicies,
	};
}
