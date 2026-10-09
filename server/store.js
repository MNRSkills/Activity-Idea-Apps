import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";

// One local server owns this file. Queue mutations to prevent overlapping writes.
export async function createFavoritesStore(file) {
  await mkdir(path.dirname(file), { recursive: true });
  let ids;
  try {
    ids = JSON.parse(await readFile(file, "utf8"));
    if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
      throw new Error("Favorites file must contain an array of idea IDs.");
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    ids = [];
    await writeFile(file, "[]\n", { flag: "wx" });
  }
  let pending = Promise.resolve();
  return {
    async list() {
      await pending;
      return [...ids];
    },
    set(id, saved) {
      const operation = pending.then(async () => {
        const next = saved
          ? [...new Set([...ids, id])]
          : ids.filter((value) => value !== id);
        await writeFile(file + ".tmp", JSON.stringify(next, null, 2) + "\n");
        await rename(file + ".tmp", file);
        ids = next;
      });
      pending = operation.catch(() => {});
      return operation;
    },
  };
}
