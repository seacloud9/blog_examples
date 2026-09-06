# Command center example

This local exercise demonstrates routing for fictional personas and a receipt recording the outcome of structural validation. It does not run a schedule or model.

## Files

1. content.json contains two drafts marked VALIDATED and one marked DRAFT. These labels are synthetic fixture states, not proof of source verification.
2. queue.json receives eligible drafts after routing, with an exact payload and digest.
3. receipts.json records the outcome of local structural checks.
4. command-center.mjs implements status, route, run-validation, and reset.
5. dashboard-demo.html is a separate static screenshot fixture. It does not load the JSON files or run any tasks.

## Run

Requires Node.js 20 or newer.

```bash
node command-center.mjs route
node command-center.mjs route
node command-center.mjs run-validation
node command-center.mjs status
```

With the initial fixtures, the first routing run adds two pending records. The second adds none. The unvalidated draft stays out of the queue. Validation checks IDs, persona, fictional destination, demo channel, text length, and supported states. A failing validation writes a FAILED receipt and exits with a nonzero status. Routing rejects malformed content before writing the queue.

These checks do not establish factual accuracy, source freshness, or approval. They also do not revise an existing queue item when its source text changes. A real implementation needs an explicit invalidation and review policy for changed drafts.

This is a single process teaching example without concurrency control or an approval dispatcher. It has no publish, fetch, webhook, or execute command.

Run the companion tests with `node command-center.test.mjs`. They invoke the Node.js CLI against temporary fixture copies, with no shell or external services, and leave your working queue unchanged.

```bash
node command-center.mjs reset
```

Reset clears only this example's queue.json and receipts.json. There are no connected accounts or external actions.
