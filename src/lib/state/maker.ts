import { create } from "zustand";

export type ScenarioStatus =
	| "not-run"
	| "running"
	| "passed"
	| "failed"
	| "invalid";

export interface Outcome {
	passed: boolean;
	ran: boolean;
	status: ScenarioStatus;
}

export interface Scenario {
	id: string | null;
	name: string;
	data: object;
	expectPass: boolean; // Added expectPass property
	createdAt: Date;
	outcome: Outcome;
	resultSet: object | null;
	schemaVersion?: string;
}

interface ScenarioStore {
	scenarios: Scenario[];
	currentScenario: Scenario | null;
	// biome-ignore lint/suspicious/noExplicitAny: schema can be anything
	schema: any;
	policyText: string;
	schemaVersion: string;

	// Actions
	// biome-ignore lint/suspicious/noExplicitAny: schema can be anything
	setSchema: (schema: any) => void;
	setPolicyText: (text: string) => void;

	createScenario: () => void;
	saveScenario: (
		// biome-ignore lint/suspicious/noExplicitAny: scenario data can be anything
		scenarioData: any,
		name?: string,
		expectPass?: boolean,
	) => void; // Updated to include expectPass
	selectScenario: (scenario: Scenario) => void;
	deleteScenario: (scenarioId: string) => void;
	runScenario: (scenarioId: string) => Promise<void>;
	runAllScenarios: () => Promise<void>;
	updateScenarioStatus: (scenarioId: string, status: ScenarioStatus) => void;
	validateScenarioAgainstSchema: (scenario: Scenario) => boolean;
	markInvalidScenarios: () => void;
	repairScenario: (scenarioId: string) => void;
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
				// biome-ignore lint/suspicious/noExplicitAny: prop type can be anything thats the point
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

// Default scenarios
const defaultScenarios: Scenario[] = [
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
		createdAt: new Date(),
		outcome: {
			passed: false,
			ran: false,
			status: "not-run" as ScenarioStatus,
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
		createdAt: new Date(),
		outcome: {
			passed: false,
			ran: false,
			status: "not-run" as ScenarioStatus,
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

export const useScenarioStore = create<ScenarioStore>((set, get) => ({
	scenarios: defaultScenarios.map((scenario) => ({
		...scenario,
		schemaVersion: generateSchemaHash(defaultSchema),
	})),
	currentScenario: null,
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
		get().markInvalidScenarios();
	},

	setPolicyText: (text) => set({ policyText: text }),

	createScenario: () => {
		const { scenarios, schema, schemaVersion } = get();
		const newScenario: Scenario = {
			id: null,
			name: `Scenario ${scenarios.length + 1}`,
			data: {},
			expectPass: true, // Default to expecting pass for new scenarios
			createdAt: new Date(),
			outcome: {
				passed: false,
				ran: false,
				status: "not-run",
			},
			resultSet: null,
			schemaVersion,
		};
		set({ currentScenario: newScenario });
	},

	saveScenario: (scenarioData, name, expectPass = true) => {
		// Updated to accept expectPass parameter
		const { currentScenario, scenarios, schemaVersion } = get();
		if (!currentScenario) return;

		let updatedScenario: Scenario;
		const scenarioName = name || currentScenario.name;

		if (currentScenario.id) {
			updatedScenario = {
				...currentScenario,
				data: scenarioData,
				name: scenarioName,
				expectPass, // Update expectPass
				schemaVersion,
				outcome: {
					...currentScenario.outcome,
					status: "not-run" as ScenarioStatus,
				},
			};
			const existingIndex = scenarios.findIndex(
				(s) => s.id === currentScenario.id,
			);
			const updatedScenarios = [...scenarios];
			updatedScenarios[existingIndex] = updatedScenario;
			set({ scenarios: updatedScenarios, currentScenario: updatedScenario });
		} else {
			updatedScenario = {
				...currentScenario,
				id: Date.now().toString(),
				data: scenarioData,
				name: scenarioName,
				expectPass, // Set expectPass
				schemaVersion,
				outcome: {
					...currentScenario.outcome,
					status: "not-run" as ScenarioStatus,
				},
			};
			set({
				scenarios: [...scenarios, updatedScenario],
				currentScenario: updatedScenario,
			});
		}
	},

	selectScenario: (scenario) => set({ currentScenario: scenario }),

	deleteScenario: (scenarioId) => {
		const { scenarios, currentScenario } = get();
		set({
			scenarios: scenarios.filter((s) => s.id !== scenarioId),
			currentScenario:
				currentScenario?.id === scenarioId ? null : currentScenario,
		});
	},

	updateScenarioStatus: (scenarioId, status) => {
		const { scenarios } = get();
		const updatedScenarios = scenarios.map((scenario) => {
			if (scenario.id === scenarioId) {
				return {
					...scenario,
					outcome: {
						...scenario.outcome,
						status: status as ScenarioStatus,
					},
				};
			}
			return scenario;
		});
		set({ scenarios: updatedScenarios });
	},

	validateScenarioAgainstSchema: (scenario) => {
		const { schema } = get();
		return validateDataAgainstSchema(scenario.data, schema);
	},

	markInvalidScenarios: () => {
		const { scenarios, schema, schemaVersion } = get();
		const updatedScenarios = scenarios.map((scenario) => {
			// If scenario was created with different schema version, check if it's still valid
			if (scenario.schemaVersion !== schemaVersion) {
				const isValid = validateDataAgainstSchema(scenario.data, schema);
				return {
					...scenario,
					outcome: {
						...scenario.outcome,
						status: isValid
							? ("not-run" as ScenarioStatus)
							: ("invalid" as ScenarioStatus),
					},
				};
			}
			return scenario;
		});
		set({ scenarios: updatedScenarios });
	},

	repairScenario: (scenarioId) => {
		const { scenarios, schema, schemaVersion } = get();
		const updatedScenarios = scenarios.map((scenario) => {
			if (scenario.id === scenarioId && scenario.outcome.status === "invalid") {
				const repairedData = repairDataToMatchSchema(scenario.data, schema);
				return {
					...scenario,
					data: repairedData,
					schemaVersion,
					outcome: {
						...scenario.outcome,
						status: "not-run" as ScenarioStatus,
					},
				};
			}
			return scenario;
		});
		set({ scenarios: updatedScenarios });
	},

	runScenario: async (scenarioId) => {
		const { scenarios, schema, policyText } = get();
		const scenario = scenarios.find((s) => s.id === scenarioId);
		if (!scenario) return;

		// Set status to running with complete state update
		const updateScenarioState = (updates: Partial<Scenario>) => {
			const currentScenarios = get().scenarios;
			const updatedScenarios = currentScenarios.map((s) => {
				if (s.id === scenarioId) {
					return { ...s, ...updates };
				}
				return s;
			});
			set({ scenarios: updatedScenarios });
		};

		// Set initial running state
		updateScenarioState({
			outcome: {
				...scenario.outcome,
				status: "running" as ScenarioStatus,
			},
		});

		try {
			const dataSet = {
				data: scenario.data,
				rule: policyText,
			};

			const response = await fetch("/api/scenario", {
				method: "POST",
				body: JSON.stringify(dataSet),
			});

			if (!response.ok) {
				// Complete failure state update
				updateScenarioState({
					outcome: {
						passed: false,
						ran: true,
						status: "failed" as ScenarioStatus,
					},
				});
				return;
			}

			const resp = await response.json();
			const testPassed = resp.result === true;

			// Apply expectPass logic: if expectPass is false, invert the result
			const actuallyPassed = scenario.expectPass ? testPassed : !testPassed;

			// Complete success state update
			updateScenarioState({
				outcome: {
					passed: actuallyPassed,
					ran: true,
					status: actuallyPassed ? "passed" : ("failed" as ScenarioStatus),
				},
				resultSet: {
					trace: resp.trace,
					data: resp.data,
					text: resp.text,
				},
			});
		} catch (e) {
			console.error("Error running scenario:", e);
			// Complete error state update
			updateScenarioState({
				outcome: {
					passed: false,
					ran: true,
					status: "failed" as ScenarioStatus,
				},
			});
		}
	},

	runAllScenarios: async () => {
		const { scenarios, runScenario } = get();
		const runnableScenarios = scenarios.filter((s) => s.id !== null);
		// Run all scenarios concurrently
		await Promise.all(
			runnableScenarios.map((scenario) => runScenario(scenario.id)),
		);
	},
}));
