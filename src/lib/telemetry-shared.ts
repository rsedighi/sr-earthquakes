// Shared between the browser telemetry client and the /api/events endpoint.

export const PRODUCT_EVENTS = [
  'landing_viewed',
  'city_selector_opened',
  'city_selected',
  'address_search_started',
  'address_selected',
  'alert_offer_viewed',
  'alert_preferences_saved',
  'alert_permission_requested',
  'alert_permission_result',
  'area_activated',
  'alert_disabled',
  'earthquake_opened',
  'felt_report_started',
  'felt_report_submitted',
  'risk_report_started',
  'risk_report_viewed',
  'report_downloaded',
  'lead_cta_clicked',
  'lead_submitted',
  'waitlist_started',
  'waitlist_submitted',
  'waitlist_failed',
  'affiliate_link_clicked',
  'share_started',
  'share_completed',
  'welcome_dismissed',
] as const;

export const OPERATIONAL_EVENTS = [
  'client_page_view',
  'web_vital',
  'js_error',
  'asset_load_failed',
  'asset_reload_attempted',
  'dashboard_ready',
  'feed_ready',
  'feed_failed',
  'map_ready',
  'map_failed',
  'error_boundary_rendered',
  'feature_flag_evaluated',
  'history_archive_loaded',
  'history_archive_failed',
  'alert_subscribe_failed',
] as const;

export type ProductEvent = (typeof PRODUCT_EVENTS)[number];
export type OperationalEvent = (typeof OPERATIONAL_EVENTS)[number];
export type TelemetryEvent = ProductEvent | OperationalEvent;

const KNOWN_EVENTS = new Set<string>([...PRODUCT_EVENTS, ...OPERATIONAL_EVENTS]);

export function isKnownEvent(name: unknown): name is TelemetryEvent {
  return typeof name === 'string' && KNOWN_EVENTS.has(name);
}

// Keys that could carry PII or precise location. Dropped on both client and server.
const FORBIDDEN_PROP_KEY = /(e-?mail|address|street|phone|^lat$|^lon$|^lng$|latitude|longitude|query|^q$|name$|token|password)/i;

export type TelemetryProps = Record<string, string | number | boolean | null>;

export function sanitizeProps(props: unknown): TelemetryProps {
  const out: TelemetryProps = {};
  if (!props || typeof props !== 'object') return out;
  let count = 0;
  for (const [key, value] of Object.entries(props as Record<string, unknown>)) {
    if (count >= 12 || FORBIDDEN_PROP_KEY.test(key)) continue;
    if (typeof value === 'string') out[key] = value.slice(0, 160);
    else if (typeof value === 'number' && Number.isFinite(value)) out[key] = value;
    else if (typeof value === 'boolean' || value === null) out[key] = value;
    else continue;
    count++;
  }
  return out;
}

const ROUTE_FAMILIES: Array<[RegExp, string]> = [
  [/^\/$/, '/'],
  [/^\/earthquake\/[^/]+$/, '/earthquake/:id'],
  [/^\/[^/]+-earthquake-today$/, '/:city-earthquake-today'],
  [/^\/[^/]+-earthquakes-\d{4}$/, '/:city-earthquakes-:year'],
  [/^\/city\/[^/]+$/, '/city/:city'],
  [/^\/risk\/[^/]+$/, '/risk/:city'],
  [/^\/region\/[^/]+$/, '/region/:id'],
  [/^\/history$/, '/history'],
  [/^\/history\/[^/]+$/, '/history/:event'],
  [/^\/community(\/.*)?$/, '/community'],
  [/^\/learn(\/.*)?$/, '/learn'],
  [/^\/[a-z-]+-fault$/, '/:fault'],
  [/^\/api(\/.*)?$/, '/api'],
];

export function routeFamily(pathname: string): string {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  for (const [pattern, family] of ROUTE_FAMILIES) {
    if (pattern.test(path)) return family;
  }
  // Single-segment static pages (/today, /my-area, /ios, ...) are already low-cardinality.
  return /^\/[a-z0-9-]{1,40}$/.test(path) ? path : '/other';
}

export type TrafficClass = 'human' | 'bot' | 'automation' | 'internal';

const CRAWLER_UA = /bot\b|bot\/|crawl|spider|slurp|mediapartners|bingpreview|facebookexternalhit|embedly|preview|feedfetcher|validator|archiver/i;
const AUTOMATION_UA = /headless|phantomjs|puppeteer|playwright|selenium|lighthouse|chrome-lighthouse|pagespeed|gtmetrix|pingdom|uptime|datadog|synthetics|python-requests|python-urllib|curl\/|wget\/|go-http-client|node-fetch|axios|okhttp|java\/|^node$|undici|baytremor-smoke/i;

export function classifyTraffic(input: {
  userAgent: string | null;
  verifiedBotCategory?: string | null;
  webdriver?: boolean;
  internal?: boolean;
}): TrafficClass {
  if (input.internal) return 'internal';
  const ua = input.userAgent ?? '';
  if (!ua || input.verifiedBotCategory || CRAWLER_UA.test(ua)) return 'bot';
  if (input.webdriver || AUTOMATION_UA.test(ua)) return 'automation';
  return 'human';
}

export function deviceClass(userAgent: string | null): 'mobile' | 'tablet' | 'desktop' {
  const ua = userAgent ?? '';
  if (/iPad|Tablet|Nexus (7|9|10)|SM-T/i.test(ua)) return 'tablet';
  if (/Mobi|iPhone|Android/i.test(ua)) return 'mobile';
  return 'desktop';
}

export function referrerSource(referrer: string | null | undefined): string {
  if (!referrer) return 'direct';
  let host: string;
  try { host = new URL(referrer).hostname.replace(/^www\./, ''); } catch { return 'unknown'; }
  if (host === 'baytremor.com') return 'internal';
  if (/(^|\.)google\./.test(host)) return 'google';
  if (/(^|\.)bing\.com$/.test(host)) return 'bing';
  if (/(^|\.)duckduckgo\.com$/.test(host)) return 'duckduckgo';
  if (/(^|\.)yahoo\.com$/.test(host)) return 'yahoo';
  return host.slice(0, 64);
}
