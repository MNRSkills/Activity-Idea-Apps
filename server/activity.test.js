import test from "node:test";
import assert from "node:assert/strict";
import { validateActivity } from "./activity.js";
const input = {
  title: "A plan",
  description: "Try something",
  place: "home",
  energy: "lazy",
  cost: 0,
  minutes: 30,
  steps: ["One", "Two", "Three"],
  bring: "Water",
};
test("activity creation assigns its own ID and only permits validated fields", () => {
  const result = validateActivity({ ...input, id: "25", admin: true });
  assert.notEqual(result.id, "25");
  assert.equal(result.admin, undefined);
  for (const change of [
    { cost: -1 },
    { minutes: 0 },
    { title: { $ne: null } },
    { steps: ["one"] },
    { place: "moon" },
  ])
    assert.throws(() => validateActivity({ ...input, ...change }));
});
