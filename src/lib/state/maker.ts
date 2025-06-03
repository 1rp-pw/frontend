import { create } from "zustand";

export type TestStatus =
	| "not-run"
	| "running"
	| "passed"
	| "failed"
	| "invalid";

export interface Outcome {
	passed: boolean;
	ran: boolean;
	status: TestStatus;
}

export interface TestResultSet {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	errors: any | null;
	result: boolean;
	trace: {
		execution: Array<{
			conditions: Array<{
				evaluation_details?: {
					comparison_result: boolean;
					// biome-ignore lint/suspicious/noExplicitAny: <explanation>
					left_value: { type: string; value: any };
					// biome-ignore lint/suspicious/noExplicitAny: <explanation>
					right_value: { type: string; value: any };
				};
				operator?: string;
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				property?: { path: string; value: any };
				result: boolean;
				selector?: { value: string };
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				value?: { pos: any; type: string; value: any };
				referenced_rule_outcome?: string;
				rule_name?: string;
			}>;
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			outcome: { pos: any; value: string };
			result: boolean;
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			selector: { pos: any; value: string };
		}>;
	};
	text: string[];
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	data: any | null;
}

export interface Test {
	id: string;
	name: string;
	data: object;
	expectPass: boolean; // Added expectPass property
	created: boolean; // Added to track if test has been saved
	createdAt: Date;
	outcome: Outcome;
	resultSet: TestResultSet | null;
	schemaVersion?: string;
}

interface TestStore {
	tests: Test[];
	currentTest: Test | null;
	// biome-ignore lint/suspicious/noExplicitAny: schema can be anything
	schema: any;
	policyText: string;
	schemaVersion: string;

	// Actions
	// biome-ignore lint/suspicious/noExplicitAny: schema can be anything
	setSchema: (schema: any) => void;
	setPolicyText: (text: string) => void;

	createTest: () => void;
	saveTest: (
		// biome-ignore lint/suspicious/noExplicitAny: test data can be anything
		testData: any,
		name?: string,
		expectPass?: boolean,
	) => void; // Updated to include expectPass
	selectTest: (test: Test) => void;
	deleteTest: (testId: string) => void;
	runTest: (testId: string) => Promise<void>;
	runAllTests: () => Promise<void>;
	updateTestStatus: (testId: string, status: TestStatus) => void;
	validateTestAgainstSchema: (test: Test) => boolean;
	markInvalidTests: () => void;
	repairTest: (testId: string) => void;
}

// biome-ignore lint/suspicious/noExplicitAny: schema can be anything
const generateSchemaHash = (schema: any): string => {
	return btoa(JSON.stringify(schema)).slice(0, 16);
};

// biome-ignore lint/suspicious/noExplicitAny: data can be anything, schema can be anything
const validateDataAgainstSchema = (data: any, schema: any): boolean => {
	if (!schema || !schema.properties) return false;

	// biome-ignore lint/suspicious/noExplicitAny: schema can be anything
	const validateObject = (obj: any, schemaObj: any): boolean => {
		if (!schemaObj.properties) return true;

		const required = schemaObj.required || [];
		for (const reqProp of required) {
			if (!(reqProp in obj)) return false;
		}

		for (const [propName, propSchema] of Object.entries(schemaObj.properties)) {
			if (propName in obj) {
				const propValue = obj[propName];
				// biome-ignore lint/suspicious/noExplicitAny: prop type can be anything that's the point
				const expectedType = (propSchema as any).type;

				if (expectedType === "string" && typeof propValue !== "string")
					return false;
				if (expectedType === "boolean" && typeof propValue !== "boolean")
					return false;
				if (propValue === "number" && typeof propValue !== "number")
					return false;
				if (
					propValue !== "object" &&
					typeof propValue !== "object" &&
					propValue !== null
				) {
					if (!validateObject(propValue, propSchema)) return false;
				}
			}
		}

		return true;
	};

	return validateObject(data, schema);
};

// biome-ignore lint/suspicious/noExplicitAny: data and schema can be anything
const repairDataToMatchSchema = (data: any, schema: any): any => {
	if (!schema || !schema.properties) return {};

	// biome-ignore lint/suspicious/noExplicitAny: obj can be anything
	const repairObject = (obj: any, schemaObj: any): any => {
		// biome-ignore lint/suspicious/noExplicitAny: obj can be anything
		const repairedObj: any = {};

		if (!schemaObj.properties) return repairedObj;

		for (const [propName, propSchema] of Object.entries(schemaObj.properties)) {
			// biome-ignore lint/suspicious/noExplicitAny: prob could be anything
			const expectedType = (propSchema as any).type;
			const currentValue = obj[propName];

			if (currentValue !== undefined && currentValue !== null) {
				// Try to preserve existing value if type matches
				if (expectedType === "string" && typeof currentValue === "string") {
					repairedObj[propName] = currentValue;
				} else if (
					expectedType === "number" &&
					typeof currentValue === "number"
				) {
					repairedObj[propName] = currentValue;
				} else if (
					expectedType === "boolean" &&
					typeof currentValue === "boolean"
				) {
					repairedObj[propName] = currentValue;
				} else if (
					expectedType === "object" &&
					typeof currentValue === "object"
				) {
					repairedObj[propName] = repairObject(currentValue, propSchema);
				} else {
					// Type mismatch, use default value
					repairedObj[propName] = getDefaultValue(expectedType);
				}
			} else {
				// Missing value, use default
				repairedObj[propName] =
					expectedType === "object"
						? repairObject({}, propSchema)
						: getDefaultValue(expectedType);
			}
		}

		return repairedObj;
	};

	// biome-ignore lint/suspicious/noExplicitAny: default value can be anything
	const getDefaultValue = (type: string): any => {
		switch (type) {
			case "string":
				return "";
			case "number":
				return 0;
			case "boolean":
				return false;
			case "array":
				return [];
			case "object":
				return {};
			default:
				return null;
		}
	};

	return repairObject(data, schema);
};

// Default tests
const defaultTests: Test[] = [
	{
		id: "default-1",
		name: "Passing",
		data: {
			person: {
				name: "Tester",
				drivingTestScore: 70,
				age: 19,
			},
		},
		expectPass: true, // Expects test to pass
		created: true, // Already created
		createdAt: new Date(),
		outcome: {
			passed: false,
			ran: false,
			status: "not-run" as TestStatus,
		},
		resultSet: null,
	},
	{
		id: "default-2",
		name: "Failing",
		data: {
			person: {
				name: "Tester",
				drivingTestScore: 30,
				age: 19,
			},
		},
		expectPass: false, // Expects test to fail (fail = pass)
		created: true, // Already created
		createdAt: new Date(),
		outcome: {
			passed: false,
			ran: false,
			status: "not-run" as TestStatus,
		},
		resultSet: null,
	},
];

const defaultSchema = {
	title: "Person Model",
	type: "object",
	required: ["person"],
	properties: {
		person: {
			type: "object",
			required: ["name", "age", "drivingTestScore"],
			properties: {
				name: {
					type: "string",
					title: "Name",
				},
				age: {
					type: "number",
					title: "Age",
				},
				drivingTestScore: {
					type: "number",
					title: "Driving Test Score",
				},
			},
		},
	},
};

export const useTestStore = create<TestStore>((set, get) => ({
	tests: defaultTests.map((test) => ({
		...test,
		schemaVersion: generateSchemaHash(defaultSchema),
	})),
	currentTest: null,
	schema: defaultSchema,
	schemaVersion: generateSchemaHash(defaultSchema),
	policyText:
		"# Driving Test Rules\nA **Person** gets a full driving license\n if the __age__ of the **Person** is greater than or equal to 17\n and the **Person** passes the practical driving test\n and the **Person** passes the eye test.\n\nA **Person** passes the practical driving test\n if the __driving test score__ of the **Person** is greater than or equal to 60.",

	setSchema: (schema) => {
		const newSchemaVersion = generateSchemaHash(schema);
		set({
			schema,
			schemaVersion: newSchemaVersion,
		});
		get().markInvalidTests();
	},

	setPolicyText: (text) => set({ policyText: text }),

	createTest: () => {
		const { tests, schema, schemaVersion } = get();
		const newTest: Test = {
			id: `temp-${Date.now()}`, // Generate temporary ID
			name: `Test ${tests.length + 1}`,
			data: {},
			expectPass: true, // Default to expecting pass for new tests
			created: false, // Mark as not yet created/saved
			createdAt: new Date(),
			outcome: {
				passed: false,
				ran: false,
				status: "not-run",
			},
			resultSet: null,
			schemaVersion,
		};
		set({ currentTest: newTest });
	},

	saveTest: (TestData, name, expectPass = true) => {
		// Updated to accept expectPass parameter
		const { currentTest, tests, schemaVersion } = get();
		if (!currentTest) return;

		let updatedTest: Test;
		const testName = name || currentTest.name;

		if (currentTest.created) {
			// Update existing test
			updatedTest = {
				...currentTest,
				data: TestData,
				name: testName,
				expectPass, // Update expectPass
				schemaVersion,
				outcome: {
					...currentTest.outcome,
					status: "not-run" as TestStatus,
				},
			};
			const existingIndex = tests.findIndex((t) => t.id === currentTest.id);
			const updatedTests = [...tests];
			updatedTests[existingIndex] = updatedTest;
			set({ tests: updatedTests, currentTest: updatedTest });
		} else {
			// Create new test
			updatedTest = {
				...currentTest,
				id: `test-${Date.now()}`, // Generate proper ID for saved test
				data: TestData,
				name: testName,
				expectPass, // Set expectPass
				created: true, // Mark as created/saved
				schemaVersion,
				outcome: {
					...currentTest.outcome,
					status: "not-run" as TestStatus,
				},
			};
			set({
				tests: [...tests, updatedTest],
				currentTest: updatedTest,
			});
		}
	},

	selectTest: (test) => set({ currentTest: test }),

	deleteTest: (testId) => {
		const { tests, currentTest } = get();
		set({
			tests: tests.filter((t) => t.id !== testId),
			currentTest: currentTest?.id === testId ? null : currentTest,
		});
	},

	updateTestStatus: (testId, status) => {
		const { tests } = get();
		const updatedTests = tests.map((test) => {
			if (test.id === testId) {
				return {
					...test,
					outcome: {
						...test.outcome,
						status: status as TestStatus,
					},
				};
			}
			return test;
		});
		set({ tests: updatedTests });
	},

	validateTestAgainstSchema: (test) => {
		const { schema } = get();
		return validateDataAgainstSchema(test.data, schema);
	},

	markInvalidTests: () => {
		const { tests, schema, schemaVersion } = get();
		const updatedTests = tests.map((test) => {
			// If test was created with different schema version, check if it's still valid
			if (test.schemaVersion !== schemaVersion) {
				const isValid = validateDataAgainstSchema(test.data, schema);
				return {
					...test,
					outcome: {
						...test.outcome,
						status: isValid
							? ("not-run" as TestStatus)
							: ("invalid" as TestStatus),
					},
				};
			}
			return test;
		});
		set({ tests: updatedTests });
	},

	repairTest: (testId) => {
		const { tests, schema, schemaVersion } = get();
		const updatedTests = tests.map((test) => {
			if (test.id === testId && test.outcome.status === "invalid") {
				const repairedData = repairDataToMatchSchema(test.data, schema);
				return {
					...test,
					data: repairedData,
					schemaVersion,
					outcome: {
						...test.outcome,
						status: "not-run" as TestStatus,
					},
				};
			}
			return test;
		});
		set({ tests: updatedTests });
	},

	runTest: async (testId) => {
		const { tests, schema, policyText } = get();
		const test = tests.find((t) => t.id === testId);
		if (!test) return;

		// Set status to running with complete state update
		const updateTestState = (updates: Partial<Test>) => {
			const currentTests = get().tests;
			const updatedTests = currentTests.map((t) => {
				if (t.id === testId) {
					return { ...t, ...updates };
				}
				return t;
			});
			set({ tests: updatedTests });
		};

		// Set initial running state
		updateTestState({
			outcome: {
				...test.outcome,
				status: "running" as TestStatus,
			},
		});

		try {
			const dataSet = {
				data: test.data,
				rule: policyText,
			};

			const response = await fetch("/api/test", {
				method: "POST",
				body: JSON.stringify(dataSet),
			});

			if (!response.ok) {
				// Complete failure state update
				updateTestState({
					outcome: {
						passed: false,
						ran: true,
						status: "failed" as TestStatus,
					},
				});
				return;
			}

			const resp = await response.json();
			const testPassed = resp.result === true;

			// Apply expectPass logic: if expectPass is false, invert the result
			const actuallyPassed = test.expectPass ? testPassed : !testPassed;

			// Complete success state update
			updateTestState({
				outcome: {
					passed: actuallyPassed,
					ran: true,
					status: actuallyPassed ? "passed" : ("failed" as TestStatus),
				},
				resultSet: {
					trace: resp.trace,
					data: resp.data,
					text: resp.text,
					errors: resp.errors,
					result: resp.result,
				},
			});
		} catch (e) {
			console.error("Error running test:", e);
			// Complete error state update
			updateTestState({
				outcome: {
					passed: false,
					ran: true,
					status: "failed" as TestStatus,
				},
			});
		}
	},

	runAllTests: async () => {
		const { tests, runTest } = get();
		const runnableTests = tests.filter((t) => t.created); // Only run created tests
		// Run all tests concurrently
		await Promise.all(runnableTests.map((test) => runTest(test.id)));
	},
}));
