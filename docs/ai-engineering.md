# AI-assisted engineering

Barcode Inventory runs no AI inference. AI coding agents are used as development tools, and their changes meet the same bar as any other change.

1. **Constraints first.** Give the agent [AGENTS.md](../AGENTS.md) and [DESIGN.md](../DESIGN.md) as explicit constraints, with a bounded task and observable acceptance criteria.
2. **Real APIs only.** Resolve APIs against the versioned Expo SDK 57 documentation and the installed type definitions. Reject invented APIs and packages.
3. **Rules stay in code.** Business transitions stay pure, untrusted data is validated at boundaries and persistence stays serialized. Model output never replaces these rules.
4. **Review every diff.** Check for unnecessary dependencies, secret exposure, wider permissions, data-loss paths, accessibility regressions and claims the app does not support.
5. **Verify.** Run `npm run check`, `npm run format:check` and `npx expo-doctor`, and exercise native changes on simulators or devices. Never report a check as passing unless it ran.
6. **Data boundaries.** Never give a model customer code, real photos, personal data or credentials.

## Invoice extraction (not implemented)

Reading expected quantities from invoice photos is a possible extension, not part of the app. If it is built, it must:

- run the model behind a server with server-side credentials, never from the mobile bundle;
- treat document text as untrusted data, never as instructions;
- validate output against a narrow schema and require the person to confirm every line before the expected list is created;
- be evaluated against a versioned synthetic set (unreadable photos, duplicate codes, ambiguous quantities, adversarial text) with field-level accuracy and abstention reported;
- set limits on image size, time and cost, avoid storing raw documents by default, and keep manual entry as the fallback.
