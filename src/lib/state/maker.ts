import { create } from "zustand";

export type ScenarioStatus = "not-run" | "running" | "passed" | "failed";

export interface Outcome {
	passed: boolean;
	ran: boolean;
	status: ScenarioStatus;
}

export interface Scenario {
	id: string;
	name: string;
	data: object;
	createdAt: Date;
	outcome: Outcome;
}

interface ScenarioStore {
	scenarios: Scenario[];
	currentScenario: Scenario | null;
	// biome-ignore lint/suspicious/noExplicitAny: schema can be anything
	schema: any;
	policyText: string;

	// Actions
	// biome-ignore lint/suspicious/noExplicitAny: schema can be anything
	setSchema: (schema: any) => void;
	setPolicyText: (text: string) => void;
	createScenario: () => void;
	// biome-ignore lint/suspicious/noExplicitAny: scenario data can be anything
	saveScenario: (scenarioData: any, name?: string) => void;
	selectScenario: (scenario: Scenario) => void;
	deleteScenario: (scenarioId: string) => void;
	runScenario: (scenarioId: string) => Promise<void>;
	runAllScenarios: () => Promise<void>;
	updateScenarioStatus: (scenarioId: string, status: ScenarioStatus) => void;
}

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
		createdAt: new Date(),
		outcome: {
			passed: false,
			ran: false,
			status: "not-run",
		},
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
		createdAt: new Date(),
		outcome: {
			passed: false,
			ran: false,
			status: "not-run",
		},
	},
];

export const useScenarioStore = create<ScenarioStore>((set, get) => ({
	scenarios: defaultScenarios,
	currentScenario: null,
	schema: {
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
	},
	policyText:
		"# Driving Test Rules\nA **Person** gets a full driving license\n if the __age__ of the **Person** is greater than or equal to 17\n and the **Person** passes the practical driving test\n and the **Person** passes the eye test.\n\nA **Person** passes the practical driving test\n if the __driving test score__ of the **Person** is greater than or equal to 60.",

	setSchema: (schema) => set({ schema }),

	setPolicyText: (text) => set({ policyText: text }),

	createScenario: () => {
		const { scenarios } = get();
		const newScenario: Scenario = {
			id: Date.now().toString(),
			name: `Scenario ${scenarios.length + 1}`,
			data: {},
			createdAt: new Date(),
			outcome: {
				passed: false,
				ran: false,
				status: "not-run",
			},
		};
		set({ currentScenario: newScenario });
	},

	saveScenario: (scenarioData, name) => {
		const { currentScenario, scenarios } = get();
		if (!currentScenario) return;

		const updatedScenario = {
			...currentScenario,
			data: scenarioData,
			name: name || currentScenario.name,
		};

		const existingIndex = scenarios.findIndex(
			(s) => s.id === currentScenario.id,
		);
		if (existingIndex >= 0) {
			const updatedScenarios = [...scenarios];
			updatedScenarios[existingIndex] = updatedScenario;
			set({ scenarios: updatedScenarios, currentScenario: updatedScenario });
		} else {
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
						status,
					},
				};
			}
			return scenario;
		});
		set({ scenarios: updatedScenarios });
	},

	runScenario: async (scenarioId) => {
		const { scenarios, schema, policyText, updateScenarioStatus } = get();
		const scenario = scenarios.find((s) => s.id === scenarioId);
		if (!scenario) return;

		// Set status to running
		updateScenarioStatus(scenarioId, "running");

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
				updateScenarioStatus(scenarioId, "failed");
				return;
			}

			const resp = await response.json();
			console.info("response", resp);

			const passed = resp.result === true;
			updateScenarioStatus(scenarioId, passed ? "passed" : "failed");

			// Update the scenario outcome
			const updatedScenarios = scenarios.map((s) => {
				if (s.id === scenarioId) {
					return {
						...s,
						outcome: {
							passed,
							ran: true,
							status: passed ? "passed" : "failed",
						},
					};
				}
				return s;
			});
			set({ scenarios: updatedScenarios });
		} catch (e) {
			console.error("Error running scenario:", e);
			updateScenarioStatus(scenarioId, "failed");
		}
	},

	runAllScenarios: async () => {
		const { scenarios, runScenario } = get();
		// Run all scenarios concurrently
		await Promise.all(scenarios.map((scenario) => runScenario(scenario.id)));
	},
}));
