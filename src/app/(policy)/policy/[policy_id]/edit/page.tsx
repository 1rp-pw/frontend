import Maker from "./maker";

export default async function IDEPage({
	params,
}: {
	params: Promise<{ policy_id: string }>;
	searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
	const { policy_id } = await params;

	return <Maker policy_id={policy_id} />;
}
