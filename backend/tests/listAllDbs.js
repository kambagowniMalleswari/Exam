import mongoose from "mongoose";

async function listDbs() {
  await mongoose.connect("mongodb://127.0.0.1:27017");
  const admin = new mongoose.mongo.Admin(mongoose.connection.db);
  const dbs = await admin.listDatabases();
  console.log("=== ALL MONGODB DATABASES ===");
  console.log(dbs.databases.map(d => `${d.name} (${d.sizeOnDisk} bytes)`).join("\n"));

  for (const dbInfo of dbs.databases) {
    if (["admin", "config", "local"].includes(dbInfo.name)) continue;
    const client = mongoose.connection.useDb(dbInfo.name);
    const collections = await client.db.listCollections().toArray();
    console.log(`\nDatabase: ${dbInfo.name}`);
    for (const col of collections) {
      const count = await client.db.collection(col.name).countDocuments();
      console.log(`  - ${col.name}: ${count} docs`);
      // search for mahiharish6
      const found = await client.db.collection(col.name).findOne({
        $or: [
          { email: /mahiharish6/i },
          { name: /Capgemini/i }
        ]
      });
      if (found) {
        console.log(`    >>> FOUND IN ${dbInfo.name}.${col.name}:`, JSON.stringify(found));
      }
    }
  }
  await mongoose.disconnect();
}

listDbs().catch(console.error);
