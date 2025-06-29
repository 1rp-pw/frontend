"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
	const [lastPublishedVersion, setLastPublishedVersion] = useState<number>(0);
	const [minVersion, setMinVersion] = useState<number>(0.1);
	const router = useRouter();

	const { tests, savePolicy, updatePolicySpec, id } = usePolicyStore();

	// Fetch the last published version when dialog opens
	useEffect(() => {
		if (formOpen && id) {
			fetchLastPublishedVersion();
		}
		// biome-ignore lint/correctness/useExhaustiveDependencies: fetchLastPublishedVersion is stable
	}, [formOpen, id]);

	const fetchLastPublishedVersion = async () => {
		if (!id) return;

		try {
			const response = await fetch(`/api/policy/versions?policy_id=${id}`);
			if (response.ok) {
				const versions = await response.json();
				// Find the highest published version
				const publishedVersions = versions
					// biome-ignore lint/suspicious/noExplicitAny: API response type
					.filter((v: any) => v.status === "published")
					// biome-ignore lint/suspicious/noExplicitAny: API response type
					.map((v: any) => v.version)
					.filter((v: number) => !Number.isNaN(v));

				if (publishedVersions.length > 0) {
					const maxVersion = Math.max(...publishedVersions);
					setLastPublishedVersion(maxVersion);
					// Set minimum version to be 0.1 above the last published version
					const newMinVersion = Math.round((maxVersion + 0.1) * 10) / 10;
					setMinVersion(newMinVersion);
					// Update form default value
					form.setValue("policyVersion", newMinVersion);
				}
			}
		} catch (error) {
			console.error("Failed to fetch versions:", error);
		}
	};

	// Create form schema dynamically based on minVersion
	const formSchema = z.object({
		policyVersion: z
			.number()
			.min(minVersion, `Policy version must be at least ${minVersion}`)
			.refine((val) => {
				// Ensure the version is a valid increment (multiples of 0.1)
				return Math.round(val * 10) / 10 === val;
			}, "Version must be in increments of 0.1"),
		policyChanges: z
			.string()
			.min(2, "Policy changes must be more than 2 chars"),
	});

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			policyVersion: minVersion,
			policyChanges: "",
		},
	});

	// Update form when minVersion changes
	useEffect(() => {
		form.setValue("policyVersion", minVersion);
	}, [minVersion, form]);

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
									<FormLabel>
										Policy Version
										{lastPublishedVersion > 0 && (
											<span className="ml-2 text-xs text-zinc-400">
												(Last published: {lastPublishedVersion})
											</span>
										)}
									</FormLabel>
									<FormControl>
										<Input
											type={"number"}
											step={"0.1"}
											min={minVersion}
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
