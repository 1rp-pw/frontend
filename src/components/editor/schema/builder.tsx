"use client";

import { EditIcon, FileJsonIcon, FileTextIcon } from "lucide-react";
import { onNavigationIntent } from "next/dist/client/components/links";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { RainbowBraces } from "~/components/ui/rainbow";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { usePolicyStore } from "~/lib/state/policy";
import { PropertyList } from "./list";
import { BreadcrumbNav } from "./navigate";
import { SchemaPreview } from "./preview";
import { PropertyForm } from "./properties";

interface SchemaBuilderProps {
	// biome-ignore lint/suspicious/noExplicitAny: schema is dynamic
	schema: any;
	// biome-ignore lint/suspicious/noExplicitAny: still dynamic
	setSchema: (schema: any) => void;
	newImportAllowed: boolean;
}

export function SchemaBuilder({
	schema,
	setSchema,
	newImportAllowed,
}: SchemaBuilderProps) {
	const { initializeSchemaIfEmpty } = usePolicyStore();

	// biome-ignore lint/correctness/useExhaustiveDependencies: on mount
	useEffect(() => {
		initializeSchemaIfEmpty();
	}, []);

	const [editingObject, setEditingObject] = useState<string | null>(null);
	const [schemaInput, setSchemaInput] = useState("");
	const [importError, setImportError] = useState("");

	const getCurrentSchema = () => {
		if (!editingObject) return schema;

		// Navigate to the nested object schema
		const path = editingObject.split(".");
		let current = schema;
		for (const segment of path) {
			current = current.properties[segment];
		}
		return current;
	};

	// biome-ignore lint/suspicious/noExplicitAny: schema updates can be anything
	const updateNestedSchema = (updatedSchema: any) => {
		if (!editingObject) {
			setSchema(updatedSchema);
			return;
		}

		const path = editingObject.split(".");
		const newSchema = JSON.parse(JSON.stringify(schema));
		let current = newSchema;

		// Navigate to parent
		for (let i = 0; i < path.length - 1; i++) {
			const segment = path[i];
			if (segment && current.properties[segment]) {
				current = current.properties[segment];
			}
		}

		// Update the target object
		const lastSegment = path[path.length - 1];
		if (lastSegment) {
			current.properties[lastSegment] = updatedSchema;
		}
		setSchema(newSchema);
	};

	const handleAddProperty = (
		name: string,
		type: string,
		required: boolean,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		options?: any,
	) => {
		const currentSchema = getCurrentSchema();
		const updatedSchema = { ...currentSchema };

		// biome-ignore lint/suspicious/noExplicitAny: new property can be anything
		const newProperty: any = { type, ...options };

		// If it's an object type, initialize with empty properties
		if (type === "object") {
			newProperty.properties = {};
			newProperty.required = [];
		}

		updatedSchema.properties = {
			...updatedSchema.properties,
			[name]: { ...newProperty },
		};

		if (required) {
			updatedSchema.required = [...(updatedSchema.required || []), name];
		}

		updateNestedSchema(updatedSchema);
	};

	const handleRemoveProperty = (propName: string) => {
		const currentSchema = getCurrentSchema();
		const updatedSchema = { ...currentSchema };
		const { [propName]: _, ...restProperties } = updatedSchema.properties;
		updatedSchema.properties = restProperties;

		if (updatedSchema.required) {
			updatedSchema.required = updatedSchema.required.filter(
				(name: string) => name !== propName,
			);
		}

		updateNestedSchema(updatedSchema);
	};

	const handleEditProperty = (
		oldName: string,
		newName: string,
		type: string,
		required: boolean,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		options?: any,
	) => {
		const currentSchema = getCurrentSchema();
		const updatedSchema = { ...currentSchema };
		//const oldProperty = updatedSchema.properties[oldName];

		// Create the updated property
		const newProperty = {
			type,
			...options,
		};

		// If changing to object type and it wasn't before, initialize structure
		if (type === "object") {
			newProperty.properties = {};
			newProperty.required = [];
		}

		// If the name changed, we need to rename the property
		if (oldName !== newName) {
			// Remove old property
			const { [oldName]: _, ...restProperties } = updatedSchema.properties;
			// Add new property
			updatedSchema.properties = {
				...restProperties,
				[newName]: newProperty,
			};

			// Update required array
			if (updatedSchema.required) {
				updatedSchema.required = updatedSchema.required.map((name: string) =>
					name === oldName ? newName : name,
				);
			}
		} else {
			// Just update the existing property
			updatedSchema.properties[oldName] = newProperty;
		}

		// Handle required status
		const currentRequired = updatedSchema.required || [];
		const finalPropName = newName;

		if (required && !currentRequired.includes(finalPropName)) {
			updatedSchema.required = [...currentRequired, finalPropName];
		} else if (!required && currentRequired.includes(finalPropName)) {
			updatedSchema.required = currentRequired.filter(
				(name: string) => name !== finalPropName,
			);
		}

		updateNestedSchema(updatedSchema);
	};

	const handleEditObject = (propName: string) => {
		const newPath = editingObject ? `${editingObject}.${propName}` : propName;
		setEditingObject(newPath);
	};

	const handleNavigateTo = (targetPath: string | null) => {
		if (targetPath === null) {
			setEditingObject(null);
		} else {
			setEditingObject(targetPath);
		}
	};

	const importSchema = () => {
		try {
			const parsed = JSON.parse(schemaInput.trim());

			// Basic validation to ensure it's a valid JSON Schema structure
			if (typeof parsed !== "object" || parsed === null) {
				throw new Error("Schema must be a valid JSON object");
			}

			// Ensure basic schema structure
			if (!parsed.type) {
				parsed.type = "object";
			}
			if (!parsed.properties) {
				parsed.properties = {};
			}
			if (!parsed.required) {
				parsed.required = [];
			}

			setSchema(parsed);
			setImportError("");
			setEditingObject(null); // Reset to root level
		} catch (error) {
			setImportError(error instanceof Error ? error.message : "Invalid JSON");
		}
	};

	const loadCurrentSchema = () => {
		setSchemaInput(JSON.stringify(schema, null, 2));
		setImportError("");
	};

	const currentSchema = getCurrentSchema();
	const gridCols = newImportAllowed ? "grid-cols-3" : "grid-cols-2";

	return (
		<Tabs defaultValue={"edit"}>
			<TabsList className={`grid w-full ${gridCols}`}>
				<TabsTrigger value={"edit"}>
					<EditIcon className="h-4 w-4" />
					Edit Schema
				</TabsTrigger>
				{newImportAllowed && (
					<TabsTrigger value={"import"}>
						<FileTextIcon className="h-4 w-4" />
						Import Schema
					</TabsTrigger>
				)}
				<TabsTrigger value={"preview"}>
					<FileJsonIcon className="h-4 w-4" />
					Preview Schema
				</TabsTrigger>
			</TabsList>

			<TabsContent value={"edit"}>
				<div className="space-y-4">
					<BreadcrumbNav
						editingObject={editingObject}
						onNavigateTo={handleNavigateTo}
					/>

					<PropertyForm onAddProperty={handleAddProperty} />

					<PropertyList
						properties={currentSchema.properties}
						required={currentSchema.required}
						editingObject={editingObject}
						onEditProperty={handleEditProperty}
						onRemoveProperty={handleRemoveProperty}
						onEditObject={handleEditObject}
					/>
				</div>
			</TabsContent>

			<TabsContent value={"import"}>
				<div className="space-y-4">
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<h3 className="font-medium text-sm">Import JSON Schema</h3>
							<Button variant="outline" size="sm" onClick={loadCurrentSchema}>
								Load Current Schema
							</Button>
						</div>
						<ScrollArea className="h-[350px]">
							<Textarea
								placeholder="Paste your JSON schema here..."
								value={schemaInput}
								onChange={(e) => {
									setSchemaInput(e.target.value);
									setImportError("");
								}}
								className="min-h-[350px] font-mono text-sm"
							/>
						</ScrollArea>
						{importError && (
							<p className="text-red-400 text-sm">{importError}</p>
						)}
						<div className="flex gap-2">
							<Button onClick={importSchema} disabled={!schemaInput.trim()}>
								Import Schema
							</Button>
							<Button
								variant="outline"
								onClick={() => {
									setSchemaInput("");
									setImportError("");
								}}
							>
								Clear
							</Button>
						</div>
					</div>
				</div>
			</TabsContent>

			<TabsContent value={"preview"}>
				<SchemaPreview schema={schema} />
			</TabsContent>
		</Tabs>
	);
}
