import { NextResponse } from "next/server";
import { env } from "~/env";

export async function GET() {
	try {
		const response = await fetch(`${env.API_SERVER}/flows`, {
			method: "GET",
			cache: "no-store",
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const flows = await response.json();

		return NextResponse.json(flows, { status: 200 });
	} catch (error) {
		console.error("Error fetching flows:", error);
		return NextResponse.json(
			{ error: "Failed to fetch flows" },
			{ status: 500 },
		);
	}
}