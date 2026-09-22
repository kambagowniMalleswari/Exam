import mongoose from "mongoose";

const ATLAS_URI = "mongodb+srv://kambagownikmalleswari_db_user:gfW40mT57Lxp34Vg@cluster-1.70fazgr.mongodb.net/multi_tenant_mcq_portal?retryWrites=true&w=majority&appName=cluster-1";
const LOCAL_URI = "mongodb://127.0.0.1:27017/multi_tenant_mcq_portal";

async function run() {
  console.log("Connecting to MongoDB Atlas...");
  const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
  console.log("✓ Connected to MongoDB Atlas successfully!");

  console.log("Connecting to Local MongoDB...");
  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log("✓ Connected to Local MongoDB!");

  const localDb = localConn.db;
  const atlasDb = atlasConn.db;

  const collections = await localDb.listCollections().toArray();
  console.log(`\nFound ${collections.length} collections in local database to migrate:`);

  for (const col of collections) {
    const colName = col.name;
    if (colName.startsWith("system.")) continue;

    const count = await localDb.collection(colName).countDocuments();
    console.log(`- Migrating ${colName} (${count} documents)...`);

    if (count > 0) {
      const docs = await localDb.collection(colName).find({}).toArray();
      // Clear atlas collection first to avoid duplicates
      await atlasDb.collection(colName).deleteMany({});
      await atlasDb.collection(colName).insertMany(docs);
      console.log(`  ✓ Successfully copied ${docs.length} documents to Atlas ${colName}`);
    }
  }

  console.log("\n=============================================");
  console.log("ALL LOCAL DATA SUCCESSFULLY MIGRATED TO ATLAS!");
  console.log("=============================================");

  await atlasConn.close();
  await localConn.close();
  process.exit(0);
}

run().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
