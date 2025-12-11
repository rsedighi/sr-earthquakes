import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

// Comment schema
export interface Comment {
  _id?: ObjectId;
  earthquakeId: string;
  parentId?: string; // For threading - null means top-level comment
  author: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  likes: number;
  location?: string; // Optional: "Near San Ramon" for context
  feltIt?: boolean; // Quick "I felt this" indicator
}

// Type for client-side use (with string _id)
export interface CommentWithId extends Omit<Comment, '_id'> {
  _id: string;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.warn('MONGODB_URI not found in environment variables. Comments feature will be disabled.');
}

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

if (uri) {
  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so the client is not recreated on every HMR
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    // In production mode, create a new client for each instance
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }
}

export async function getDatabase(): Promise<Db | null> {
  if (!clientPromise) return null;
  const client = await clientPromise;
  return client.db('earthquake-tracker');
}

export async function getCommentsCollection(): Promise<Collection<Comment> | null> {
  const db = await getDatabase();
  if (!db) return null;
  return db.collection<Comment>('comments');
}

// Helper functions for comments
export async function getCommentsByEarthquakeId(earthquakeId: string): Promise<CommentWithId[]> {
  const collection = await getCommentsCollection();
  if (!collection) return [];
  
  const comments = await collection
    .find({ earthquakeId })
    .sort({ createdAt: -1 })
    .toArray();
  
  return comments.map(c => ({
    ...c,
    _id: c._id!.toString(),
  }));
}

export async function createComment(comment: Omit<Comment, '_id' | 'createdAt' | 'likes'>): Promise<CommentWithId | null> {
  const collection = await getCommentsCollection();
  if (!collection) return null;
  
  const newComment: Comment = {
    ...comment,
    createdAt: new Date(),
    likes: 0,
  };
  
  const result = await collection.insertOne(newComment);
  
  return {
    ...newComment,
    _id: result.insertedId.toString(),
  };
}

export async function getCommentCount(earthquakeId: string): Promise<number> {
  const collection = await getCommentsCollection();
  if (!collection) return 0;
  
  return await collection.countDocuments({ earthquakeId });
}

export async function getCommentCountsForEarthquakes(earthquakeIds: string[]): Promise<Record<string, number>> {
  const collection = await getCommentsCollection();
  if (!collection) return {};
  
  const pipeline = [
    { $match: { earthquakeId: { $in: earthquakeIds } } },
    { $group: { _id: '$earthquakeId', count: { $sum: 1 } } },
  ];
  
  const results = await collection.aggregate(pipeline).toArray();
  
  return results.reduce((acc, r) => {
    acc[r._id] = r.count;
    return acc;
  }, {} as Record<string, number>);
}

export default clientPromise;


