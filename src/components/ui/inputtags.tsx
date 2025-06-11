"use client";

import { XIcon } from "lucide-react";

import { type Dispatch, forwardRef, useEffect, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

type InputTagsProps = Omit<
	React.ComponentProps<"input">,
	"value" | "onChange"
> & {
	value: string[];
	onChange: Dispatch<React.SetStateAction<string[]>>;
};

const InputTags = forwardRef<HTMLInputElement, InputTagsProps>(
	({ className, value, onChange, ...props }, ref) => {
		const [pendingDataPoint, setPendingDataPoint] = useState("");

		useEffect(() => {
			if (pendingDataPoint.includes(",")) {
				const newDataPoints = new Set([
					...value,
					...pendingDataPoint.split(",").map((chunk) => chunk.trim()),
				]);
				onChange(Array.from(newDataPoints));
				setPendingDataPoint("");
			}
		}, [pendingDataPoint, onChange, value]);

		const addPendingDataPoint = () => {
			if (pendingDataPoint) {
				const newDataPoints = new Set([...value, pendingDataPoint]);
				onChange(Array.from(newDataPoints));
				setPendingDataPoint("");
			}
		};

		return (
			<div
				className={cn(
					"flex min-h-10 w-full flex-wrap gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
					className,
				)}
			>
				{value.map((item) => (
					<Badge key={item} variant="secondary">
						<span className="block max-w-xs truncate break-words">{item}</span>
						<Button
							variant="ghost"
							size="icon"
							className="ml-2 size-4 p-0"
							onClick={() => {
								onChange(value.filter((i) => i !== item));
							}}
						>
							<XIcon />
						</Button>
					</Badge>
				))}
				<input
					className="flex-1 outline-none placeholder:text-muted-foreground"
					value={pendingDataPoint}
					onChange={(e) => setPendingDataPoint(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === ",") {
							e.preventDefault();
							addPendingDataPoint();
						} else if (
							e.key === "Backspace" &&
							pendingDataPoint.length === 0 &&
							value.length > 0
						) {
							e.preventDefault();
							onChange(value.slice(0, -1));
						}
					}}
					{...props}
					ref={ref}
				/>
			</div>
		);
	},
);

InputTags.displayName = "InputTags";

export { InputTags };
