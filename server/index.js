import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ideas, randomIdea } from "./ideas.js";
import { createFavoritesStore } from "./store.js";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const favorites = await createFavoritesStore(
  path.join(root, "data", "favorites.json"),
);
const app = express();
app.use(express.json({ limit: "10kb" }));
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", storage: "JSON", ideas: ideas.length }),
);
app.get("/api/ideas/random", (req, res) => {
  try {
    res.json(randomIdea(req.query));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
app.get("/api/favorites", async (req, res) => {
  const saved = await favorites.list();
  res.json(ideas.filter((idea) => saved.includes(idea.id)));
});
app.put("/api/favorites/:id", async (req, res) => {
  if (!ideas.some((idea) => idea.id === req.params.id))
    return res.status(404).json({ error: "Idea not found" });
  await favorites.set(req.params.id, true);
  res.json({ saved: true });
});
app.delete("/api/favorites/:id", async (req, res) => {
  await favorites.set(req.params.id, false);
  res.json({ saved: false });
});
app.use("/api", (req, res) =>
  res.status(404).json({ error: "Endpoint not found" }),
);
let vite;
if (process.argv.includes("--production")) {
  app.use(express.static(path.join(root, "dist")));
  app.get("/{*path}", (req, res) =>
    res.sendFile(path.join(root, "dist", "index.html")),
  );
} else {
  vite = await (
    await import("vite")
  ).createServer({ root, server: { middlewareMode: true }, appType: "spa" });
  app.use(vite.middlewares);
}
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});
const server = app.listen(Number(process.env.PORT) || 3000, "127.0.0.1", () =>
  console.log(
    "Little Weekends is ready at http://127.0.0.1:" +
      (Number(process.env.PORT) || 3000),
  ),
);
async function stop() {
  server.close();
  await vite?.close();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
