import Maker from "./maker";

export default async function IDEPage({
	params,
}: { params: Promise<{ policy_id: string }> }) {
	const { policy_id } = await params;

	return <Maker policy_id={policy_id} />;
}
