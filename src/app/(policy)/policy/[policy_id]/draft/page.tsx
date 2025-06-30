import { RedirectType, redirect } from "next/navigation";
import { env } from "~/env";

export default async function IDEPage({
	params,
}: {
	params: Promise<{ policy_id: string }>;
	searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
	const { policy_id } = await params;
	let newPolicyId = "";

	try {
		const response = await fetch(`${env.API_SERVER}/policy/${policy_id}/draft`);
		const resp = await response.json();
		if (resp.id) {
			newPolicyId = resp.id;
		}
	} catch (error) {
		console.error("Error while creating route", error);
	}

	if (newPolicyId !== "") {
		redirect(`/policy/${newPolicyId}/edit`, RedirectType.push);
	}

	return "There was an error while creating the draft. Please try again later.";
}
