import { randomUUID } from "node:crypto";

export function validateActivity(body) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new Error("Provide an activity object.");
  const text = (key, max) => {
    if (
      typeof body[key] !== "string" ||
      !body[key].trim() ||
      body[key].trim().length > max
    )
      throw new Error(`Provide ${key} (up to ${max} characters).`);
    return body[key].trim();
  };
  if (!["home", "out"].includes(body.place))
    throw new Error("Choose a valid place.");
  if (!["lazy", "easy", "adventure"].includes(body.energy))
    throw new Error("Choose a valid energy level.");
  if (!Number.isFinite(body.cost) || body.cost < 0 || body.cost > 10)
    throw new Error("Cost must be between $0 and $10.");
  if (
    !Number.isInteger(body.minutes) ||
    body.minutes < 1 ||
    body.minutes > 1440
  )
    throw new Error("Duration must be 1–1440 minutes.");
  if (
    !Array.isArray(body.steps) ||
    body.steps.length !== 3 ||
    body.steps.some(
      (s) => typeof s !== "string" || !s.trim() || s.trim().length > 300,
    )
  )
    throw new Error("Provide three steps, each up to 300 characters.");
  return {
    id: randomUUID(),
    title: text("title", 120),
    description: text("description", 500),
    place: body.place,
    energy: body.energy,
    cost: body.cost,
    minutes: body.minutes,
    icon: "✦",
    steps: body.steps.map((s) => s.trim()),
    bring: text("bring", 250),
  };
}
