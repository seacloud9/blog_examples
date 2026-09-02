#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const contentPath = resolve(root, "content.json");
const queuePath = resolve(root, "queue.json");

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, stableValue(entry)])
    );
  }
  return value;
}

function digest(payload) {
  return createHash("sha256")
    .update(JSON.stringify(stableValue(payload)))
    .digest("hex");
}

async function saveQueue(queue) {
  queue.updatedAt = new Date().toISOString();
  await writeFile(queuePath, `${JSON.stringify(queue, null, 2)}\n`, "utf8");
}

async function status() {
  const queue = await readJson(queuePath);
  const counts = queue.items.reduce((result, item) => {
    result[item.status] = (result[item.status] ?? 0) + 1;
    return result;
  }, {});
  console.log(JSON.stringify({ total: queue.items.length, counts, externalActionsPerformed: false }, null, 2));
}

async function stage() {
  const [content, queue] = await Promise.all([readJson(contentPath), readJson(queuePath)]);
  const draft = content.items.find((item) => item.status === "VALIDATED");
  if (!draft) throw new Error("No validated demo draft found");

  const id = `APPROVAL-${draft.id}`;
  const existing = queue.items.find((item) => item.id === id);
  if (existing) {
    console.log(`${id} is already ${existing.status}`);
    return;
  }

  const exactPayload = {
    contentId: draft.id,
    channel: draft.channel,
    text: draft.text,
    destination: draft.destination
  };

  queue.items.push({
    id,
    status: "PENDING",
    exactPayload,
    payloadSha256: digest(exactPayload),
    requestedAt: new Date().toISOString(),
    approvedAt: null
  });
  await saveQueue(queue);
  console.log(`${id} staged for local review`);
}

async function approve(id) {
  if (!id) throw new Error("Usage: node queue-one.mjs approve APPROVAL-DEMO-001");
  const queue = await readJson(queuePath);
  const item = queue.items.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Unknown approval: ${id}`);
  if (item.status !== "PENDING") throw new Error(`${id} is not pending`);
  if (digest(item.exactPayload) !== item.payloadSha256) throw new Error("Exact payload changed; approval blocked");

  item.status = "APPROVED";
  item.approvedAt = new Date().toISOString();
  await saveQueue(queue);
  console.log(`${id} approved locally; nothing was published`);
}

async function reset() {
  await saveQueue({ schemaVersion: 1, updatedAt: null, items: [] });
  console.log("Demo queue reset");
}

const [command = "status", argument] = process.argv.slice(2);

if (command === "status") await status();
else if (command === "stage") await stage();
else if (command === "approve") await approve(argument);
else if (command === "reset") await reset();
else throw new Error(`Unknown command: ${command}`);
