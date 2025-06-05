"use client";

import { RainbowBraces } from "~/components/ui/rainbow";

interface SchemaPreviewProps {
	// biome-ignore lint/suspicious/noExplicitAny: schema can be anything
	schema: any;
}

export function SchemaPreview({ schema }: SchemaPreviewProps) {
	return (
		<div className="space-y-2">
			<h3 className="font-medium text-sm">Schema Preview</h3>
			<div className="max-h-63 overflow-auto rounded bg-zinc-700/30 p-2">
				<RainbowBraces json={schema} className="text-xs" />
			</div>
		</div>
	);
}
