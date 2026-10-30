import { MongoClient } from "mongodb";
import { createMongoCatalog } from "./catalog.js";

export async function connectDatabase(env = process.env) {
  if (!env.DB_HOST) throw new Error("Set DB_HOST in the root .env file.");
  if (env.DB_HOST.includes("<db_password>")) throw new Error("Set DB_HOST with your actual database password in place of <db_password>.");
  let client;
  try {
    client = new MongoClient(env.DB_HOST, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    await client.connect();
    // Discover only when unambiguous; never silently read a new empty database.
    let dbName = env.MONGODB_DB || env.DB_NAME;
    if (!dbName) {
      const { databases } = await client.db("admin").admin().listDatabases({ nameOnly: true, authorizedDatabases: true });
      const names = databases.map((db) => db.name).filter((name) => !["admin", "local", "config"].includes(name));
      if (names.length !== 1) throw new Error("Set MONGODB_DB in .env to your Atlas database name.");
      [dbName] = names;
    }
    const db = client.db(dbName);
    const names = (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name);
    let collectionName = env.MONGODB_COLLECTION;
    if (!collectionName && names.length === 1) [collectionName] = names;
    if (!collectionName || !names.includes(collectionName)) throw new Error("Set MONGODB_COLLECTION in .env to your existing activity collection name.");
    await db.command({ ping: 1 });
    return { client, catalog: createMongoCatalog(db.collection(collectionName)) };
  } catch (error) {
    await client?.close();
    // Never expose driver messages, which may contain connection details.
    if (error.message.startsWith("Set ")) throw error;
    throw new Error("Atlas connection failed. Check DB_HOST, database permissions, and the Atlas IP access list.");
  }
}
