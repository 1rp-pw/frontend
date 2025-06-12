import {useEffect, useState} from "react";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "~/components/ui/table";
import type {PolicySpec} from "~/lib/types";
import Link from "next/link";

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

export default function PolicyList() {
	const [policies, setPolicies] = useState<PolicySpec[]>([]);
	useEffect(() => {
		getList().then((policies) => {
			setPolicies(policies);
		});
	}, [])

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead>Created</TableHead>
					<TableHead>Updated</TableHead>
					<TableHead>Version</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{policies.map((policy: PolicySpec) => (
					<TableRow key={policy.id}>
						<TableCell><Link href={`/policy/${policy.id}`}>{policy.name}</Link></TableCell>
						<TableCell><Link href={`/policy/${policy.id}`}>{formatDate(policy.createdAt)}</Link></TableCell>
						<TableCell><Link href={`/policy/${policy.id}`}>{formatDate(policy.updatedAt)}</Link></TableCell>
						<TableCell><Link href={`/policy/${policy.id}`}>{policy.version}</Link></TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	)
}
