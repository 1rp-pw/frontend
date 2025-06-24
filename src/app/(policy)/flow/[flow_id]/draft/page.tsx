import { RedirectType, redirect } from "next/navigation";
import { env } from "~/env";

export default async function IDEPage({
                                        params,
                                      }: {
  params: Promise<{ flow_id: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const { flow_id } = await params;
  let newFlowId = "";

  try {
    const response = await fetch(`${env.API_SERVER}/flow/${flow_id}/draft`);
    const resp = await response.json();
    if (resp.id) {
      newFlowId = resp.id;
    }
  } catch (error) {
    console.error("Error while creating route", error);
  }

  if (newFlowId !== "") {
    redirect(`/flow/${newFlowId}/edit`, RedirectType.push);
  }

  return (
    <>There was an error while creating the draft. Please try again later.</>
  );
}
