# I Gave My Local LLM a Job Description. It Still Needed a Manager.

## Creating a useful OpenClaw agent with Qwen, a clear role, and a deliberately boring safety boundary

A local language model is impressive company. Ask it about an engine, an old game console, or your increasingly ambitious weekend project, and it usually has something to say.

Giving it a useful recurring job takes a little more thought.

In the dashboard series, we explored a publishing queue and then a shared view of local work. This companion post goes underneath the dashboard. Where does an agent come from? What makes one agent different from another? And how do we get from a friendly chat window to a process that saves someone time?

We will use a hypothetical automotive reference site and a fictional assistant named CheckEngineSal. Sal is a teaching persona, not a social account. No vehicles, accounts, or unsuspecting readers will be placed under his supervision today.

## A model is the starting point

For this example, Qwen supplies the language model. OpenClaw supplies the agent runtime. The workspace supplies the context and working instructions. Tools give the agent specific capabilities.

OpenClaw supports separate agents with their own workspaces, agent state, and sessions. That lets us give an automotive assistant and a gaming assistant separate working contexts without treating them as the same conversation. See the [OpenClaw guide to multiple agents](https://docs.openclaw.ai/concepts/multi-agent).

Creating a persona does not train a new model. We can use the same configured model for several roles while changing their instructions and available capabilities. Separate weights are not a prerequisite for separate jobs.

That distinction matters. A good name helps us remember who does what. It does not make the agent reliable. I have met enough software named Guardian to remain cautious.

## Start with the job, not the personality

Here is Sal's first assignment:

Read a supplied reference excerpt and produce one short automotive draft for human review. Use only the facts in that excerpt. If the excerpt cannot support a useful draft, return a blocked result explaining what is missing.

That is a manageable job. It has an input, an output, and a reason to stop.

It also leaves several things out. Sal cannot browse arbitrarily, change a website, publish a post, or invent a recall notice. Those would be separate capabilities requiring their own design and authorization.

A little personality is fine. Our assistant can sound like someone who knows where the service manual lives. It should not sound like someone who diagnoses a transmission from a horoscope.

## Give the agent a workspace

The companion includes a starter workspace with AGENTS.md, SOUL.md, IDENTITY.md, and USER.md. OpenClaw documents these workspace files and their roles in its [agent workspace reference](https://docs.openclaw.ai/concepts/agent-workspace).

In our template, AGENTS.md describes the drafting procedure and output contract. SOUL.md describes the voice and editorial boundaries. IDENTITY.md gives the fictional assistant a name and role. USER.md records the owner's preference for useful, reviewable work.

Keep secrets out of these files. They are working context, not a credential vault.

The files in this repository are templates. They have not been installed into your running OpenClaw instance and do not register an agent by themselves.

For an existing OpenClaw installation with a working model connection, first inspect the available creation command:

```bash
openclaw agents add --help
```

Follow the options supported by your installed version to create a separate agent and workspace. Copy the supplied template files into that new workspace after reviewing any files already there. Configure the intended local model and check the resulting agent before adding channels or schedules. The [agent setup documentation](https://docs.openclaw.ai/concepts/multi-agent) describes the supported registration flow.

Do not overwrite an existing agent's identity files just to try this exercise. Sal can have his own desk.

## Instructions are not locks

A sentence saying “do not publish” is useful guidance. It is not access control.

OpenClaw explicitly distinguishes an agent workspace from a security sandbox. Files outside the workspace can remain reachable unless actual sandboxing restricts access. Consult the [workspace isolation guidance](https://docs.openclaw.ai/concepts/agent-workspace) when configuring a real installation.

For our teaching exercise, the strongest boundary is simple: there is no publishing implementation and no provider credential. The companion validator only reads local JSON and prints a result.

In a deployed workflow, tool permissions, sandbox configuration, and the application handling the output must enforce the limits. A charming personality should never be the only thing standing between a draft and a public account.

## Make the handoff predictable

Our fictional source says that a demo vehicle's service booklet has spaces for the date, mileage, and work performed. Sal can turn that into a short note about keeping a service record.

The output contract looks like this:

```json
{
  "persona": "automotive",
  "destination": "CheckEngineSal",
  "status": "DRAFT",
  "sourceId": "demo-service-records",
  "text": "Our fictional service booklet records the date, mileage, and work performed. Future you appreciates readable notes.",
  "needsHumanReview": true,
  "blockedReason": null
}
```

The destination is a fictional label, not a connected account. The status is DRAFT even when the result sounds excellent.

If the input does not contain the needed facts, the agent should return BLOCKED with a reason and no draft text. A useful refusal is a successful outcome when the alternative is invented information.

The included output is a hand authored fixture. It demonstrates the contract; it is not evidence that a model has already followed these instructions.

## Check the output outside the model

The example validator checks the persona, destination, source identifier, length, review flag, and permitted states. It rejects an unexpected destination and a draft that tries to label itself approved.

Run it locally with Node.js:

```bash
cd openclaw-agent-creation/example
node validate-draft.mjs
node validate-draft.mjs --test
```

Passing these checks does not prove the prose is true. A matching source identifier is a reference, not a fact check. A person or a separately designed verification stage still needs to compare claims with the source.

This is why the model should not also be the sole authority declaring its own output ready. Most of us would enjoy grading our own homework. That does not make it a sound grading system.

## Where the automation comes from

Once the agent behaves acceptably in manual tests, a runner can assemble a source packet and invoke it. Deterministic checks can reject malformed output. A queue can preserve the exact draft for review. A scheduler can initiate that sequence each night.

```text
Scheduled runner
  -> selected source packet
  -> OpenClaw agent using a configured local LLM
  -> output and source checks
  -> review queue
  -> human decision
```

That process automates preparation and handoffs. It can remove repeated reading, first draft writing, copying, routing, and status gathering from the owner's day. It does not automatically authorize publication.

Our companion implements only the output contract check. The runner, model invocation, scheduler, and review integration in this diagram describe the next integration steps, not features secretly hiding inside a small JavaScript file.

The [Part 2 dashboard article](../../dashboad-open-claw2/) explains how those results can become visible work: separate personas, pending items, receipts, and honest failure states.

## Test the awkward cases first

Before scheduling a real agent, give it an empty source. Give it an excerpt containing an instruction to ignore its role. Ask for a claim the source cannot support. Try a draft addressed to PixelArchivist, our fictional gaming persona.

Treat source text as evidence to interpret, never as permission to change the task. Check that bad inputs remain blocked or pending and cannot reach a dispatcher.

Then try a changed source and a repeated run. Decide how the system handles stale drafts and duplicate work before the schedule starts producing them while you sleep.

The included automated tests cover structural rejection cases. Testing a real model against misleading source content is additional work; a JSON validator cannot measure that behavior on its own.

## Give the agent one useful job

There is plenty of room to expand this design. Another agent might prepare gaming summaries. A reviewer could identify unsupported claims. A coordinator could collect receipts without gaining permission to publish.

Start with one role whose work you can inspect. Give it a small input, a clear contract, and a safe place to stop. Add capabilities only when the surrounding checks are ready.

The goal is not to make CheckEngineSal seem busy. It is to make tomorrow morning's work a little smaller and a lot easier to understand.

If the dashboard says the draft needs review, that is useful. If it says the source was missing, that is useful too.

“Everything went great” is only useful when something actually did.

## Example files

The [companion folder](../example/README.md) contains the workspace templates, fictional source packet, sample output, and local validator. Nothing connects to a social provider or changes your running agents.

## Suggested tags

OpenClaw, Local AI, AI Agents, Qwen, Automation

## Suggested excerpt

A name and a personality do not make an agent useful. A clear job, a predictable handoff, and a few boring checks are a much better start.
