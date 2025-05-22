"use client"

import PolicyList from "~/app/(policy)/list";

export default function Home() {
	return (
		<div className={"flex-col"}>
			<header className={"col-span-2"}>
				<h1 className={"text-2xl font-semibold"}>Policy Maker</h1>
			</header>
			<PolicyList />
		</div>
	)
}