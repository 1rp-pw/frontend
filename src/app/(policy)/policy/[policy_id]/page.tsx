import PolicyInfo from "./content";

export default async function PolicyInfoPage({
	params,
}: { params: Promise<{ policy_id: string }> }) {
	const { policy_id } = await params;

	return <PolicyInfo policy_id={policy_id} />;
}
