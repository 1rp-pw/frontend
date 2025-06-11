"use client";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";

interface BreadcrumbNavProps {
	editingObject: string | null;
	onNavigateTo: (path: string | null) => void;
}

export function BreadcrumbNav({
	editingObject,
	onNavigateTo,
}: BreadcrumbNavProps) {
	if (!editingObject) return null;

	const breadcrumb = editingObject.split(".");

	return (
		<Breadcrumb>
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink asChild>
						{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
						<span className="cursor-pointer" onClick={() => onNavigateTo(null)}>
							$.
						</span>
					</BreadcrumbLink>
				</BreadcrumbItem>
				{breadcrumb.map((item, index) => {
					const isLast = index === breadcrumb.length - 1;
					const pathToHere = breadcrumb.slice(0, index + 1).join(".");
					const i = index;

					return (
						<>
							<BreadcrumbSeparator key={`separator-${item}-${i}`} />
							<BreadcrumbItem key={`item-${item}-${i}`}>
								{isLast ? (
									<BreadcrumbPage>{item}</BreadcrumbPage>
								) : (
									<BreadcrumbLink asChild>
										{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
										<span
											className="cursor-pointer"
											onClick={() => onNavigateTo(pathToHere)}
										>
											{item}
										</span>
									</BreadcrumbLink>
								)}
							</BreadcrumbItem>
						</>
					);
				})}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
