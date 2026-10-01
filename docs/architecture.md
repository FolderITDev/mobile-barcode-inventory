# Architecture and decisions

Barcode Inventory is a local-first Expo app: every count lives on the device and SQLite is the source of truth.

## Layers

```text
src/app/        routes (Expo Router)       → render a screen, nothing else
src/features/   screens and components     → read state, call store actions
src/data/store  serialized write queue     → apply a domain transition, write, then publish
src/domain/     pure rules and validation  → no React, Expo or storage imports
src/data/       repositories               → SQLite on device, IndexedDB on web
```

A screen asks the store for a change. The store applies a pure domain transition to the latest committed count, writes it through the repository and only then publishes the new state to React. If the write fails, the committed state is untouched and the error appears next to the action that triggered it.

## Storage

- **One aggregate per row.** Each count is stored as validated JSON in a single SQLite row with an explicit `revision`. Each scan or adjustment rewrites the whole count atomically, with at most 500 lines. A workload with much larger collections would justify normalized tables and filtering in SQL.
- **Optimistic revisions.** Every write states the revision it started from; a stale revision is rejected instead of overwritten. The in-process queue serializes writes from the app itself.
- **Versioned schema.** `PRAGMA user_version` tracks the schema. Databases written by a newer version are rejected without a destructive reset.
- **Validation on read and write.** Every stored count passes through `parseRecord`; corrupt data is reported, never repaired by guessing.
- **Platforms.** Native builds use SQLite in WAL mode. The browser build uses IndexedDB transactions with the same validation and domain rules; it exists for quick UI review and does not stand in for native testing.

## Scanning

The native camera is mounted only while the scanner screen is focused, reads EAN-13 only and requests permission at the moment scanning starts. Every barcode event goes through `ScanGate`, a synchronous gate held in a ref: it accepts one event and stays closed until the person taps **Scan next unit**. React state alone cannot stop two native callbacks that arrive in the same frame. The accepted code is validated, including its check digit, and passes through the same `scan` transition as manual entry. Barcode Inventory stores no photos and never requests photo library access; barcode values stay on the device.

## Reconciliation

Expected quantities are fixed when the count starts. Each line resolves to *Matched*, *Short*, *Over*, *Unexpected* or *Not counted yet*; a line with zero units is never reported as short while the count is in progress. Differences are expressed as a word and a signed quantity, so the status never depends on color.

## Interface

Navigation uses native Expo Router stacks with large titles, modals for creation and review, and platform back gestures. Interactive elements are built from React Native primitives with explicit accessibility roles, names and states. Colors, fonts, spacing and motion come from `src/theme/tokens.ts` and follow the system appearance. Long lists are virtualized. See [DESIGN.md](../DESIGN.md).

## Verification

Automated tests run on Node's test runner against a real SQLite database (`node:sqlite`): domain invariants, migrations, durable restart, stale updates, corrupted payloads and formatting. Camera scanning, permission denial, torch and repeated reads of one label are verified manually on physical iOS and Android devices.
