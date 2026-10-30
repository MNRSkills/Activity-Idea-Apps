import { ideas, listIdeas, randomIdea, buildFilter } from "./ideas.js";

export const mockCatalog = {
  storage: "JSON",
  async list(query = {}) { return listIdeas(query); },
  async get(id) { return ideas.find((idea) => idea.id === id); },
  async random(query) { return randomIdea(query); },
  async count() { return ideas.length; },
};

export function createMongoCatalog(collection) {
  const projection = { _id: 0 };
  function filter(query) {
    const { budget, ...result } = buildFilter(query);
    if (budget !== undefined) result.cost = { $lte: budget };
    return result;
  }
  return {
    storage: "MongoDB",
    async create(idea) {
      await collection.insertOne({ ...idea });
      return idea;
    },
    async list(query = {}) {
      return collection.find(filter(query), { projection }).toArray();
    },
    async get(id) { return collection.findOne({ id }, { projection }); },
    async count() { return collection.countDocuments({}); },
    async random(query) {
      const match = filter(query);
      const total = await collection.countDocuments(match);
      const eligible = total > 1 && typeof query.exclude === "string"
        ? { ...match, id: { $ne: query.exclude } } : match;
      const [idea] = await collection.aggregate([
        { $match: eligible }, { $sample: { size: 1 } }, { $project: projection },
      ]).toArray();
      return { idea: idea || null, total };
    },
  };
}
