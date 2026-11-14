/**
 * Production health checks and weekly scorecard (replaces Datadog monitors).
 *
 * Runs from the per-minute cron, gated in KV to every 15 minutes (checks) and
 * once per week (scorecard). Alerts are emailed via the EMAIL send binding and
 * de-duplicated per check so an ongoing incident sends one email per 3 hours.
 *
 * Analytics Engine checks need CF_ACCOUNT_ID and CF_ANALYTICS_TOKEN
 * (Account Analytics: Read). Without them only the feed-freshness check runs.
 */
import { getLastKnownEarthquakeFeed } from './kv';

type MonitorEnv = Pick<Env, 'EARTHQUAKE_KV' | 'EMAIL'> & {
  CF_ACCOUNT_ID?: string;
  CF_ANALYTICS_TOKEN?: string;
  OPS_ALERT_EMAIL?: string;
};

interface Finding {
  check: string;
  message: string;
}

const CHECK_INTERVAL_MS = 15 * 60 * 1000;
const ALERT_COOLDOWN_SECONDS = 3 * 60 * 60;
const FEED_STALE_MS = 10 * 60 * 1000;
const DATASET = 'earthquake_events';
const ALERT_FROM = { email: 'alerts@baytremor.com', name: 'BayTremor Monitor' };

const KV_KEYS = {
  lastCheck: 'monitor:last-check-window',
  lastReport: 'monitor:last-weekly-report',
  alerted: (check: string) => `monitor:alerted:${check}`,
} as const;

async function queryAnalytics<T>(env: MonitorEnv, sql: string): Promise<T[]> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/analytics_engine/sql`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.CF_ANALYTICS_TOKEN}` },
      body: `${sql} FORMAT JSON`,
    },
  );
  if (!res.ok) throw new Error(`Analytics Engine query failed: ${res.status} ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { data?: T[] };
  return json.data ?? [];
}

const hasAnalytics = (env: MonitorEnv) => Boolean(env.CF_ACCOUNT_ID && env.CF_ANALYTICS_TOKEN);

async function checkFeedFreshness(env: MonitorEnv, now: number): Promise<Finding | null> {
  const feed = await getLastKnownEarthquakeFeed<{ metadata?: { generated?: number } }>(env.EARTHQUAKE_KV, 'all_hour');
  const generated = feed?.metadata?.generated;
  if (typeof generated !== 'number') {
    return { check: 'feed_missing', message: 'No last-known all_hour USGS feed in KV. The ingest cron may be failing.' };
  }
  const ageMs = now - generated;
  if (ageMs <= FEED_STALE_MS) return null;
  return {
    check: 'feed_stale',
    message: `The USGS all_hour feed in KV is ${Math.round(ageMs / 60000)} minutes old (threshold ${FEED_STALE_MS / 60000}). Visitors are seeing delayed data.`,
  };
}

async function checkTelemetry(env: MonitorEnv): Promise<Finding[]> {
  const rows = await queryAnalytics<{ event: string; total: number | string }>(env, `
    SELECT blob1 AS event, SUM(_sample_interval) AS total
    FROM ${DATASET}
    WHERE timestamp > NOW() - INTERVAL '15' MINUTE
      AND blob2 = 'human'
      AND blob1 IN ('asset_load_failed', 'js_error', 'feed_ready', 'feed_failed', 'waitlist_failed', 'map_failed', 'map_ready')
    GROUP BY event`);
  const counts = Object.fromEntries(rows.map((r) => [r.event, Number(r.total)])) as Record<string, number>;
  const count = (name: string) => counts[name] ?? 0;
  const findings: Finding[] = [];

  if (count('asset_load_failed') >= 5) {
    findings.push({ check: 'asset_failures', message: `${count('asset_load_failed')} JavaScript/CSS asset load failures from human visitors in 15 minutes. Check for a stale deploy.` });
  }
  if (count('js_error') >= 25) {
    findings.push({ check: 'js_errors', message: `${count('js_error')} uncaught JavaScript errors from human visitors in 15 minutes.` });
  }
  const feedTotal = count('feed_ready') + count('feed_failed');
  if (feedTotal >= 20 && count('feed_failed') / feedTotal > 0.05) {
    findings.push({ check: 'feed_failures', message: `Feed failure rate is ${Math.round((count('feed_failed') / feedTotal) * 100)}% (${count('feed_failed')}/${feedTotal}) in 15 minutes.` });
  }
  const mapTotal = count('map_ready') + count('map_failed');
  if (mapTotal >= 20 && count('map_failed') / mapTotal > 0.05) {
    findings.push({ check: 'map_failures', message: `Map failure rate is ${Math.round((count('map_failed') / mapTotal) * 100)}% (${count('map_failed')}/${mapTotal}) in 15 minutes.` });
  }
  if (count('waitlist_failed') >= 3) {
    findings.push({ check: 'waitlist_failures', message: `${count('waitlist_failed')} failed iOS waitlist submissions in 15 minutes.` });
  }

  const [pipeline] = await queryAnalytics<{ total: number | string }>(env, `
    SELECT SUM(_sample_interval) AS total
    FROM ${DATASET}
    WHERE timestamp > NOW() - INTERVAL '6' HOUR AND blob1 = 'client_page_view' AND blob2 = 'human'`);
  if (Number(pipeline?.total ?? 0) === 0) {
    findings.push({ check: 'telemetry_silent', message: 'No human client_page_view events in 6 hours. The site or the /api/events pipeline may be down.' });
  }
  return findings;
}

async function sendEmail(env: MonitorEnv, subject: string, text: string): Promise<void> {
  if (!env.OPS_ALERT_EMAIL) {
    console.error(`[monitor] OPS_ALERT_EMAIL not set; would have sent: ${subject}\n${text}`);
    return;
  }
  await env.EMAIL.send({ from: ALERT_FROM, to: env.OPS_ALERT_EMAIL, subject, text });
}

async function alert(env: MonitorEnv, findings: Finding[]): Promise<void> {
  const fresh: Finding[] = [];
  for (const finding of findings) {
    if (await env.EARTHQUAKE_KV.get(KV_KEYS.alerted(finding.check))) continue;
    fresh.push(finding);
  }
  for (const finding of findings) console.error(`[monitor] ${finding.check}: ${finding.message}`);
  if (fresh.length === 0) return;

  await sendEmail(
    env,
    `[BayTremor] ${fresh.length} production alert${fresh.length > 1 ? 's' : ''}: ${fresh.map((f) => f.check).join(', ')}`,
    `${fresh.map((f) => `- ${f.check}: ${f.message}`).join('\n')}\n\nRunbooks: docs/10X-IMPROVEMENT-PLAN.md (Phase 1.5).\nThis alert repeats at most every 3 hours per check.`,
  );
  await Promise.all(fresh.map((f) => env.EARTHQUAKE_KV.put(KV_KEYS.alerted(f.check), '1', { expirationTtl: ALERT_COOLDOWN_SECONDS })));
}

async function sendWeeklyScorecard(env: MonitorEnv): Promise<void> {
  const [traffic, serverTraffic, funnel, vitals, landings] = await Promise.all([
    queryAnalytics<{ traffic: string; views: number | string; sessions: number | string }>(env, `
      SELECT blob2 AS traffic, SUM(_sample_interval) AS views, COUNT(DISTINCT blob9) AS sessions
      FROM ${DATASET}
      WHERE timestamp > NOW() - INTERVAL '7' DAY AND blob1 = 'client_page_view'
      GROUP BY traffic ORDER BY views DESC`),
    queryAnalytics<{ traffic: string; views: number | string }>(env, `
      SELECT blob4 AS traffic, SUM(_sample_interval) AS views
      FROM ${DATASET}
      WHERE timestamp > NOW() - INTERVAL '7' DAY AND blob1 = 'page_view'
      GROUP BY traffic ORDER BY views DESC`),
    queryAnalytics<{ event: string; total: number | string }>(env, `
      SELECT blob1 AS event, SUM(_sample_interval) AS total
      FROM ${DATASET}
      WHERE timestamp > NOW() - INTERVAL '7' DAY AND blob2 = 'human'
        AND blob1 IN ('city_selector_opened', 'city_selected', 'area_activated', 'alert_preferences_saved',
                      'risk_report_viewed', 'lead_submitted', 'waitlist_submitted', 'felt_report_submitted',
                      'asset_load_failed', 'js_error', 'feed_failed')
      GROUP BY event ORDER BY total DESC`),
    queryAnalytics<{ metric: string; device: string; p75: number | string }>(env, `
      SELECT blob12 AS metric, blob5 AS device, quantileExactWeighted(0.75)(double1, _sample_interval) AS p75
      FROM ${DATASET}
      WHERE timestamp > NOW() - INTERVAL '7' DAY AND blob1 = 'web_vital' AND blob2 = 'human'
        AND blob12 IN ('LCP', 'INP', 'CLS')
      GROUP BY metric, device ORDER BY metric, device`),
    queryAnalytics<{ landing: string; sessions: number | string }>(env, `
      SELECT blob4 AS landing, COUNT(DISTINCT blob9) AS sessions
      FROM ${DATASET}
      WHERE timestamp > NOW() - INTERVAL '7' DAY AND blob1 = 'client_page_view' AND blob2 = 'human'
      GROUP BY landing ORDER BY sessions DESC LIMIT 8`),
  ]);

  const fmt = (metric: string, value: number) => (metric === 'CLS' ? value.toFixed(3) : `${Math.round(value)}ms`);
  const text = [
    'BayTremor weekly scorecard (last 7 days)',
    '',
    'Browser page views by traffic class (views / sessions):',
    ...traffic.map((r) => `  ${r.traffic}: ${Number(r.views)} / ${Number(r.sessions)}`),
    '',
    'Worker HTML requests by traffic class (includes crawlers that run no JS):',
    ...serverTraffic.map((r) => `  ${r.traffic || 'unclassified'}: ${Number(r.views)}`),
    '',
    'Top human landing route families (sessions):',
    ...landings.map((r) => `  ${r.landing}: ${Number(r.sessions)}`),
    '',
    'Human funnel and reliability events:',
    ...funnel.map((r) => `  ${r.event}: ${Number(r.total)}`),
    '',
    'Human p75 Core Web Vitals:',
    ...vitals.map((r) => `  ${r.metric} ${r.device}: ${fmt(r.metric, Number(r.p75))}`),
    '',
    'Targets and definitions: docs/10X-IMPROVEMENT-PLAN.md',
  ].join('\n');

  await sendEmail(env, '[BayTremor] Weekly scorecard', text);
}

export async function runMonitors(env: MonitorEnv, now = Date.now()): Promise<void> {
  const checkWindow = Math.floor(now / CHECK_INTERVAL_MS).toString();
  if ((await env.EARTHQUAKE_KV.get(KV_KEYS.lastCheck)) === checkWindow) return;
  await env.EARTHQUAKE_KV.put(KV_KEYS.lastCheck, checkWindow, { expirationTtl: 3600 });

  const findings: Finding[] = [];
  try {
    const feed = await checkFeedFreshness(env, now);
    if (feed) findings.push(feed);
  } catch (err) {
    console.error('[monitor] feed freshness check failed:', err);
  }
  if (hasAnalytics(env)) {
    try {
      findings.push(...(await checkTelemetry(env)));
    } catch (err) {
      console.error('[monitor] telemetry checks failed:', err);
    }
  }
  if (findings.length > 0) await alert(env, findings);

  // Weekly scorecard: Mondays, first check window at or after 16:00 UTC (8-9am Pacific).
  const date = new Date(now);
  const weekKey = Math.floor(now / (7 * 24 * 60 * 60 * 1000)).toString();
  if (hasAnalytics(env) && date.getUTCDay() === 1 && date.getUTCHours() >= 16) {
    if ((await env.EARTHQUAKE_KV.get(KV_KEYS.lastReport)) !== weekKey) {
      await env.EARTHQUAKE_KV.put(KV_KEYS.lastReport, weekKey, { expirationTtl: 8 * 24 * 60 * 60 });
      try {
        await sendWeeklyScorecard(env);
      } catch (err) {
        console.error('[monitor] weekly scorecard failed:', err);
      }
    }
  }
}
