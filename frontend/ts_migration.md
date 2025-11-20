You are an assistant continuing a staged migration of a React + JavaScript + Redux codebase into a TypeScript codebase. Context: data services and domain classes/models have already been partly migrated, some are missing. Use incremental, reversible changes and keep CI green.

Summary of completed work
- Partly migrated data services: rewritten with async/await, added TypeScript types for inputs/outputs, centralized API client.
- Partly migrated domain classes/models: converted to typed classes/interfaces and updated usages where necessary.

Next steps (ordered, with brief actions & acceptance criteria)
0) Migrate the remainders of data services and domain classes/models/interfaces.
   - These are located in the frontend/src/services and frontend/src/classes directories.
   - Adhere to the code style and paradigms already employed in migrated data services and classes/interfaces.

1) Migrate Redux slices (priority: high, next task to start)
   - Convert existing slices to Redux Toolkit createSlice and createAsyncThunk (or RTK Query where appropriate).
   - Add strict TypeScript types for state, actions, and thunks.
   - Acceptance: all migrated slices compile, unit tests pass, behavior unchanged.

2) Migrate other Redux parts (middleware, store config, selectors)
   - Replace legacy middleware patterns, update store setup to use typed RootState/AppDispatch.
   - Rework selectors to be memoized and typed.
   - Acceptance: no runtime selector/type errors, store tests pass.

3) Integrate data services into Redux
   - Decide per-feature between wrapping services with createAsyncThunk + slice or exposing via RTK Query endpoints.
   - Replace direct service calls inside components with dispatch/select flow or RTK hooks.
   - Acceptance: network interactions flow through store or RTK Query; no duplicated API clients.

4) Migrate UI components incrementally
   - Update components to use typed props/hooks; migrate class components to hooks selectively.
   - Fix prop/type errors and update snapshots.
   - Acceptance: visual/regression tests pass; UX unchanged.

5) Tests, CI, and verification
   - Expand unit/integration tests for migrated areas, run E2E smoke tests, update CI to include new checks.
   - Acceptance: CI pipeline green, no regressions in E2E.

6) Cleanup and rollout
   - Remove deprecated code, update docs, perform performance profiling and final code review.
   - Acceptance: repo size reduced, code coverage maintained, PRs reviewed/merged.

Constraints and guidance
- Migrate incrementally with small PRs; prefer feature-flagged changes if behavior could break.
- Always run unit/CI tests and validate runtime in a staging environment.
- Prioritize slices that own network/stateful logic first, then UI wrappers.
- If uncertain whether to use RTK Query vs thunks, default to RTK Query for simple CRUD endpoints and thunks for complex orchestrations.
- Periodically run `npx tsc --noEmit --pretty false` to check progress and narrow down issues.
- Before starting a new step, open a small PR. I will ask you to commence working on a new step in a new session.

Immediate next task to assign to an agent
- Start migrating the remainders of data services and domain classes/models/interfaces. Open a small PR.

Return progress updates as: changed files, tests added/updated, CI status, and any runtime errors observed.