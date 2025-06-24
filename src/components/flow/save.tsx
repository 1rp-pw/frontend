"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SaveIcon } from "lucide-react";
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
import { useFlowStore } from "~/lib/state/flow";

export function SaveFlow({
	isSaveDisabled = null,
}: {
	isSaveDisabled?: boolean | null;
}) {
	const [formOpen, setFormOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const { id, name, setFlowName, saveFlow, validationResult, updateFlowSpec } =
		useFlowStore();

	const formSchema = z.object({
		flowName: z.string().min(2, "Flow name needs to be more than 2 chars"),
	});

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			flowName: "",
		},
	});

	const onSubmit = async (data: z.infer<typeof formSchema>) => {
		setIsLoading(true);
		try {
			if (!id) {
				setFlowName(data.flowName);
			}
			updateFlowSpec({
				draft: true,
				status: "draft",
			});
			const result = await saveFlow();
			if (result.success) {
				toast("Flow Saved!");
				setFormOpen(false);
				form.reset();

				if (result.returnId) {
					router.push(`/flow/${result.returnId}`);
				}
			} else {
				toast("Failed to Save Flow!");
			}
		} catch (error) {
			console.error("save error", error);
			toast("Flow Save Failed");
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
					onSubmit({ flowName: name }).then();
				}}
			>
				{isLoading ? "Saving..." : id ? "Update Draft" : "Save Flow"}
			</Button>
		);
	}

	const saveDisabled = isSaveDisabled === null ? false : isSaveDisabled;

	return (
		<Dialog open={formOpen} onOpenChange={setFormOpen}>
			<DialogTrigger asChild>
				<Button
					className={"rounded text-sm"}
					disabled={saveDisabled}
					title={
						validationResult && !validationResult.isValid
							? validationResult.errors.join("\n")
							: "Save flow"
					}
				>
					<SaveIcon />
					{id ? "Update" : "Save"}
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{id ? `Update ${name}` : "Save Flow"}</DialogTitle>
					<DialogDescription>Save the draft flow</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<FormField
							control={form.control}
							name={"flowName"}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Flow Name</FormLabel>
									<FormControl>
										<Input placeholder="Flow Name" {...field} />
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
								{isLoading ? "Saving..." : id ? "Update Draft" : "Save Flow"}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
