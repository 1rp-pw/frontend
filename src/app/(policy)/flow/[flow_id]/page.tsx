import FlowInfo from "./content";

export default async function FlowInfoPage({
	params,
}: {
	params: Promise<{ flow_id: string }>;
}) {
	const { flow_id } = await params;

	return <FlowInfo flow_id={flow_id} />;
}
