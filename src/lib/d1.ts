/**
 * D1 query helpers — replaces lib/mongodb.ts
 * All functions accept a D1Database binding (from Astro.locals.runtime.env.DB)
 */
function uuid(): string {
  return crypto.randomUUID();
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type ForumCategory = 'earthquake' | 'general' | 'neighborhood' | 'preparedness' | 'science';
export type FeedbackType  = 'feedback' | 'improvement' | 'bug' | 'feature' | 'advertising';
export type FeedbackStatus = 'new' | 'reviewed' | 'resolved' | 'archived';

export interface Comment {
  id: string;
  earthquakeId: string;
  parentId: string | null;
  author: string;
  content: string;
  createdAt: number;
  updatedAt: number | null;
  likes: number;
  location: string | null;
  feltIt: boolean;
}

export interface ForumThread {
  id: string;
  title: string;
  slug: string;
  category: ForumCategory;
  author: string;
  authorLocation: string | null;
  content: string;
  earthquakeId: string | null;
  earthquakeData: { magnitude: number; place: string; time: string; depth?: number } | null;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  postCount: number;
  lastPostAt: number;
  lastPostAuthor: string | null;
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

export interface ForumPost {
  id: string;
  threadId: string;
  parentPostId: string | null;
  author: string;
  authorLocation: string | null;
  content: string;
  feltIt: boolean | null;
  intensity: number | null;
  likes: number;
  createdAt: number;
  updatedAt: number | null;
  isOriginalPost: boolean;
}

export interface Device {
  token: string;
  city: string | null;
  minMagnitude: number;
  lat: number | null;
  lon: number | null;
  radiusMiles: number;
  createdAt: number;
}

export interface UserAddress {
  id: string;
  visitorId: string;
  address: string;
  lat: number;
  lon: number;
  city: string | null;
  createdAt: number;
  updatedAt: number;
  searchCount: number;
  lastSearchAt: number;
}

export interface Feedback {
  id: string;
  type: FeedbackType;
  name: string;
  email: string;
  message: string;
  page: string;
  createdAt: number;
  userAgent: string | null;
  ipHash: string | null;
  status: FeedbackStatus;
  notes: string | null;
}

// ── Row → domain mappers ──────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToComment(r: any): Comment {
  return {
    id: r.id,
    earthquakeId: r.earthquake_id,
    parentId: r.parent_id ?? null,
    author: r.author,
    content: r.content,
    createdAt: r.created_at,
    updatedAt: r.updated_at ?? null,
    likes: r.likes,
    location: r.location ?? null,
    feltIt: r.felt_it === 1,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToThread(r: any): ForumThread {
  return {
    id: r.id,
    title: r.title,
    slug: r.slug,
    category: r.category as ForumCategory,
    author: r.author,
    authorLocation: r.author_location ?? null,
    content: r.content,
    earthquakeId: r.earthquake_id ?? null,
    earthquakeData: r.earthquake_data ? JSON.parse(r.earthquake_data) : null,
    isPinned: r.is_pinned === 1,
    isLocked: r.is_locked === 1,
    viewCount: r.view_count,
    postCount: r.post_count,
    lastPostAt: r.last_post_at,
    lastPostAuthor: r.last_post_author ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    tags: r.tags ? JSON.parse(r.tags) : [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToPost(r: any): ForumPost {
  return {
    id: r.id,
    threadId: r.thread_id,
    parentPostId: r.parent_post_id ?? null,
    author: r.author,
    authorLocation: r.author_location ?? null,
    content: r.content,
    feltIt: r.felt_it !== null ? r.felt_it === 1 : null,
    intensity: r.intensity ?? null,
    likes: r.likes,
    createdAt: r.created_at,
    updatedAt: r.updated_at ?? null,
    isOriginalPost: r.is_original_post === 1,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToFeedback(r: any): Feedback {
  return {
    id: r.id,
    type: r.type as FeedbackType,
    name: r.name,
    email: r.email,
    message: r.message,
    page: r.page,
    createdAt: r.created_at,
    userAgent: r.user_agent ?? null,
    ipHash: r.ip_hash ?? null,
    status: r.status as FeedbackStatus,
    notes: r.notes ?? null,
  };
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80);
  return `${base}-${Date.now().toString(36)}`;
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function getComments(db: D1Database, earthquakeId: string): Promise<Comment[]> {
  const { results } = await db
    .prepare('SELECT * FROM comments WHERE earthquake_id = ? ORDER BY created_at DESC')
    .bind(earthquakeId)
    .all();
  return results.map(rowToComment);
}

export async function createComment(db: D1Database, data: {
  earthquakeId: string;
  parentId?: string;
  author: string;
  content: string;
  location?: string;
  feltIt?: boolean;
}): Promise<Comment> {
  const id = uuid();
  const now = Date.now();
  await db
    .prepare(
      `INSERT INTO comments (id, earthquake_id, parent_id, author, content, created_at, likes, location, felt_it)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`
    )
    .bind(id, data.earthquakeId, data.parentId ?? null, data.author, data.content, now, data.location ?? null, data.feltIt ? 1 : 0)
    .run();
  return { id, earthquakeId: data.earthquakeId, parentId: data.parentId ?? null, author: data.author, content: data.content, createdAt: now, updatedAt: null, likes: 0, location: data.location ?? null, feltIt: data.feltIt ?? false };
}

export async function likeComment(db: D1Database, commentId: string): Promise<void> {
  await db.prepare('UPDATE comments SET likes = likes + 1 WHERE id = ?').bind(commentId).run();
}

export async function getCommentCount(db: D1Database, earthquakeId: string): Promise<number> {
  const row = await db
    .prepare('SELECT COUNT(*) as cnt FROM comments WHERE earthquake_id = ?')
    .bind(earthquakeId)
    .first<{ cnt: number }>();
  return row?.cnt ?? 0;
}

export async function getCommentCountsBatch(db: D1Database, earthquakeIds: string[]): Promise<Record<string, number>> {
  if (!earthquakeIds.length) return {};
  const placeholders = earthquakeIds.map(() => '?').join(',');
  const { results } = await db
    .prepare(`SELECT earthquake_id, COUNT(*) as cnt FROM comments WHERE earthquake_id IN (${placeholders}) GROUP BY earthquake_id`)
    .bind(...earthquakeIds)
    .all<{ earthquake_id: string; cnt: number }>();
  return Object.fromEntries(results.map(r => [r.earthquake_id, r.cnt]));
}

export async function getRecentComments(db: D1Database, limit = 50): Promise<Comment[]> {
  const { results } = await db
    .prepare('SELECT * FROM comments ORDER BY created_at DESC LIMIT ?')
    .bind(limit)
    .all();
  return results.map(rowToComment);
}

export async function getCommunityStats(db: D1Database): Promise<{ totalComments: number; totalFeltIt: number; activeEarthquakes: number; last24hComments: number }> {
  const oneDayAgo = Date.now() - 86_400_000;
  const [totals, felt, active, recent] = await Promise.all([
    db.prepare('SELECT COUNT(*) as cnt FROM comments').first<{ cnt: number }>(),
    db.prepare('SELECT COUNT(*) as cnt FROM comments WHERE felt_it = 1').first<{ cnt: number }>(),
    db.prepare('SELECT COUNT(DISTINCT earthquake_id) as cnt FROM comments').first<{ cnt: number }>(),
    db.prepare('SELECT COUNT(*) as cnt FROM comments WHERE created_at >= ?').bind(oneDayAgo).first<{ cnt: number }>(),
  ]);
  return {
    totalComments: totals?.cnt ?? 0,
    totalFeltIt: felt?.cnt ?? 0,
    activeEarthquakes: active?.cnt ?? 0,
    last24hComments: recent?.cnt ?? 0,
  };
}

// ── Forum Threads ─────────────────────────────────────────────────────────────

export async function getForumThreads(db: D1Database, options: {
  category?: ForumCategory;
  earthquakeId?: string;
  limit?: number;
  skip?: number;
  sortBy?: 'latest' | 'popular' | 'active';
}): Promise<{ threads: ForumThread[]; total: number }> {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (options.category) { conditions.push('category = ?'); params.push(options.category); }
  if (options.earthquakeId) { conditions.push('earthquake_id = ?'); params.push(options.earthquakeId); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderBy = options.sortBy === 'popular'
    ? 'ORDER BY is_pinned DESC, view_count DESC, post_count DESC'
    : options.sortBy === 'active'
    ? 'ORDER BY is_pinned DESC, post_count DESC, last_post_at DESC'
    : 'ORDER BY is_pinned DESC, last_post_at DESC';

  const limit  = options.limit ?? 20;
  const offset = options.skip ?? 0;

  const [{ results }, countRow] = await Promise.all([
    db.prepare(`SELECT * FROM forum_threads ${where} ${orderBy} LIMIT ? OFFSET ?`).bind(...params, limit, offset).all(),
    db.prepare(`SELECT COUNT(*) as cnt FROM forum_threads ${where}`).bind(...params).first<{ cnt: number }>(),
  ]);

  return { threads: results.map(rowToThread), total: countRow?.cnt ?? 0 };
}

export async function getForumThread(db: D1Database, identifier: string, incrementView = false): Promise<ForumThread | null> {
  let row = await db.prepare('SELECT * FROM forum_threads WHERE slug = ?').bind(identifier).first();
  if (!row) row = await db.prepare('SELECT * FROM forum_threads WHERE id = ?').bind(identifier).first();
  if (!row) return null;

  if (incrementView) {
    await db.prepare('UPDATE forum_threads SET view_count = view_count + 1 WHERE id = ?').bind((row as { id: string }).id).run();
    (row as { view_count: number }).view_count += 1;
  }
  return rowToThread(row);
}

export async function getOrCreateEarthquakeThread(db: D1Database, quake: { id: string; magnitude: number; place: string; time: string; depth?: number }): Promise<ForumThread> {
  const existing = await db.prepare('SELECT * FROM forum_threads WHERE earthquake_id = ?').bind(quake.id).first();
  if (existing) return rowToThread(existing);

  return createForumThread(db, {
    title: `M${quake.magnitude.toFixed(1)} ${quake.place}`,
    category: 'earthquake',
    author: 'System',
    content: `Discussion thread for the M${quake.magnitude.toFixed(1)} earthquake near ${quake.place}.\n\nShare your experience, ask questions, or discuss this event with the community.`,
    earthquakeId: quake.id,
    earthquakeData: { magnitude: quake.magnitude, place: quake.place, time: quake.time, depth: quake.depth },
  });
}

export async function createForumThread(db: D1Database, data: {
  title: string;
  category: ForumCategory;
  author: string;
  authorLocation?: string;
  content: string;
  earthquakeId?: string;
  earthquakeData?: { magnitude: number; place: string; time: string; depth?: number };
  tags?: string[];
}): Promise<ForumThread> {
  const id   = uuid();
  const now  = Date.now();
  const slug = slugify(data.title);

  await db.prepare(
    `INSERT INTO forum_threads (id, title, slug, category, author, author_location, content, earthquake_id, earthquake_data, is_pinned, is_locked, view_count, post_count, last_post_at, last_post_author, created_at, updated_at, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 1, ?, ?, ?, ?, ?)`
  ).bind(
    id, data.title, slug, data.category, data.author,
    data.authorLocation ?? null, data.content,
    data.earthquakeId ?? null,
    data.earthquakeData ? JSON.stringify(data.earthquakeData) : null,
    now, data.author, now, now,
    data.tags ? JSON.stringify(data.tags) : null,
  ).run();

  const postId = uuid();
  await db.prepare(
    `INSERT INTO forum_posts (id, thread_id, author, author_location, content, likes, created_at, is_original_post)
     VALUES (?, ?, ?, ?, ?, 0, ?, 1)`
  ).bind(postId, id, data.author, data.authorLocation ?? null, data.content, now).run();

  return { id, title: data.title, slug, category: data.category, author: data.author, authorLocation: data.authorLocation ?? null, content: data.content, earthquakeId: data.earthquakeId ?? null, earthquakeData: data.earthquakeData ?? null, isPinned: false, isLocked: false, viewCount: 0, postCount: 1, lastPostAt: now, lastPostAuthor: data.author, createdAt: now, updatedAt: now, tags: data.tags ?? [] };
}

export async function getForumPosts(db: D1Database, threadId: string, options?: { limit?: number; skip?: number }): Promise<{ posts: ForumPost[]; total: number }> {
  const limit  = options?.limit ?? 50;
  const offset = options?.skip ?? 0;

  const [{ results }, countRow] = await Promise.all([
    db.prepare('SELECT * FROM forum_posts WHERE thread_id = ? ORDER BY created_at ASC LIMIT ? OFFSET ?').bind(threadId, limit, offset).all(),
    db.prepare('SELECT COUNT(*) as cnt FROM forum_posts WHERE thread_id = ?').bind(threadId).first<{ cnt: number }>(),
  ]);

  return { posts: results.map(rowToPost), total: countRow?.cnt ?? 0 };
}

export async function createForumPost(db: D1Database, data: {
  threadId: string;
  parentPostId?: string;
  author: string;
  authorLocation?: string;
  content: string;
  feltIt?: boolean;
  intensity?: number;
}): Promise<ForumPost> {
  const id  = uuid();
  const now = Date.now();

  await db.prepare(
    `INSERT INTO forum_posts (id, thread_id, parent_post_id, author, author_location, content, felt_it, intensity, likes, created_at, is_original_post)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 0)`
  ).bind(
    id, data.threadId, data.parentPostId ?? null,
    data.author, data.authorLocation ?? null, data.content,
    data.feltIt !== undefined ? (data.feltIt ? 1 : 0) : null,
    data.intensity ?? null, now,
  ).run();

  await db.prepare(
    'UPDATE forum_threads SET post_count = post_count + 1, last_post_at = ?, last_post_author = ?, updated_at = ? WHERE id = ?'
  ).bind(now, data.author, now, data.threadId).run();

  return { id, threadId: data.threadId, parentPostId: data.parentPostId ?? null, author: data.author, authorLocation: data.authorLocation ?? null, content: data.content, feltIt: data.feltIt ?? null, intensity: data.intensity ?? null, likes: 0, createdAt: now, updatedAt: null, isOriginalPost: false };
}

export async function likeForumPost(db: D1Database, postId: string): Promise<void> {
  await db.prepare('UPDATE forum_posts SET likes = likes + 1 WHERE id = ?').bind(postId).run();
}

export async function getForumStats(db: D1Database): Promise<{ totalThreads: number; totalPosts: number; earthquakeThreads: number; activeToday: number }> {
  const oneDayAgo = Date.now() - 86_400_000;
  const [threads, posts, eqThreads, active] = await Promise.all([
    db.prepare('SELECT COUNT(*) as cnt FROM forum_threads').first<{ cnt: number }>(),
    db.prepare('SELECT COUNT(*) as cnt FROM forum_posts').first<{ cnt: number }>(),
    db.prepare("SELECT COUNT(*) as cnt FROM forum_threads WHERE category = 'earthquake'").first<{ cnt: number }>(),
    db.prepare('SELECT COUNT(*) as cnt FROM forum_threads WHERE last_post_at >= ?').bind(oneDayAgo).first<{ cnt: number }>(),
  ]);
  return { totalThreads: threads?.cnt ?? 0, totalPosts: posts?.cnt ?? 0, earthquakeThreads: eqThreads?.cnt ?? 0, activeToday: active?.cnt ?? 0 };
}

export async function getTrendingThreads(db: D1Database, limit = 10): Promise<ForumThread[]> {
  const oneDayAgo = Date.now() - 86_400_000;
  const { results } = await db
    .prepare('SELECT * FROM forum_threads WHERE last_post_at >= ? ORDER BY post_count DESC, last_post_at DESC LIMIT ?')
    .bind(oneDayAgo, limit)
    .all();
  return results.map(rowToThread);
}

export async function searchForumThreads(db: D1Database, query: string, options?: { category?: ForumCategory; limit?: number }): Promise<ForumThread[]> {
  const like  = `%${query}%`;
  const limit = options?.limit ?? 20;
  const { results } = options?.category
    ? await db.prepare("SELECT * FROM forum_threads WHERE category = ? AND (title LIKE ? OR content LIKE ?) ORDER BY last_post_at DESC LIMIT ?").bind(options.category, like, like, limit).all()
    : await db.prepare("SELECT * FROM forum_threads WHERE title LIKE ? OR content LIKE ? ORDER BY last_post_at DESC LIMIT ?").bind(like, like, limit).all();
  return results.map(rowToThread);
}

// ── Devices ───────────────────────────────────────────────────────────────────

export async function registerDevice(db: D1Database, data: {
  token: string;
  city?: string;
  minMagnitude?: number;
  lat?: number;
  lon?: number;
  radiusMiles?: number;
}): Promise<void> {
  await db.prepare(
    `INSERT INTO devices (token, city, min_magnitude, lat, lon, radius_miles, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(token) DO UPDATE SET
       city = excluded.city,
       min_magnitude = excluded.min_magnitude,
       lat = excluded.lat,
       lon = excluded.lon,
       radius_miles = excluded.radius_miles`
  ).bind(
    data.token, data.city ?? null, data.minMagnitude ?? 2.5,
    data.lat ?? null, data.lon ?? null,
    data.radiusMiles ?? 25, Date.now(),
  ).run();
}

export async function unregisterDevice(db: D1Database, token: string): Promise<void> {
  await db.prepare('DELETE FROM devices WHERE token = ?').bind(token).run();
}

export async function getDevicesForNotification(db: D1Database, magnitude: number): Promise<Device[]> {
  const { results } = await db
    .prepare('SELECT * FROM devices WHERE min_magnitude <= ?')
    .bind(magnitude)
    .all();
  return results.map((r: unknown) => {
    const row = r as { token: string; city: string | null; min_magnitude: number; lat: number | null; lon: number | null; radius_miles: number; created_at: number };
    return {
      token: row.token,
      city: row.city,
      minMagnitude: row.min_magnitude,
      lat: row.lat,
      lon: row.lon,
      radiusMiles: row.radius_miles,
      createdAt: row.created_at,
    };
  });
}

// ── iOS Waitlist ──────────────────────────────────────────────────────────────

export async function addToWaitlist(db: D1Database, data: {
  email: string;
  source?: string;
  referralCode?: string;
  userAgent?: string;
  ipHash?: string;
}): Promise<{ isNew: boolean }> {
  const existing = await db
    .prepare('SELECT email FROM ios_waitlist WHERE email = ?')
    .bind(data.email.toLowerCase())
    .first();

  if (existing) return { isNew: false };

  await db.prepare(
    `INSERT INTO ios_waitlist (email, source, referral_code, created_at, user_agent, ip_hash, notified, unsubscribed)
     VALUES (?, ?, ?, ?, ?, ?, 0, 0)`
  ).bind(
    data.email.toLowerCase(),
    data.source ?? 'website',
    data.referralCode ?? null,
    Date.now(),
    data.userAgent ?? null,
    data.ipHash ?? null,
  ).run();

  return { isNew: true };
}

// ── User Addresses ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToUserAddress(r: any): UserAddress {
  return {
    id: r.id,
    visitorId: r.visitor_id,
    address: r.address,
    lat: r.lat,
    lon: r.lon,
    city: r.city ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    searchCount: r.search_count,
    lastSearchAt: r.last_search_at,
  };
}

export async function saveUserAddress(db: D1Database, data: {
  visitorId: string;
  address: string;
  lat: number;
  lon: number;
  city?: string;
  userAgent?: string;
  ipHash?: string;
}): Promise<UserAddress> {
  const now = Date.now();

  // Upsert by (visitor_id, address): increment search_count if exists.
  const existing = await db
    .prepare('SELECT * FROM user_addresses WHERE visitor_id = ? AND address = ?')
    .bind(data.visitorId, data.address)
    .first();

  if (existing) {
    await db.prepare(
      `UPDATE user_addresses
         SET lat = ?, lon = ?, city = ?, updated_at = ?, last_search_at = ?, search_count = search_count + 1
       WHERE id = ?`
    ).bind(data.lat, data.lon, data.city ?? null, now, now, (existing as { id: string }).id).run();

    const row = await db
      .prepare('SELECT * FROM user_addresses WHERE id = ?')
      .bind((existing as { id: string }).id)
      .first();
    return rowToUserAddress(row);
  }

  const id = uuid();
  await db.prepare(
    `INSERT INTO user_addresses
       (id, visitor_id, address, lat, lon, city, created_at, updated_at, search_count, last_search_at, user_agent, ip_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`
  ).bind(
    id,
    data.visitorId,
    data.address,
    data.lat,
    data.lon,
    data.city ?? null,
    now,
    now,
    now,
    data.userAgent ?? null,
    data.ipHash ?? null,
  ).run();

  return {
    id,
    visitorId: data.visitorId,
    address: data.address,
    lat: data.lat,
    lon: data.lon,
    city: data.city ?? null,
    createdAt: now,
    updatedAt: now,
    searchCount: 1,
    lastSearchAt: now,
  };
}

export async function getAddressesByVisitor(db: D1Database, visitorId: string, limit = 10): Promise<UserAddress[]> {
  const { results } = await db
    .prepare('SELECT * FROM user_addresses WHERE visitor_id = ? ORDER BY last_search_at DESC LIMIT ?')
    .bind(visitorId, limit)
    .all();
  return results.map(rowToUserAddress);
}

// ── Feedback ──────────────────────────────────────────────────────────────────

export async function saveFeedback(db: D1Database, data: {
  type: FeedbackType;
  name: string;
  email: string;
  message: string;
  page: string;
  userAgent?: string;
  ipHash?: string;
}): Promise<Feedback> {
  const id  = uuid();
  const now = Date.now();

  await db.prepare(
    `INSERT INTO feedback (id, type, name, email, message, page, created_at, user_agent, ip_hash, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')`
  ).bind(id, data.type, data.name, data.email, data.message, data.page, now, data.userAgent ?? null, data.ipHash ?? null).run();

  return { id, type: data.type, name: data.name, email: data.email, message: data.message, page: data.page, createdAt: now, userAgent: data.userAgent ?? null, ipHash: data.ipHash ?? null, status: 'new', notes: null };
}

export async function getAllFeedback(db: D1Database, options?: { limit?: number; skip?: number; status?: FeedbackStatus; type?: FeedbackType }): Promise<{ feedback: Feedback[]; total: number }> {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (options?.status) { conditions.push('status = ?'); params.push(options.status); }
  if (options?.type)   { conditions.push('type = ?');   params.push(options.type); }

  const where  = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit  = options?.limit ?? 50;
  const offset = options?.skip ?? 0;

  const [{ results }, countRow] = await Promise.all([
    db.prepare(`SELECT * FROM feedback ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(...params, limit, offset).all(),
    db.prepare(`SELECT COUNT(*) as cnt FROM feedback ${where}`).bind(...params).first<{ cnt: number }>(),
  ]);

  return { feedback: results.map(rowToFeedback), total: countRow?.cnt ?? 0 };
}
