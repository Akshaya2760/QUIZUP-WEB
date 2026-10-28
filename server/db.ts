import mongoose from 'mongoose';

interface ConnectionState {
  isConnected: boolean;
  state: string;
  dbName: string | null;
  error?: string;
}

// Global cached connection for serverless/Vercel environments
declare global {
  // eslint-disable-next-line no-var
  var mongooseConnection: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

let cached = global.mongooseConnection;

if (!cached) {
  cached = global.mongooseConnection = { conn: null, promise: null };
}

export function sanitizeUri(uri?: string): string {
  if (!uri) return 'NOT_CONFIGURED';
  try {
    const parsed = new URL(uri);
    if (parsed.password) {
      parsed.password = '****';
    }
    return parsed.toString();
  } catch {
    return uri.replace(/:([^:@]+)@/, ':****@');
  }
}

/**
 * Determine the correct database name from URI, defaulting to lowercase 'quizup'
 * to prevent case collision with existing databases on MongoDB Atlas.
 */
export function getTargetDbName(uri?: string): string {
  if (!uri) return 'quizup';
  try {
    const parsed = new URL(uri);
    const dbFromPath = parsed.pathname.replace(/^\//, '').split('?')[0];
    if (dbFromPath && dbFromPath.trim() !== '') {
      if (dbFromPath.trim().toLowerCase() === 'quizup') {
        return 'quizup';
      }
      return dbFromPath.trim();
    }
  } catch {
    const match = uri.match(/\/([^/?]+)(\?|$)/);
    if (match && match[1]) {
      if (match[1].trim().toLowerCase() === 'quizup') {
        return 'quizup';
      }
      return match[1].trim();
    }
  }
  return 'quizup';
}

export async function sanitizeSessionIndexes(db: mongoose.mongo.Db) {
  try {
    const indexes = await db.collection('sessions').indexes();
    const sessionIdx = indexes.find((i) => i.name === 'sessionId_1');
    if (sessionIdx) {
      console.log('[Database] Removing harmful redundant index sessionId_1 from sessions...');
      await db.collection('sessions').dropIndex('sessionId_1');
      console.log('[Database] Successfully removed sessionId_1 index.');
    }
    const expiresAtIdx = indexes.find((i) => i.name === 'expiresAt_1');
    if (expiresAtIdx) {
      console.log('[Database] Removing legacy index expiresAt_1 from sessions...');
      await db.collection('sessions').dropIndex('expiresAt_1');
      console.log('[Database] Successfully removed expiresAt_1 index.');
    }

    // Clean harmful legacy indexes from quizzes & attempts
    try {
      const quizIndexes = await db.collection('quizzes').indexes();
      const quizIdIdx = quizIndexes.find((i) => i.name === 'id_1');
      if (quizIdIdx) {
        console.log('[Database] Removing legacy id_1 index from quizzes...');
        await db.collection('quizzes').dropIndex('id_1');
        console.log('[Database] Successfully removed id_1 index from quizzes.');
      }
    } catch {
      // Ignore if quizzes collection doesn't exist
    }

    try {
      const attemptIndexes = await db.collection('attempts').indexes();
      const attemptIdIdx = attemptIndexes.find((i) => i.name === 'id_1');
      if (attemptIdIdx) {
        console.log('[Database] Removing legacy id_1 index from attempts...');
        await db.collection('attempts').dropIndex('id_1');
        console.log('[Database] Successfully removed id_1 index from attempts.');
      }
    } catch {
      // Ignore if attempts collection doesn't exist
    }
  } catch (err: any) {
    // If collection does not exist yet or index already dropped, ignore
  }
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is missing or empty.');
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    let targetDb = getTargetDbName(uri);

    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      dbName: targetDb,
    };

    console.log(`[Database] Attempting connection to MongoDB: ${sanitizeUri(uri)} (DB: ${targetDb})`);

    cached.promise = mongoose
      .connect(uri, opts)
      .then(async (mongooseInstance) => {
        const dbName = mongooseInstance.connection.db?.databaseName || targetDb;
        console.log(`[Database] MongoDB Atlas connected successfully to database: ${dbName}`);
        if (mongooseInstance.connection.db) {
          await sanitizeSessionIndexes(mongooseInstance.connection.db);
        }
        return mongooseInstance;
      })
      .catch(async (err) => {
        cached.promise = null;

        // Auto-recover from case-sensitivity mismatch error:
        // "db already exists with different case already have: [quizup] trying to create [QUIZUP]"
        const caseMatch = err.message?.match(/already have:\s*\[([^\]]+)\]/i);
        if (caseMatch && caseMatch[1]) {
          const actualDbCase = caseMatch[1];
          console.log(`[Database] Detected existing cluster database case: [${actualDbCase}]. Reconnecting...`);
          opts.dbName = actualDbCase;
          try {
            const reconnected = await mongoose.connect(uri, opts);
            console.log(`[Database] MongoDB Atlas reconnected successfully to database: ${actualDbCase}`);
            if (reconnected.connection.db) {
              await sanitizeSessionIndexes(reconnected.connection.db);
            }
            return reconnected;
          } catch (retryErr: any) {
            console.error('[Database] Retry with detected database case failed:', retryErr.message);
            throw retryErr;
          }
        }

        console.error('[Database] MongoDB connection failed:', err.message);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export function getDatabaseStatus(): ConnectionState {
  const stateCode = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const stateName = states[stateCode] || 'unknown';

  return {
    isConnected: stateCode === 1,
    state: stateName,
    dbName: stateCode === 1 ? (mongoose.connection.db?.databaseName || 'quizup') : null,
  };
}
