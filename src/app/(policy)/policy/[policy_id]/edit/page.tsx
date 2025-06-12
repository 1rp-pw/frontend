import Maker from "./maker";

export default async function IDEPage({
	params,
	searchParams,
}: {
	params: Promise<{ policy_id: string }>;
	searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
	const { policy_id } = await params;
	const { version } = await searchParams;

	return <Maker policy_id={policy_id} version={version} />;
}
