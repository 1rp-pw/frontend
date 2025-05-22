"use server"

import {SidebarTrigger} from "~/components/ui/sidebar";

export default async function Headerbar() {
  return (
    <header className={"sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-4"}>
      <SidebarTrigger />
    </header>
  )
}