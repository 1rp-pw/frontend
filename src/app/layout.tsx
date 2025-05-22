import "~/styles/globals.css";

import type { Metadata } from "next";
import { Geist, Inter as FontSans } from "next/font/google";
import {cn} from "~/lib/utils";
import ClientProvider from "~/components/ClientProvider";
import {TooltipProvider} from "~/components/ui/tooltip";
import {SidebarProvider} from "~/components/ui/sidebar";
import SideBar from "~/components/SideBar";
import Headerbar from "~/components/Headerbar";
import {Toaster} from "~/components/ui/sonner";

export const metadata: Metadata = {
	title: "Policies",
	description: "Policies",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

const fontSans = FontSans({
	subsets: ["latin"],
	variable: "--font-sans",
})

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className={`${geist.variable}`} suppressHydrationWarning={true}>
			<body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
				<ClientProvider>
					<TooltipProvider>
						<div className={"relative flex min-h-screen flex-col bg-muted/40"}>
							<SidebarProvider>
								<SideBar />
								<div className={"flex flex-col sm:py-4 size-full"}>
									<Headerbar />
									<main className={"flex-1 size-full p-4"} suppressHydrationWarning={true}>
										{children}
									</main>
								</div>
							</SidebarProvider>
						</div>
						<Toaster />
					</TooltipProvider>
				</ClientProvider>
			</body>
		</html>
	);
}
