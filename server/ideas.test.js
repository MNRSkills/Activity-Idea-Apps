import test from "node:test";
import assert from "node:assert/strict";
import { ideas, buildFilter, randomIdea } from "./ideas.js";
test("free activities cover every location and energy combination", () => {
  for (const place of ["home", "out"])
    for (const energy of ["lazy", "easy", "adventure"])
      assert.ok(
        ideas.some(
          (i) => i.place === place && i.energy === energy && i.cost === 0,
        ),
        `${place}/${energy}`,
      );
});
test("filters enforce budget and reject invalid inputs", () => {
  assert.deepEqual(
    buildFilter({ place: "home", energy: "lazy", budget: "0" }),
    { place: "home", energy: "lazy", budget: 0 },
  );
  for (const query of [
    { budget: "-1" },
    { budget: "abc" },
    { place: "moon" },
    { energy: { $ne: null } },
  ])
    assert.throws(() => buildFilter(query));
});
test("activity catalog has unique IDs and actionable steps", () => {
  assert.equal(new Set(ideas.map((i) => i.id)).size, ideas.length);
  for (const idea of ideas) {
    assert.equal(idea.steps.length, 3);
    assert.ok(idea.minutes > 0);
    assert.ok(idea.bring);
  }
});
test("random ideas respect all filters and avoid immediate repeats", () => {
  const query = { place: "home", energy: "lazy", budget: "0" };
  const first = randomIdea(query);
  assert.ok(first.total > 1);
  for (let i = 0; i < 30; i++) {
    const { idea } = randomIdea({ ...query, exclude: first.idea.id });
    assert.equal(idea.place, "home");
    assert.equal(idea.energy, "lazy");
    assert.equal(idea.cost, 0);
    assert.notEqual(idea.id, first.idea.id);
  }
});
test("empty results and single remaining choice are handled", () => {
  assert.deepEqual(randomIdea({ budget: "0" }, []), { idea: null, total: 0 });
  assert.equal(
    randomIdea({ exclude: ideas[0].id }, [ideas[0]]).idea.id,
    ideas[0].id,
  );
});
