import { readFile } from "node:fs/promises";
export const ideas = JSON.parse(
  await readFile(new URL("../data/ideas.json", import.meta.url), "utf8"),
);

export function buildFilter(query) {
  const filter = {};
  for (const [key, allowed] of Object.entries({
    place: ["home", "out"],
    energy: ["lazy", "easy", "adventure"],
  })) {
    if (query[key] && query[key] !== "any") {
      if (!allowed.includes(query[key])) throw new Error(`Invalid ${key}`);
      filter[key] = query[key];
    }
  }
  if (query.budget !== undefined) {
    if (!["0", "5", "10"].includes(query.budget))
      throw new Error("Invalid budget");
    filter.budget = Number(query.budget);
  }
  return filter;
}

export function randomIdea(query, catalog = ideas) {
  const filter = buildFilter(query);
  const matches = catalog.filter(
    (idea) =>
      (!filter.place || idea.place === filter.place) &&
      (!filter.energy || idea.energy === filter.energy) &&
      (filter.budget === undefined || idea.cost <= filter.budget),
  );
  const choices =
    matches.length > 1
      ? matches.filter((idea) => idea.id !== query.exclude)
      : matches;
  return {
    idea: choices[Math.floor(Math.random() * choices.length)] || null,
    total: matches.length,
  };
}
