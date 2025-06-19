import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env";
import {flowToYaml} from "~/lib/utils/flow-to-yaml";

export async function POST(request: Request) {
	try {
		const { name, nodes, edges, tests } =
			await request.json();

		const yaml = flowToYaml(nodes, edges);

		const body = JSON.stringify({
			name,
			nodes,
			edges,
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			tests: tests.map((test: any) => ({ ...test, result: false })),
			flowFlat: yaml,
		})

		console.info("body", body)

		const response = await fetch(`${env.API_SERVER}/flow`, {
			method: "POST",
			body,
			cache: "no-store",
		});

		// console.info("resp", response)
		const resp = await response.json();
		// console.info("resp", resp)

		return NextResponse.json(
			{
				id: resp.id,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error while creating route", error);

		return NextResponse.json({ error: error }, { status: 500 });
	}
}

export async function PUT(request: Request) {
	try {
		const {
			id,
			name,
			description,
			tags,
			nodes,
			edges,
			tests,
			yaml,
			yamlFlat,
			version,
			status,
			baseId,
		} = await request.json();

		const dataModel = {
			id,
			baseId,
			name,
			description,
			tags,
			nodes,
			edges,
			tests,
			yaml,
			yamlFlat,
			version: "",
			status,
		};
		if (version) {
			dataModel.version = `${version}`;
		}

		await fetch(`${env.API_SERVER}/flow/${id}`, {
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

		// biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
		let response;
		if (version) {
			response = await fetch(`${env.API_SERVER}/flow/${id}/${version}`);
		} else {
			response = await fetch(`${env.API_SERVER}/flow/${id}`);
		}

		const resp = await response.json();
		if (resp.id) {
			return NextResponse.json(
				{
					id: resp.id,
					baseId: resp.baseId,
					name: resp.name,
					description: resp.description,
					tags: resp.tags,
					nodes: resp.nodes,
					edges: resp.edges,
					status: resp.status,
					version: resp.version,
					createdAt: resp.createdAt,
					updatedAt: resp.updatedAt,
					hasDraft: resp.hasDraft,
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
