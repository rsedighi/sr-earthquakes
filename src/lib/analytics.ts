/**
 * Typed wrapper around Cloudflare Analytics Engine.
 *
 * Cloudflare data point shape:
 *   - `blobs`: up to 20 strings (high-cardinality dimensions, ~5KB total)
 *   - `doubles`: up to 20 numeric measurements
 *   - `indexes`: single string used as the primary sampling index (≤96 bytes)
 *
 * All writes are best-effort: if the binding is missing (local dev) or the
 * call throws, we swallow the error — analytics must never break a request.
 *
 * Query example (from CF dashboard / GraphQL API):
 *   SELECT index1, blob1, sum(_sample_interval) AS count
 *   FROM earthquake_events
 *   WHERE blob1 = 'page_view'
 *   GROUP BY index1, blob1
 */

type AE = AnalyticsEngineDataset | undefined;

function write(ae: AE, point: { blobs: string[]; doubles: number[]; indexes: string[] }): void {
  if (!ae) return;
  try {
    ae.writeDataPoint(point);
  } catch {
    // never throw out of analytics
  }
}

// ── Event: page view ────────────────────────────────────────────────────────
// index = route, so we can rank routes by traffic
export function trackPageView(
  ae: AE,
  args: { route: string; country?: string; status: number; cacheHit: boolean; durationMs: number },
): void {
  write(ae, {
    indexes: [args.route.slice(0, 96)],
    blobs: ['page_view', args.country ?? 'XX', args.cacheHit ? 'hit' : 'miss'],
    doubles: [args.status, args.durationMs],
  });
}

// ── Event: API error ────────────────────────────────────────────────────────
export function trackApiError(
  ae: AE,
  args: { route: string; status: number; message?: string },
): void {
  write(ae, {
    indexes: [args.route.slice(0, 96)],
    blobs: ['api_error', args.message?.slice(0, 256) ?? ''],
    doubles: [args.status],
  });
}

// ── Event: AI summary call ──────────────────────────────────────────────────
export function trackAiSummary(
  ae: AE,
  args: { regionId: string; cacheHit: boolean; throttled: boolean; ok: boolean },
): void {
  write(ae, {
    indexes: [args.regionId.slice(0, 96)],
    blobs: [
      'ai_summary',
      args.cacheHit ? 'hit' : 'miss',
      args.throttled ? 'throttled' : 'ok',
      args.ok ? 'success' : 'failure',
    ],
    doubles: [args.cacheHit ? 0 : 1], // doubles[0] = openai_calls (cost driver)
  });
}

// ── Event: new earthquake detected by cron ──────────────────────────────────
export function trackNewQuake(
  ae: AE,
  args: { id: string; magnitude: number; latitude: number; longitude: number; place?: string },
): void {
  write(ae, {
    indexes: [args.id.slice(0, 96)],
    blobs: ['new_quake', args.place?.slice(0, 256) ?? ''],
    doubles: [args.magnitude, args.latitude, args.longitude],
  });
}
