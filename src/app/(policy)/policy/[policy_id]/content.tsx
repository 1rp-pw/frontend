"use client";

import {
	Clock,
	FilePenLine,
	FilePlus2,
	FileText,
	GitCompareArrows,
	PackageCheck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DiffModal } from "~/components/policy/diff-modal";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { highlightText } from "~/components/ui/highlight";
import { RainbowBraces } from "~/components/ui/rainbow";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Skeleton } from "~/components/ui/skeleton";
import type { PolicySpec } from "~/lib/types";

async function getPolicyVersions(policy_id: string) {
	const resp = await fetch(`/api/policy/versions?policy_id=${policy_id}`, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
	});
	return await resp.json();
}

export default function PolicyInfo({ policy_id }: { policy_id: string }) {
	const [hasDraft, setHasDraft] = useState<boolean>(false);
	const [versionsLoading, setVersionsLoading] = useState<boolean>(true);
	const [versions, setVersions] = useState<PolicySpec[]>([]);
	const [selectedVersion, setSelectedVersion] = useState<PolicySpec | null>(
		null,
	);
	const [diffModalOpen, setDiffModalOpen] = useState(false);
	const [diffModalVersion, setDiffModalVersion] = useState<PolicySpec | null>(
		null,
	);

	const getStatusVariant = (status: string) => {
		switch (status) {
			case "draft":
				return "secondary";
			default:
				return "default";
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: dont ned others
	useEffect(() => {
		getPolicyVersions(policy_id).then((respVersions) => {
			// console.info("respVersions", respVersions);

			setVersions(respVersions);
			setHasDraft(respVersions.some((v: PolicySpec) => v.draft));

			// Auto-select the first version if available
			if (respVersions.length > 0 && !selectedVersion) {
				setSelectedVersion(respVersions[0]);
			}
			setVersionsLoading(false);
		});
	}, [policy_id]);

	if (versionsLoading) {
		return (
			<div className="flex flex-col space-y-3">
				<h2>Loading Policy</h2>
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
								key={version.id}
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
										<div className="flex items-center gap-2">
											<Badge
												variant={getStatusVariant(version.status)}
												className={"text-xs"}
											>
												{version.status === "draft" ? "Draft" : "Published"}
											</Badge>
											{versions.length > 1 && (
												<Button
													variant="ghost"
													size="sm"
													className="h-6 w-6 p-0"
													onClick={(e) => {
														e.stopPropagation();
														setDiffModalVersion(version);
														setDiffModalOpen(true);
													}}
												>
													<GitCompareArrows className="h-3 w-3" />
												</Button>
											)}
										</div>
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
									{selectedVersion?.draft
										? "Draft"
										: (selectedVersion?.version ?? "")}
								</h1>
								<div className={"mt-2 flex items-center gap-3"}>
									{selectedVersion && (
										<>
											<span className={"text-muted-foreground text-sm"}>
												Created{": "}
												{selectedVersion &&
													new Date(
														selectedVersion?.createdAt,
													).toLocaleDateString()}
											</span>
											<span className={"text-muted-foreground text-sm"}>
												Updated{": "}
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
										<Link href={`/policy/${selectedVersion.id}/edit`}>
											<FilePenLine className={"mr-2 h-4 w-4"} />
											Edit Draft
										</Link>
									</Button>
								) : (
									<div className={"flex gap-2"}>
										{!hasDraft && (
											<Button variant={"outline"} size={"sm"} asChild>
												<Link href={`/policy/${selectedVersion.id}/draft`}>
													<FilePlus2 className={"mr-2 h-4 w-4"} />
													Create Draft
												</Link>
											</Button>
										)}
										<Button variant={"outline"} size={"sm"} asChild>
											<Link href={`/policy/${selectedVersion.id}/view`}>
												<FileText className={"mr-2 h-4 w-4"} />
												View Details
											</Link>
										</Button>
									</div>
								))}
						</div>
					</div>

					<div className={"min-h-0 flex-1"}>
						<ScrollArea className={"h-full"}>
							<div className={"p-6"}>
								{selectedVersion ? (
									<pre className={"whitespace-pre-wrap"}>
										<div
											// biome-ignore lint/security/noDangerouslySetInnerHtml: its fine
											dangerouslySetInnerHTML={{
												__html: highlightText(
													selectedVersion.rule || "No rule content available",
												),
											}}
										/>
									</pre>
								) : (
									<div
										className={
											"flex h-32 items-center justify-center text-muted-foreground"
										}
									>
										Select a version to view its rule
									</div>
								)}
							</div>
						</ScrollArea>
					</div>
				</div>

				<div className={"flex h-[33vh] flex-col border-t bg-muted/5"}>
					<div className={"flex-shrink-0 border-b bg-muted/10 p-4"}>
						<h3 className={"flex items-center gap-2 font-semibold text-lg"}>
							<PackageCheck className={"h-4 w-4"} />
							Configuration
						</h3>
						<p className={"text-muted-foreground text-sm"}>
							Version Configuration and metadata
						</p>
					</div>
					<div className={"min-h-0 flex-1"}>
						<ScrollArea className={"h-full"}>
							<div className={"p-4"}>
								{selectedVersion && (
									<pre
										className={
											"overflow-x-auto rounded-lg bg-background text-xs"
										}
									>
										<code>
											<RainbowBraces
												json={selectedVersion?.schema}
												className={"text-sm"}
											/>
										</code>
									</pre>
								)}
							</div>
						</ScrollArea>
					</div>
				</div>
			</div>

			{diffModalVersion && (
				<DiffModal
					open={diffModalOpen}
					onOpenChange={setDiffModalOpen}
					versions={versions}
					currentVersion={diffModalVersion}
				/>
			)}
		</div>
	);
}
