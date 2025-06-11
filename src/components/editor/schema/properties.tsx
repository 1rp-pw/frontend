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
	onAddProperty: (
		name: string,
		type: string,
		required: boolean,
		// biome-ignore lint/suspicious/noExplicitAny: property options can be anything
		options?: any,
	) => void;
}

export function PropertyForm({ onAddProperty }: PropertyFormProps) {
	const [newPropName, setNewPropName] = useState("");
	const [newPropType, setNewPropType] = useState("string");
	const [newPropRequired, setNewPropRequired] = useState(true);

	// subtypes
	const [stringSubtype, setStringSubtype] = useState("default");
	const [numberMin, setNumberMin] = useState("");
	const [numberMax, setNumberMax] = useState("");
	const [arrayItemType, setArrayItemType] = useState("string");

	const handleAddProperty = () => {
		if (!newPropName.trim()) return;
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const propertyOptions: any = {};
		switch (newPropType) {
			case "string":
				if (stringSubtype === "date") {
					propertyOptions.format = "date-time";
				}
				break;

			case "number":
				if (numberMin !== "") {
					propertyOptions.minimum = Number.parseFloat(numberMin);
				}
				if (numberMax !== "") {
					propertyOptions.maximum = Number.parseFloat(numberMax);
				}
				break;

			case "array":
				propertyOptions.items = {
					type: arrayItemType,
				};
				break;
		}

		onAddProperty(newPropName, newPropType, newPropRequired, propertyOptions);
		setNewPropName("");
		setNewPropType("string");
		setNewPropRequired(true);
		setStringSubtype("default");
		setNumberMin("");
		setNumberMax("");
		setArrayItemType("string");
	};

	const renderTypeSpecificOptions = () => {
		switch (newPropType) {
			case "string":
				return (
					<Select value={stringSubtype} onValueChange={setStringSubtype}>
						<SelectTrigger className={"flex h-8 w-28 flex-auto"}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="default">Default</SelectItem>
							<SelectItem value="date">Date</SelectItem>
						</SelectContent>
					</Select>
				);

			case "number":
				return (
					<div className={"grid grid-cols-2 gap-2"}>
						<Input
							placeholder="Min value"
							type="number"
							value={numberMin}
							onChange={(e) => setNumberMin(e.target.value)}
							className="h-8"
						/>
						<Input
							placeholder="Max value"
							type="number"
							value={numberMax}
							onChange={(e) => setNumberMax(e.target.value)}
							className="h-8"
						/>
					</div>
				);

			case "array":
				return (
					<Select value={arrayItemType} onValueChange={setArrayItemType}>
						<SelectTrigger className={"flex h-8 w-28 flex-auto"}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="string">String</SelectItem>
							<SelectItem value="number">Number</SelectItem>
							<SelectItem value="boolean">Boolean</SelectItem>
							<SelectItem value="mixed">Mixed</SelectItem>
						</SelectContent>
					</Select>
				);

			default:
				return null;
		}
	};

	return (
		<div className="space-y-2">
			<h3 className={"font-medium text-sm"}>Add Property</h3>
			<div className={"flex flex-auto items-center gap-2"}>
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
					<SelectTrigger className={"flex h-8 w-26 flex-auto"}>
						<SelectValue placeholder="Type" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="string">String</SelectItem>
						<SelectItem value="number">Number</SelectItem>
						<SelectItem value="boolean">Boolean</SelectItem>
						<SelectItem value="object">Object</SelectItem>
						<SelectItem value="array">Array</SelectItem>
						<SelectItem value="null">Null</SelectItem>
					</SelectContent>
				</Select>
				{renderTypeSpecificOptions()}
				<div className={"flex items-center space-x-1"}>
					<Switch
						id="required"
						checked={newPropRequired}
						onCheckedChange={setNewPropRequired}
					/>
					<Label htmlFor="required" className="text-xs">
						Req
					</Label>
				</div>
				<div className={"flex gap-1"}>
					<Button size="sm" onClick={handleAddProperty} variant={"outline"}>
						<PlusIcon className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
