"use client";

import { ArrowBigLeft } from "lucide-react";
import Link from "next/link";
import { PublishFlow } from "~/components/flow/publsh";
import { SaveFlow } from "~/components/flow/save";
import { Button } from "~/components/ui/button";

interface FlowHeaderProps {
	name: string;
	baseId?: string | undefined;
	readonly?: boolean;
}

export function FlowHeader({ name, baseId, readonly }: FlowHeaderProps) {
	return (
		<header className="flex border-border border-b bg-card px-6 py-4">
			<div className="flex w-full items-center justify-between">
				<div className="flex items-center gap-4">
					{baseId && (
						<Button variant={"outline"} size={"sm"} asChild>
							<Link href={`/flow/${baseId}`}>
								<ArrowBigLeft className={"h-4 w-4"} />
							</Link>
						</Button>
					)}
					<h1 className="font-bold text-xl">{name ? name : "Flow Editor"}</h1>
				</div>
				<div className="flex items-center gap-2">
					{!readonly && (
						<>
							<SaveFlow />
							<PublishFlow />
						</>
					)}
				</div>
			</div>
		</header>
	);
}
