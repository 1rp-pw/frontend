"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { useFlowStore } from "~/lib/state/flow";

export function PublishFlow() {
	const [formOpen, setFormOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const { tests, saveFlow, id, updateFlowSpec, flowSpec } = useFlowStore();

	const formSchema = z.object({
		flowVersion: z.number().min(0.1, "Flow version must be at least 0.1"),
		flowChanges: z.string().min(1, "Flow changes must be at least 1 character"),
	});
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			flowVersion: 0.1,
			flowChanges: "",
		},
	});

	const onSubmit = async (data: z.infer<typeof formSchema>) => {
		setIsLoading(true);
		if (!id) {
			toast("Flow not saved yet, please save first");
			return;
		}
		try {
			updateFlowSpec({
				version: data.flowVersion,
				status: "published",
				description: data.flowChanges,
				draft: false,
				id: id,
			});

			const result = await saveFlow();
			if (result.success) {
				toast("Flow Published!");
				setFormOpen(false);
				form.reset();
			} else {
				toast("Failed to Publish Flow!");
			}
		} catch (error) {
			console.error("publish error", error);
			toast("Flow Publish Failed");
		} finally {
			setIsLoading(false);
			setFormOpen(false);
			router.push(`/flow/${flowSpec?.baseId}`);
		}
	};

	const createdTests = tests.filter((test) => test.created);
	const allTestsPassed =
		createdTests.length > 0 &&
		createdTests.every((test) => test.result?.result === test.expectedOutcome);

	if (!allTestsPassed) {
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<span>
						<Button
							disabled={!allTestsPassed}
							className={!allTestsPassed ? "cursor-not-allowed opacity-50" : ""}
						>
							Publish Flow
						</Button>
					</span>
				</TooltipTrigger>
				<TooltipContent>
					<p>All tests must be run and passed before publishing</p>
				</TooltipContent>
			</Tooltip>
		);
	}

	return (
		<Dialog open={formOpen} onOpenChange={setFormOpen}>
			<DialogTrigger asChild>
				<Button>Publish Flow</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Publish Flow</DialogTitle>
					<DialogDescription>Publish the flow</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<FormField
							control={form.control}
							name={"flowVersion"}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Flow Version</FormLabel>
									<FormControl>
										<Input
											type={"number"}
											step={"0.1"}
											min={"0.1"}
											placeholder="Flow Version"
											{...field}
											onChange={(e) => {
												const value = e.target.value;
												field.onChange(
													value === "" ? 0 : Number.parseFloat(value),
												);
											}}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<br />
						<FormField
							control={form.control}
							name={"flowChanges"}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Flow Changes</FormLabel>
									<FormControl>
										<Textarea placeholder="Flow Changes" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className={"justify-items-end-safe mt-2 grid grid-cols-2"}>
							<DialogClose asChild>
								<Button variant={"outline"} disabled={isLoading}>
									Cancel
								</Button>
							</DialogClose>
							<Button type="submit" disabled={isLoading}>
								{isLoading ? "Publishing..." : "Publish Flow"}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
