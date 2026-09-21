// Copies every collection from the local MongoDB to Atlas.
//
//   node scripts/copy-to-atlas.js          # report what would be copied
//   node scripts/copy-to-atlas.js --write  # actually copy
//
// Both connection strings come from server/.env and are never printed.
import { MongoClient } from 'mongodb';
import { env } from '../src/config/env.js';

const write = process.argv.includes('--write');
const source = process.env.MONGODB_URI;
const target = (process.env.MONGODB_ATLAS_URI || '').trim();

if (!target) {
  console.error('MONGODB_ATLAS_URI is empty. Fill it in server/.env first.');
  process.exit(1);
}
if (target === source) {
  console.error('MONGODB_ATLAS_URI and MONGODB_URI point at the same database.');
  process.exit(1);
}

const from = new MongoClient(source);
const to = new MongoClient(target, { serverSelectionTimeoutMS: 10000 });

try {
  await from.connect();
  await to.connect();
  const fromDb = from.db();
  const toDb = to.db();
  console.log(`source: ${fromDb.databaseName} (local)`);
  console.log(`target: ${toDb.databaseName} (Atlas)`);
  console.log(write ? '--- copying ---' : '--- dry run, nothing written ---');

  for (const { name } of await fromDb.listCollections().toArray()) {
    const docs = await fromDb.collection(name).find().toArray();
    const existing = await toDb.collection(name).countDocuments();
    if (docs.length === 0) {
      console.log(`  ${name}: empty, skipped`);
      continue;
    }
    // Refuse to merge into a collection that already holds data: a second run
    // would otherwise fail halfway on duplicate _id values.
    if (existing > 0) {
      console.log(`  ${name}: target already has ${existing} document(s), skipped`);
      continue;
    }
    if (write) {
      await toDb.collection(name).insertMany(docs, { ordered: false });
    }
    console.log(`  ${name}: ${docs.length} document(s)${write ? ' copied' : ' would be copied'}`);
  }

  if (write) {
    // Indexes are not carried by insertMany, and the app relies on the unique
    // ones. Creating the models rebuilds them from the schemas.
    const mongoose = (await import('mongoose')).default;
    await mongoose.connect(target);
    await Promise.all([
      import('../src/models/User.js'),
      import('../src/models/Product.js'),
      import('../src/models/Cart.js'),
      import('../src/models/Order.js'),
      import('../src/models/Counter.js'),
    ]);
    await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
    console.log('  indexes rebuilt');
    await mongoose.disconnect();
  }

  console.log(write ? 'done' : 'dry run complete — rerun with --write to copy');
} finally {
  await from.close();
  await to.close();
}
