"use client"

import {
  Sidebar,
  SidebarContent, SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "~/components/ui/sidebar";
import Link from "next/link";
import {Home, ChartNetwork} from "lucide-react";

export default function SideBar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <Link href={"/"}>
          Policies
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
                  <Link href={"/maker"}>
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
  )
}