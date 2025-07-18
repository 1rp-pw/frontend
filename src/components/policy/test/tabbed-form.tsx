"use client";

import {
	BracesIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	CopyIcon,
	EditIcon,
	FileTextIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { DateTimeInput } from "~/components/ui/date-time-input";
import { Input } from "~/components/ui/input";
import { InputTags } from "~/components/ui/inputtags";
import { Label } from "~/components/ui/label";
import { RainbowBraces } from "~/components/ui/rainbow";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Slider } from "~/components/ui/slider";
import { Switch } from "~/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

interface Test {
	id: string;
	name: string;
	// biome-ignore lint/suspicious/noExplicitAny: stuff
	data: any;
	expectPass?: boolean;
	created: boolean;
	createdAt: Date;
}

interface TestFormProps {
	// biome-ignore lint/suspicious/noExplicitAny: stuff
	schema: any;
	currentTest: Test | null;
	// biome-ignore lint/suspicious/noExplicitAny: stuff
	onSaveTest: (data: any, name?: string, expectPass?: boolean) => void;
	disabled?: boolean;
}

const FIELDS_PER_PAGE = 4;

interface FieldInfo {
	name: string;
	path: string;
	// biome-ignore lint/suspicious/noExplicitAny: can be anything
	details: any;
	isRequired: boolean;
}

interface TabStructure {
	name: string;
	path: string;
	fields: FieldInfo[];
	subTabs?: TabStructure[];
}

export function TabbedTestForm({
	schema,
	currentTest,
	onSaveTest,
	disabled = false,
}: TestFormProps) {
	// biome-ignore lint/suspicious/noExplicitAny: stuff
	const [formData, setFormData] = useState<any>({});
	const [testName, setTestName] = useState("");
	const [expectPass, setExpectPass] = useState(true);
	const [tabStructure, setTabStructure] = useState<TabStructure[]>([]);
	// Track pagination state for each sub-tab
	const [paginationState, setPaginationState] = useState<
		Record<string, number>
	>({});

	// biome-ignore lint/correctness/useExhaustiveDependencies: yep
	useEffect(() => {
		if (currentTest) {
			setFormData(currentTest.data || {});
			setTestName(currentTest.name);
			setExpectPass(currentTest.expectPass ?? true);
		} else {
			const initialData = initializeDataFromSchema(schema);
			setFormData(initialData);
			setTestName("");
			setExpectPass(true);
		}

		// Build tab structure from schema
		const structure = buildTabStructure(schema);
		setTabStructure(structure);
		setPaginationState({}); // Reset pagination
	}, [schema, currentTest]);

	// biome-ignore lint/suspicious/noExplicitAny: schema can be anything
	const initializeDataFromSchema = (schemaObj: any, _parentPath = ""): any => {
		// biome-ignore lint/suspicious/noExplicitAny: can be antyhing
		const initialData: any = {};

		if (!schemaObj.properties) return initialData;

		Object.entries(schemaObj.properties).forEach(
			// biome-ignore lint/suspicious/noExplicitAny: can be anything
			([propName, propDetails]: [string, any]) => {
				switch (propDetails.type) {
					case "string":
						initialData[propName] = "";
						break;
					case "number":
					case "integer":
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

	// Build the tab structure from schema - recursively process all objects as sub-tabs
	const buildTabStructure = (
		// biome-ignore lint/suspicious/noExplicitAny: can be anything
		schemaObj: any,
		parentPath = "",
		parentRequired: string[] = [],
	): TabStructure[] => {
		const tabs: TabStructure[] = [];

		if (!schemaObj.properties) return tabs;

		Object.entries(schemaObj.properties).forEach(
			// biome-ignore lint/suspicious/noExplicitAny: can be anything
			([propName, propDetails]: [string, any]) => {
				const fieldPath = parentPath ? `${parentPath}.${propName}` : propName;
				const isRequired = parentRequired.includes(propName);

				// Only create tabs for top-level properties
				if (
					!parentPath &&
					propDetails.type === "object" &&
					propDetails.properties
				) {
					const tab: TabStructure = {
						name: propName,
						path: fieldPath,
						fields: [],
						subTabs: [],
					};

					// Process nested properties and create sub-tabs for ALL objects
					tab.subTabs = processNestedProperties(
						propDetails,
						fieldPath,
						propDetails.required || [],
					);

					tabs.push(tab);
				} else if (!parentPath) {
					// Top-level non-object property - create a simple tab
					tabs.push({
						name: propName,
						path: fieldPath,
						fields: [
							{
								name: propName,
								path: fieldPath,
								details: propDetails,
								isRequired,
							},
						],
					});
				}
			},
		);

		return tabs;
	};

	// Recursively process nested properties and create sub-tabs for all objects
	const processNestedProperties = (
		// biome-ignore lint/suspicious/noExplicitAny: can be anything
		parentObj: any,
		parentPath: string,
		parentRequired: string[] = [],
	): TabStructure[] => {
		const subTabs: TabStructure[] = [];
		const directFields: FieldInfo[] = [];

		if (!parentObj.properties) return subTabs;

		Object.entries(parentObj.properties).forEach(
			// biome-ignore lint/suspicious/noExplicitAny: can be anything
			([propName, propDetails]: [string, any]) => {
				const fieldPath = `${parentPath}.${propName}`;
				const isRequired = parentRequired.includes(propName);

				if (propDetails.type === "object" && propDetails.properties) {
					// Create a sub-tab for this object
					const subTab: TabStructure = {
						name: propName,
						path: fieldPath,
						fields: [],
						subTabs: [],
					};

					// Recursively process this object's properties
					const nestedSubTabs = processNestedProperties(
						propDetails,
						fieldPath,
						propDetails.required || [],
					);

					// Get direct fields for this object (non-object properties)
					Object.entries(propDetails.properties).forEach(
						// biome-ignore lint/suspicious/noExplicitAny: can be anything
						([nestedPropName, nestedPropDetails]: [string, any]) => {
							if (
								nestedPropDetails.type !== "object" ||
								!nestedPropDetails.properties
							) {
								subTab.fields.push({
									name: nestedPropName,
									path: `${fieldPath}.${nestedPropName}`,
									details: nestedPropDetails,
									isRequired: (propDetails.required || []).includes(
										nestedPropName,
									),
								});
							}
						},
					);

					// Add nested sub-tabs if any
					if (nestedSubTabs.length > 0) {
						subTab.subTabs = nestedSubTabs;
					}

					subTabs.push(subTab);
				} else {
					// Non-object field - add to direct fields
					directFields.push({
						name: propName,
						path: fieldPath,
						details: propDetails,
						isRequired,
					});
				}
			},
		);

		// If there are direct fields and sub-tabs, create a "General" tab for direct fields
		if (directFields.length > 0 && subTabs.length > 0) {
			subTabs.unshift({
				name: "_general",
				path: `${parentPath}._general`,
				fields: directFields,
			});
		}

		// Return subTabs if any exist, otherwise return a special marker with direct fields
		if (subTabs.length > 0) {
			return subTabs;
		}
		if (directFields.length > 0) {
			// Return a special structure to indicate direct fields only
			return [
				{
					name: "_direct",
					path: parentPath,
					fields: directFields,
				},
			];
		}

		return subTabs;
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
		onSaveTest(formData, testName || `Test ${Date.now()}`, expectPass);
	};

	const formatFieldLabel = (fieldName: string): string => {
		const connectorWords = new Set([
			"of",
			"in",
			"and",
			"or",
			"the",
			"a",
			"an",
			"to",
			"for",
			"with",
		]);

		return fieldName
			.replace(/_/g, " ")
			.replace(/([A-Z])/g, " $1")
			.split(" ")
			.filter((word) => word.length > 0)
			.map((word, index) => {
				const lowerWord = word.toLowerCase();
				if (index === 0 || !connectorWords.has(lowerWord)) {
					return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
				}
				return lowerWord;
			})
			.join(" ");
	};

	const renderFormField = (field: FieldInfo) => {
		const { name, path, details, isRequired } = field;

		switch (details.type) {
			case "string":
				if (details.format === "date-time" || details.format === "date") {
					return (
						<div key={path} className={"space-y-1"}>
							<Label htmlFor={path} className="text-sm">
								{formatFieldLabel(name)}{" "}
								{isRequired && <span className="text-red-500">*</span>}
							</Label>
							<DateTimeInput
								id={path}
								value={
									getNestedValue(formData, path)
										? new Date(getNestedValue(formData, path))
										: undefined
								}
								onChange={(date) =>
									setFormData(
										setNestedValue(formData, path, date.toISOString()),
									)
								}
								className="border-zinc-600 "
								disabled={disabled}
							/>
						</div>
					);
				}

				if (details.enum && Array.isArray(details.enum)) {
					return (
						<div key={path} className="space-y-1">
							<Label htmlFor={path} className="text-sm">
								{formatFieldLabel(name)}{" "}
								{isRequired && <span className="text-red-500">*</span>}
							</Label>
							<Select
								value={getNestedValue(formData, path) || ""}
								onValueChange={(value) =>
									setFormData(setNestedValue(formData, path, value))
								}
								disabled={disabled}
							>
								<SelectTrigger
									id={path}
									className="border-zinc-600 bg-zinc-700"
								>
									<SelectValue
										placeholder={`Select ${formatFieldLabel(name).toLowerCase()}`}
									/>
								</SelectTrigger>
								<SelectContent>
									{details.enum.map((option: string) => (
										<SelectItem key={option} value={option}>
											{formatFieldLabel(option)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					);
				}

				return (
					<div key={path} className="space-y-1">
						<Label htmlFor={path} className="text-sm">
							{formatFieldLabel(name)}{" "}
							{isRequired && <span className="text-red-500">*</span>}
						</Label>
						<Input
							id={path}
							value={getNestedValue(formData, path) || ""}
							onChange={(e) =>
								setFormData(setNestedValue(formData, path, e.target.value))
							}
							className="border-zinc-600 bg-zinc-700"
							disabled={disabled}
						/>
					</div>
				);

			case "number":
			case "integer":
				return (
					<div key={path} className="space-y-1">
						<Label htmlFor={path} className="text-sm">
							{formatFieldLabel(name)}{" "}
							{isRequired && <span className="text-red-500">*</span>}
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
								disabled={disabled}
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
								disabled={disabled}
							/>
						</div>
					</div>
				);

			case "boolean":
				return (
					<div key={path} className="flex items-center justify-between">
						<Label htmlFor={path} className="text-sm">
							{formatFieldLabel(name)}{" "}
							{isRequired && <span className="text-red-500">*</span>}
						</Label>
						<Switch
							id={path}
							checked={getNestedValue(formData, path) || false}
							onCheckedChange={(checked) =>
								setFormData(setNestedValue(formData, path, checked))
							}
							disabled={disabled}
						/>
					</div>
				);

			case "array":
				return (
					<div key={path} className="space-y-1">
						<Label htmlFor={path} className="text-sm">
							{formatFieldLabel(name)}{" "}
							{isRequired && <span className="text-red-500">*</span>}
						</Label>
						<InputTags
							value={getNestedValue(formData, path) || []}
							onChange={(newTags) =>
								setFormData(setNestedValue(formData, path, newTags))
							}
							placeholder="Type and press Enter to add tags..."
							className="border-zinc-600 bg-zinc-700"
							disabled={disabled}
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

	const renderSubTabContent = (subTab: TabStructure) => {
		// Special case: if this is a "_direct" marker with only fields, don't create tabs
		if (
			subTab.subTabs &&
			subTab.subTabs.length === 1 &&
			subTab.subTabs[0]?.name === "_direct"
		) {
			const directFields = subTab.subTabs[0].fields;
			return renderFieldsWithPagination(directFields, subTab.subTabs[0].path);
		}

		// If this sub-tab has its own nested sub-tabs, render them recursively
		if (subTab.subTabs && subTab.subTabs.length > 0) {
			return (
				<Tabs defaultValue={subTab.subTabs[0]?.name} className="mt-2">
					<TabsList className="w-full overflow-x-auto">
						{subTab.subTabs.map((nestedSubTab) => (
							<TabsTrigger
								key={nestedSubTab.name}
								value={nestedSubTab.name}
								className="min-w-fit"
							>
								{nestedSubTab.name === "_general" ||
								nestedSubTab.name === "_direct"
									? "General"
									: formatFieldLabel(nestedSubTab.name)}
							</TabsTrigger>
						))}
					</TabsList>

					{subTab.subTabs.map((nestedSubTab) => (
						<TabsContent
							key={nestedSubTab.name}
							value={nestedSubTab.name}
							className="mt-4"
						>
							{renderSubTabContent(nestedSubTab)}
						</TabsContent>
					))}
				</Tabs>
			);
		}

		// Render fields with pagination
		return renderFieldsWithPagination(subTab.fields, subTab.path);
	};

	const renderFieldsWithPagination = (fields: FieldInfo[], path: string) => {
		const currentPage = paginationState[path] || 0;
		const totalPages = Math.ceil(fields.length / FIELDS_PER_PAGE);
		const needsPagination = fields.length > FIELDS_PER_PAGE;

		const startIndex = currentPage * FIELDS_PER_PAGE;
		const endIndex = startIndex + FIELDS_PER_PAGE;
		const currentFields = fields.slice(startIndex, endIndex);

		return (
			<div className="space-y-4">
				{currentFields.map((field) => renderFormField(field))}

				{needsPagination && (
					<div className="flex items-center justify-between border-zinc-700 border-t pt-3">
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								setPaginationState((prev) => ({
									...prev,
									[path]: Math.max(0, currentPage - 1),
								}))
							}
							disabled={currentPage === 0}
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
								setPaginationState((prev) => ({
									...prev,
									[path]: Math.min(totalPages - 1, currentPage + 1),
								}))
							}
							disabled={currentPage >= totalPages - 1}
							className="flex items-center gap-1"
						>
							Next
							<ChevronRightIcon className="h-4 w-4" />
						</Button>
					</div>
				)}
			</div>
		);
	};

	const renderTabContent = (tab: TabStructure) => {
		// If tab has sub-tabs, render nested tabs
		if (tab.subTabs && tab.subTabs.length > 0) {
			// Include direct fields if any
			const hasDirectFields = tab.fields.length > 0;

			return (
				<Tabs
					defaultValue={hasDirectFields ? "_fields" : tab.subTabs[0]?.name}
					className="mt-4"
				>
					<TabsList className="w-full overflow-x-auto">
						{hasDirectFields && (
							<TabsTrigger value="_fields" className="min-w-fit">
								General
							</TabsTrigger>
						)}
						{tab.subTabs.map((subTab) => (
							<TabsTrigger
								key={subTab.name}
								value={subTab.name}
								className="min-w-fit"
							>
								{subTab.name === "_general" ||
								subTab.name === "_fields" ||
								subTab.name === "_direct"
									? "General"
									: formatFieldLabel(subTab.name)}
							</TabsTrigger>
						))}
					</TabsList>

					{hasDirectFields && (
						<TabsContent value="_fields" className="mt-4">
							<div className="space-y-4">
								{tab.fields.map((field) => renderFormField(field))}
							</div>
						</TabsContent>
					)}

					{tab.subTabs.map((subTab) => (
						<TabsContent key={subTab.name} value={subTab.name} className="mt-4">
							{renderSubTabContent(subTab)}
						</TabsContent>
					))}
				</Tabs>
			);
		}

		// No sub-tabs, just render fields with pagination if needed
		return renderFieldsWithPagination(tab.fields, tab.path);
	};

	// If no test is selected or being created, show a message
	if (!currentTest) {
		return (
			<div className="flex h-full flex-col items-center justify-center p-8 text-center text-zinc-500">
				<FileTextIcon className="mb-4 h-12 w-12 opacity-30" />
				<h3 className="mb-2 font-medium text-lg">No Test Selected</h3>
				<p className="max-w-xs text-sm">
					Select an existing test from the list or click "New Test" to create
					one
				</p>
			</div>
		);
	}

	// If schema has no properties, show a message
	if (!schema.properties || Object.keys(schema.properties).length === 0) {
		return (
			<div className="py-8 text-center text-zinc-500">
				<p className="text-sm">Build a schema first to create tests</p>
				<p className="mt-1 text-xs">
					Add properties in the Schema Builder to get started
				</p>
			</div>
		);
	}

	return (
		<Tabs defaultValue={"form"}>
			<TabsList className={"grid w-full grid-cols-2"}>
				<TabsTrigger value={"form"}>
					<EditIcon className="h-6 w-6" />
					Test Form
				</TabsTrigger>
				<TabsTrigger value={"preview"}>
					<BracesIcon className="h-6 w-6" />
					JSON Preview
				</TabsTrigger>
			</TabsList>
			<TabsContent value={"form"}>
				<div className="space-y-4">
					{/* Test Name and Expect Pass */}
					<div className="flex items-end gap-4 rounded-sm bg-gray-500 p-2 text-black">
						<div className="flex-1 space-y-2">
							<Label htmlFor="test-name" className="font-medium text-sm">
								Test Name
							</Label>
							<Input
								name="test-name"
								value={testName}
								onChange={(e) => setTestName(e.target.value)}
								placeholder="Enter test name..."
								className="border-zinc-600 bg-zinc-700"
								disabled={disabled}
							/>
						</div>
						<div className="flex items-center space-x-2 pb-1">
							<Switch
								name="expect-pass"
								checked={expectPass}
								onCheckedChange={setExpectPass}
								disabled={disabled}
							/>
							<Label
								htmlFor="expect-pass"
								className="whitespace-nowrap text-sm"
							>
								Expect Pass
							</Label>
						</div>
					</div>

					{/* Main tabs for top-level properties */}
					{tabStructure.length > 0 && (
						<Tabs defaultValue={tabStructure[0]?.name} className="w-full">
							<TabsList className="w-full overflow-x-auto">
								{tabStructure.map((tab) => (
									<TabsTrigger
										key={tab.name}
										value={tab.name}
										className="min-w-fit"
									>
										{formatFieldLabel(tab.name)}
									</TabsTrigger>
								))}
							</TabsList>

							{tabStructure.map((tab) => (
								<TabsContent key={tab.name} value={tab.name} className="mt-4">
									{renderTabContent(tab)}
								</TabsContent>
							))}
						</Tabs>
					)}

					{!disabled && (
						<div className="mt-auto border-zinc-600 border-t pt-4">
							<Button
								className="w-full"
								onClick={handleSave}
								disabled={!testName.trim()}
							>
								{currentTest.created ? "Update Test" : "Save Test"}
							</Button>
						</div>
					)}
				</div>
			</TabsContent>
			<TabsContent value={"preview"}>
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<span className="font-medium text-sm">JSON Preview</span>
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								navigator.clipboard
									.writeText(JSON.stringify(formData, null, 2))
									.then(() => {
										toast("Copied JSON to clipboard", {});
									});
							}}
							className="h-7 px-2"
						>
							<CopyIcon className="h-3 w-3" />
							Copy JSON
						</Button>
					</div>
					<pre className="overflow-auto rounded bg-zinc-700/30 p-2 text-xs">
						<RainbowBraces json={formData} className={"text-xs"} />
					</pre>
				</div>
			</TabsContent>
		</Tabs>
	);
}
