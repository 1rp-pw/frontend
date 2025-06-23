import { create } from "zustand";
import type { PolicySpec } from "~/lib/types";

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
	// biome-ignore lint/suspicious/noExplicitAny: can be anything
	errors: any | null;
	result: boolean;
	trace: {
		execution: Array<{
			conditions: Array<{
				evaluation_details?: {
					comparison_result: boolean;
					// biome-ignore lint/suspicious/noExplicitAny: can be anything
					left_value: { type: string; value: any };
					// biome-ignore lint/suspicious/noExplicitAny: can be anything
					right_value: { type: string; value: any };
				};
				operator?: string;
				// biome-ignore lint/suspicious/noExplicitAny: can be anything
				property?: { path: string; value: any };
				result: boolean;
				selector?: { value: string };
				// biome-ignore lint/suspicious/noExplicitAny: can be anything
				value?: { pos: any; type: string; value: any };
				referenced_rule_outcome?: string;
				rule_name?: string;
			}>;
			// biome-ignore lint/suspicious/noExplicitAny: can be anything
			outcome: { pos: any; value: string };
			result: boolean;
			// biome-ignore lint/suspicious/noExplicitAny: can be anything
			selector: { pos: any; value: string };
		}>;
	};
	rule: string[];
	// biome-ignore lint/suspicious/noExplicitAny: can be anything
	data: any | null;
}

export interface Test {
	id: string;
	name: string;
	data: object;
	expectPass: boolean;
	created: boolean;
	createdAt: Date;
	outcome: Outcome;
	resultSet: TestResultSet | null;
	schemaVersion?: string;
}

interface PolicyStore {
	// Test stuff
	createTest: () => void;
	saveTest: (
		// biome-ignore lint/suspicious/noExplicitAny: test data can be anything
		testData: any,
		name?: string,
		expectPass?: boolean,
	) => void;
	selectTest: (test: Test) => void;
	deleteTest: (testId: string) => void;
	runTest: (testId: string) => Promise<void>;
	runAllTests: () => Promise<void>;
	updateTestStatus: (testId: string, status: TestStatus) => void;
	validateTestAgainstSchema: (test: Test) => boolean;
	markInvalidTests: () => void;
	repairTest: (testId: string) => void;
	autoRepairInvalidTests: () => void;
	tests: Test[];
	currentTest: Test | null;

	// Schema
	// biome-ignore lint/suspicious/noExplicitAny: schema can be anything
	setSchema: (schema: any) => void;
	// biome-ignore lint/suspicious/noExplicitAny: can be anything
	schema: any;
	schemaVersion: string;
	// biome-ignore lint/suspicious/noExplicitAny: can be anything
	getDefaultSchema: () => any;
	initializeSchemaIfEmpty: () => void;

	// Policy stuff
	policySpec: PolicySpec | null;
	rule: string;
	name: string;
	id: string | null;
	setPolicyRule: (rule: string) => void;
	setPolicyName: (name: string) => void;
	setPolicyId: (id: string) => void;
	setPolicySpec: (spec: PolicySpec) => void;
	updatePolicySpec: (updates: Partial<PolicySpec>) => void;
	savePolicy: () => Promise<{
		success: boolean;
		returnId?: string;
		version?: number;
		error?: string;
	}>;
	getPolicy: (policyId?: string) => Promise<{
		success: boolean;
		error?: string;
	}>;

	// loading states
	isLoading: boolean;
	error: string | null;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;

	// Reset
	reset: () => void;
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
				if (expectedType === "number" && typeof propValue !== "number")
					return false;
				if (expectedType === "array" && !Array.isArray(propValue)) return false;
				if (
					expectedType === "object" &&
					(typeof propValue !== "object" ||
						propValue === null ||
						Array.isArray(propValue))
				) {
					return false;
				}
				if (
					expectedType === "object" &&
					typeof propValue === "object" &&
					!Array.isArray(propValue)
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
				// Check if the current value matches the expected type
				const isValidType =
					(expectedType === "string" && typeof currentValue === "string") ||
					(expectedType === "number" && typeof currentValue === "number") ||
					(expectedType === "boolean" && typeof currentValue === "boolean") ||
					(expectedType === "array" && Array.isArray(currentValue)) ||
					(expectedType === "object" &&
						typeof currentValue === "object" &&
						!Array.isArray(currentValue));

				if (isValidType) {
					if (expectedType === "object") {
						repairedObj[propName] = repairObject(currentValue, propSchema);
					} else {
						repairedObj[propName] = currentValue;
					}
				} else {
					// Type mismatch - completely remove the old data and use default
					repairedObj[propName] =
						expectedType === "object"
							? repairObject({}, propSchema)
							: getDefaultValue(expectedType);
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

	return repairObject(data, schema);
};

// Default schema and rule
export const defaultSchema = {
	properties: {
		drivingTest: {
			properties: {
				person: {
					properties: {
						dateOfBirth: {
							type: "string",
						},
						name: {
							type: "string",
						},
					},
					required: ["name", "dateOfBirth"],
					type: "object",
				},
				scores: {
					properties: {
						practical: {
							properties: {
								major: {
									type: "boolean",
								},
								minor: {
									type: "number",
								},
							},
							required: ["minor", "major"],
							type: "object",
						},
						theory: {
							properties: {
								hazardPerception: {
									type: "number",
								},
								multipleChoice: {
									type: "number",
								},
							},
							required: ["multipleChoice", "hazardPerception"],
							type: "object",
						},
					},
					required: ["practical", "theory"],
					type: "object",
				},
				testDates: {
					properties: {
						practical: {
							properties: {
								center: {
									type: "string",
								},
								date: {
									format: "date-time",
									type: "string",
								},
							},
							required: ["date", "center"],
							type: "object",
						},
						theory: {
							properties: {
								center: {
									type: "string",
								},
								date: {
									format: "date-time",
									type: "string",
								},
							},
							required: ["center", "date"],
							type: "object",
						},
					},
					required: ["practical", "theory"],
					type: "object",
				},
			},
			required: ["person", "scores", "testDates"],
			type: "object",
		},
	},
	required: ["drivingTest"],
	title: "Person Model",
	type: "object",
};

const defaultRule = `# Driving Test Example

A **driver** gets a driving licence
  if the **driver** passes the age test
  and the **driver** passes the test requirements
  and the **driver** has taken the test in the time period
  and the **driver** did their test at a valid center.

A **driver** did their test at a valid center
  if the __center__ of the **drivingTest.testDates.practical** is in ["Manchester", "Coventry"]
  and the __center__ of the **practical** of the **test dates** in the **driving test** is in ["Manchester", "Coventry"].

A **driver** passes the age test
  if the __date of birth__ of the **person** in the **driving test** is earlier than 2008-12-12.

A **driver** passes the test requirements
  if **driver** passes the theory test
  and the **driver** passes the practical test.

A **driver** passes the theory test
  if the __multiple choice__ of the **theory** of the **scores** in the **driving test** is at least 43
  and the __hazard perception__ of the **theory** of the **scores** in the **driving test** is at least 44.

A **driver** passes the practical test
  if the __minor__ in the **practical** of the **scores** in the **driving test** is no more than 15
  and the __major__ in the **practical** of the **scores** in the **driving test** is equal to false.

A **driver** has taken the test in the time period
  if the __date__ of the __theory__ of the **testDates** in the **driving test** is within 2 years
  and the __date__ of the __practical__ of the **testDates** in the **driving test** is within 30 days.
`;

const createDefaultPolicySpec = (): PolicySpec => ({
	id: "",
	name: "Test Policy",
	rule: defaultRule,
	schema: defaultSchema,
	schemaVersion: generateSchemaHash(defaultSchema),
	version: 1,
	createdAt: new Date(),
	updatedAt: new Date(),
	description: "Default test policy",
	tags: ["test"],
	draft: true,
	status: "draft",
	baseId: "",
	hasDraft: true,
	error: null,
});

const defaultTests: Test[] = [
	{
		id: "default-1",
		name: "Passing",
		data: {
			drivingTest: {
				person: {
					dateOfBirth: "1990-01-01",
					name: "Bob",
				},
				scores: {
					practical: {
						major: false,
						minor: 13,
					},
					theory: {
						hazardPerception: 75,
						multipleChoice: 45,
					},
				},
				testDates: {
					practical: {
						center: "Manchester",
						date: "2025-06-11T10:31:00.002Z",
					},
					theory: {
						center: "Coventry",
						date: "2025-06-11T10:29:00.594Z",
					},
				},
			},
		},
		expectPass: true,
		created: true,
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
			drivingTest: {
				person: {
					dateOfBirth: "1990-01-01",
					name: "Bob",
				},
				scores: {
					practical: {
						major: false,
						minor: 24,
					},
					theory: {
						hazardPerception: 44,
						multipleChoice: 60,
					},
				},
				testDates: {
					practical: {
						center: "Manchester",
						date: "2025-06-11T12:14:00.895Z",
					},
					theory: {
						center: "Coventry",
						date: "2025-06-11T12:13:00.307Z",
					},
				},
			},
		},
		expectPass: false,
		created: true,
		createdAt: new Date(),
		outcome: {
			passed: false,
			ran: false,
			status: "not-run" as TestStatus,
		},
		resultSet: null,
	},
];

export const usePolicyStore = create<PolicyStore>((set, get) => {
	const defaultSpec = createDefaultPolicySpec();

	return {
		policySpec: defaultSpec,
		schema: defaultSpec.schema,
		schemaVersion: defaultSpec.schemaVersion,
		rule: defaultSpec.rule,
		name: defaultSpec.name,
		id: defaultSpec.id || null,

		tests: defaultTests.map((test) => ({
			...test,
			schemaVersion: generateSchemaHash(defaultSchema),
		})),
		currentTest: null,

		// Schema
		getDefaultSchema: () => defaultSchema,
		initializeSchemaIfEmpty: () => {
			const { schema, setSchema } = get();
			if (
				!schema ||
				Object.keys(schema).length === 0 ||
				!schema.properties ||
				Object.keys(schema.properties).length === 0
			) {
				setSchema(defaultSchema);
			}
		},

		// Policy spec management
		setPolicySpec: (spec) => {
			set({
				policySpec: spec,
				schema: spec.schema,
				schemaVersion: spec.schemaVersion,
				rule: spec.rule,
				name: spec.name,
				id: spec.id || null,
			});
			get().markInvalidTests();
		},

		updatePolicySpec: (updates) => {
			const current = get().policySpec;
			if (!current) return;

			const schemaChanged = updates.schema && current.schema !== updates.schema;
			const updatedSpec: PolicySpec = {
				...current,
				...updates,
				updatedAt: new Date(),
			};

			if (updates.schema) {
				updatedSpec.schemaVersion = generateSchemaHash(updates.schema);
			}

			set({
				policySpec: updatedSpec,
				schema: updatedSpec.schema,
				schemaVersion: updatedSpec.schemaVersion,
				rule: updatedSpec.rule,
				name: updatedSpec.name,
				id: updatedSpec.id || null,
			});

			if (schemaChanged) {
				get().markInvalidTests();
			}
		},

		setSchema: (schema) => {
			get().updatePolicySpec({ schema });
			// Automatically repair tests after schema changes to clean up incompatible data
			setTimeout(() => {
				get().autoRepairInvalidTests();
			}, 0);
		},

		setPolicyRule: (rule) => {
			get().updatePolicySpec({ rule: rule });
		},

		setPolicyId: (id) => {
			get().updatePolicySpec({ id });
		},

		setPolicyName: (name) => {
			get().updatePolicySpec({ name });
		},

		createTest: () => {
			const { tests, schemaVersion } = get();
			const newTest: Test = {
				id: `temp-${Date.now()}`,
				name: `Test ${tests.length + 1}`,
				data: {},
				expectPass: true,
				created: false,
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
			const { currentTest, tests, schemaVersion } = get();
			if (!currentTest) return;

			let updatedTest: Test;
			const testName = name || currentTest.name;

			if (currentTest.created) {
				updatedTest = {
					...currentTest,
					data: TestData,
					name: testName,
					expectPass,
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
				updatedTest = {
					...currentTest,
					id: `test-${Date.now()}`,
					data: TestData,
					name: testName,
					expectPass,
					created: true,
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
				// Check both schema version mismatch AND data validity
				const hasVersionMismatch = test.schemaVersion !== schemaVersion;
				const isDataValid = validateDataAgainstSchema(test.data, schema);

				// A test is invalid if it has a version mismatch OR if the data doesn't match the current schema
				const shouldBeInvalid = hasVersionMismatch || !isDataValid;

				if (shouldBeInvalid && test.outcome.status !== "invalid") {
					return {
						...test,
						outcome: {
							...test.outcome,
							status: "invalid" as TestStatus,
						},
					};
				}
				if (!shouldBeInvalid && test.outcome.status === "invalid") {
					// If test was invalid but is now valid, mark as not-run
					return {
						...test,
						schemaVersion, // Update to current version
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

		autoRepairInvalidTests: () => {
			const { tests, schema, schemaVersion } = get();
			const updatedTests = tests.map((test) => {
				if (test.outcome.status === "invalid") {
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

		isLoading: false,
		error: null,
		setLoading: (loading) => set({ isLoading: loading }),
		setError: (error) => set({ error }),

		getPolicy: async (policyId?: string) => {
			const currentId = policyId || get().id;

			if (!currentId) {
				const error = "No Policy ID";
				set({ error });
				return {
					success: false,
					error: "No policy ID provided",
				};
			}
			set({
				isLoading: true,
				error: null,
			});

			try {
				const response = await fetch(`/api/policy?id=${currentId}`, {
					method: "GET",
					headers: { "Content-Type": "application/json" },
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					const error = errorData.message || `Server error: ${response.status}`;
					set({
						isLoading: false,
						error,
					});
					return {
						success: false,
						error: errorData.message || `Server error: ${response.status}`,
					};
				}

				const result = await response.json();

				// Convert API response to PolicySpec
				const policySpec: PolicySpec = {
					id: result.id,
					baseId: result.baseId,
					name: result.name,
					rule: result.rule,
					schema: JSON.parse(result.schema),
					schemaVersion: generateSchemaHash(result.schema),
					version: result.version || 1,
					createdAt: new Date(result.createdAt || Date.now()),
					updatedAt: new Date(result.updatedAt || Date.now()),
					description: result.description,
					tags: result.tags,
					status: result.status,
					draft: result.status === "draft",
					hasDraft: result.hasDraft,
					error: null,
				};

				// console.info("Policy spec", policySpec, result);

				const tests = JSON.parse(result.tests);

				set({
					policySpec: policySpec,
					schema: policySpec.schema,
					schemaVersion: policySpec.schemaVersion,
					rule: policySpec.rule,
					name: policySpec.name,
					id: policySpec.id,
					// biome-ignore lint/suspicious/noExplicitAny: can be anything
					tests: tests.map((test: any) => ({
						...test,
						createdAt: new Date(test.createdAt),
						schemaVersion: test.schemaVersion,
						outcome: {
							passed: false,
							ran: false,
							status: "not-run" as TestStatus,
						},
						resultSet: null,
					})),
					isLoading: false,
					error: null,
				});

				return {
					success: true,
				};
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Failed to get policy";
				set({
					isLoading: false,
					error: errorMessage,
				});
				return {
					success: false,
					error:
						error instanceof Error ? error.message : "Failed to get policy",
				};
			}
		},

		savePolicy: async (): Promise<{
			success: boolean;
			returnId?: string;
			version?: number;
			error?: string;
		}> => {
			const { tests, policySpec, id } = get();

			if (!policySpec) {
				return {
					success: false,
					error: "No policy spec available",
				};
			}

			// console.info("Saving policy", policySpec);

			try {
				const apiData = {
					name: policySpec.name,
					tests,
					rule: policySpec.rule,
					schema: policySpec.schema,
					id: id || undefined,
					version: policySpec.version,
					description: policySpec.description,
					tags: policySpec.tags,
					status: policySpec.status,
					baseId: policySpec.baseId,
				};

				// console.info("API data", apiData);

				const response = await fetch("/api/policy", {
					method: policySpec.id ? "PUT" : "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(apiData),
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					return {
						success: false,
						error: errorData.message || `Server error: ${response.status}`,
					};
				}

				const result = await response.json();
				if (result.id) {
					get().updatePolicySpec({ id: result.id });
					if (result.version) {
						return {
							success: true,
							returnId: result.id,
							version: result.version,
						};
					}

					return {
						success: true,
						returnId: result.id,
					};
				}

				return {
					success: true,
				};
			} catch (error) {
				return {
					success: false,
					error:
						error instanceof Error ? error.message : "Failed to save policy",
				};
			}
		},

		runTest: async (testId) => {
			const { tests, rule } = get();
			const test = tests.find((t) => t.id === testId);
			if (!test) return;

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

			updateTestState({
				outcome: {
					...test.outcome,
					status: "running" as TestStatus,
				},
			});

			try {
				const dataSet = {
					data: test.data,
					rule,
				};

				const response = await fetch("/api/policy/test", {
					method: "POST",
					body: JSON.stringify(dataSet),
				});

				if (!response.ok) {
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
				const actuallyPassed = test.expectPass ? testPassed : !testPassed;

				updateTestState({
					outcome: {
						passed: actuallyPassed,
						ran: true,
						status: actuallyPassed ? "passed" : ("failed" as TestStatus),
					},
					resultSet: {
						trace: resp.trace,
						data: resp.data,
						rule: resp.rule,
						errors: resp.errors,
						result: resp.result,
					},
				});
			} catch (e) {
				console.error("Error running test:", e);
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
			const runnableTests = tests.filter((t) => t.created);
			await Promise.all(runnableTests.map((test) => runTest(test.id)));
		},

		reset: () => {
			const defaultSpec = createDefaultPolicySpec();
			set({
				policySpec: defaultSpec,
				schema: defaultSpec.schema,
				schemaVersion: defaultSpec.schemaVersion,
				rule: defaultSpec.rule,
				name: defaultSpec.name,
				id: defaultSpec.id || null,
				tests: defaultTests.map((test) => ({
					...test,
					schemaVersion: defaultSpec.schemaVersion,
				})),
				currentTest: null,
			});
		},
	};
});
