import "~/styles/globals.css";

import type { Metadata } from "next";
import { Inter as FontSans, Geist } from "next/font/google";
import ClientProvider from "~/components/ClientProvider";
import Headerbar from "~/components/Headerbar";
import SideBar from "~/components/SideBar";
import { SidebarProvider } from "~/components/ui/sidebar";
import { Toaster } from "~/components/ui/sonner";
import { TooltipProvider } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

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
});

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html
			lang="en"
			className={`${geist.variable}`}
			suppressHydrationWarning={true}
		>
			<body
				className={cn(
					"min-h-screen bg-background font-sans antialiased",
					fontSans.variable,
				)}
			>
				<ClientProvider>
					<TooltipProvider>
						<div className={"relative flex min-h-screen flex-col bg-muted/40"}>
							<SidebarProvider>
								<SideBar />
								<div className={"flex size-full flex-col sm:py-4"}>
									<Headerbar />
									<main
										className={"size-full flex-1 p-4"}
										suppressHydrationWarning={true}
									>
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
