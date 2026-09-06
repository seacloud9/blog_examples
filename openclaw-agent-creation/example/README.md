# A small agent contract

The workspace directory contains starter instructions for a fictional automotive drafting agent. Review and copy them into a separate OpenClaw workspace when you are ready to configure a real agent. Do not overwrite existing workspace files without reviewing them.

The source and output JSON files are hand authored fictional fixtures. They demonstrate a proposed handoff, not a completed model run.

```bash
node validate-draft.mjs
node validate-draft.mjs --test
```

You can check a saved output against a saved source packet:

```bash
node validate-draft.mjs path/to/output.json path/to/source.json
```

The validator only reads local files and prints JSON. It checks structure and routing, not factual accuracy, freshness, prompt injection resistance, or editorial quality. A valid draft still requires human review. BLOCKED is a valid contract result but is never queue eligible.

The templates describe desired model behavior. Real tool permissions and sandbox settings must enforce access limits. No agent, provider, scheduler, or model is started by this example.
