import { readFile } from "node:fs/promises";
import { connectDatabase } from "../server/database.js";
import { validateActivity } from "../server/activity.js";

// Validate the entire batch before writing. Existing activities are never updated.
const candidates = (await Promise.all(["ideas.json", "more-ideas.json"].map(async (file) =>
  JSON.parse(await readFile(new URL(`../data/${file}`, import.meta.url), "utf8"))
))).flat();
const batch = candidates.map((idea) => ({ ...validateActivity(idea), id: idea.id, icon: idea.icon }));
let database;
try {
  database = await connectDatabase();
  const existing = await database.catalog.list();
  const ids = new Set(existing.map((idea) => idea.id));
  const normalize = (title) => title.trim().toLowerCase();
  const titles = new Set(existing.map((idea) => normalize(idea.title)));
  let added = 0;
  for (const idea of batch) {
    if (ids.has(idea.id) || titles.has(normalize(idea.title))) continue;
    await database.catalog.create(idea);
    ids.add(idea.id); titles.add(normalize(idea.title)); added++;
  }
  const catalog = await database.catalog.list();
  const coverage = {};
  for (const idea of catalog) {
    const key = `${idea.place}/${idea.energy}`;
    coverage[key] = (coverage[key] || 0) + 1;
  }
  console.log(JSON.stringify({ added, skipped: batch.length - added, total: catalog.length, free: catalog.filter((i) => i.cost === 0).length, coverage }, null, 2));
} catch {
  console.error("Activity import failed. Check Atlas connectivity and write permissions. Rerunning skips activities already imported.");
  process.exitCode = 1;
} finally {
  await database?.client.close();
}
