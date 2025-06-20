import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env";

export async function POST(request: Request) {
	try {
		const { name, rule, tests, schema } = await request.json();

		const response = await fetch(`${env.API_SERVER}/policy`, {
			method: "POST",
			body: JSON.stringify({
				name,
				rule,
				tests,
				schema,
			}),
			cache: "no-store",
		});

		// console.info("hmm");

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

export async function PUT(request: Request) {
	try {
		const {
			id,
			rule,
			tests,
			schema,
			name,
			version,
			status,
			baseId,
			description,
		} = await request.json();

		const dataModel = {
			id,
			baseId,
			rule,
			tests,
			schema,
			name,
			version: "",
			status,
			description,
		};
		if (version) {
			dataModel.version = `${version}`;
		}

		// console.info("dataModel", dataModel);

		await fetch(`${env.API_SERVER}/policy/${id}`, {
			method: "PUT",
			body: JSON.stringify(dataModel),
			cache: "no-store",
		});

		return NextResponse.json({}, { status: 200 });
	} catch (error) {
		return NextResponse.json({ error: error }, { status: 500 });
	}
}

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const id = searchParams.get("id");
		const version = searchParams.get("version");

		// biome-ignore lint/suspicious/noImplicitAnyLet: runtime
		let response;
		if (version) {
			response = await fetch(`${env.API_SERVER}/policy/${id}/${version}`);
		} else {
			response = await fetch(`${env.API_SERVER}/policy/${id}`);
		}

		const resp = await response.json();
		if (resp.id) {
			return NextResponse.json(
				{
					id: resp.id,
					baseId: resp.baseId,
					name: resp.name,
					rule: resp.rule,
					tests: resp.tests,
					schema: resp.schema,
					status: resp.status,
				},
				{ status: 200 },
			);
		}

		return NextResponse.json({ error: "failed request" }, { status: 500 });
	} catch (error) {
		console.error("Error while creating route", error, request);

		return NextResponse.json({ error: error }, { status: 500 });
	}
}
