"use client";

import {
	ArrowLeftIcon,
	CheckIcon,
	ChevronRightIcon,
	EditIcon,
	FileTextIcon,
	PlusIcon,
	TrashIcon,
	XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";

interface SchemaBuilderProps {
	// biome-ignore lint/suspicious/noExplicitAny: its dynamic
	schema: any;
	// biome-ignore lint/suspicious/noExplicitAny: still dynamic
	setSchema: (schema: any) => void;
}

type TabType = "edit" | "import";

const DEFAULT_SCHEMA = {
	title: "Person Model",
	type: "object",
	required: ["person"],
	properties: {
		person: {
			type: "object",
			required: ["name", "age", "drivingTestScore"],
			properties: {
				age: {
					type: "number",
				},
				drivingTestScore: {
					type: "number",
				},
				name: {
					type: "string",
				},
			},
		},
	},
};

export function SchemaBuilder({ schema, setSchema }: SchemaBuilderProps) {
	// Initialize with default schema if schema is empty or minimal
	const initializeSchema = () => {
		if (
			!schema ||
			Object.keys(schema).length === 0 ||
			!schema.properties ||
			Object.keys(schema.properties).length === 0
		) {
			setSchema(DEFAULT_SCHEMA);
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: on mount
	useEffect(() => {
		initializeSchema();
	}, []);

	const [activeTab, setActiveTab] = useState<TabType>("edit");
	const [newPropName, setNewPropName] = useState("");
	const [newPropType, setNewPropType] = useState("string");
	const [newPropRequired, setNewPropRequired] = useState(true);
	const [editingObject, setEditingObject] = useState<string | null>(null);
	const [schemaInput, setSchemaInput] = useState("");
	const [importError, setImportError] = useState("");

	// New state for inline editing
	const [editingProperty, setEditingProperty] = useState<string | null>(null);
	const [editingName, setEditingName] = useState("");
	const [editingType, setEditingType] = useState("");
	const [editingRequired, setEditingRequired] = useState(true);

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

	// biome-ignore lint/suspicious/noExplicitAny: stuff
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

	const addProperty = () => {
		if (!newPropName.trim()) return;

		const currentSchema = getCurrentSchema();
		const updatedSchema = { ...currentSchema };

		// biome-ignore lint/suspicious/noExplicitAny: stuff
		const newProperty: any = { type: newPropType };

		// If it's an object type, initialize with empty properties
		if (newPropType === "object") {
			newProperty.properties = {};
			newProperty.required = [];
		}

		updatedSchema.properties = {
			...updatedSchema.properties,
			[newPropName]: { ...newProperty },
		};

		if (newPropRequired) {
			updatedSchema.required = [...(updatedSchema.required || []), newPropName];
		}

		updateNestedSchema(updatedSchema);
		setNewPropName("");
		setNewPropType("string");
		setNewPropRequired(true);
	};

	const removeProperty = (propName: string) => {
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

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const startEditing = (propName: string, propDetails: any) => {
		setEditingProperty(propName);
		setEditingName(propName);
		setEditingType(propDetails.type);
		const currentSchema = getCurrentSchema();
		setEditingRequired(currentSchema.required?.includes(propName) || false);
	};

	const cancelEditing = () => {
		setEditingProperty(null);
		setEditingName("");
		setEditingType("");
		setEditingRequired(false);
	};

	const saveEdit = () => {
		if (!editingProperty || !editingName.trim()) return;

		const currentSchema = getCurrentSchema();
		const updatedSchema = { ...currentSchema };
		const oldProperty = updatedSchema.properties[editingProperty];

		// Create the updated property
		const newProperty = {
			...oldProperty,
			type: editingType,
		};

		// If changing to object type and it wasn't before, initialize structure
		if (editingType === "object" && oldProperty.type !== "object") {
			newProperty.properties = {};
			newProperty.required = [];
		}

		// If the name changed, we need to rename the property
		if (editingProperty !== editingName) {
			// Remove old property
			const { [editingProperty]: _, ...restProperties } =
				updatedSchema.properties;
			// Add new property
			updatedSchema.properties = {
				...restProperties,
				[editingName]: newProperty,
			};

			// Update required array
			if (updatedSchema.required) {
				updatedSchema.required = updatedSchema.required.map((name: string) =>
					name === editingProperty ? editingName : name,
				);
			}
		} else {
			// Just update the existing property
			updatedSchema.properties[editingProperty] = newProperty;
		}

		// Handle required status
		const currentRequired = updatedSchema.required || [];
		const finalPropName = editingName;

		if (editingRequired && !currentRequired.includes(finalPropName)) {
			updatedSchema.required = [...currentRequired, finalPropName];
		} else if (!editingRequired && currentRequired.includes(finalPropName)) {
			updatedSchema.required = currentRequired.filter(
				(name: string) => name !== finalPropName,
			);
		}

		updateNestedSchema(updatedSchema);
		cancelEditing();
	};

	const editObject = (propName: string) => {
		const newPath = editingObject ? `${editingObject}.${propName}` : propName;
		setEditingObject(newPath);
	};

	const goBack = () => {
		if (!editingObject) return;

		const path = editingObject.split(".");
		if (path.length === 1) {
			setEditingObject(null);
		} else {
			setEditingObject(path.slice(0, -1).join("."));
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
			setActiveTab("edit");
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
	const breadcrumb = editingObject ? editingObject.split(".") : [];

	return (
		<Tabs defaultValue={"edit"}>
			<TabsList className={"grid w-full grid-cols-2"}>
				<TabsTrigger value={"edit"}>
					<EditIcon className="h-4 w-4" />
					Edit Schema
				</TabsTrigger>
				<TabsTrigger value={"import"}>
					<FileTextIcon className="h-4 w-4" />
					Import Schema
				</TabsTrigger>
			</TabsList>
			<TabsContent value={"edit"}>
				<>
					{/* Breadcrumb Navigation */}
					{editingObject && (
						<div className="flex items-center gap-2 rounded bg-zinc-700/30 p-2">
							<Button variant="ghost" size="sm" onClick={goBack}>
								<ArrowLeftIcon className="h-4 w-4" />
							</Button>
							<span className="text-sm text-zinc-400">
								Editing:{" "}
								<span className="text-zinc-200">{breadcrumb.join(" → ")}</span>
							</span>
						</div>
					)}

					<div className="space-y-2">
						<h3 className="font-medium text-sm">Add Property</h3>
						<div className="grid grid-cols-3 gap-2">
							<Input
								placeholder="Property name"
								value={newPropName}
								onChange={(e) => setNewPropName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										addProperty();
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
								<Button size="sm" onClick={addProperty}>
									<PlusIcon className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>

					<div className="space-y-2">
						<h3 className="font-medium text-sm">
							{editingObject
								? `Properties of ${breadcrumb[breadcrumb.length - 1]}`
								: "Schema Properties"}
						</h3>
						<div className="space-y-1">
							{Object.keys(currentSchema.properties || {}).length === 0 ? (
								<p className="text-xs text-zinc-500 italic">
									No properties defined yet
								</p>
							) : (
								Object.entries(currentSchema.properties || {}).map(
									// biome-ignore lint/suspicious/noExplicitAny: hmm
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
													<Select
														value={editingType}
														onValueChange={setEditingType}
													>
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
															<span className="font-medium text-sm">
																{propName}
															</span>
															<span className="ml-2 text-xs text-zinc-400">
																({propDetails.type})
															</span>
															{currentSchema.required?.includes(propName) && (
																<span className="ml-2 text-amber-400 text-xs">
																	required
																</span>
															)}
														</div>
														{propDetails.type === "object" && (
															<Button
																variant="ghost"
																size="sm"
																onClick={() => editObject(propName)}
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
															onClick={() =>
																startEditing(propName, propDetails)
															}
															className="h-6 w-6 text-zinc-400 hover:text-zinc-100"
														>
															<EditIcon className="h-3 w-3" />
														</Button>
														<Button
															variant="ghost"
															size="icon"
															onClick={() => removeProperty(propName)}
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

					{/* Schema Preview */}
					<div className="space-y-2">
						<h3 className="font-medium text-sm">Schema Preview</h3>
						<pre className="max-h-70 overflow-auto rounded bg-zinc-700/30 p-2 text-xs">
							{JSON.stringify(schema, null, 2)}
						</pre>
					</div>
				</>
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
						<Textarea
							placeholder="Paste your JSON schema here..."
							value={schemaInput}
							onChange={(e) => {
								setSchemaInput(e.target.value);
								setImportError("");
							}}
							className="min-h-[200px] font-mono text-sm"
						/>
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

					{/* Current Schema Preview in Import Tab */}
					<div className="space-y-2">
						<h3 className="font-medium text-sm">Current Schema</h3>
						<pre className="max-h-48 overflow-auto rounded bg-zinc-700/30 p-3 text-xs">
							{JSON.stringify(schema, null, 2)}
						</pre>
					</div>
				</div>
			</TabsContent>
		</Tabs>
	);
}
