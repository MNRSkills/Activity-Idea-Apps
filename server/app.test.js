import test from "node:test";
import assert from "node:assert/strict";
import { createApiApp } from "./app.js";
import { ideas } from "./ideas.js";

test("GET API serves the mock catalog and validates requests", async (t) => {
  const app = createApiApp({ list: async () => ["1"] });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  async function get(route, status = 200) {
    const response = await fetch(base + route);
    assert.equal(response.status, status);
    assert.match(response.headers.get("content-type"), /application\/json/);
    return response.json();
  }
  assert.deepEqual(await get("/api/ideas"), { ideas, total: ideas.length });
  const expected = ideas.filter(
    (i) => i.place === "home" && i.energy === "lazy" && i.cost === 0,
  );
  assert.deepEqual(await get("/api/ideas?place=home&energy=lazy&budget=0"), {
    ideas: expected,
    total: expected.length,
  });
  assert.deepEqual(await get("/api/ideas/1"), { idea: ideas[0] });
  const random = await get("/api/ideas/random?place=home&energy=lazy&budget=0");
  assert.ok(expected.some((i) => i.id === random.idea.id));
  assert.equal(random.total, expected.length);
  assert.deepEqual(await get("/api/favorites"), [ideas[0]]);
  assert.equal((await get("/api/health")).status, "ok");
  for (const route of [
    "/api/ideas?budget=abc",
    "/api/ideas?place=moon",
    "/api/ideas?energy=easy&energy=lazy",
  ]) {
    assert.ok((await get(route, 400)).error);
  }
  assert.deepEqual(await get("/api/ideas/missing", 404), {
    error: "Idea not found",
  });
  assert.deepEqual(await get("/api/missing", 404), {
    error: "Endpoint not found",
  });
});

test("POST creates an activity and rejects invalid and cross-origin requests", async (t) => {
 let inserted;
 const app = createApiApp({}, { create: async (idea) => { inserted = idea; return idea; } });
 const server = app.listen(0, "127.0.0.1");
 await new Promise((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
 t.after(() => new Promise((resolve) => server.close(resolve)));
 const url = `http://127.0.0.1:${server.address().port}/api/ideas`;
 const body = { title: "A plan", description: "Try something", place: "home", energy: "lazy", cost: 0, minutes: 30, steps: ["One", "Two", "Three"], bring: "Water" };
 const send = (data, extra = {}) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...extra }, body: JSON.stringify(data) });
 const response = await send(body);
 assert.equal(response.status, 201);
 assert.equal((await response.json()).idea.id, inserted.id);
 assert.equal(response.headers.get("location"), `/api/ideas/${inserted.id}`);
 assert.equal((await send({...body,cost:-1})).status,400);
 assert.equal((await send(body,{Origin:"https://other.example"})).status,403);
});
