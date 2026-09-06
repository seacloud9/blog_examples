# I Gave My Local LLM a Job Description. It Still Needed a Manager.

A companion to the OpenClaw dashboard series about giving a local model a useful role and turning its output into reviewable work.

Read the [article](./article/Giving%20a%20Local%20LLM%20a%20Job%20Description.md), explore the [workspace templates and example](./example/README.md), or return to [Part 2](../dashboad-open-claw2/).

All personas, sources, and drafts in this example are fictional. CheckEngineSal and PixelArchivist are teaching labels, not social account identifiers.

## Run locally

Requires Node.js 20 or newer. No packages or credentials are needed.

```bash
cd example
node validate-draft.mjs
node validate-draft.mjs --test
```

The example does not invoke a model, register an OpenClaw agent, schedule a job, or publish anything. The article explains those integration steps separately. No live agent configuration has been changed.
