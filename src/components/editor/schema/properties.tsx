"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";

interface PropertyFormProps {
	onAddProperty: (name: string, type: string, required: boolean) => void;
}

export function PropertyForm({ onAddProperty }: PropertyFormProps) {
	const [newPropName, setNewPropName] = useState("");
	const [newPropType, setNewPropType] = useState("string");
	const [newPropRequired, setNewPropRequired] = useState(true);

	const handleAddProperty = () => {
		if (!newPropName.trim()) return;
		onAddProperty(newPropName, newPropType, newPropRequired);
		setNewPropName("");
		setNewPropType("string");
		setNewPropRequired(true);
	};

	return (
		<div className="space-y-2">
			<h3 className="font-medium text-sm">Add Property</h3>
			<div className="grid grid-cols-3 gap-2">
				<Input
					placeholder="Property name"
					value={newPropName}
					onChange={(e) => setNewPropName(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							handleAddProperty();
						}
					}}
				/>
				<Select value={newPropType} onValueChange={setNewPropType}>
					<SelectTrigger>
						<SelectValue placeholder="Type" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="string">String</SelectItem>
						<SelectItem value="number">Number</SelectItem>
						<SelectItem value="boolean">Boolean</SelectItem>
						<SelectItem value="object">Object</SelectItem>
						<SelectItem value="array">Array</SelectItem>
					</SelectContent>
				</Select>
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-2">
						<Switch
							id="required"
							checked={newPropRequired}
							onCheckedChange={setNewPropRequired}
						/>
						<Label htmlFor="required" className="text-xs">
							Required
						</Label>
					</div>
					<Button size="sm" onClick={handleAddProperty}>
						<PlusIcon className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
