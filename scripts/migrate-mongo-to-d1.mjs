#!/usr/bin/env node
/**
 * MongoDB Atlas -> Cloudflare D1 migration.
 *
 * Reads every relevant collection from both `earthquake-tracker` and
 * `baytremor` databases on Atlas and writes idempotent SQL dump files
 * (one per D1 table) to `migrations/dump/`. Each statement uses
 * INSERT OR REPLACE so re-running is safe.
 *
 * Apply with:
 *   for f in migrations/dump/*.sql; do
 *     npx wrangler d1 execute earthquake-tracker --remote --file="$f"
 *   done
 *
 * Usage:
 *   MONGODB_URI="mongodb+srv://..." node scripts/migrate-mongo-to-d1.mjs
 */

import { MongoClient } from 'mongodb';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '..', 'migrations', 'dump');

const URI = process.env.MONGODB_URI;
if (!URI) {
  console.error('ERROR: MONGODB_URI env var is required.');
  process.exit(1);
}

const BATCH = 250; // rows per INSERT statement

// ── Helpers ──────────────────────────────────────────────────────────────────
const sqlStr = (v) => {
  if (v === null || v === undefined) return 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
};
const sqlInt = (v) => {
  if (v === null || v === undefined || v === '') return 'NULL';
  const n = typeof v === 'boolean' ? (v ? 1 : 0) : Number(v);
  return Number.isFinite(n) ? String(Math.trunc(n)) : 'NULL';
};
const sqlReal = (v) => {
  if (v === null || v === undefined || v === '') return 'NULL';
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : 'NULL';
};
const sqlBool = (v) => (v ? '1' : '0');
const ts = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (v instanceof Date) return String(v.getTime());
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? String(d.getTime()) : 'NULL';
};
const tsRequired = (v, fallback = Date.now()) => {
  const out = ts(v);
  return out === 'NULL' ? String(fallback) : out;
};
const jsonOrNull = (v) => (v === null || v === undefined ? 'NULL' : sqlStr(JSON.stringify(v)));
const idStr = (doc) =>
  typeof doc._id === 'string' ? doc._id : doc._id?.toString?.() ?? null;

// ── Table mappers: Mongo doc -> array of column values in declared order ─────
const TABLES = {
  comments: {
    db: 'earthquake-tracker',
    collection: 'comments',
    columns: [
      'id', 'earthquake_id', 'parent_id', 'author', 'content',
      'created_at', 'updated_at', 'likes', 'location', 'felt_it',
    ],
    map: (d) => [
      sqlStr(idStr(d)),
      sqlStr(d.earthquakeId),
      sqlStr(d.parentId ?? null),
      sqlStr(d.author ?? 'Anonymous'),
      sqlStr(d.content ?? ''),
      tsRequired(d.createdAt),
      ts(d.updatedAt),
      sqlInt(d.likes ?? 0),
      sqlStr(d.location ?? null),
      sqlBool(d.feltIt),
    ],
  },

  forum_threads: {
    db: 'earthquake-tracker',
    collection: 'forum_threads',
    columns: [
      'id', 'title', 'slug', 'category', 'author', 'author_location',
      'content', 'earthquake_id', 'earthquake_data', 'is_pinned',
      'is_locked', 'view_count', 'post_count', 'last_post_at',
      'last_post_author', 'created_at', 'updated_at', 'tags',
    ],
    map: (d) => [
      sqlStr(idStr(d)),
      sqlStr(d.title ?? ''),
      sqlStr(d.slug ?? idStr(d)),
      sqlStr(d.category ?? 'general'),
      sqlStr(d.author ?? 'Anonymous'),
      sqlStr(d.authorLocation ?? null),
      sqlStr(d.content ?? ''),
      sqlStr(d.earthquakeId ?? null),
      jsonOrNull(d.earthquakeData ?? null),
      sqlBool(d.isPinned),
      sqlBool(d.isLocked),
      sqlInt(d.viewCount ?? 0),
      sqlInt(d.postCount ?? 1),
      tsRequired(d.lastPostAt ?? d.createdAt),
      sqlStr(d.lastPostAuthor ?? null),
      tsRequired(d.createdAt),
      tsRequired(d.updatedAt ?? d.createdAt),
      jsonOrNull(d.tags ?? null),
    ],
  },

  forum_posts: {
    db: 'earthquake-tracker',
    collection: 'forum_posts',
    columns: [
      'id', 'thread_id', 'parent_post_id', 'author', 'author_location',
      'content', 'felt_it', 'intensity', 'likes', 'created_at',
      'updated_at', 'is_original_post',
    ],
    map: (d) => [
      sqlStr(idStr(d)),
      sqlStr(d.threadId),
      sqlStr(d.parentPostId ?? null),
      sqlStr(d.author ?? 'Anonymous'),
      sqlStr(d.authorLocation ?? null),
      sqlStr(d.content ?? ''),
      d.feltIt === undefined || d.feltIt === null ? 'NULL' : sqlBool(d.feltIt),
      sqlInt(d.intensity ?? null),
      sqlInt(d.likes ?? 0),
      tsRequired(d.createdAt),
      ts(d.updatedAt),
      sqlBool(d.isOriginalPost),
    ],
  },

  community_reactions: {
    db: 'earthquake-tracker',
    collection: 'community_reactions',
    optional: true,
    columns: ['id', 'earthquake_id', 'author', 'reaction_type', 'created_at'],
    map: (d) => [
      sqlStr(idStr(d)),
      sqlStr(d.earthquakeId),
      sqlStr(d.author ?? 'Anonymous'),
      sqlStr(d.reactionType ?? d.type ?? 'felt'),
      tsRequired(d.createdAt),
    ],
  },

  ios_waitlist: {
    db: 'earthquake-tracker',
    collection: 'ios_waitlist',
    columns: [
      'email', 'source', 'referral_code', 'created_at', 'user_agent',
      'ip_hash', 'notified', 'unsubscribed',
    ],
    map: (d) => [
      sqlStr(String(d.email ?? '').toLowerCase()),
      sqlStr(d.source ?? 'website'),
      sqlStr(d.referralCode ?? null),
      tsRequired(d.createdAt),
      sqlStr(d.userAgent ?? null),
      sqlStr(d.ipHash ?? null),
      sqlBool(d.notified),
      sqlBool(d.unsubscribed),
    ],
  },

  feedback: {
    db: 'earthquake-tracker',
    collection: 'feedback',
    columns: [
      'id', 'type', 'name', 'email', 'message', 'page', 'created_at',
      'user_agent', 'ip_hash', 'status', 'notes',
    ],
    map: (d) => [
      sqlStr(idStr(d)),
      sqlStr(d.type ?? 'feedback'),
      sqlStr(d.name ?? ''),
      sqlStr(d.email ?? ''),
      sqlStr(d.message ?? ''),
      sqlStr(d.page ?? '/'),
      tsRequired(d.createdAt),
      sqlStr(d.userAgent ?? null),
      sqlStr(d.ipHash ?? null),
      sqlStr(d.status ?? 'new'),
      sqlStr(d.notes ?? null),
    ],
  },

  user_addresses: {
    db: 'earthquake-tracker',
    collection: 'user_addresses',
    columns: [
      'id', 'visitor_id', 'address', 'lat', 'lon', 'city',
      'created_at', 'updated_at', 'search_count', 'last_search_at',
      'user_agent', 'ip_hash',
    ],
    map: (d) => [
      sqlStr(idStr(d)),
      sqlStr(d.visitorId),
      sqlStr(d.address ?? ''),
      sqlReal(d.lat),
      sqlReal(d.lon),
      sqlStr(d.city ?? null),
      tsRequired(d.createdAt),
      tsRequired(d.updatedAt ?? d.createdAt),
      sqlInt(d.searchCount ?? 1),
      tsRequired(d.lastSearchAt ?? d.updatedAt ?? d.createdAt),
      sqlStr(d.userAgent ?? null),
      sqlStr(d.ipHash ?? null),
    ],
  },

  devices: {
    db: 'baytremor',
    collection: 'devices',
    columns: [
      'token', 'city', 'min_magnitude', 'lat', 'lon',
      'radius_miles', 'created_at',
    ],
    map: (d) => {
      const prefs = d.preferences ?? {};
      return [
        sqlStr(d.deviceToken ?? d.token ?? idStr(d)),
        sqlStr(prefs.selectedCity ?? d.city ?? null),
        sqlReal(prefs.minimumMagnitude ?? d.minMagnitude ?? 2.5),
        sqlReal(d.lat ?? null),
        sqlReal(d.lon ?? null),
        sqlReal(prefs.alertRadius ?? d.radiusMiles ?? 25),
        tsRequired(d.createdAt),
      ];
    },
  },
};

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const client = new MongoClient(URI);
  await client.connect();
  console.log('Connected to MongoDB Atlas');

  const summary = [];

  for (const [tableName, cfg] of Object.entries(TABLES)) {
    const db = client.db(cfg.db);
    const coll = db.collection(cfg.collection);

    let count;
    try {
      count = await coll.estimatedDocumentCount();
    } catch (err) {
      if (cfg.optional) {
        console.log(`  • ${tableName}: collection missing, skipping (${err.message})`);
        summary.push({ table: tableName, rows: 0, skipped: true });
        continue;
      }
      throw err;
    }

    console.log(`→ ${tableName} (${cfg.db}.${cfg.collection}): ${count} docs`);

    if (count === 0) {
      summary.push({ table: tableName, rows: 0 });
      writeFileSync(
        resolve(OUT_DIR, `${tableName}.sql`),
        `-- ${tableName}: no rows in MongoDB at ${new Date().toISOString()}\n`
      );
      continue;
    }

    const cursor = coll.find({});
    const lines = [
      `-- ${tableName}: ${count} rows from ${cfg.db}.${cfg.collection}`,
      `-- Generated ${new Date().toISOString()}`,
      '',
    ];
    const colList = cfg.columns.join(', ');

    let batch = [];
    let total = 0;
    const flush = () => {
      if (!batch.length) return;
      lines.push(
        `INSERT OR REPLACE INTO ${tableName} (${colList}) VALUES`
      );
      lines.push(batch.map((row) => `  (${row.join(', ')})`).join(',\n') + ';');
      lines.push('');
      total += batch.length;
      batch = [];
    };

    for await (const doc of cursor) {
      try {
        batch.push(cfg.map(doc));
      } catch (err) {
        console.warn(`    ! skipped doc _id=${idStr(doc)}: ${err.message}`);
        continue;
      }
      if (batch.length >= BATCH) flush();
    }
    flush();

    writeFileSync(resolve(OUT_DIR, `${tableName}.sql`), lines.join('\n'));
    summary.push({ table: tableName, rows: total });
    console.log(`  ✓ wrote ${total} rows`);
  }

  await client.close();

  console.log('\n── Summary ──');
  for (const s of summary) {
    console.log(
      `  ${s.table.padEnd(22)} ${String(s.rows).padStart(6)} rows${s.skipped ? ' (skipped)' : ''}`
    );
  }
  console.log(`\nSQL files written to: ${OUT_DIR}`);
  console.log('\nNext step — apply to remote D1:');
  console.log(
    '  for f in migrations/dump/*.sql; do npx wrangler d1 execute earthquake-tracker --remote --file="$f"; done'
  );
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
