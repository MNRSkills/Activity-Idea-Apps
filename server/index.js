import express from "express";
import { connectDatabase } from "./database.js";
import { createServer } from "node:http";
import { createApiApp } from "./app.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createFavoritesStore } from "./store.js";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const favorites = await createFavoritesStore(
  path.join(root, "data", "favorites.json"),
);
let database;
try {
  database = await connectDatabase();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
const app = createApiApp(favorites, database.catalog);
const server = createServer(app);
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "127.0.0.1";
let vite;
if (process.argv.includes("--production")) {
  app.use(express.static(path.join(root, "dist")));
  app.get("/{*path}", (req, res) =>
    res.sendFile(path.join(root, "dist", "index.html")),
  );
} else {
  vite = await (
    await import("vite")
  ).createServer({
    root,
    server: { middlewareMode: true, hmr: { server } },
    appType: "spa",
  });
  app.use(vite.middlewares);
}
app.use((error, req, res, next) => {
  console.error("API request failed:", error.name);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});
server.on("error", async (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Stop the existing Little Weekends server or set a different PORT in .env.`);
  } else {
    console.error("Could not start Little Weekends:", error.message);
  }
  await vite?.close();
  await database.client.close();
  process.exitCode = 1;
});
server.listen(port, host, () =>
  console.log(`Little Weekends is ready at http://127.0.0.1:${port}`),
);
async function stop() {
  server.close();
  await vite?.close();
  await database.client.close();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
