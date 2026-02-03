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

// Get recent comments across all earthquakes (for community feed)
export async function getRecentComments(limit: number = 50): Promise<CommentWithId[]> {
  const collection = await getCommentsCollection();
  if (!collection) return [];
  
  const comments = await collection
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  
  return comments.map(c => ({
    ...c,
    _id: c._id!.toString(),
  }));
}

// Get earthquakes with most comments (trending discussions)
export async function getTrendingEarthquakes(limit: number = 10, hoursBack: number = 72): Promise<Array<{ earthquakeId: string; count: number; recentCount: number; lastComment: Date }>> {
  const collection = await getCommentsCollection();
  if (!collection) return [];
  
  const cutoffDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  
  const pipeline = [
    {
      $facet: {
        // Get total counts and last activity
        totals: [
          { $group: { 
            _id: '$earthquakeId', 
            count: { $sum: 1 },
            lastComment: { $max: '$createdAt' }
          }},
        ],
        // Get recent activity (last N hours)
        recent: [
          { $match: { createdAt: { $gte: cutoffDate } } },
          { $group: { _id: '$earthquakeId', recentCount: { $sum: 1 } } },
        ],
      },
    },
  ];
  
  const [result] = await collection.aggregate(pipeline).toArray();
  
  if (!result) return [];
  
  type TotalEntry = { _id: string; count: number; lastComment: Date };
  const totalsMap = new Map<string, TotalEntry>(result.totals.map((t: TotalEntry) => [t._id, t]));
  const recentMap = new Map<string, number>(result.recent.map((r: { _id: string; recentCount: number }) => [r._id, r.recentCount]));
  
  // Combine and sort by recent activity + total
  const combined = Array.from(totalsMap.entries()).map(([earthquakeId, data]) => ({
    earthquakeId,
    count: data.count,
    recentCount: recentMap.get(earthquakeId) || 0,
    lastComment: data.lastComment,
  }));
  
  // Sort by recent activity first, then total count
  return combined
    .sort((a, b) => {
      // Prioritize recent activity
      if (b.recentCount !== a.recentCount) return b.recentCount - a.recentCount;
      return b.count - a.count;
    })
    .slice(0, limit);
}

// Get comment stats for community dashboard
export async function getCommunityStats(): Promise<{
  totalComments: number;
  totalFeltIt: number;
  activeEarthquakes: number;
  last24hComments: number;
}> {
  const collection = await getCommentsCollection();
  if (!collection) return { totalComments: 0, totalFeltIt: 0, activeEarthquakes: 0, last24hComments: 0 };
  
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const [totalComments, totalFeltIt, activeEarthquakes, last24hComments] = await Promise.all([
    collection.countDocuments({}),
    collection.countDocuments({ feltIt: true }),
    collection.distinct('earthquakeId').then(ids => ids.length),
    collection.countDocuments({ createdAt: { $gte: oneDayAgo } }),
  ]);
  
  return { totalComments, totalFeltIt, activeEarthquakes, last24hComments };
}

// ============================================
// User Address Storage (for My Neighborhood)
// ============================================

export interface UserAddress {
  _id?: ObjectId;
visitorId: string; // Unique identifier for the visitor (fingerprint or generated ID)
  address: string;
  lat: number;
  lon: number;
  city?: string;
  createdAt: Date;
  updatedAt: Date;
  searchCount: number; // Track how many times they've searched
  lastSearchAt: Date;
  userAgent?: string;
  ipHash?: string; // Hashed IP for analytics (not storing raw IP)
}

export interface UserAddressWithId extends Omit<UserAddress, '_id'> {
  _id: string;
}

export async function getUserAddressesCollection(): Promise<Collection<UserAddress> | null> {
  const db = await getDatabase();
  if (!db) return null;
  return db.collection<UserAddress>('user_addresses');
}

// Save or update a user's address
export async function saveUserAddress(data: {
  visitorId: string;
  address: string;
  lat: number;
  lon: number;
  city?: string;
  userAgent?: string;
  ipHash?: string;
}): Promise<UserAddressWithId | null> {
  const collection = await getUserAddressesCollection();
  if (!collection) return null;
  
  const now = new Date();
  
  // Check if this visitor already has this address saved
  const existing = await collection.findOne({ 
    visitorId: data.visitorId,
    address: data.address 
  });
  
  if (existing) {
    // Update existing record
    await collection.updateOne(
      { _id: existing._id },
      { 
        $set: { 
          updatedAt: now,
          lastSearchAt: now,
          lat: data.lat,
          lon: data.lon,
        },
        $inc: { searchCount: 1 }
      }
    );
    
    return {
      ...existing,
      _id: existing._id!.toString(),
      updatedAt: now,
      lastSearchAt: now,
      searchCount: existing.searchCount + 1,
    };
  }
  
  // Create new record
  const newAddress: UserAddress = {
    visitorId: data.visitorId,
    address: data.address,
    lat: data.lat,
    lon: data.lon,
    city: data.city,
    createdAt: now,
    updatedAt: now,
    searchCount: 1,
    lastSearchAt: now,
    userAgent: data.userAgent,
    ipHash: data.ipHash,
  };
  
  const result = await collection.insertOne(newAddress);
  
  return {
    ...newAddress,
    _id: result.insertedId.toString(),
  };
}

// Get addresses for a specific visitor
export async function getAddressesByVisitor(visitorId: string): Promise<UserAddressWithId[]> {
  const collection = await getUserAddressesCollection();
  if (!collection) return [];
  
  const addresses = await collection
    .find({ visitorId })
    .sort({ lastSearchAt: -1 })
    .limit(10)
    .toArray();
  
  return addresses.map(a => ({
    ...a,
    _id: a._id!.toString(),
  }));
}

// Get all unique addresses (for marketing/analytics)
export async function getAllUserAddresses(options?: {
  limit?: number;
  skip?: number;
  since?: Date;
}): Promise<{ addresses: UserAddressWithId[]; total: number }> {
  const collection = await getUserAddressesCollection();
  if (!collection) return { addresses: [], total: 0 };
  
  const query = options?.since ? { createdAt: { $gte: options.since } } : {};
  
  const [addresses, total] = await Promise.all([
    collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(options?.skip || 0)
      .limit(options?.limit || 100)
      .toArray(),
    collection.countDocuments(query),
  ]);
  
  return {
    addresses: addresses.map(a => ({
      ...a,
      _id: a._id!.toString(),
    })),
    total,
  };
}

// Get address statistics
export async function getAddressStats(): Promise<{
  totalAddresses: number;
  uniqueVisitors: number;
  addressesToday: number;
  addressesThisWeek: number;
}> {
  const collection = await getUserAddressesCollection();
  if (!collection) return { totalAddresses: 0, uniqueVisitors: 0, addressesToday: 0, addressesThisWeek: 0 };
  
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const [totalAddresses, uniqueVisitors, addressesToday, addressesThisWeek] = await Promise.all([
    collection.countDocuments({}),
    collection.distinct('visitorId').then(ids => ids.length),
    collection.countDocuments({ createdAt: { $gte: oneDayAgo } }),
    collection.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
  ]);
  
  return { totalAddresses, uniqueVisitors, addressesToday, addressesThisWeek };
}

// ============================================
// Forum System (Threads and Posts)
// ============================================

export type ForumCategory = 'earthquake' | 'general' | 'neighborhood' | 'preparedness' | 'science';

export interface ForumThread {
  _id?: ObjectId;
  title: string;
  slug: string;
  category: ForumCategory;
  author: string;
  authorLocation?: string;
  content: string; // First post content
  earthquakeId?: string; // Link to earthquake if category is 'earthquake'
  earthquakeData?: {
    magnitude: number;
    place: string;
    time: string;
    depth?: number;
  };
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  postCount: number;
  lastPostAt: Date;
  lastPostAuthor?: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

export interface ForumThreadWithId extends Omit<ForumThread, '_id'> {
  _id: string;
}

export interface ForumPost {
  _id?: ObjectId;
  threadId: string;
  parentPostId?: string; // For nested replies
  author: string;
  authorLocation?: string;
  content: string;
  feltIt?: boolean; // For earthquake threads
  intensity?: number; // 1-5 scale for earthquake experience
  likes: number;
  createdAt: Date;
  updatedAt?: Date;
  isOriginalPost: boolean; // First post in thread
}

export interface ForumPostWithId extends Omit<ForumPost, '_id'> {
  _id: string;
}

export async function getForumThreadsCollection(): Promise<Collection<ForumThread> | null> {
  const db = await getDatabase();
  if (!db) return null;
  return db.collection<ForumThread>('forum_threads');
}

export async function getForumPostsCollection(): Promise<Collection<ForumPost> | null> {
  const db = await getDatabase();
  if (!db) return null;
  return db.collection<ForumPost>('forum_posts');
}

// Generate URL-friendly slug
function generateSlug(title: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80);
  return `${baseSlug}-${Date.now().toString(36)}`;
}

// Create a new forum thread
export async function createForumThread(data: {
  title: string;
  category: ForumCategory;
  author: string;
  authorLocation?: string;
  content: string;
  earthquakeId?: string;
  earthquakeData?: { magnitude: number; place: string; time: string; depth?: number };
  tags?: string[];
}): Promise<ForumThreadWithId | null> {
  const threadsCollection = await getForumThreadsCollection();
  const postsCollection = await getForumPostsCollection();
  if (!threadsCollection || !postsCollection) return null;

  const now = new Date();
  const slug = generateSlug(data.title);

  const newThread: ForumThread = {
    title: data.title,
    slug,
    category: data.category,
    author: data.author,
    authorLocation: data.authorLocation,
    content: data.content,
    earthquakeId: data.earthquakeId,
    earthquakeData: data.earthquakeData,
    isPinned: false,
    isLocked: false,
    viewCount: 0,
    postCount: 1,
    lastPostAt: now,
    lastPostAuthor: data.author,
    createdAt: now,
    updatedAt: now,
    tags: data.tags,
  };

  const threadResult = await threadsCollection.insertOne(newThread);
  const threadId = threadResult.insertedId.toString();

  // Create the original post
  const originalPost: ForumPost = {
    threadId,
    author: data.author,
    authorLocation: data.authorLocation,
    content: data.content,
    likes: 0,
    createdAt: now,
    isOriginalPost: true,
  };

  await postsCollection.insertOne(originalPost);

  return {
    ...newThread,
    _id: threadId,
  };
}

// Get threads by category
export async function getForumThreads(options: {
  category?: ForumCategory;
  earthquakeId?: string;
  limit?: number;
  skip?: number;
  sortBy?: 'latest' | 'popular' | 'active';
}): Promise<{ threads: ForumThreadWithId[]; total: number }> {
  const collection = await getForumThreadsCollection();
  if (!collection) return { threads: [], total: 0 };

  const query: Record<string, unknown> = {};
  if (options.category) query.category = options.category;
  if (options.earthquakeId) query.earthquakeId = options.earthquakeId;

  let sortOptions: Record<string, 1 | -1> = { isPinned: -1, lastPostAt: -1 };
  if (options.sortBy === 'popular') {
    sortOptions = { isPinned: -1, viewCount: -1, postCount: -1 };
  } else if (options.sortBy === 'active') {
    sortOptions = { isPinned: -1, postCount: -1, lastPostAt: -1 };
  }

  const [threads, total] = await Promise.all([
    collection
      .find(query)
      .sort(sortOptions)
      .skip(options.skip || 0)
      .limit(options.limit || 20)
      .toArray(),
    collection.countDocuments(query),
  ]);

  return {
    threads: threads.map(t => ({ ...t, _id: t._id!.toString() })),
    total,
  };
}

// Get a single thread by slug or ID
export async function getForumThread(identifier: string, incrementView = false): Promise<ForumThreadWithId | null> {
  const collection = await getForumThreadsCollection();
  if (!collection) return null;

  // Try to find by slug first, then by ID
  let thread = await collection.findOne({ slug: identifier });
  if (!thread) {
    try {
      thread = await collection.findOne({ _id: new ObjectId(identifier) });
    } catch {
      return null;
    }
  }

  if (!thread) return null;

  if (incrementView) {
    await collection.updateOne(
      { _id: thread._id },
      { $inc: { viewCount: 1 } }
    );
    thread.viewCount += 1;
  }

  return { ...thread, _id: thread._id!.toString() };
}

// Get or create earthquake thread
export async function getOrCreateEarthquakeThread(earthquakeData: {
  id: string;
  magnitude: number;
  place: string;
  time: string;
  depth?: number;
}): Promise<ForumThreadWithId | null> {
  const collection = await getForumThreadsCollection();
  if (!collection) return null;

  // Check if thread exists
  let thread = await collection.findOne({ earthquakeId: earthquakeData.id });
  if (thread) {
    return { ...thread, _id: thread._id!.toString() };
  }

  // Create new thread for this earthquake
  const title = `M${earthquakeData.magnitude.toFixed(1)} ${earthquakeData.place}`;
  return createForumThread({
    title,
    category: 'earthquake',
    author: 'System',
    content: `Discussion thread for the M${earthquakeData.magnitude.toFixed(1)} earthquake near ${earthquakeData.place}.\n\nShare your experience, ask questions, or discuss this event with the community.`,
    earthquakeId: earthquakeData.id,
    earthquakeData: {
      magnitude: earthquakeData.magnitude,
      place: earthquakeData.place,
      time: earthquakeData.time,
      depth: earthquakeData.depth,
    },
  });
}

// Create a post in a thread
export async function createForumPost(data: {
  threadId: string;
  parentPostId?: string;
  author: string;
  authorLocation?: string;
  content: string;
  feltIt?: boolean;
  intensity?: number;
}): Promise<ForumPostWithId | null> {
  const postsCollection = await getForumPostsCollection();
  const threadsCollection = await getForumThreadsCollection();
  if (!postsCollection || !threadsCollection) return null;

  const now = new Date();

  const newPost: ForumPost = {
    threadId: data.threadId,
    parentPostId: data.parentPostId,
    author: data.author,
    authorLocation: data.authorLocation,
    content: data.content,
    feltIt: data.feltIt,
    intensity: data.intensity,
    likes: 0,
    createdAt: now,
    isOriginalPost: false,
  };

  const result = await postsCollection.insertOne(newPost);

  // Update thread's last post info and count
  await threadsCollection.updateOne(
    { _id: new ObjectId(data.threadId) },
    {
      $inc: { postCount: 1 },
      $set: {
        lastPostAt: now,
        lastPostAuthor: data.author,
        updatedAt: now,
      },
    }
  );

  return {
    ...newPost,
    _id: result.insertedId.toString(),
  };
}

// Get posts for a thread
export async function getForumPosts(threadId: string, options?: {
  limit?: number;
  skip?: number;
}): Promise<{ posts: ForumPostWithId[]; total: number }> {
  const collection = await getForumPostsCollection();
  if (!collection) return { posts: [], total: 0 };

  const [posts, total] = await Promise.all([
    collection
      .find({ threadId })
      .sort({ createdAt: 1 })
      .skip(options?.skip || 0)
      .limit(options?.limit || 50)
      .toArray(),
    collection.countDocuments({ threadId }),
  ]);

  return {
    posts: posts.map(p => ({ ...p, _id: p._id!.toString() })),
    total,
  };
}

// Get forum statistics
export async function getForumStats(): Promise<{
  totalThreads: number;
  totalPosts: number;
  earthquakeThreads: number;
  activeToday: number;
}> {
  const threadsCollection = await getForumThreadsCollection();
  const postsCollection = await getForumPostsCollection();
  if (!threadsCollection || !postsCollection) {
    return { totalThreads: 0, totalPosts: 0, earthquakeThreads: 0, activeToday: 0 };
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [totalThreads, totalPosts, earthquakeThreads, activeToday] = await Promise.all([
    threadsCollection.countDocuments({}),
    postsCollection.countDocuments({}),
    threadsCollection.countDocuments({ category: 'earthquake' }),
    threadsCollection.countDocuments({ lastPostAt: { $gte: oneDayAgo } }),
  ]);

  return { totalThreads, totalPosts, earthquakeThreads, activeToday };
}

// Get recent/trending threads across all categories
export async function getTrendingThreads(limit = 10): Promise<ForumThreadWithId[]> {
  const collection = await getForumThreadsCollection();
  if (!collection) return [];

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Get threads with recent activity, sorted by post count and recency
  const threads = await collection
    .find({ lastPostAt: { $gte: oneDayAgo } })
    .sort({ postCount: -1, lastPostAt: -1 })
    .limit(limit)
    .toArray();

  return threads.map(t => ({ ...t, _id: t._id!.toString() }));
}

// Search threads
export async function searchForumThreads(query: string, options?: {
  category?: ForumCategory;
  limit?: number;
}): Promise<ForumThreadWithId[]> {
  const collection = await getForumThreadsCollection();
  if (!collection) return [];

  const searchQuery: Record<string, unknown> = {
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { content: { $regex: query, $options: 'i' } },
      { tags: { $regex: query, $options: 'i' } },
    ],
  };

  if (options?.category) {
    searchQuery.category = options.category;
  }

  const threads = await collection
    .find(searchQuery)
    .sort({ lastPostAt: -1 })
    .limit(options?.limit || 20)
    .toArray();

  return threads.map(t => ({ ...t, _id: t._id!.toString() }));
}

export default clientPromise;


