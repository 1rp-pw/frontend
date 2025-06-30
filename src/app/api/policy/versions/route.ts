import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const id = searchParams.get("policy_id");

		const response = await fetch(`${env.API_SERVER}/policy/${id}/versions`);

		if (!response.ok) {
			console.error(
				"Versions API error:",
				response.status,
				response.statusText,
			);
			return NextResponse.json(
				{ error: "Failed to fetch versions" },
				{ status: response.status },
			);
		}

		const resp = await response.json();

		// Sort versions by newest activity first
		if (Array.isArray(resp) && resp.length > 0) {
			// biome-ignore lint/suspicious/noExplicitAny: they can be anything
			const sortedVersions = resp.sort((a: any, b: any) => {
				// Use updatedAt if available, otherwise use createdAt
				const dateA = new Date(a.updatedAt || a.createdAt);
				const dateB = new Date(b.updatedAt || b.createdAt);
				return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
			});
			return NextResponse.json(sortedVersions, { status: 200 });
		}

		return NextResponse.json([], { status: 200 });
	} catch (error) {
		console.error("Error while creating route", error, request);

		return NextResponse.json({ error: error }, { status: 500 });
	}
}
