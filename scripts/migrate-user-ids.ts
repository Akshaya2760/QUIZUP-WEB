import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI found.');
    process.exit(1);
  }

  console.log('[Migration] Connecting to MongoDB Atlas (db: quizup)...');
  await mongoose.connect(uri, { dbName: 'quizup' });
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database handle is undefined.');
  }

  const usersCollection = db.collection('users');

  // Find all documents where id is null, undefined, or empty string
  const usersToMigrate = await usersCollection
    .find({
      $or: [{ id: { $exists: false } }, { id: null }, { id: '' }],
    })
    .toArray();

  console.log(`[Migration] Found ${usersToMigrate.length} user(s) needing an ID migration.`);

  for (const user of usersToMigrate) {
    const prefix = user.role === 'admin' ? 'admin' : 'stu';
    const timestamp = Date.now().toString(36);
    const randomHex = user._id.toString().slice(-8);
    const generatedId = `${prefix}-${timestamp}-${randomHex}`;

    console.log(`[Migration] Assigning id="${generatedId}" to user: ${user.email} (_id: ${user._id})`);
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { id: generatedId } }
    );
  }

  // Verify all documents in users collection have a valid id
  const totalUsers = await usersCollection.countDocuments();
  const remainingInvalid = await usersCollection.countDocuments({
    $or: [{ id: { $exists: false } }, { id: null }, { id: '' }],
  });

  console.log(`[Migration] Total users in collection: ${totalUsers}. Invalid IDs remaining: ${remainingInvalid}.`);

  // Verify indexes on users collection
  const indexes = await usersCollection.indexes();
  console.log('[Migration] Current indexes on users collection:');
  for (const idx of indexes) {
    console.log(` - ${idx.name}: ${JSON.stringify(idx.key)} (unique: ${Boolean(idx.unique)})`);
  }

  await mongoose.disconnect();
  console.log('[Migration] Migration complete.');
}

migrate().catch((err) => {
  console.error('[Migration Error]:', err);
  process.exit(1);
});
