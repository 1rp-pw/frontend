"use client";

import { FileTextIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Slider } from "~/components/ui/slider";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";

interface Scenario {
	id: string;
	name: string;
	// biome-ignore lint/suspicious/noExplicitAny: stuff
	data: any;
	createdAt: Date;
}

interface ScenarioFormProps {
	// biome-ignore lint/suspicious/noExplicitAny: stuff
	schema: any;
	currentScenario: Scenario | null;
	// biome-ignore lint/suspicious/noExplicitAny: stuff
	onSaveScenario: (data: any, name?: string) => void;
}

export function ScenarioForm({
	schema,
	currentScenario,
	onSaveScenario,
}: ScenarioFormProps) {
	// biome-ignore lint/suspicious/noExplicitAny: stuff
	const [formData, setFormData] = useState<any>({});
	const [scenarioName, setScenarioName] = useState("");

	// Initialize form data when schema or current scenario changes
	useEffect(() => {
		if (currentScenario) {
			setFormData(currentScenario.data || {});
			setScenarioName(currentScenario.name);
		} else {
			// Initialize with default values based on schema
			// biome-ignore lint/suspicious/noExplicitAny: generated
			const initialData: any = {};
			if (schema.properties) {
				// biome-ignore lint/complexity/noForEach: easiest way
				Object.entries(schema.properties).forEach(
					// biome-ignore lint/suspicious/noExplicitAny: stuff
					([propName, propDetails]: [string, any]) => {
						switch (propDetails.type) {
							case "string":
								initialData[propName] = "";
								break;
							case "number":
								initialData[propName] = 0;
								break;
							case "boolean":
								initialData[propName] = false;
								break;
							case "array":
								initialData[propName] = [];
								break;
							case "object":
								initialData[propName] = {};
								break;
						}
					},
				);
			}
			setFormData(initialData);
			setScenarioName("");
		}
	}, [schema, currentScenario]);

	// biome-ignore lint/suspicious/noExplicitAny: stuff
	const handleChange = (propName: string, value: any) => {
		setFormData({
			...formData,
			[propName]: value,
		});
	};

	const handleSave = () => {
		onSaveScenario(formData, scenarioName || `Scenario ${Date.now()}`);
	};

	// biome-ignore lint/suspicious/noExplicitAny: stuff
	const renderNestedObjectFields = (objSchema: any, parentPath = "") => {
		if (!objSchema.properties) return null;

		return Object.entries(objSchema.properties).map(
			// biome-ignore lint/suspicious/noExplicitAny: stuff
			([propName, propDetails]: [string, any]) => {
				const fieldPath = parentPath ? `${parentPath}.${propName}` : propName;
				return renderFormField(
					propName,
					propDetails,
					fieldPath,
					objSchema.required?.includes(propName),
				);
			},
		);
	};

	// biome-ignore lint/suspicious/noExplicitAny: stuff
	const getNestedValue = (obj: any, path: string) => {
		return path.split(".").reduce((current, key) => current?.[key], obj);
	};

	// biome-ignore lint/suspicious/noExplicitAny: stuff
	const setNestedValue = (obj: any, path: string, value: any) => {
		const keys = path.split(".");
		// biome-ignore lint/style/noNonNullAssertion: stuff
		const lastKey = keys.pop()!;
		const target = keys.reduce((current, key) => {
			if (!current[key]) current[key] = {};
			return current[key];
		}, obj);
		target[lastKey] = value;
		return { ...obj };
	};

	const renderFormField = (
		propName: string,
		// biome-ignore lint/suspicious/noExplicitAny: stuff
		propDetails: any,
		fieldPath: string = propName,
		isRequired = false,
	) => {
		switch (propDetails.type) {
			case "string":
				return (
					<div key={fieldPath} className="space-y-1">
						<Label htmlFor={fieldPath} className="text-sm">
							{propName} {isRequired && <span className="text-red-500">*</span>}
						</Label>
						<Input
							id={fieldPath}
							value={getNestedValue(formData, fieldPath) || ""}
							onChange={(e) =>
								setFormData(setNestedValue(formData, fieldPath, e.target.value))
							}
							className="border-zinc-600 bg-zinc-700"
						/>
					</div>
				);

			case "number":
				return (
					<div key={fieldPath} className="space-y-1">
						<Label htmlFor={fieldPath} className="text-sm">
							{propName} {isRequired && <span className="text-red-500">*</span>}
						</Label>
						<div className="flex gap-2">
							<Slider
								id={fieldPath}
								value={[getNestedValue(formData, fieldPath) || 0]}
								min={0}
								max={100}
								step={1}
								onValueChange={(value) =>
									setFormData(setNestedValue(formData, fieldPath, value[0]))
								}
								className="flex-1"
							/>
							<Input
								type="number"
								value={getNestedValue(formData, fieldPath) || 0}
								onChange={(e) =>
									setFormData(
										setNestedValue(formData, fieldPath, Number(e.target.value)),
									)
								}
								className="w-20 border-zinc-600 bg-zinc-700"
							/>
						</div>
					</div>
				);

			case "boolean":
				return (
					<div key={fieldPath} className="flex items-center justify-between">
						<Label htmlFor={fieldPath} className="text-sm">
							{propName} {isRequired && <span className="text-red-500">*</span>}
						</Label>
						<Switch
							id={fieldPath}
							checked={getNestedValue(formData, fieldPath) || false}
							onCheckedChange={(checked) =>
								setFormData(setNestedValue(formData, fieldPath, checked))
							}
						/>
					</div>
				);

			case "object":
				return (
					<div
						key={fieldPath}
						className="space-y-2 rounded border border-zinc-600 p-3"
					>
						<Label className="font-medium text-sm text-zinc-300">
							{propName} {isRequired && <span className="text-red-500">*</span>}
						</Label>
						<div className="ml-2 space-y-3">
							{renderNestedObjectFields(propDetails, fieldPath)}
						</div>
					</div>
				);

			default:
				return (
					<div key={fieldPath} className="text-sm text-zinc-400">
						Unsupported type: {propDetails.type}
					</div>
				);
		}
	};

	// If no scenario is selected or being created, show a message
	if (!currentScenario) {
		return (
			<div className="flex h-full flex-col items-center justify-center p-8 text-center text-zinc-500">
				<FileTextIcon className="mb-4 h-12 w-12 opacity-30" />
				<h3 className="mb-2 font-medium text-lg">No Scenario Selected</h3>
				<p className="max-w-xs text-sm">
					Select an existing scenario from the list or click "New Scenario" to
					create one
				</p>
			</div>
		);
	}

	// If schema has no properties, show a message
	if (Object.keys(schema.properties).length === 0) {
		return (
			<div className="py-8 text-center text-zinc-500">
				<p className="text-sm">Build a schema first to create scenarios</p>
				<p className="mt-1 text-xs">
					Add properties in the Schema Builder to get started
				</p>
			</div>
		);
	}

	// Show the form when a scenario is selected/being created and schema has properties
	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="scenario-name" className="font-medium text-sm">
					Scenario Name
				</Label>
				<Input
					id="scenario-name"
					value={scenarioName}
					onChange={(e) => setScenarioName(e.target.value)}
					placeholder="Enter scenario name..."
					className="border-zinc-600 bg-zinc-700"
				/>
			</div>

			<div className="space-y-4">
				{Object.entries(schema.properties).map(
					// biome-ignore lint/suspicious/noExplicitAny: stuff
					([propName, propDetails]: [string, any]) =>
						renderFormField(
							propName,
							propDetails,
							propName,
							schema.required?.includes(propName),
						),
				)}
			</div>

			<div className="space-y-2">
				<Label className="font-medium text-sm">Scenario Data Preview</Label>
				<Textarea
					value={JSON.stringify(formData, null, 2)}
					readOnly
					className="border-zinc-600 bg-zinc-700 font-mono text-xs"
					rows={6}
				/>
			</div>

			<Button
				className="w-full"
				onClick={handleSave}
				disabled={!scenarioName.trim()}
			>
				{currentScenario.id ? "Update Scenario" : "Save Scenario"}
			</Button>
		</div>
	);
}
