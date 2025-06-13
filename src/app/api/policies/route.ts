import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const search = searchParams.get("search");

		const url = search
			? `${env.API_SERVER}/policies?search=${encodeURIComponent(search)}`
			: `${env.API_SERVER}/policies`;

		const response = await fetch(url);
		const resp = await response.json();

		if (resp.length === 0) {
			return NextResponse.json({}, { status: 200 });
		}

		return NextResponse.json(resp, { status: 200 });
	} catch (error) {
		return NextResponse.json({ error: error }, { status: 500 });
	}
}
