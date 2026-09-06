#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const contentPath = resolve(root, "content.json");
const queuePath = resolve(root, "queue.json");
const receiptsPath = resolve(root, "receipts.json");

async function readJson(path) { return JSON.parse(await readFile(path, "utf8")); }
async function writeJson(path, value) { await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function digest(value) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }

// These are fictional routing labels, never social account identifiers.
const destinations = { arcade: "PixelArchivist", automotive: "CheckEngineSal" };
function validateContent(content) {
  if (!Array.isArray(content.items)) return ["items must be an array"];
  const errors = [];
  const seen = new Set();
  for (const item of content.items) {
    if (!item || typeof item !== "object") { errors.push("draft must be an object"); continue; }
    if (typeof item.id !== "string" || !item.id.trim() || seen.has(item.id)) errors.push("draft IDs must be unique nonempty strings");
    seen.add(item.id);
    if (!Object.hasOwn(destinations, item.persona) || item.targetAccount !== destinations[item.persona]) errors.push(`${item.id}: unexpected persona or destination`);
    if (item.channel !== "demo") errors.push(`${item.id}: only the demo channel is allowed`);
    if (!["DRAFT", "VALIDATED"].includes(item.status)) errors.push(`${item.id}: unexpected state`);
    if (typeof item.text !== "string" || !item.text.trim() || [...item.text].length > 260) errors.push(`${item.id}: text must contain 1 to 260 characters`);
  }
  return errors;
}

async function status() {
  const [queue, receipts] = await Promise.all([readJson(queuePath), readJson(receiptsPath)]);
  const counts = queue.items.reduce((all, item) => ({ ...all, [item.status]: (all[item.status] ?? 0) + 1 }), {});
  console.log(JSON.stringify({ queue: { total: queue.items.length, counts }, receipts: receipts.items.length, externalActionsPerformed: false }, null, 2));
}

async function route() {
  const [content, queue] = await Promise.all([readJson(contentPath), readJson(queuePath)]);
  const errors = validateContent(content);
  if (errors.length) throw new Error(errors.join("; "));
  const existing = new Set(queue.items.map((item) => item.exactPayload.contentId));
  const routed = content.items.filter((item) => item.status === "VALIDATED" && !existing.has(item.id));
  for (const draft of routed) {
    const payload = { contentId: draft.id, persona: draft.persona, channel: draft.channel, text: draft.text, targetAccount: draft.targetAccount };
    queue.items.push({ id: `APPROVAL-${draft.id}`, status: "PENDING", exactPayload: payload, payloadSha256: digest(payload), requestedAt: new Date().toISOString(), approvedAt: null });
  }
  queue.updatedAt = new Date().toISOString();
  await writeJson(queuePath, queue);
  console.log(JSON.stringify({ routed: routed.length, targetAccounts: routed.map((item) => item.targetAccount), externalActionsPerformed: false }, null, 2));
}

async function runValidation() {
  const content = await readJson(contentPath);
  const errors = validateContent(content);
  const validated = errors.length ? [] : content.items.filter((item) => item.status === "VALIDATED");
  const receipt = { id: `RECEIPT-${Date.now()}`, task: "local-content-validation", status: errors.length ? "FAILED" : "COMPLETE", validatedDrafts: validated.length, errors, checks: "structure and routing only; not source verification", generatedAt: new Date().toISOString(), externalActionsPerformed: false };
  const receipts = await readJson(receiptsPath);
  receipts.items.push(receipt);
  await writeJson(receiptsPath, receipts);
  console.log(JSON.stringify(receipt, null, 2));
  if (errors.length) process.exitCode = 1;
}

async function reset() {
  await writeJson(queuePath, { schemaVersion: 1, updatedAt: null, mode: "review-only", items: [] });
  await writeJson(receiptsPath, { schemaVersion: 1, items: [] });
  console.log("Local queue and receipts reset; no external action performed");
}

const [command = "status"] = process.argv.slice(2);
if (command === "status") await status();
else if (command === "route") await route();
else if (command === "run-validation") await runValidation();
else if (command === "reset") await reset();
else throw new Error(`Unknown command: ${command}`);
