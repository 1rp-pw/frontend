"use client";

import {
	CheckIcon,
	ChevronRightIcon,
	EditIcon,
	TrashIcon,
	XIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";

interface PropertyListProps {
	// biome-ignore lint/suspicious/noExplicitAny: schema properties can be anything
	properties: any;
	required: string[];
	editingObject: string | null;
	onEditProperty: (
		oldName: string,
		newName: string,
		type: string,
		required: boolean,
	) => void;
	onRemoveProperty: (name: string) => void;
	onEditObject: (propName: string) => void;
}

export function PropertyList({
	properties,
	required,
	editingObject,
	onEditProperty,
	onRemoveProperty,
	onEditObject,
}: PropertyListProps) {
	const [editingProperty, setEditingProperty] = useState<string | null>(null);
	const [editingName, setEditingName] = useState("");
	const [editingType, setEditingType] = useState("");
	const [editingRequired, setEditingRequired] = useState(true);

	// biome-ignore lint/suspicious/noExplicitAny: property details can be anything
	const startEditing = (propName: string, propDetails: any) => {
		setEditingProperty(propName);
		setEditingName(propName);
		setEditingType(propDetails.type);
		setEditingRequired(required?.includes(propName) || false);
	};

	const cancelEditing = () => {
		setEditingProperty(null);
		setEditingName("");
		setEditingType("");
		setEditingRequired(false);
	};

	const saveEdit = () => {
		if (!editingProperty || !editingName.trim()) return;
		onEditProperty(editingProperty, editingName, editingType, editingRequired);
		cancelEditing();
	};

	const breadcrumb = editingObject ? editingObject.split(".") : [];

	return (
		<div className="space-y-2">
			<h3 className="font-medium text-sm">
				{editingObject
					? `Properties of ${breadcrumb[breadcrumb.length - 1]}`
					: "Schema Properties"}
			</h3>
			<div className="space-y-1">
				{Object.keys(properties || {}).length === 0 ? (
					<p className="text-xs text-zinc-500 italic">
						No properties defined yet
					</p>
				) : (
					Object.entries(properties || {}).map(
						// biome-ignore lint/suspicious/noExplicitAny: property details can be anything
						([propName, propDetails]: [string, any]) => (
							<div
								key={propName}
								className="flex items-center justify-between rounded bg-zinc-700/50 p-2"
							>
								{editingProperty === propName ? (
									// Editing mode
									<div className="flex flex-auto items-center gap-2">
										<Input
											value={editingName}
											onChange={(e) => setEditingName(e.target.value)}
											className="h-8 text-sm"
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													saveEdit();
												} else if (e.key === "Escape") {
													cancelEditing();
												}
											}}
										/>
										<Select value={editingType} onValueChange={setEditingType}>
											<SelectTrigger className="flex h-8 w-24 flex-auto">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="string">String</SelectItem>
												<SelectItem value="number">Number</SelectItem>
												<SelectItem value="boolean">Boolean</SelectItem>
												<SelectItem value="object">Object</SelectItem>
												<SelectItem value="array">Array</SelectItem>
											</SelectContent>
										</Select>
										<div className="flex items-center space-x-1">
											<Switch
												checked={editingRequired}
												onCheckedChange={setEditingRequired}
												className="scale-75"
											/>
											<span className="text-xs text-zinc-400">Req</span>
										</div>
										<div className="flex gap-1">
											<Button
												variant="ghost"
												size="sm"
												onClick={saveEdit}
												className="h-6 w-6 p-0 text-green-400 hover:text-green-300"
											>
												<CheckIcon className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={cancelEditing}
												className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-300"
											>
												<XIcon className="h-4 w-4" />
											</Button>
										</div>
									</div>
								) : (
									// Display mode
									<>
										<div className="flex items-center gap-2">
											<div>
												<span className="font-medium text-sm">{propName}</span>
												<span className="ml-2 text-xs text-zinc-400">
													({propDetails.type})
												</span>
												{required?.includes(propName) && (
													<span className="ml-2 text-amber-400 text-xs">
														required
													</span>
												)}
											</div>
											{propDetails.type === "object" && (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => onEditObject(propName)}
													className="h-6 px-2 text-zinc-400 hover:text-zinc-100"
												>
													<ChevronRightIcon className="h-4 w-4" />
													<span className="ml-1 text-xs">Edit</span>
												</Button>
											)}
										</div>
										<div className="flex gap-1">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => startEditing(propName, propDetails)}
												className="h-6 w-6 text-zinc-400 hover:text-zinc-100"
											>
												<EditIcon className="h-3 w-3" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => onRemoveProperty(propName)}
												className="h-6 w-6 text-zinc-400 hover:text-red-400"
											>
												<TrashIcon className="h-4 w-4" />
											</Button>
										</div>
									</>
								)}
							</div>
						),
					)
				)}
			</div>
		</div>
	);
}
