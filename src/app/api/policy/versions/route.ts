import {env} from "~/env";
import {type NextRequest, NextResponse} from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("policy_id");

    const response = await fetch(`${env.API_SERVER}/policy/${id}/versions`);
    const resp = await response.json();

    if (resp[0].id) {
      return NextResponse.json(resp, {status: 200})
    }

    return NextResponse.json({error: "failed request"}, {status: 404})
  } catch (error) {
    console.error("Error while creating route", error, request);

    return NextResponse.json({error: error}, {status: 500})
  }
}