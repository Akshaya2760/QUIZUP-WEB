import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function fixSessionIndexes() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI found.');
    process.exit(1);
  }

  console.log('[Fix Sessions] Connecting to MongoDB Atlas...');
  await mongoose.connect(uri, { dbName: 'quizup' });
  const db = mongoose.connection.db!;

  const sessionsCol = db.collection('sessions');

  // 1. Check existing documents
  const nullDocs = await sessionsCol.find({ $or: [{ sessionId: { $exists: false } }, { sessionId: null }] }).toArray();
  console.log(`[Fix Sessions] Found ${nullDocs.length} session document(s) with missing or null sessionId.`);

  for (const doc of nullDocs) {
    console.log(`[Fix Sessions] Updating doc _id: ${doc._id} with sessionId: ${doc._id}`);
    await sessionsCol.updateOne({ _id: doc._id }, { $set: { sessionId: doc._id.toString() } });
  }

  // 2. Check indexes on sessions
  const indexes = await sessionsCol.indexes();
  console.log('[Fix Sessions] Current indexes on sessions:');
  for (const idx of indexes) {
    console.log(` - ${idx.name}: ${JSON.stringify(idx.key)} (unique: ${Boolean(idx.unique)}, sparse: ${Boolean(idx.sparse)})`);
  }

  const sessionIdx = indexes.find((i) => i.name === 'sessionId_1');
  if (sessionIdx) {
    console.log('[Fix Sessions] Found redundant sessionId_1 index. Dropping it...');
    await sessionsCol.dropIndex('sessionId_1');
    console.log('[Fix Sessions] Successfully dropped sessionId_1 index.');
  }

  const expiresAtIdx = indexes.find((i) => i.name === 'expiresAt_1');
  if (expiresAtIdx) {
    console.log('[Fix Sessions] Found redundant expiresAt_1 index. Dropping it...');
    await sessionsCol.dropIndex('expiresAt_1');
    console.log('[Fix Sessions] Successfully dropped expiresAt_1 index.');
  }

  // Verify new indexes
  const updatedIndexes = await sessionsCol.indexes();
  console.log('[Fix Sessions] Updated indexes on sessions:');
  for (const idx of updatedIndexes) {
    console.log(` - ${idx.name}: ${JSON.stringify(idx.key)} (unique: ${Boolean(idx.unique)}, sparse: ${Boolean(idx.sparse)})`);
  }

  await mongoose.disconnect();
  console.log('[Fix Sessions] Done.');
}

fixSessionIndexes().catch((err) => {
  console.error('[Fix Sessions Error]:', err);
  process.exit(1);
});
