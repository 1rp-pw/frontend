"use client";

import { PublishFlow } from "~/components/flow/publsh";
import { SaveFlow } from "~/components/flow/save";

interface FlowHeaderProps {
	name: string;
	readonly?: boolean;
}

export function FlowHeader({ name, readonly }: FlowHeaderProps) {
	return (
		<header className="flex border-border border-b bg-card px-6 py-4">
			<div className="flex w-full items-center justify-between">
				<div className="flex items-center gap-4">
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
