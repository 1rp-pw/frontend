import "@testing-library/jest-dom";

// Mock next/navigation
jest.mock("next/navigation", () => ({
	useRouter: () => ({
		push: jest.fn(),
		replace: jest.fn(),
		back: jest.fn(),
		forward: jest.fn(),
		refresh: jest.fn(),
		prefetch: jest.fn(),
	}),
	usePathname: () => "/",
	useSearchParams: () => new URLSearchParams(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: jest.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: jest.fn(),
		removeListener: jest.fn(),
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		dispatchEvent: jest.fn(),
	})),
});

// Mock fetch
global.fetch = jest.fn();

// Mock Next.js Request/Response
global.Request = jest.fn().mockImplementation((url, options = {}) => ({
	url,
	method: options.method || "GET",
	headers: new Map(Object.entries(options.headers || {})),
	body: options.body,
	json: async () => JSON.parse(options.body || "{}"),
	text: async () => options.body || "",
	...options,
}));

// Mock global Response constructor
// biome-ignore lint/suspicious/noExplicitAny: can be anything
(global as any).Response = jest
	.fn()
	.mockImplementation((body, options = {}) => ({
		status: options.status || 200,
		statusText: options.statusText || "OK",
		headers: new Map(Object.entries(options.headers || {})),
		body,
		json: async () => JSON.parse(body || "{}"),
		text: async () => body || "",
		ok: (options.status || 200) >= 200 && (options.status || 200) < 300,
		...options,
	}));

// Silence console warnings in tests
const originalConsoleWarn = console.warn;
beforeAll(() => {
	console.warn = jest.fn();
});

afterAll(() => {
	console.warn = originalConsoleWarn;
});
