"use client";

import { ArrowLeftIcon } from "lucide-react";
import { Button } from "~/components/ui/button";

interface BreadcrumbNavProps {
	editingObject: string | null;
	onGoBack: () => void;
}

export function BreadcrumbNav({ editingObject, onGoBack }: BreadcrumbNavProps) {
	if (!editingObject) return null;

	const breadcrumb = editingObject.split(".");

	return (
		<div className="flex items-center gap-2 rounded bg-zinc-700/30 p-2">
			<Button variant="ghost" size="sm" onClick={onGoBack}>
				<ArrowLeftIcon className="h-4 w-4" />
			</Button>
			<span className="text-sm text-zinc-400">
				Editing: <span className="text-zinc-200">{breadcrumb.join(" → ")}</span>
			</span>
		</div>
	);
}
