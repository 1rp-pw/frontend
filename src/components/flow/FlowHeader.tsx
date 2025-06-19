"use client";

import { Save } from "lucide-react";
import { Button } from "~/components/ui/button";
import type { FlowValidationResult } from "~/lib/utils/flow-validation";
import {SaveFlow} from "~/components/flow/save";

interface FlowHeaderProps {
	name: string;
	id: string | null;
	isLoading: boolean;
	isSaveDisabled: boolean | null;
	validationResult: FlowValidationResult | null;
	onNameChange: (name: string) => void;
	onSaveFlow: () => void;
	onNewFlow: () => void;
}

export function FlowHeader({
	isLoading,
	isSaveDisabled,
	validationResult,
}: FlowHeaderProps) {
	const saveDisabled = isSaveDisabled === null ? false : isSaveDisabled;

	return (
		<header className="flex border-border border-b bg-card px-6 py-4">
			<div className="flex w-full items-center justify-between">
				<div className="flex items-center gap-4">
					<h1 className="font-bold text-xl">Flow Editor</h1>
				</div>
				<div className="flex items-center gap-2">
					<SaveFlow />
				</div>
			</div>
		</header>
	);
}
