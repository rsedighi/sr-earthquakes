# Baytremor AI Intelligence — Plan & Roadmap

Concrete, file-level roadmap for three AI workstreams, built on the existing
Astro-on-Cloudflare-Workers stack. Sequenced so each phase ships independently
and de-risks the next.

- **Workstream 1 — AI Gateway & Workers AI** (foundation / model control plane)
- **Workstream 2 — AI Search** (sitewide grounded search over historical quakes + content)
- **Workstream 3 — Conversational Ask Box** (natural-language Q&A UI)

## Current state (what we're building on)

| Piece | Status | Location |
| --- | --- | --- |
| LLM summaries | Live, external OpenAI `gpt-4o-mini` | `src/lib/openai.ts` |
| Summary API | Live, KV cache + per-IP throttle + Analytics | `src/pages/api/ai-summary/index.ts` |
| Historical corpus | 15yr USGS GeoJSON in R2 | `HISTORICAL_R2`, `src/lib/historical.ts` |
| Recent quakes | D1 `earthquakes` table (post 2025-12-08) | `src/lib/earthquakes-db.ts` |
| Worker entrypoint | Custom `createExports` wrapper | `src/worker.ts` |
| Bindings | D1, KV×2, DO×2, R2×2, Queue, Analytics | `wrangler.toml` |

**Gaps to close:** no `AI` binding (Workers AI), no AI Gateway, no AI Search
instance, no conversational UI. All three workstreams add these.

---

## Workstream 1 — AI Gateway & Workers AI

**Goal:** centralize every model call behind AI Gateway (caching, rate limiting,
logging, provider fallback) and add Workers AI as an on-platform model option.

### Phase 1.1 — Route existing OpenAI through AI Gateway (fastest win)

No new models — just proxy the current `gpt-4o-mini` calls through the gateway
so we get logging, caching, and cost analytics for free.

- **Dashboard:** create an *authenticated* AI Gateway named `baytremor`.
- **`.env` / secrets:** add `CF_ACCOUNT_ID`, `CF_GATEWAY_ID`, `CF_AIG_TOKEN`.
  Add the same keys (optional) to `.env.example`.
- **`src/lib/openai.ts`:** point the client `baseURL` at the gateway compat endpoint
  and pass `cf-aig-authorization`:
  ```ts
  new OpenAI({
    apiKey: key,
    baseURL: `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/compat`,
    defaultHeaders: { 'cf-aig-authorization': `Bearer ${aigToken}` },
  });
  ```
  Model string becomes `openai/gpt-4o-mini` (provider-prefixed for the unified API).
- **`src/env.d.ts`:** add `CF_ACCOUNT_ID?`, `CF_GATEWAY_ID?`, `CF_AIG_TOKEN?` to `Env`.
- **Cache/throttle:** keep the existing KV cache + per-IP guard in
  `ai-summary/index.ts` initially; once gateway caching is validated we can
  optionally lean on `cf-aig-cache-ttl` instead.

**Exit criteria:** every summary shows up in the AI Gateway log with token/cost
metrics; no behavior change for users.

### Phase 1.2 — Add Workers AI binding

- **`wrangler.toml`:** add
  ```toml
  [ai]
  binding = "AI"
  ```
- **`src/env.d.ts`:** add `AI?: Ai` to `Env`. (Type already in `worker-configuration.d.ts` after `npm run types`.)
- **New `src/lib/workers-ai.ts`:** thin wrapper over `env.AI.run(...)` that always
  passes `{ gateway: { id: 'baytremor', metadata: {...} } }` so Workers AI calls
  are logged in the *same* gateway as OpenAI.
- **Dev note:** Workers AI requires `wrangler dev --remote` (no local models).

### Phase 1.3 — Provider abstraction + fallback

- **New `src/lib/ai/provider.ts`:** single `generate({ task, prompt })` entry point.
  Chooses model per task and routes through the gateway. Enables A/B and fallback
  (e.g. Workers AI `@cf/meta/llama-3.1-8b-instruct` primary → OpenAI `gpt-4o-mini` fallback).
- **Refactor** `generateActivitySummary` / `generateEarthquakeExplanation` to call
  the abstraction instead of instantiating OpenAI directly.
- **Model choices:**
  - Summaries / explanations: `@cf/meta/llama-3.1-8b-instruct` (cheap) with OpenAI fallback.
  - Embeddings (for Workstream 3 RAG, if not using AI Search): `@cf/baai/bge-base-en-v1.5`.

**Deliverables:** one governed model layer; demoable gateway dashboard showing
caching, retries, per-task metadata, and provider switching.

---

## Workstream 2 — AI Search (sitewide historical earthquake search)

**Goal:** grounded "ask anything about Bay Area quakes + preparedness" search over
a managed RAG pipeline. AI Search auto-indexes an R2 bucket every 6h — a good fit
for **stable, document-shaped content**, not the live minute-by-minute feed.

### What we index (two content types)

1. **Historical event briefs** — one Markdown doc per notable quake / swarm,
   generated from `HISTORICAL_R2` + D1. Rich, searchable, human-readable.
2. **Static knowledge** — preparedness guidance, FAQ, learn pages, fault pages,
   region descriptions (already in `src/pages/**` and `src/lib/regions.ts`).

> AI Search max file size 4 MB, max 100k files/instance, 6h refresh. Per-quake or
> per-swarm briefs keep files small and let filters work well.

### Phase 2.1 — Content-generation pipeline (populate a search bucket)

- **New R2 bucket:** `earthquake-search-content` → bind as `SEARCH_R2` in `wrangler.toml`.
- **New `src/lib/search-content.ts`:** render Markdown docs:
  - `events/{id}.md` — one per significant quake (M≥ threshold) with place, magnitude,
    depth, region, fault, felt reports, and a plain-English blurb.
  - `swarms/{id}.md` — one per detected swarm episode (reuse `detectSwarms` from `src/lib/analysis.ts`).
  - `regions/{regionId}.md`, `faults/*.md`, `preparedness.md`, `faq.md` — static knowledge.
- **New `src/pages/api/admin/rebuild-search-content.ts`:** admin-token-guarded route
  (mirror `admin/backfill-earthquakes.ts`) that regenerates + writes all docs to `SEARCH_R2`.
- **Incremental updates:** extend the cron in `src/lib/cron.ts` so newly ingested
  significant quakes also write their brief to `SEARCH_R2` (keeps the index fresh
  within the 6h cycle).

### Phase 2.2 — Create + wire the AI Search instance

- **Dashboard:** AI Search → Create → data source = R2 bucket `earthquake-search-content`.
  Name it `baytremor-search`. Point its generation model through the `baytremor` gateway.
- **Binding:** uses the same `[ai]` binding from Workstream 1 (`env.AI.autorag(...)`).
- **New `src/pages/api/search/index.ts`:**
  ```ts
  // GET /api/search?q=...&mode=results|answer
  const ai = env.AI.autorag('baytremor-search');
  const out = mode === 'answer'
    ? await ai.aiSearch({ query, model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast' })
    : await ai.search({ query });
  ```
  - `search()` → raw chunks for a results list UI.
  - `aiSearch()` → generated answer + citations (feeds Workstream 3).
- **Metadata filters:** attach `region`, `magnitude`, `year` metadata to docs so
  the API can filter (e.g. "M2.5+ near Palo Alto this month").

### Phase 2.3 — Sitewide search UI

- **New `src/components/site-search.tsx`:** command-palette style search (⌘K),
  debounced calls to `/api/search`, result cards linking to
  `earthquake/[id]` / `history/[event]` / learn pages.
- **Mount** in `src/layouts/*` header so it's available site-wide.
- **Caching:** KV-cache popular queries (reuse `src/lib/kv.ts` patterns) + rely on
  gateway cache for the generation step.

**Deliverables:** a ⌘K search that answers "what happened near San Ramon in 2019?"
with grounded citations, plus a raw results mode.

---

## Workstream 3 — Conversational Ask Box

**Goal:** a chat experience that answers plain-English questions, grounded in
Baytremor data. Builds directly on Workstreams 1 & 2.

### Architecture decision

- **Retrieval:** reuse **AI Search `aiSearch()`** (from W2) for document-grounded
  answers — no separate Vectorize needed initially.
- **Live/structured questions** ("quakes over M2.5 near Palo Alto this month"):
  add **function calling** (Workers AI tool support) so the model can call a
  structured query tool backed by D1 (`getEarthquakesSince`) instead of RAG.
- **Generation + governance:** all model calls go through the `baytremor` gateway (W1).

### Phase 3.1 — Streaming chat endpoint

- **New `src/pages/api/ask/index.ts`:** POST `{ messages }` → streamed response.
  1. Classify intent: knowledge/historical → AI Search `aiSearch()`; structured/live → tool call.
  2. Structured path: define a `queryEarthquakes(region?, minMag?, sinceDays?)` tool,
     execute against D1, feed results back to the model for a natural-language answer.
  3. Stream tokens back (`env.AI.run(..., { stream: true })`).
- **Guardrails:** system prompt scoped to Bay Area seismic topics; reuse the
  per-IP throttle pattern from `ai-summary/index.ts`; enable AI Gateway rate limiting.

### Phase 3.2 — Ask Box UI

- **New `src/components/ask-box.tsx`:** chat panel (React 19 + lucide icons +
  existing Tailwind design system). Streams tokens, renders citations/links,
  shows suggested prompts ("What changed in the last 24h?", "Summarize notable activity").
- **Entry points:** floating button in `src/layouts/*` + a dedicated `src/pages/ask/index.astro`.
- **Session state (optional, Phase 3.3):** for multi-turn memory + rate-limited
  fanout, add an `AskSession` Durable Object (mirrors `EarthquakeRoom`/`CommentRoom`
  in `src/durable-objects/`). Not required for v1 (stateless per request works).

### Phase 3.3 — Grounding polish

- Add "sources" chips from AI Search citations.
- Cache canned questions (daily "what happened in the last 24h" brief) via cron →
  KV so the common ask is instant and cheap.

**Deliverables:** a working ask box answering both historical ("has San Ramon
swarmed before?") and live/structured ("M2.5+ near Palo Alto this month") questions.

---

## Config & schema changes summary

| Change | File | Workstream |
| --- | --- | --- |
| AI Gateway env vars | `.env`, `.env.example`, `src/env.d.ts` | 1.1 |
| `baseURL` → gateway | `src/lib/openai.ts` | 1.1 |
| `[ai]` binding | `wrangler.toml`, `src/env.d.ts` | 1.2 |
| Workers AI wrapper | `src/lib/workers-ai.ts` (new) | 1.2 |
| Provider abstraction | `src/lib/ai/provider.ts` (new) | 1.3 |
| `SEARCH_R2` bucket + binding | `wrangler.toml`, `src/env.d.ts` | 2.1 |
| Content generator | `src/lib/search-content.ts` (new) | 2.1 |
| Rebuild admin route | `src/pages/api/admin/rebuild-search-content.ts` (new) | 2.1 |
| Cron writes briefs | `src/lib/cron.ts` | 2.1 |
| Search API | `src/pages/api/search/index.ts` (new) | 2.2 |
| Search UI | `src/components/site-search.tsx` (new) | 2.3 |
| Ask API (stream + tools) | `src/pages/api/ask/index.ts` (new) | 3.1 |
| Ask Box UI | `src/components/ask-box.tsx`, `src/pages/ask/index.astro` (new) | 3.2 |
| Ask session DO (optional) | `src/durable-objects/AskSession.ts` (new) | 3.3 |

## Sequencing & dependencies

```
W1.1 (gateway proxy) ─┬─▶ W1.2 (Workers AI) ─▶ W1.3 (provider/fallback)
                      │
                      └─▶ W2.1 (content) ─▶ W2.2 (AI Search API) ─▶ W2.3 (search UI)
                                                     │
                                                     └─▶ W3.1 (ask API) ─▶ W3.2 (ask UI) ─▶ W3.3 (polish)
```

**Recommended order:** W1.1 → W1.2 → W2.1 → W2.2 → W2.3 → W3.1 → W3.2, with W1.3
and W3.3 as polish passes. W1.1 is the fastest standalone win and unlocks
governance for everything after it.

## Cost & guardrail notes

- Keep the existing KV cache + per-IP throttle; layer AI Gateway caching/rate
  limiting on top for defense-in-depth.
- Prefer Workers AI (`@cf/*`) for high-volume/cheap tasks (summaries, embeddings);
  reserve OpenAI as a quality fallback via gateway dynamic routing.
- AI Search bills embedding + generation — cache popular queries and gate the
  generated-answer mode behind the throttle.
- Workers AI free tier is 10k neurons/day; validate volume before relying on it in prod.
