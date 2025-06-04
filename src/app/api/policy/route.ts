import { NextResponse } from "next/server";
import { env } from "~/env";

export async function POST(request: Request) {
	try {
		const { name, text, tests, schema } = await request.json();

		const response = await fetch(`${env.API_SERVER}/policy`, {
			method: "POST",
			body: JSON.stringify({
				name,
				rule: text,
				tests,
				data_model: schema,
			}),
			cache: "no-store",
		});

		const resp = await response.json();

		return NextResponse.json(
			{
				id: resp.id,
			},
			{ status: 200 },
		);
	} catch (error) {
		return NextResponse.json({ error: error }, { status: 500 });
	}
}
