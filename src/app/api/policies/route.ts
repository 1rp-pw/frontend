import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env";

export async function GET(request: NextRequest) {
	try {
		const response = await fetch(`${env.API_SERVER}/policies`);
		const resp = await response.json();
		if (resp.length === 0) {
			return NextResponse.json({ "No Policies": { status: 200 } });
		}

		return NextResponse.json(resp, { status: 200 });
	} catch (error) {
		return NextResponse.json({ error: error }, { status: 500 });
	}
}
