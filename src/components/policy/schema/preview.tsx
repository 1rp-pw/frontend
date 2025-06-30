"use client";

import { CopyIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { RainbowBraces } from "~/components/ui/rainbow";
import {toast} from "sonner";

interface SchemaPreviewProps {
	// biome-ignore lint/suspicious/noExplicitAny: schema can be anything
	schema: any;
}

export function SchemaPreview({ schema }: SchemaPreviewProps) {
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<h3 className="font-medium text-sm">Schema Preview</h3>
				<Button
					variant="outline"
					size="sm"
					onClick={() => {
						navigator.clipboard.writeText(JSON.stringify(schema, null, 2)).then(() => {
							toast("Copied JSON to clipboard", {})
						});
					}}
					className="h-7 px-2"
				>
					<CopyIcon className="h-3 w-3" />
					Copy JSON
				</Button>
			</div>
			<div className="max-h-100 overflow-auto rounded bg-zinc-700/30 p-2">
				<RainbowBraces json={schema} className="text-xs" />
			</div>
		</div>
	);
}
