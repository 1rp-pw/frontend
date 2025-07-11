"use client";

import { ChartNetwork, Home } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "~/components/ui/sidebar";

export default function SideBar() {
	return (
		<Sidebar>
			<SidebarHeader>
				<Link href={"/"}>
					<Image src={"/logo.png"} alt={"Policies"} width={50} height={50} />
				</Link>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Policies</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem key={"list"}>
								<SidebarMenuButton asChild={true}>
									<Link href={"/"}>
										<Home className={"size-5"} />
										<span>Home</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
				<SidebarGroup>
					<SidebarGroupLabel>Create</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem key={"policy"}>
								<SidebarMenuButton asChild={true}>
									<Link href={"/policy"}>
										<ChartNetwork />
										<span>Policy</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem key={"flow"}>
								<SidebarMenuButton asChild={true}>
									<Link href={"/flow"}>
										<ChartNetwork />
										<span>Flow</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}
