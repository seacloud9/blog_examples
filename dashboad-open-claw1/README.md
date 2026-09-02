# Queue One

A tiny companion repository for the article **From Zero to One: I Turned a Local Qwen Agent Into a Human-Gated Publishing System**.

This repository contains:

- the complete Medium-ready article and screenshots in [`article/`](./article/);
- a dependency-free local queue demonstration in [`example/`](./example/).

The example illustrates only the core idea:

```text
draft -> pending review -> approved locally
```

It contains no credentials, OAuth material, account identifiers, external API calls, network requests, production authentication, or publishing capability. Approving the demo changes a local JSON file only.

## Try the example

Requires Node.js 20 or newer.

```bash
cd example
node queue-one.mjs status
node queue-one.mjs stage
node queue-one.mjs approve APPROVAL-DEMO-001
node queue-one.mjs reset
```

## Read the article

[From Zero to One - I Turned a Local Qwen Agent Into a Human-Gated Publishing System](./article/From%20Zero%20to%20One%20-%20I%20Turned%20a%20Local%20Qwen%20Agent%20Into%20a%20Human-Gated%20Publishing%20System.md)

## Scope

This is an educational example, not a production publishing service. The article explains the fuller architecture and why generation, validation, approval, execution, and outcome verification should remain separate states.
