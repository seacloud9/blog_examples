import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

function validate(draft, source) {
  if (!draft || typeof draft !== "object" || Array.isArray(draft)) return { ok: false, errors: ["Expected a JSON object"], queueEligible: false };
  const errors = [];
  const fields = ["persona", "destination", "status", "sourceId", "text", "needsHumanReview", "blockedReason"];
  if (Object.keys(draft).length !== fields.length || fields.some(key => !Object.hasOwn(draft, key))) errors.push("Unexpected or missing fields");
  if (draft.persona !== "automotive" || draft.destination !== "CheckEngineSal") errors.push("Unexpected persona or destination");
  if (draft.needsHumanReview !== true) errors.push("Human review is required");
  if (!["DRAFT", "BLOCKED"].includes(draft.status)) errors.push("Only DRAFT or BLOCKED is allowed");
  const sourceId = typeof source?.sourceId === "string" && source.sourceId.trim() ? source.sourceId : null;
  if (draft.sourceId !== sourceId) errors.push("Source identifier does not match");
  if (draft.status === "DRAFT") {
    if (!sourceId || typeof source?.excerpt !== "string" || !source.excerpt.trim()) errors.push("A draft requires a source excerpt and identifier");
    if (typeof draft.text !== "string" || !draft.text.trim() || [...draft.text].length > 260) errors.push("Draft text must contain 1 to 260 characters");
    if (draft.blockedReason !== null) errors.push("A draft must have a null blockedReason");
  }
  if (draft.status === "BLOCKED" && (draft.text !== "" || typeof draft.blockedReason !== "string" || !draft.blockedReason.trim())) errors.push("A blocked result requires empty text and a reason");
  return { ok: errors.length === 0, errors, queueEligible: errors.length === 0 && draft.status === "DRAFT" };
}

const read = async path => JSON.parse(await readFile(path, "utf8"));
const [arg, sourceArg] = process.argv.slice(2);
const fixture = await read(new URL("./output.json", import.meta.url));
const source = await read(new URL("./source.json", import.meta.url));

if (arg === "--test") {
  assert.equal(validate(fixture, source).queueEligible, true);
  const badDrafts = [
    { ...fixture, destination: "PixelArchivist" },
    { ...fixture, persona: "gaming" },
    { ...fixture, status: "APPROVED" },
    { ...fixture, needsHumanReview: false },
    { ...fixture, sourceId: "different-source" },
    { ...fixture, text: "x".repeat(261) },
    { ...fixture, text: "" },
    { ...fixture, extra: true },
    { ...fixture, blockedReason: "conflicting state" },
    null
  ];
  for (const bad of badDrafts) assert.equal(validate(bad, source).ok, false);
  assert.equal(validate(fixture, { ...source, excerpt: "" }).ok, false);
  const blocked = { ...fixture, status: "BLOCKED", text: "", sourceId: null, blockedReason: "No source supplied" };
  assert.deepEqual(validate(blocked, null), { ok: true, errors: [], queueEligible: false });
  assert.equal(validate({ ...blocked, blockedReason: "" }, null).ok, false);
  console.log("14 contract checks passed. No model or external service was called.");
} else {
  const result = validate(arg ? await read(arg) : fixture, sourceArg ? await read(sourceArg) : source);
  console.log(JSON.stringify({ ...result, checks: "Structure and routing only, not factual accuracy", externalActionsPerformed: false }, null, 2));
  if (!result.ok) process.exitCode = 1;
}
