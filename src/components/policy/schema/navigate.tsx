"use client";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";

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
						<Button asChild variant={"link"} onClick={() => onNavigateTo(null)}>
							<span className="cursor-pointer">$.</span>
						</Button>
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
										<Button
											asChild
											variant={"link"}
											onClick={() => onNavigateTo(pathToHere)}
										>
											<span className="cursor-pointer">{item}</span>
										</Button>
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
