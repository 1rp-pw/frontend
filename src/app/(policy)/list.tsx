import Link from "next/link";
import { useEffect, useState } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import type { PolicySpec } from "~/lib/types";

async function getList() {
	const resp = await fetch("/api/policies", {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
	});
	return await resp.json();
}

function formatDate(date: Date | string) {
	const d = typeof date === "string" ? new Date(date) : date;
	return `${d.toLocaleDateString()}, ${d.toLocaleTimeString()}`;
}

function isValidPublishDate(date: Date | string | undefined): boolean {
	if (!date) return false;
	const dateStr = typeof date === "string" ? date : date.toISOString();
	return !dateStr.startsWith("0001-01-01");
}

export default function PolicyList() {
	const [policies, setPolicies] = useState<PolicySpec[]>([]);
	useEffect(() => {
		getList().then((policies) => {
			setPolicies(policies);
		});
	}, []);

	if (policies.length === 0) {
		return (
			<div className="flex h-screen bg-background">
				<div className="w-1/4 border-r bg-muted/10">
					<div className="border-b p-4">
						<h2 className="flex items-center gap-2 text-lg text-semibold">
							Policies
						</h2>
						<p className="mt-1 text-muted-foreground text-sm">
							No policies found
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead>Created</TableHead>
					<TableHead>Updated</TableHead>
					<TableHead>Last Published</TableHead>
					<TableHead>Version</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{policies.map((policy: PolicySpec) => (
					<TableRow key={policy.baseId}>
						<TableCell>
							<Link href={`/policy/${policy.baseId}`}>{policy.name}</Link>
						</TableCell>
						<TableCell>
							<Link href={`/policy/${policy.baseId}`}>
								{formatDate(policy.createdAt)}
							</Link>
						</TableCell>
						<TableCell>
							<Link href={`/policy/${policy.baseId}`}>
								{formatDate(policy.updatedAt)}
							</Link>
						</TableCell>
						<TableCell>
							<Link href={`/policy/${policy.baseId}`}>
								{isValidPublishDate(policy.lastPublishedAt) &&
								policy.lastPublishedAt
									? formatDate(policy.lastPublishedAt)
									: "Not Published Yet"}
							</Link>
						</TableCell>
						<TableCell>
							<Link href={`/policy/${policy.baseId}`}>{policy.version}</Link>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
