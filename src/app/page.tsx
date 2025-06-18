"use client";

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
import type { FlowSpec, PolicySpec } from "~/lib/types";

async function getPolicyList() {
	const resp = await fetch("/api/policies", {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
	});
	return await resp.json();
}

async function getFlowList() {
	const resp = await fetch("/api/flows", {
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
	const [flows, setFlows] = useState<FlowSpec[]>([]);

	useEffect(() => {
		getPolicyList().then((policyData) => {
			setPolicies(policyData);
		});
		getFlowList().then((flowData) => {
			setFlows(flowData);
		});
	}, []);

	const getPolicies = () => {
		if (policies.length === 0) return null;

		return (
			<div>
				<h2 className="mb-4 font-semibold text-2xl">Policies</h2>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Created</TableHead>
							<TableHead>Updated</TableHead>
							<TableHead>Last Published</TableHead>
							<TableHead>Has Draft In Progress</TableHead>
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
									<Link href={`/policy/${policy.baseId}`}>
										{policy.hasDraft ? "Yes" : "No"}
									</Link>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		);
	};

	const getFlows = () => {
		if (flows.length === 0) return null;

		return (
			<div>
				<h2 className="mb-4 font-semibold text-2xl">Flows</h2>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Created</TableHead>
							<TableHead>Updated</TableHead>
							<TableHead>Last Published</TableHead>
							<TableHead>Has Draft In Progress</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{flows.map((flow: FlowSpec) => (
							<TableRow key={flow.baseId}>
								<TableCell>
									<Link href={`/flow/${flow.baseId}`}>{flow.name}</Link>
								</TableCell>
								<TableCell>
									<Link href={`/flow/${flow.baseId}`}>
										{formatDate(flow.createdAt)}
									</Link>
								</TableCell>
								<TableCell>
									<Link href={`/policy/${flow.baseId}`}>
										{formatDate(flow.updatedAt)}
									</Link>
								</TableCell>
								<TableCell>
									<Link href={`/flow/${flow.baseId}`}>
										{isValidPublishDate(flow.lastPublishedAt) &&
										flow.lastPublishedAt
											? formatDate(flow.lastPublishedAt)
											: "Not Published Yet"}
									</Link>
								</TableCell>
								<TableCell>
									<Link href={`/flow/${flow.baseId}`}>
										{flow.hasDraft ? "Yes" : "No"}
									</Link>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		);
	};

	return (
		<div className="space-y-8">
			{getPolicies()}
			{getFlows()}
		</div>
	);
}
