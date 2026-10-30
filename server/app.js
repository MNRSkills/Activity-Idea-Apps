import express from "express";
import { ideas, listIdeas, randomIdea } from "./ideas.js";

// Keep API routes independent of Vite and server startup for reuse and testing.
export function createApiApp(favorites) {
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
  app.get("/api/ideas", (req, res) => {
    try {
      const matches = listIdeas(req.query);
      res.json({ ideas: matches, total: matches.length });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app.get("/api/ideas/:id", (req, res) => {
    const idea = ideas.find((item) => item.id === req.params.id);
    if (!idea) return res.status(404).json({ error: "Idea not found" });
    res.json({ idea });
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
  return app;
}


