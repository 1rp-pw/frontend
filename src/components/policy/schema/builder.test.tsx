import { fireEvent, render, waitFor } from "@testing-library/react";
import { SchemaBuilder } from "./builder";

// Mock the policy store
const mockUsePolicyStore = jest.fn();
jest.mock("~/lib/state/policy", () => ({
	usePolicyStore: () => mockUsePolicyStore(),
}));

// Mock UI components
jest.mock("~/components/ui/button", () => ({
	// biome-ignore lint/suspicious/noExplicitAny: any
	Button: ({ children, onClick, disabled, variant, size }: any) => (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			data-variant={variant}
			data-size={size}
			data-testid="button"
		>
			{children}
		</button>
	),
}));

jest.mock("~/components/ui/scroll-area", () => ({
	// biome-ignore lint/suspicious/noExplicitAny: any
	ScrollArea: ({ children, className }: any) => (
		<div data-testid="scroll-area" className={className}>
			{children}
		</div>
	),
}));

jest.mock("~/components/ui/tabs", () => ({
	// biome-ignore lint/suspicious/noExplicitAny: any
	Tabs: ({ children, defaultValue }: any) => (
		<div data-testid="tabs" data-default-value={defaultValue}>
			{children}
		</div>
	),
	// biome-ignore lint/suspicious/noExplicitAny: any
	TabsList: ({ children, className }: any) => (
		<div data-testid="tabs-list" className={className}>
			{children}
		</div>
	),
	// biome-ignore lint/suspicious/noExplicitAny: any
	TabsTrigger: ({ children, value }: any) => (
		<button
			type="button"
			data-testid={`tab-trigger-${value}`}
			data-value={value}
		>
			{children}
		</button>
	),
	// biome-ignore lint/suspicious/noExplicitAny: any
	TabsContent: ({ children, value }: any) => (
		<div data-testid={`tab-content-${value}`} data-value={value}>
			{children}
		</div>
	),
}));

jest.mock("~/components/ui/textarea", () => ({
	// biome-ignore lint/suspicious/noExplicitAny: any
	Textarea: ({ value, onChange, placeholder, className }: any) => (
		<textarea
			data-testid="textarea"
			value={value}
			onChange={onChange}
			placeholder={placeholder}
			className={className}
		/>
	),
}));

// Mock child components
jest.mock("./list", () => ({
	PropertyList: ({
		properties,
		required,
		onEditProperty,
		onRemoveProperty,
		onEditObject,
		// biome-ignore lint/suspicious/noExplicitAny: stuffs
	}: any) => (
		<div data-testid="property-list">
			<div data-testid="properties-count">
				{Object.keys(properties || {}).length}
			</div>
			<div data-testid="required-count">{(required || []).length}</div>
			<button
				type="button"
				onClick={() => onEditProperty("test", "test", "string", false)}
				data-testid="edit-property"
			>
				Edit Property
			</button>
			<button
				type="button"
				onClick={() => onRemoveProperty("test")}
				data-testid="remove-property"
			>
				Remove Property
			</button>
			<button
				type="button"
				onClick={() => onEditObject("test")}
				data-testid="edit-object"
			>
				Edit Object
			</button>
		</div>
	),
}));

jest.mock("./navigate", () => ({
	// biome-ignore lint/suspicious/noExplicitAny: any
	BreadcrumbNav: ({ editingObject, onNavigateTo }: any) => (
		<div data-testid="breadcrumb-nav">
			<div data-testid="editing-object">{editingObject || "root"}</div>
			<button
				type="button"
				onClick={() => onNavigateTo(null)}
				data-testid="navigate-root"
			>
				Root
			</button>
			<button
				type="button"
				onClick={() => onNavigateTo("test")}
				data-testid="navigate-nested"
			>
				Navigate
			</button>
		</div>
	),
}));

jest.mock("./preview", () => ({
	// biome-ignore lint/suspicious/noExplicitAny: schema can be anything
	SchemaPreview: ({ schema }: any) => (
		<div data-testid="schema-preview">
			<div data-testid="schema-type">{schema?.type || "unknown"}</div>
		</div>
	),
}));

jest.mock("./properties", () => ({
	// biome-ignore lint/suspicious/noExplicitAny: any
	PropertyForm: ({ onAddProperty }: any) => (
		<div data-testid="property-form">
			<button
				type="button"
				onClick={() =>
					onAddProperty("newProp", "string", true, { description: "test" })
				}
				data-testid="add-property"
			>
				Add Property
			</button>
		</div>
	),
}));

// Mock Lucide icons
jest.mock("lucide-react", () => ({
	EditIcon: () => <span data-testid="edit-icon">Edit</span>,
	FileJsonIcon: () => <span data-testid="file-json-icon">JSON</span>,
	FileTextIcon: () => <span data-testid="file-text-icon">Text</span>,
}));

describe("SchemaBuilder", () => {
	const mockSchema = {
		type: "object",
		properties: {
			name: { type: "string" },
			age: { type: "number" },
			test: {
				type: "object",
				properties: {
					nested: {
						type: "object",
						properties: {
							value: { type: "string" },
						},
						required: ["value"],
					},
				},
				required: ["nested"],
			},
		},
		required: ["name"],
	};

	const defaultProps = {
		schema: mockSchema,
		setSchema: jest.fn(),
		newImportAllowed: true,
		disabled: false,
	};

	beforeEach(() => {
		jest.clearAllMocks();
		mockUsePolicyStore.mockReturnValue({
			initializeSchemaIfEmpty: jest.fn(),
		});
	});

	it("should render with all tabs when newImportAllowed is true", () => {
		const { getByTestId } = render(<SchemaBuilder {...defaultProps} />);

		expect(getByTestId("tabs")).toBeInTheDocument();
		expect(getByTestId("tab-trigger-edit")).toBeInTheDocument();
		expect(getByTestId("tab-trigger-import")).toBeInTheDocument();
		expect(getByTestId("tab-trigger-preview")).toBeInTheDocument();
	});

	it("should render without import tab when newImportAllowed is false", () => {
		const { getByTestId, queryByTestId } = render(
			<SchemaBuilder {...defaultProps} newImportAllowed={false} />,
		);

		expect(getByTestId("tab-trigger-edit")).toBeInTheDocument();
		expect(queryByTestId("tab-trigger-import")).not.toBeInTheDocument();
		expect(getByTestId("tab-trigger-preview")).toBeInTheDocument();
	});

	it("should render only preview tab when disabled", () => {
		const { getByTestId, queryByTestId } = render(
			<SchemaBuilder
				{...defaultProps}
				disabled={true}
				newImportAllowed={false}
			/>,
		);

		expect(queryByTestId("tab-trigger-edit")).not.toBeInTheDocument();
		expect(queryByTestId("tab-trigger-import")).not.toBeInTheDocument();
		expect(getByTestId("tab-trigger-preview")).toBeInTheDocument();
	});

	it("should initialize schema on mount", () => {
		const initializeSchemaIfEmpty = jest.fn();
		mockUsePolicyStore.mockReturnValue({
			initializeSchemaIfEmpty,
		});

		render(<SchemaBuilder {...defaultProps} />);

		expect(initializeSchemaIfEmpty).toHaveBeenCalled();
	});

	it("should render edit tab content with components", () => {
		const { getByTestId } = render(<SchemaBuilder {...defaultProps} />);

		expect(getByTestId("tab-content-edit")).toBeInTheDocument();
		expect(getByTestId("breadcrumb-nav")).toBeInTheDocument();
		expect(getByTestId("property-form")).toBeInTheDocument();
		expect(getByTestId("property-list")).toBeInTheDocument();
	});

	it("should render import tab content", () => {
		const { getByTestId } = render(<SchemaBuilder {...defaultProps} />);

		expect(getByTestId("tab-content-import")).toBeInTheDocument();
		expect(getByTestId("scroll-area")).toBeInTheDocument();
		expect(getByTestId("textarea")).toBeInTheDocument();
	});

	it("should render preview tab content", () => {
		const { getByTestId } = render(<SchemaBuilder {...defaultProps} />);

		expect(getByTestId("tab-content-preview")).toBeInTheDocument();
		expect(getByTestId("schema-preview")).toBeInTheDocument();
		expect(getByTestId("schema-type")).toHaveTextContent("object");
	});

	it("should handle adding properties", () => {
		const setSchema = jest.fn();
		const { getByTestId } = render(
			<SchemaBuilder {...defaultProps} setSchema={setSchema} />,
		);

		const addButton = getByTestId("add-property");
		fireEvent.click(addButton);

		expect(setSchema).toHaveBeenCalled();
		const updatedSchema = setSchema.mock.calls[0][0];
		expect(updatedSchema.properties.newProp).toBeDefined();
		expect(updatedSchema.properties.newProp.type).toBe("string");
		expect(updatedSchema.required).toContain("newProp");
	});

	it("should handle editing properties", () => {
		const setSchema = jest.fn();
		const { getByTestId } = render(
			<SchemaBuilder {...defaultProps} setSchema={setSchema} />,
		);

		const editButton = getByTestId("edit-property");
		fireEvent.click(editButton);

		expect(setSchema).toHaveBeenCalled();
	});

	it("should handle removing properties", () => {
		const setSchema = jest.fn();
		const { getByTestId } = render(
			<SchemaBuilder {...defaultProps} setSchema={setSchema} />,
		);

		const removeButton = getByTestId("remove-property");
		fireEvent.click(removeButton);

		expect(setSchema).toHaveBeenCalled();
	});

	it("should handle editing nested objects", () => {
		const { getByTestId } = render(<SchemaBuilder {...defaultProps} />);

		const editObjectButton = getByTestId("edit-object");
		fireEvent.click(editObjectButton);

		expect(getByTestId("editing-object")).toHaveTextContent("test");
	});

	it("should handle navigation", () => {
		const { getByTestId } = render(<SchemaBuilder {...defaultProps} />);

		// Navigate to nested
		const navigateButton = getByTestId("navigate-nested");
		fireEvent.click(navigateButton);

		expect(getByTestId("editing-object")).toHaveTextContent("test");

		// Navigate back to root
		const rootButton = getByTestId("navigate-root");
		fireEvent.click(rootButton);

		expect(getByTestId("editing-object")).toHaveTextContent("root");
	});

	it("should handle schema import", async () => {
		const setSchema = jest.fn();
		const { getByTestId, getAllByText } = render(
			<SchemaBuilder {...defaultProps} setSchema={setSchema} />,
		);

		const textarea = getByTestId("textarea");
		const validSchema = JSON.stringify({
			type: "object",
			properties: { test: { type: "string" } },
		});

		fireEvent.change(textarea, { target: { value: validSchema } });

		// Get all "Import Schema" buttons and click the one that's not a tab trigger
		const importButtons = getAllByText("Import Schema");
		const importButton = importButtons.find(
			(button) =>
				!button.hasAttribute("data-testid") ||
				!button.getAttribute("data-testid")?.includes("tab-trigger"),
		);

		if (importButton) {
			fireEvent.click(importButton);
		}

		await waitFor(() => {
			expect(setSchema).toHaveBeenCalledWith({
				type: "object",
				properties: { test: { type: "string" } },
				required: [],
			});
		});
	});

	it("should handle invalid schema import", async () => {
		const setSchema = jest.fn();
		const { getByTestId, getAllByText } = render(
			<SchemaBuilder {...defaultProps} setSchema={setSchema} />,
		);

		const textarea = getByTestId("textarea");
		fireEvent.change(textarea, { target: { value: "invalid json" } });

		// Get all "Import Schema" buttons and click the one that's not a tab trigger
		const importButtons = getAllByText("Import Schema");
		const importButton = importButtons.find(
			(button) =>
				!button.hasAttribute("data-testid") ||
				!button.getAttribute("data-testid")?.includes("tab-trigger"),
		);

		if (importButton) {
			fireEvent.click(importButton);
		}

		// Since we have mocked components, we can't test for specific error text
		// Instead, verify setSchema was not called (indicating error handling)
		await waitFor(() => {
			expect(setSchema).not.toHaveBeenCalled();
		});
	});

	it("should load current schema into textarea", () => {
		const { getByTestId, getByText } = render(
			<SchemaBuilder {...defaultProps} />,
		);

		const loadButton = getByText("Load Current Schema");
		fireEvent.click(loadButton);

		const textarea = getByTestId("textarea");
		expect((textarea as HTMLInputElement).value).toBe(
			JSON.stringify(mockSchema, null, 2),
		);
	});

	it("should clear schema input", () => {
		const { getByTestId, getByText } = render(
			<SchemaBuilder {...defaultProps} />,
		);

		const textarea = getByTestId("textarea");
		fireEvent.change(textarea, { target: { value: "test content" } });

		const clearButton = getByText("Clear");
		fireEvent.click(clearButton);

		expect((textarea as HTMLInputElement).value).toBe("");
	});

	it("should handle object type properties correctly", () => {
		const setSchema = jest.fn();
		const { getByTestId } = render(
			<SchemaBuilder {...defaultProps} setSchema={setSchema} />,
		);

		// Mock adding an object type property
		const propertyForm = getByTestId("property-form");
		const mockOnAddProperty = propertyForm.querySelector(
			'[data-testid="add-property"]',
		);

		// Simulate adding object type
		// biome-ignore lint/style/noNonNullAssertion: null
		fireEvent.click(mockOnAddProperty!);

		expect(setSchema).toHaveBeenCalled();
	});

	it("should handle empty schema", () => {
		const emptySchema = {};
		const { getByTestId } = render(
			<SchemaBuilder {...defaultProps} schema={emptySchema} />,
		);

		expect(getByTestId("properties-count")).toHaveTextContent("0");
		expect(getByTestId("required-count")).toHaveTextContent("0");
	});

	it("should display correct grid layout classes", () => {
		// Test all import allowed
		const { getByTestId, rerender } = render(
			<SchemaBuilder {...defaultProps} />,
		);
		expect(getByTestId("tabs-list")).toHaveClass("grid-cols-3");

		// Test import not allowed
		rerender(<SchemaBuilder {...defaultProps} newImportAllowed={false} />);
		expect(getByTestId("tabs-list")).toHaveClass("grid-cols-2");

		// Test disabled (should also disable import)
		rerender(
			<SchemaBuilder
				{...defaultProps}
				disabled={true}
				newImportAllowed={false}
			/>,
		);
		expect(getByTestId("tabs-list")).toHaveClass("grid-cols-1");
	});

	it("should set correct default tab", () => {
		// Default for enabled
		const { getByTestId, rerender } = render(
			<SchemaBuilder {...defaultProps} />,
		);
		expect(getByTestId("tabs")).toHaveAttribute("data-default-value", "edit");

		// Default for disabled
		rerender(<SchemaBuilder {...defaultProps} disabled={true} />);
		expect(getByTestId("tabs")).toHaveAttribute(
			"data-default-value",
			"preview",
		);
	});
});
