# Barcode Inventory

Instructions for anyone, human or AI coding agent, changing this repository. Read this file, [DESIGN.md](DESIGN.md) and [docs/architecture.md](docs/architecture.md) before editing.

Barcode Inventory is an offline app for iOS and Android that counts stock by barcode. A person enters the expected items, counts them by scanning EAN-13 barcodes or typing codes, and reviews what is short, over or unexpected before closing the count.

Everything runs on the device. There is no backend, account system, analytics or AI inference; SQLite is the source of truth.

**Stack:** Expo SDK 57 · React Native 0.86 · React 19.2 · TypeScript 6 (strict) · Expo Router with typed routes · `expo-sqlite` · Reanimated 4 · Node.js 24 (`.node-version`).

---

## Commands

| Command | Purpose |
| --- | --- |
| `npm ci` | Install the locked dependencies. |
| `npm run ios` / `npm run android` | Build and run a native development build. |
| `npm start` | Start the dev server for an installed development build. |
| `npm run web` | Browser build backed by IndexedDB, for quick UI review only. |
| `npm run check` | ESLint, `tsc --noEmit` and the test suite. |
| `npm run format` / `npm run format:check` | Prettier. |
| `npx expo-doctor` | Expo dependency and configuration checks. |

## Project structure

| Location | Responsibility |
| --- | --- |
| `src/app/` | Routes only: `index` (counts), `new`, `count/[id]`, `scanner/[id]`, `review/[id]`, `about`. |
| `src/features/counts/` | Screens and feature components. |
| `src/domain/` | Pure rules and runtime validation: `isEan13`, `createCount`, `scan`, `adjust`, `rename`, `lineStatus`, `discrepancies`, `totals`, `closeCount`, `ScanGate`. |
| `src/data/` | Store and write queue, SQLite repository and migrations, IndexedDB adapter for the web build. |
| Media | none: the app never stores camera frames or requests photo library access. |
| `src/ui/`, `src/theme/` | Shared components and design tokens, documented in DESIGN.md. |
| `src/hooks/`, `src/lib/` | `useAction`, `useUnsavedGuard`, formatting, dialogs and haptics. |
| `tests/` | Node test runner with a real SQLite database (`node:sqlite`). |

Platform-specific code uses the `.web.ts` suffix; there are no runtime platform checks for storage.

---

## Critical rules (always apply)

### R1. Success follows the durable write
Screens change data only through the store (`add`, `change`, `remove` from `useStore()` in `src/data/store.tsx`). The store serializes writes and resolves only after the repository write succeeds. Never show a saved, completed or confirmed state before that promise resolves, and never call a repository directly from a screen.

### R2. The domain is pure and validates everything
Business rules live in `src/domain/model.ts` as pure functions that take a record and return a new one. They import nothing from React, Expo or the data layer. Every write goes through a domain transition, and every read goes through `parseRecord`; invalid data throws a readable error instead of being repaired by guessing.

### R3. Schema changes are migrations
SQLite stores one validated JSON aggregate per row with an explicit `revision`. The schema version is `PRAGMA user_version` in `src/data/sqlite-repository.ts`. To change the stored shape: bump the version, add a migration step inside a transaction, keep rejecting databases from a newer version without resetting them, bump the IndexedDB version in `src/data/persistence.web.ts`, and add a case to `tests/persistence.test.ts`.

### R4. Concurrency is explicit
Writes carry the revision they started from; a stale revision is rejected, not overwritten. Async user actions run through `useAction()` (`src/hooks/use-action.ts`), whose ref lock blocks a second tap before React re-renders. Do not replace ref locks with state.

### R5. Routes stay thin
Files in `src/app/` only register routes and screen options and render a screen from `src/features/`. Logic, data access and styling never live in route files.

### R6. Use the design system
Follow [DESIGN.md](DESIGN.md). Use `src/theme` tokens through `createStyles` and `useTheme`, and the components in `src/ui`. No raw colors, font names or spacing values in screens. Touch targets are at least 48 pt, every status has words as well as color, and Reduce Motion is respected.

### R7. No network, no tracking
The app makes no network requests at runtime: no analytics, crash reporting, remote fonts, model APIs or sync. Never log names, photos, file paths, barcodes or other user data.

### R8. Untrusted input is validated at the boundary
Validate form input, scanned or typed codes, persisted JSON and selected media before they reach a transition. SQL uses parameters only; never build queries with string interpolation.

### R9. Dependencies follow the SDK
The app targets Expo SDK 57. Check the versioned Expo documentation before using an API, install native packages with `npx expo install`, and add a dependency only for a demonstrated need with a compatible license.

### R10. One accepted read is one unit
The scanner passes every camera event through `ScanGate`, a synchronous ref-held gate that accepts one event and stays closed until the person taps **Scan next unit**. Never replace it with React state: two native callbacks can arrive in the same frame.

### R11. Expected quantities are a snapshot
Expected items are fixed when the count starts. Barcodes are unique, valid EAN-13 (check digit included) and a count holds at most 500 lines. Closed counts are read-only.

### R12. Status wording is a rule
A line with no units reads *Not counted yet*, never *Short*. Differences always read as a word and a signed quantity (`lineStatus`, `difference`); keep these in the domain and covered by tests.

### R13. Manual entry is first-class
Typed codes go through the same `scan` transition as camera reads. Manual entry stays available when camera access is denied, on simulators and in the browser build. The camera is mounted only while the scanner screen is focused and reads `ean13` only.

### R14. Invoice extraction is out of scope
Do not add OCR or model calls to the app. Any future extraction work must follow `docs/ai-engineering.md`: server-side credentials, schema validation, human confirmation and a manual fallback.

---

## Adding or changing a feature

1. Add or change the rule in `src/domain/model.ts` and cover it in `tests/domain.test.ts`.
2. If the stored shape changes, write the migration first (R3).
3. Build the screen in `src/features/counts/` with `src/ui` components, wire it through the store, and register the route in `src/app/`.
4. Design the loading, empty, error and content states, plus the screen-reader labels.
5. Update DESIGN.md when tokens, components or screen patterns change, and the README when visible behavior changes.

## Definition of done

- `npm run check`, `npm run format:check` and `npx expo-doctor` pass.
- The tests cover the changed rules. The suite already covers check-digit validation, reconciliation and closure, unexpected and duplicate codes, the scan gate, line status wording, session ordering, migrations, restart, optimistic concurrency and time-zone formatting.
- Native changes are exercised on an iOS simulator and an Android emulator. Before a release, verify on physical devices: camera scanning with permission granted and denied, torch, repeated reads of one label, manual entry and app restart.
- English copy, in sentence case, with no claims the app does not support.
- Never report a check as passing unless it ran. Guidelines for AI-assisted changes are in [docs/ai-engineering.md](docs/ai-engineering.md).
