import assert from "node:assert/strict";
import { mkdtemp, copyFile, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

// Exercise a temporary copy, never the reader's queue or receipts.
const temp = await mkdtemp(join(tmpdir(), "blog-command-center-test-"));
const read = async name => JSON.parse(await readFile(join(temp, name), "utf8"));
const run = command => spawnSync(process.execPath, [join(temp, "command-center.mjs"), command], { encoding: "utf8", timeout: 10000 });
try {
  for (const name of ["command-center.mjs", "content.json", "queue.json", "receipts.json"]) await copyFile(new URL(name, import.meta.url), join(temp, name));
  assert.equal(run("reset").status, 0);
  assert.equal(JSON.parse(run("route").stdout).routed, 2);
  assert.equal(JSON.parse(run("route").stdout).routed, 0);
  const queue = await read("queue.json");
  assert.equal(queue.items.length, 2);
  assert.ok(queue.items.every(item => item.status === "PENDING" && item.approvedAt === null));
  assert.deepEqual(queue.items.map(item => item.exactPayload.targetAccount).sort(), ["CheckEngineSal", "PixelArchivist"]);
  assert.equal(run("run-validation").status, 0);
  const content = await read("content.json");
  content.items[0].targetAccount = "CheckEngineSal";
  await writeFile(join(temp, "content.json"), JSON.stringify(content));
  assert.notEqual(run("route").status, 0);
  assert.deepEqual(await read("queue.json"), queue);
  assert.equal(run("run-validation").status, 1);
  assert.equal((await read("receipts.json")).items.at(-1).status, "FAILED");
  assert.equal(run("reset").status, 0);
  assert.equal((await read("queue.json")).items.length, 0);
  assert.equal((await read("receipts.json")).items.length, 0);
  console.log("Routing, repeat runs, pending state, validation failure, unchanged queue, and reset passed.");
} finally {
  await rm(temp, { recursive: true, force: true });
}
