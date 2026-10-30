import test from "node:test";
import assert from "node:assert/strict";
import { createMongoCatalog } from "./catalog.js";

test("MongoDB catalog builds validated filters and omits internal IDs", async () => {
  let received;
  const catalog = createMongoCatalog({
    find(filter, options) {
      received = { filter, options };
      return { toArray: async () => [{ id: "25" }] };
    },
  });
  assert.deepEqual(await catalog.list({ place: "home", energy: "lazy", budget: "0" }), [{ id: "25" }]);
  assert.deepEqual(received, {
    filter: { place: "home", energy: "lazy", cost: { $lte: 0 } },
    options: { projection: { _id: 0 } },
  });
  await assert.rejects(catalog.list({ place: { $ne: "home" } }));
});

test("MongoDB random selection excludes the last activity only with multiple matches", async () => {
  let count = 2;
  let pipeline;
  const catalog = createMongoCatalog({
    countDocuments: async () => count,
    aggregate(stages) {
      pipeline = stages;
      return { toArray: async () => count ? [{ id: "25" }] : [] };
    },
  });
  assert.deepEqual(await catalog.random({ budget: "5", exclude: "24" }), { idea: { id: "25" }, total: 2 });
  assert.deepEqual(pipeline[0], { $match: { cost: { $lte: 5 }, id: { $ne: "24" } } });
  count = 1;
  await catalog.random({ exclude: "25" });
  assert.deepEqual(pipeline[0], { $match: {} });
  count = 0;
  assert.deepEqual(await catalog.random({}), { idea: null, total: 0 });
});
