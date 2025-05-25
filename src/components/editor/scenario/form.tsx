"use client";

import {
	BracesIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	EditIcon,
	FileTextIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Slider } from "~/components/ui/slider";
import { Switch } from "~/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
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

const FIELDS_PER_PAGE = 4;

export function ScenarioForm({
	schema,
	currentScenario,
	onSaveScenario,
}: ScenarioFormProps) {
	// biome-ignore lint/suspicious/noExplicitAny: stuff
	const [formData, setFormData] = useState<any>({});
	const [scenarioName, setScenarioName] = useState("");
	const [currentPage, setCurrentPage] = useState(0);
	const [flattenedFields, setFlattenedFields] = useState<
		Array<{
			name: string;
			path: string;
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			details: any;
			isRequired: boolean;
		}>
	>([]);

	// Flatten nested schema into a list of fields for pagination
	const flattenSchema = (
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		schemaObj: any,
		parentPath = "",
		parentRequired: string[] = [],
	) => {
		const fields: Array<{
			name: string;
			path: string;
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			details: any;
			isRequired: boolean;
		}> = [];

		if (!schemaObj.properties) return fields;

		// biome-ignore lint/complexity/noForEach: prop details can be anything
		Object.entries(schemaObj.properties).forEach(
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			([propName, propDetails]: [string, any]) => {
				const fieldPath = parentPath ? `${parentPath}.${propName}` : propName;
				const isRequired = parentRequired.includes(propName);

				if (propDetails.type === "object" && propDetails.properties) {
					// For objects, add a header and then flatten their properties
					fields.push({
						name: propName,
						path: fieldPath,
						details: { ...propDetails, isObjectHeader: true },
						isRequired,
					});

					// Recursively flatten nested object properties
					const nestedFields = flattenSchema(
						propDetails,
						fieldPath,
						propDetails.required || [],
					);
					fields.push(...nestedFields);
				} else {
					// Regular field
					fields.push({
						name: propName,
						path: fieldPath,
						details: propDetails,
						isRequired,
					});
				}
			},
		);

		return fields;
	};

	// Initialize form data when schema or current scenario changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (currentScenario) {
			setFormData(currentScenario.data || {});
			setScenarioName(currentScenario.name);
		} else {
			// Initialize with default values based on schema
			const initialData = initializeDataFromSchema(schema);
			setFormData(initialData);
			setScenarioName("");
		}

		// Flatten the schema for pagination
		const flattened = flattenSchema(schema, "", schema.required || []);
		setFlattenedFields(flattened);
		setCurrentPage(0); // Reset to first page when schema changes
	}, [schema, currentScenario]);

	// biome-ignore lint/suspicious/noExplicitAny: schema can be anything
	const initializeDataFromSchema = (schemaObj: any, parentPath = ""): any => {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const initialData: any = {};

		if (!schemaObj.properties) return initialData;

		// biome-ignore lint/complexity/noForEach: <explanation>
		Object.entries(schemaObj.properties).forEach(
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
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
						initialData[propName] = initializeDataFromSchema(propDetails);
						break;
				}
			},
		);

		return initialData;
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

	const handleSave = () => {
		onSaveScenario(formData, scenarioName || `Scenario ${Date.now()}`);
	};

	const renderFormField = (field: {
		name: string;
		path: string;
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		details: any;
		isRequired: boolean;
	}) => {
		const { name, path, details, isRequired } = field;

		// Object header (just a divider with title)
		if (details.isObjectHeader) {
			return (
				<div key={path} className="col-span-full border-zinc-600 border-t pt-4">
					<h4 className="mb-2 font-medium text-sm text-zinc-200">
						{name} {isRequired && <span className="text-red-500">*</span>}
					</h4>
				</div>
			);
		}

		switch (details.type) {
			case "string":
				return (
					<div key={path} className="space-y-1">
						<Label htmlFor={path} className="text-sm">
							{name} {isRequired && <span className="text-red-500">*</span>}
						</Label>
						<Input
							id={path}
							value={getNestedValue(formData, path) || ""}
							onChange={(e) =>
								setFormData(setNestedValue(formData, path, e.target.value))
							}
							className="border-zinc-600 bg-zinc-700"
						/>
					</div>
				);

			case "number":
				return (
					<div key={path} className="space-y-1">
						<Label htmlFor={path} className="text-sm">
							{name} {isRequired && <span className="text-red-500">*</span>}
						</Label>
						<div className="flex gap-2">
							<Slider
								id={path}
								value={[getNestedValue(formData, path) || 0]}
								min={0}
								max={100}
								step={1}
								onValueChange={(value) =>
									setFormData(setNestedValue(formData, path, value[0]))
								}
								className="flex-1"
							/>
							<Input
								type="number"
								value={getNestedValue(formData, path) || 0}
								onChange={(e) =>
									setFormData(
										setNestedValue(formData, path, Number(e.target.value)),
									)
								}
								className="w-20 border-zinc-600 bg-zinc-700"
							/>
						</div>
					</div>
				);

			case "boolean":
				return (
					<div key={path} className="flex items-center justify-between">
						<Label htmlFor={path} className="text-sm">
							{name} {isRequired && <span className="text-red-500">*</span>}
						</Label>
						<Switch
							id={path}
							checked={getNestedValue(formData, path) || false}
							onCheckedChange={(checked) =>
								setFormData(setNestedValue(formData, path, checked))
							}
						/>
					</div>
				);

			default:
				return (
					<div key={path} className="text-sm text-zinc-400">
						Unsupported type: {details.type}
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
	if (!schema.properties || Object.keys(schema.properties).length === 0) {
		return (
			<div className="py-8 text-center text-zinc-500">
				<p className="text-sm">Build a schema first to create scenarios</p>
				<p className="mt-1 text-xs">
					Add properties in the Schema Builder to get started
				</p>
			</div>
		);
	}

	// Calculate pagination
	const totalPages = Math.ceil(flattenedFields.length / FIELDS_PER_PAGE);
	const startIndex = currentPage * FIELDS_PER_PAGE;
	const endIndex = startIndex + FIELDS_PER_PAGE;
	const currentFields = flattenedFields.slice(startIndex, endIndex);

	const canGoNext = currentPage < totalPages - 1;
	const canGoPrevious = currentPage > 0;

	// Show the form when a scenario is selected/being created and schema has properties
	return (
		<Tabs defaultValue={"form"}>
			<TabsList className={"grid w-full grid-cols-2"}>
				<TabsTrigger value={"form"}>
					<EditIcon className="h-6 w-6" />
					Scenario Form
				</TabsTrigger>
				<TabsTrigger value={"preview"}>
					<BracesIcon className="h-6 w-6" />
					JSON Preview
				</TabsTrigger>
			</TabsList>
			<TabsContent value={"form"}>
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

					{/* Pagination Controls */}
					{totalPages > 1 && (
						<div className="flex items-center justify-between border-zinc-700 border-b pb-3">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
								disabled={!canGoPrevious}
								className="flex items-center gap-1"
							>
								<ChevronLeftIcon className="h-4 w-4" />
								Previous
							</Button>

							<span className="text-sm text-zinc-400">
								Page {currentPage + 1} of {totalPages}
							</span>

							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
								}
								disabled={!canGoNext}
								className="flex items-center gap-1"
							>
								Next
								<ChevronRightIcon className="h-4 w-4" />
							</Button>
						</div>
					)}

					{/* Form Fields for Current Page */}
					<div className="space-y-4">
						{currentFields.map((field) => renderFormField(field))}
					</div>

					{/* Save Button (only show on last page or if single page) */}
					{(currentPage === totalPages - 1 || totalPages === 1) && (
						<Button
							className="w-full"
							onClick={handleSave}
							disabled={!scenarioName.trim()}
						>
							{currentScenario.id ? "Update Scenario" : "Save Scenario"}
						</Button>
					)}

					{/* Navigation hint for multi-page forms */}
					{totalPages > 1 && currentPage < totalPages - 1 && (
						<div className="text-center">
							<p className="text-sm text-zinc-500">
								Continue to next page to complete the form
							</p>
						</div>
					)}
				</div>
			</TabsContent>
			<TabsContent value={"preview"}>
				<div className="space-y-2">
					<Label className="font-medium text-sm">Scenario Data Preview</Label>
					<Textarea
						value={JSON.stringify(formData, null, 2)}
						readOnly
						className="border-zinc-600 bg-zinc-700 font-mono text-xs"
						rows={6}
					/>
				</div>
			</TabsContent>
		</Tabs>
	);
}
