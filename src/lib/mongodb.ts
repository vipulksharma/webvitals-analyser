import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not defined. Copy .env.example to .env.local and set your MongoDB Atlas connection string."
    );
  }
  if (uri.includes("<cluster>") || uri.includes("<user>") || uri.includes("<password>")) {
    throw new Error(
      "MONGODB_URI still contains placeholder values (<user>, <password>, <cluster>). Replace them with your real MongoDB Atlas credentials."
    );
  }
  return uri;
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  const uri = getMongoUri();

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, { bufferCommands: false }).catch((err) => {
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.conn = null;
    throw err;
  }
}
