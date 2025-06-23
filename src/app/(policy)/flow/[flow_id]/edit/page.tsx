import Maker from "./maker";

export default async function IDEPage({
                                        params,
                                      }: {
  params: Promise<{ flow_id: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const { flow_id } = await params;

  return <Maker flow_id={flow_id} />;
}
