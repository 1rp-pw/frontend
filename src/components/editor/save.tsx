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
import { type Test, usePolicyStore } from "~/lib/state/policy";

export function SavePolicy() {
	const [formOpen, setFormOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const { id, name, setPolicyName, savePolicy } = usePolicyStore();

	const formSchema = z.object({
		policyName: z.string().min(2, "Policy name needs to be more than 2 chars"),
	});

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			policyName: "",
		},
	});

	const onSubmit = async (data: z.infer<typeof formSchema>) => {
		setIsLoading(true);
		try {
			if (!id) {
				setPolicyName(data.policyName);
			}
			const result = await savePolicy();
			if (result.success) {
				toast("Policy Saved!");
				setFormOpen(false);
				form.reset();

				if (result.returnId) {
					router.push(`/policy/${result.returnId}`);
				}
			} else {
				toast("Failed to Save Policy!");
			}
		} catch (error) {
			console.error("save error", error);
			toast("Policy Save Failed");
		} finally {
			setIsLoading(false);
			setFormOpen(false);
		}
	};

	if (id) {
		return (
			<Button
				disabled={isLoading}
				onClick={() => {
					onSubmit({ policyName: name }).then();
				}}
			>
				{isLoading ? "Saving..." : id ? "Update Draft" : "Save Policy"}
			</Button>
		);
	}

	return (
		<Dialog open={formOpen} onOpenChange={setFormOpen}>
			<DialogTrigger asChild>
				<Button className={"rounded text-sm"}>{id ? "Update" : "Save"}</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{id ? `Update ${name}` : "Save Policy"}</DialogTitle>
					<DialogDescription>Save the draft policy</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<FormField
							control={form.control}
							name={"policyName"}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Policy Name</FormLabel>
									<FormControl>
										<Input placeholder="Policy Name" {...field} />
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
								{isLoading ? "Saving..." : id ? "Update Draft" : "Save Policy"}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
