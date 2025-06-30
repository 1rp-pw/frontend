import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const id = searchParams.get("flow_id");

		const response = await fetch(`${env.API_SERVER}/flow/${id}/versions`);

		if (!response.ok) {
			console.error(
				"Flow versions API error:",
				response.status,
				response.statusText,
			);
			return NextResponse.json(
				{ error: "Failed to fetch versions" },
				{ status: response.status },
			);
		}

		const resp = await response.json();

		// Return the response regardless of baseId check
		if (Array.isArray(resp) && resp.length > 0) {
			return NextResponse.json(resp, { status: 200 });
		}

		return NextResponse.json([], { status: 200 });
	} catch (error) {
		console.error("Error while creating route", error, request);

		return NextResponse.json({ error: error }, { status: 500 });
	}
}
