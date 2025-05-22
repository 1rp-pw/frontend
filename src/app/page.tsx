"use client";

import PolicyList from "~/app/(policy)/list";

export default function Home() {
	return (
		<div className={"flex-col"}>
			<header className={"col-span-2"}>
				<h1 className={"font-semibold text-2xl"}>Policy Maker</h1>
			</header>
			<PolicyList />
		</div>
	);
}
