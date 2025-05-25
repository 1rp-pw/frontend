import { NextResponse } from "next/server";
import { env } from "~/env";

export async function POST(request: Request) {
	type runRequest = {
		data: object;
		rule: string;
	};

	try {
		const { data, rule }: runRequest = (await request.json()) as runRequest;

		const response = await fetch(`${env.API_SERVER}/run`, {
			method: "POST",
			body: JSON.stringify({
				data: data,
				rule: rule,
			}),
			cache: "no-store",
		});

		const resp = await response.json();

		return NextResponse.json({
			result: resp.result,
			trace: resp.trace,
			text: resp.text,
			data: resp.data,
		}, { status: 200 });
	} catch (e) {
		console.error("Error while creating route", e, request);

		return NextResponse.json({ "Bad Request": { status: 500 } });
	}
}
