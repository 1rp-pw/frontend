# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Primary development workflow:**
```bash
pnpm dev                 # Start development server with Turbo mode
pnpm build              # Build for production
pnpm check              # Run Biome linter and formatter checks
pnpm check:write        # Run Biome with auto-fix
pnpm typecheck          # Run TypeScript type checking
pnpm test               # Full test: check + build with turbopack
```

**Environment setup:**
- Uses `pnpm` as package manager
- Requires `API_SERVER` environment variable (defaults to https://api.1rp.pw)
- Set `SKIP_ENV_VALIDATION=1` to skip environment validation during build

## Architecture Overview

This is a **Next.js 15 policy management system** with an IDE-like interface for creating and testing policies. The application uses App Router with a sophisticated 4-panel editor layout.

### Key Technologies
- **Next.js 15** with React 19 and TypeScript
- **Zustand** for state management (not Redux)
- **ReactFlow** for visual workflow builder
- **Biome** for linting/formatting (not ESLint/Prettier)
- **shadcn/ui** with Radix UI components
- **React Hook Form** with Zod validation

### Core Data Model
```typescript
interface PolicySpec {
  id: string;
  name: string;
  rule: string;              // Natural language policy rules
  schema: any;               // JSON Schema for validation
  schemaVersion: string;     // Schema compatibility hash
  version: number;
  // ... other fields
}

interface Test {
  id: string;
  name: string;
  data: any;                 // Test data matching schema
  expectPass: boolean;
  outcome: Outcome;
  resultSet: TestResultSet | null;
  schemaVersion?: string;    // For automatic test repair
}
```

## Application Structure

### Main Routes
- `/` - Home page with policy list
- `/policy` - **Main IDE interface** with 4-panel editor
- `/flow` - Visual workflow builder using ReactFlow
- `/policy/[policy_id]` - Individual policy view/edit
- `/api/policy` - Policy CRUD API proxy
- `/api/policy/test` - Policy test execution API

### 4-Panel IDE Layout (`/policy`)
1. **Policy Text Editor** (top-left) - DSL rule editing with syntax highlighting
2. **Test Data Editor** (top-right) - Dynamic form generation from JSON schema
3. **Schema Builder** (bottom-left) - Visual JSON schema editor
4. **Test Execution** (bottom-right) - Test management and results

### State Management Pattern
Uses **Zustand store** (`usePolicyStore`) with key features:
- **Automatic schema validation** and version tracking
- **Test auto-repair** when schemas change 
- **Async test execution** with detailed tracing
- **Default seeding** with example policies

### Flow/Workflow System
ReactFlow-based visual designer with:
- **Input Nodes** - Data entry with JSON input
- **Action Nodes** - Decision points with outcomes (return, chain, custom)
- **Custom edges** for connecting workflow steps
- **localStorage persistence** for flow state

## Key Patterns & Conventions

### Component Organization
- `src/components/ui/` - Base design system (shadcn/ui pattern)
- `src/components/policy/` - Policy editing functionality
- `src/components/flow/` - Workflow builder components
- `src/lib/state/` - Zustand stores
- `src/lib/types.ts` - TypeScript definitions

### Form Handling
- Use **React Hook Form** with **Zod** validation
- Dynamic form generation from JSON schemas
- Special handling for date-time fields and complex objects

### API Integration
- Next.js API routes proxy to backend (`API_SERVER` environment variable)
- Environment-based configuration via `src/env.js`
- Proper error handling with HTTP status codes

### Code Quality
- **Biome** handles all linting and formatting
- Use `pnpm check:write` for auto-fixes
- TypeScript strict mode enabled
- Component props use `ComponentProps<"element">` pattern

## Important Implementation Notes

### Schema Version Management
The system implements automatic schema versioning:
- Schema changes generate new version hashes
- Tests are automatically repaired when schemas change
- Version compatibility is tracked across policy updates

### Test Execution
- Tests run against policy rules with detailed tracing
- Supports bulk test execution with status tracking
- Results include comprehensive outcome data and error details

### Styling & Theming
- Uses **Tailwind CSS 4** with PostCSS
- Dark/light theme support via `next-themes`
- CSS variables for consistent theming
- Biome's `useSortedClasses` rule for class ordering

### Performance Considerations
- Uses React 19 features for optimized rendering
- Turbo mode enabled for faster development builds
- Resizable panels for flexible layout management
- Efficient state updates with Zustand