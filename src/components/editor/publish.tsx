"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
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
import { usePolicyStore } from "~/lib/state/policy";

export function PublishPolicy() {
	const [formOpen, setFormOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const { tests, savePolicy, updatePolicySpec, policySpec, id } =
		usePolicyStore();

	const formSchema = z.object({
		policyVersion: z.number().min(0.1, "Policy version must be at least 0.1"),
		policyChanges: z
			.string()
			.min(2, "Policy changes must be more than 2 chars"),
	});

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			policyVersion: 0.1,
			policyChanges: "",
		},
	});

	const onSubmit = async (data: z.infer<typeof formSchema>) => {
		setIsLoading(true);

		if (!id) {
			toast("Policy not saved yet, please save first");
			return;
		}

		try {
			updatePolicySpec({
				version: data.policyVersion,
				draft: false,
				status: "published",
				description: data.policyChanges,
				id: id,
			});

			const result = await savePolicy();
			if (result.success) {
				toast("Policy Published!");
				setFormOpen(false);
				form.reset();

				if (result.returnId) {
					router.push(
						`/policy/${result.returnId}/view?version=${data.policyVersion}`,
					);
				}
			} else {
				toast("Failed to Publish Policy!");
			}
		} catch (error) {
			console.error("publish error", error);
			toast("Policy Publish Failed");
		} finally {
			setIsLoading(false);
			setFormOpen(false);
		}
	};

	const createdTests = tests.filter((test) => test.created);
	const allTestsPassed =
		createdTests.length > 0 &&
		createdTests.every(
			(test) => test.outcome.ran && test.outcome.status === "passed",
		);

	if (!allTestsPassed) {
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<span>
						<Button
							disabled={!allTestsPassed}
							className={!allTestsPassed ? "cursor-not-allowed opacity-50" : ""}
						>
							Publish Policy
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
				<Button>Publish Policy</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Publish Policy</DialogTitle>
					<DialogDescription>Publish the policy</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<FormField
							control={form.control}
							name={"policyVersion"}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Policy Version</FormLabel>
									<FormControl>
										<Input
											type={"number"}
											step={"0.1"}
											min={"0.1"}
											placeholder="Policy Version"
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
							name={"policyChanges"}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Policy Changes</FormLabel>
									<FormControl>
										<Textarea placeholder="Policy Changes" {...field} />
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
								{isLoading ? "Publishing..." : "Publish Policy"}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
