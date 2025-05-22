"use client";

import { FlagsProvider } from "@flags-gg/react-library";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";
import { type ReactNode, useState } from "react";

export default function ClientProvider({ children }: { children: ReactNode }) {
	const { theme } = useTheme();
	const [queryClient] = useState(() => new QueryClient());

	const flagsConfig = {
		projectId: "3155c8f9-3826-42f8-97dd-7aed58d26bda",
		agentId: "f6b7de81-1c7b-4e18-b5df-41329543ed1d",
		environmentId: "3ef6efc1-2ea0-4945-8301-cf3b67fa4080",
	};

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider
				attribute={"class"}
				defaultTheme={theme}
				enableSystem={true}
				disableTransitionOnChange={true}
			>
				<FlagsProvider options={flagsConfig}>{children}</FlagsProvider>
			</ThemeProvider>
		</QueryClientProvider>
	);
}
