# Queue One example

This folder demonstrates the smallest useful approval workflow without frameworks or dependencies.

## Files

- `content.json` contains one synthetic validated draft.
- `queue.json` contains local approval records.
- `queue-one.mjs` stages, approves, reports, and resets the demo.

## Commands

```bash
node queue-one.mjs status
node queue-one.mjs stage
node queue-one.mjs approve APPROVAL-DEMO-001
node queue-one.mjs reset
```

`stage` copies the exact draft payload into the queue and calculates a SHA-256 digest. `approve` recomputes that digest before changing the record from `PENDING` to `APPROVED`.

There is deliberately no `publish` command. Nothing in this example connects to X or any other external service.
