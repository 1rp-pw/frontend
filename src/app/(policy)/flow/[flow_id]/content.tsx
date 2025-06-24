"use client";

import { Clock, FilePenLine, FilePlus2, FileText } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FlowVersionPreview } from "~/components/flow/FlowVersionPreview";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Skeleton } from "~/components/ui/skeleton";
import type { FlowSpec } from "~/lib/types";

async function getFlowVersions(flow_id: string) {
	const resp = await fetch(`/api/flow/versions?flow_id=${flow_id}`, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
	});
	return await resp.json();
}

export default function FlowInfo({ flow_id }: { flow_id: string }) {
	const [versionsLoading, setVersionsLoading] = useState<boolean>(true);
	const [versions, setVersions] = useState<FlowSpec[]>([]);
	const [selectedVersion, setSelectedVersion] = useState<FlowSpec | null>(null);
	const [loadError, setLoadError] = useState<Error | null>(null);
	const [hasDraft, setHasDraft] = useState<boolean>(false);

	const getStatusVariant = (status: string) => {
		switch (status) {
			case "draft":
				return "secondary";
			default:
				return "default";
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: only update when the flow_id changes
	useEffect(() => {
		getFlowVersions(flow_id).then((respVersions) => {
			if (respVersions.error !== null) {
				setLoadError(respVersions.error);
			}

			setVersions(respVersions);
			setHasDraft(respVersions.some((v: FlowSpec) => v.draft));

			// Auto-select the first version if available
			if (respVersions.length > 0 && !selectedVersion) {
				setSelectedVersion(respVersions[0]);
			}
			setVersionsLoading(false);
		});
	}, [flow_id]);

	if (versionsLoading) {
		return (
			<div className="flex flex-col space-y-3">
				<h2>Loading Flow</h2>
				<Skeleton className="h-[30vh] w-full rounded-xl" />
				<div className="space-y-2">
					<Skeleton className="h-4 w-[50vw]" />
					<Skeleton className="h-4 w-[25vw]" />
				</div>
			</div>
		);
	}

	if (versions.length === 0) {
		return null;
	}
	if (loadError !== null && loadError !== undefined) {
		console.info("loadError", loadError);
		return null;
	}

	return (
		<div className={"flex h-screen bg-background"}>
			<div className={"w-1/4 border-r bg-muted/10"}>
				<div className={"border-b p-4"}>
					<h2 className={"flex items-center gap-2 text-lg text-semibold"}>
						{versions[0]?.name} Version History
					</h2>
					<p className={"mt-1 text-muted-foreground text-sm"}>
						{versions.length} versions available
					</p>
				</div>
				<ScrollArea className={"h-[calc(100vh-80px)]"}>
					<div className={"p-2"}>
						{versions.map((version) => (
							<Card
								key={`card-${version.id}`}
								className={`mb-2 cursor-pointer transition-colors hover:bg-muted/50 ${selectedVersion?.id === version.id ? "bg-muted/30 ring-2 ring-primary" : ""}`}
								onClick={() => setSelectedVersion(version)}
							>
								<CardHeader className={"pb-2"}>
									<div className={"flex items-start justify-between"}>
										<div className={"flex-1"}>
											<CardTitle className={"font-medium text-sm"}>
												{version.draft ? "Draft" : version.version}
											</CardTitle>
											<CardDescription className={"text-xs"}>
												{version.description}
											</CardDescription>
										</div>
										<Badge
											variant={getStatusVariant(version.status)}
											className={"text-xs"}
										>
											{version.status === "draft" ? "Draft" : "Published"}
										</Badge>
									</div>
								</CardHeader>
								<CardContent className={"pt-0"}>
									<div
										className={
											"mt-2 flex items-center gap-1 text-muted-foreground text-xs"
										}
									>
										<Clock className={"h-3 w-3"} />
										{new Date(version.createdAt).toLocaleDateString()}
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</ScrollArea>
			</div>

			<div className={"flex flex-1 flex-col"}>
				<div className={"flex h-[65vh] flex-col"}>
					<div className={"flex-shrink-0 border-b bg-muted/5 p-6"}>
						<div className={"flex items-start justify-between"}>
							<div>
								<h1 className={"font-bold text-2xl"}>
									{selectedVersion?.version ?? ""}
								</h1>
								<div className={"mt-2 flex items-center gap-3"}>
									{selectedVersion && (
										<>
											<span className={"text-muted-foreground text-sm"}>
												Created{" "}
												{selectedVersion &&
													new Date(
														selectedVersion?.createdAt,
													).toLocaleDateString()}
											</span>
											<span className={"text-muted-foreground text-sm"}>
												Updated{" "}
												{new Date(
													selectedVersion?.updatedAt,
												).toLocaleDateString()}
											</span>
										</>
									)}
								</div>
							</div>
							{selectedVersion &&
								(selectedVersion?.draft ? (
									<Button variant={"outline"} size={"sm"} asChild>
										<Link href={`/flow/${selectedVersion.id}/edit`}>
											<FilePenLine className={"mr-2 h-4 w-4"} />
											Edit Draft
										</Link>
									</Button>
								) : (
									<div className={"flex gap-2"}>
										{!hasDraft && (
											<Button variant={"outline"} size={"sm"} asChild>
												<Link href={`/flow/${selectedVersion.id}/draft`}>
													<FilePlus2 className={"mr-2 h-4 w-4"} />
													Create Draft
												</Link>
											</Button>
										)}
										<Button variant={"outline"} size={"sm"} asChild>
											<Link href={`/flow/${selectedVersion.id}/view`}>
												<FileText className={"mr-2 h-4 w-4"} />
												View Details
											</Link>
										</Button>
									</div>
								))}
						</div>
					</div>

					<div className={"min-h-0 flex-1"}>
						{selectedVersion ? (
							<FlowVersionPreview
								nodes={selectedVersion.nodes}
								edges={selectedVersion.edges}
								className="h-full"
							/>
						) : (
							<div
								className={
									"flex h-32 items-center justify-center text-muted-foreground"
								}
							>
								Select a version to view its flow
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
