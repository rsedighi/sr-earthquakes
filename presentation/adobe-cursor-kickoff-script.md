# Adobe Cursor Kickoff — Full Talk Track (15–20 min)

**Presenter:** You  
**App:** Bay Tremor (`sr-earthquakes`) — Next.js, USGS feeds, structured JSON logs, Datadog RUM  
**Datadog:** US1 (`app.datadoghq.com`), MCP connected in Cursor  
**Assumption:** Demo branch is clean; no secrets on screen; browser zoom comfortable for screen share.

---

## Before you go live (2-minute checklist)

- [ ] `mcp.json` Datadog host is US1 (`mcp.datadoghq.com`) — already done per you  
- [ ] Cursor: sign in, Agent model selected (your usual)  
- [ ] Repo open at project root; sidebar visible  
- [ ] Terminal can run `npm run dev` if you show local UI (optional)  
- [ ] Datadog Logs Explorer open in **browser tab 2** as backup if MCP is slow  
- [ ] Close unrelated tabs; DND on; hide personal bookmarks bar if needed  

---

## Legend (this doc)

- **SAY:** verbatim or near-verbatim narration  
- **CLICK:** UI actions  
- **TYPE:** exact prompt text for Cursor  
- **SNIP:** code to point at (line refs match repo at time of writing)

---

# Segment 0 — Open (0:00–0:45)

**SAY:**

> Thanks for having me. I’m here to kick off Adobe’s Cursor trial the same way I’d kick off a customer: clear mental model first, then a live path through a real app.  
> I’m using a production-style Next.js app I built—Bay Tremor—earthquake awareness for the Bay Area, backed by USGS, with structured logging and Datadog RUM.  
> I’ll anchor on three ideas: **Tab** for inline speed, **Chat** for understanding, and **Agent** for multi-step work across the repo—and I’ll show **Datadog via MCP** so you can see how observability fits in the loop, not as a separate browser chore.

**CLICK:** Nothing yet. Smile, pause.

---

# Segment 1 — Cursor 101 slide or whiteboard (0:45–3:30)

**SAY:**

> **Tab** is the tight loop: you’re typing, the model completes the next tokens—best for boilerplate, tests, small edits. Think “stay in flow in one file.”  
> **Chat** is ask-and-explain: architecture, “why does this behave this way?”—before you change code.  
> **Agent** is where I spent most of my time on this repo—multi-file edits, terminal, search—because it’s the right tool when the task has *shape*: a feature, a refactor, or an incident that touches handlers, logging, and maybe a component.

**Optional honest beat (recommended):**

> Full transparency: the commit history here is basically **Agent-first**—I optimized for throughput. For teams, the winning pattern is usually **Tab plus Agent**: Tab for micro-edits, Agent when the change spans files or needs commands.

**Differentiators (one breath each, no hype):**

> **Deep editor integration** — context is your tree, not a paste buffer.  
> **Agent** can run the same kinds of steps you’d run—read files, apply patches, run commands—under your control.  
> **MCP** — Model Context Protocol — connects Cursor to tools your org already trusts. I’m on **Datadog US1**, MCP already authenticated, so the model can reason over real logs and monitors, not screenshots I pasted in chat.

**CLICK (if using slides):** Advance once after “MCP.”

---

# Segment 2 — App + ops context (3:30–5:30)

**SAY:**

> Let me ground this in the app. Bay Tremor pulls public earthquake feeds from **USGS**, filters to a Bay Area bounding box, and serves JSON to the client. That means **external dependency risk**: USGS can fail, rate-limit, or return odd payloads—classic production problem.

**CLICK:**

1. In Cursor sidebar, expand **`app/api/earthquakes`**  
2. Open **`route.ts`**

**SAY (while file is visible):**

> This `GET` handler fetches a GeoJSON feed, filters features, and returns JSON. On success we log duration and counts; on failure we log an error and return a 500.

**SNIP — point at imports and the happy path (scroll top → middle):**

```1:71:app/api/earthquakes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { logger, logExternalCall } from '@/lib/logger';
// ...
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  // ...
  try {
    const fetchStart = Date.now();
    const response = await fetch(feedUrl, {
      next: { revalidate: 0 },
      cache: 'no-store',
    });
    const fetchDuration = Date.now() - fetchStart;
    // ...
    logExternalCall('usgs', 'fetchFeed', true, fetchDuration, {
      feed,
      totalCount: data.features?.length || 0,
      filteredCount: filteredFeatures.length,
    });

    logger.info('Earthquakes API request completed', {
      path: '/api/earthquakes',
      method: 'GET',
      statusCode: 200,
      duration: totalDuration,
      feed,
      earthquakeCount: filteredFeatures.length,
    });
```

**SAY:**

> Notice **`path: '/api/earthquakes'`** in structured logs—that’s what I’ll query in Datadog. External calls use **`logExternalCall`** so we can tell “our code” from “USGS didn’t cooperate.”

**CLICK:** Open **`lib/logger.ts`** (Cmd-P / Quick Open → type `lib/logger`).

**SNIP — service name + JSON output:**

```63:141:lib/logger.ts
const SERVICE_NAME = 'baytremor';
// ...
function createLog(level: LogLevel, message: string, context?: LogContext): StructuredLog {
  const log: StructuredLog = {
    level,
    message,
    timestamp: new Date().toISOString(),
    service: SERVICE_NAME,
    env: ENV,
    version: VERSION,
  };
  // ...
}

function outputLog(log: StructuredLog): void {
  // Output as JSON for Datadog to parse
  const output = JSON.stringify(log);
  // ...
}
```

**SAY:**

> Logs are **JSON lines** with **`service: baytremor`** by default—Datadog can facet on **`path`**, **`statusCode`**, **`external_service`**, **`duration`**. Netlify log drains pick these up in prod; locally you still see the same shape in the terminal.

**SNIP — external call helper (scroll to ~193):**

```193:211:lib/logger.ts
export function logExternalCall(
  service: LogContext['service'],
  operation: string,
  success: boolean,
  duration: number,
  context?: LogContext
) {
  const level: LogLevel = success ? 'info' : 'error';

  logger[level](`External call: ${service}.${operation}`, {
    service,
    operation,
    success,
    duration,
    external_service: service,
    ...context,
  });
}
```

**SAY:**

> For the demo story, imagine an on-call thread: “Spike in 500s on earthquake load.” I want to **confirm in Datadog US1**, then **land back here**—not lose context in ten browser tabs.

---

# Segment 3 — Wow 1: Datadog MCP in Cursor (5:30–10:00)

**SAY:**

> I’m going to use **Agent** with **Datadog MCP** connected—US1 endpoint is already configured. Watch the *workflow*: natural language → tool-backed queries → back to code.

**CLICK:**

1. Open **Cursor Agent** (Chat panel, Agent mode — not plain Ask if your UI separates them).  
2. Ensure the chat is **scoped to this workspace** (default).

**TYPE (paste as one Agent message):**

```
Using Datadog (US1), search logs from the last 24 hours for our app. 
Query for entries where path contains "/api/earthquakes" and (statusCode >= 500 OR level:error OR success:false on external USGS calls). 
Summarize: count of errors, any common message or feed parameter, and the latest sample timestamp. 
If the MCP returns no data, say so clearly.
```

**SAY (while it runs — fill dead air):**

> This is the differentiator I care about for enterprises: the model isn’t *pretending* to know our production state—it’s using the **Datadog integration** through MCP. Same pattern teams use for Jira, internal runbooks, or custom APIs.

**When results appear:**

**SAY:**

> Here’s what I’d do on a real incident: confirm volume and whether it correlates with **`feed`** query params or **USGS** failures, then open the handler we already looked at.

**CLICK:** Click the **`app/api/earthquakes/route.ts`** tab again; scroll to the **`catch`** block.

**SNIP:**

```92:108:app/api/earthquakes/route.ts
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Failed to fetch earthquake data from USGS', {
      path: '/api/earthquakes',
      method: 'GET',
      statusCode: 500,
      duration,
      feed,
      error,
      service: 'usgs',
    });

    return NextResponse.json(
      { error: 'Failed to fetch earthquake data' },
      { status: 500 }
    );
  }
```

**SAY:**

> This is the line that produces the error logs you’d facet on in Datadog. The fix might be backoff, a fallback feed, or a clearer client error—but the point for **today** is: **observability query in Cursor → exact code path** in one session.

**Backup line if MCP is slow or empty:**

**SAY:**

> Live integrations can return sparse data in a demo org—I’ll show the same query in Datadog Logs Explorer: **`path:/api/earthquakes`** and **`statusCode:500`**—or facet on **`external_service:usgs`**. The workflow still holds: **signals first, then code.**

**CLICK (backup):** Browser tab with Datadog Logs; paste query from your doc:

`service:baytremor path:/api/earthquakes`  
or  
`path:/api/earthquakes @http.status_code:500`

(Adjust to whatever your facets show; US1 UI is standard.)

---

# Segment 4 — Wow 2: Agent makes a small, safe change (10:00–14:00)

**Pick ONE** of these so rehearsal stays predictable. **Recommended: Option A** (low risk).

### Option A — Logging clarity (no behavior change)

**SAY:**

> Let me show Agent on a **tight, reviewable diff**: I’ll add one structured field on error so on-call can see **`feedUrl`** redacted or **`feed`** only—we keep PII out and make logs more actionable.

**TYPE (Agent):**

```
In app/api/earthquakes/route.ts only: in the catch block for GET, add a field to the logger.error context: feedKey: feed (the query param we already have). Do not log the full URL. Keep the diff minimal. No other files.
```

**SAY (after diff appears):**

> I’d review this like any PR: scope is one file, intent is clear. In production, Netlify picks up the new JSON field automatically.

**CLICK:** Accept / apply; optionally show **Source Control** diff in sidebar.

### Option B — User-facing error nuance (slightly more product)

**TYPE (Agent):**

```
In app/api/earthquakes/route.ts only: when USGS returns non-OK before we throw, include feed name in the thrown Error message for engineers (still return generic message to client). Minimal diff.
```

**SAY:** Same review beat.

### Option C — Tab moment instead (if you’re short on time)

Skip Agent edit; go to Segment 5.

---

# Segment 5 — Tab: 30 seconds of “inline speed” (14:00–15:30)

**SAY:**

> I said I’d show **Tab** even though this repo is Agent-heavy—here’s why teams still use it daily.

**CLICK:**

1. Create **`lib/demo-tab.ts`** (or use an existing test file if you prefer no new files).  
2. Type slowly:

```ts
/** Returns true if magnitude is at or above "felt" threshold for UI badges */
export function isFeltMagnitude(magnitude: number): boolean {
```

3. **Stop typing** and let **Tab** suggest the body (`return magnitude >= 2.5` or similar).

**SAY:**

> Same model stack, different UX: **Tab** is for when you already know the shape and want speed. **Agent** is for when the task has dependencies across the repo. I use both.

**Optional:** Delete `demo-tab.ts` after demo if you do not want it in git.

---

# Segment 6 — Trial tips + Adobe hook (15:30–18:30)

**SAY:**

> For the **30-day trial**, three practices that make evaluations fair:

1. **Rules and ignore files** — align the AI with your style and keep noise down.  
2. **Explicit context** — `@file`, `@folder`, `@docs` when you want precision; Agent when you want breadth.  
3. **MCP** — connect tools teams already trust; Datadog is one example; the win is **governance**: the integration is configured once, auditable, not copy-paste from prod.

**Adobe angle (one sentence):**

> You ship creative tools at massive scale—**external dependencies, regional APIs, and observability** are table stakes. Cursor’s pitch isn’t “magic code”—it’s **shorter loops** from signal to change, with **editor-native** context.

**Competitive framing (neutral):**

> You’re trialing Copilot and Windsurf in parallel—**Tab** overlaps with inline assistants everywhere; where Cursor tends to earn its keep is **Agent plus tool integrations** like this Datadog path, and **whole-repo** work with your actual tree.

---

# Segment 7 — Close + invite questions (18:30–20:00)

**SAY:**

> Recap: **Tab** for speed, **Chat** for understanding, **Agent** for multi-step work, **MCP** for Datadog on **US1** so production context lives inside the workflow.  
> I’m happy to go deeper on security posture, data handling, or how you’d roll this out to a team—what’s most useful for the next few minutes?

**PAUSE.** Take questions.

---

## Quick reference — Datadog queries (US1)

Use these in MCP prompts or Logs Explorer:

| Intent | Example facet query |
|--------|---------------------|
| Earthquake API errors | `path:/api/earthquakes` `statusCode:500` |
| Service | `service:baytremor` |
| USGS external facet | `external_service:usgs` |
| Any 5xx | `statusCode:>=500` `service:baytremor` |

(Exact facet names can vary slightly with pipeline remapping; adjust live if needed.)

---

## Anticipated Q&A — short answers

**Q: Does Cursor send my code to the cloud?**  
**A:** Cursor publishes security and privacy documentation; enterprise customers typically review SSO, retention, and privacy controls. I’ll align with whatever your InfoSec needs for the trial.

**Q: How is this different from Copilot?**  
**A:** Overlap on Tab; differentiation is often **Agent** depth and **MCP** connectors for internal and external systems—plus how context is pulled from your workspace.

**Q: What if MCP fails mid-demo?**  
**A:** Fall back to Datadog UI with the same query—narrate that the **integration** is configured; live demos are allowed to be honest.

**Q: Why JSON logs?**  
**A:** Structured logs facet cleanly in Datadog; our `logger` outputs one JSON object per line for ingestion via Netlify drains.

---

## Timing cheat sheet

| Block | Minutes |
|-------|---------|
| Intro + Cursor 101 | ~3 |
| App + logger + route | ~2 |
| Datadog MCP + code tie-in | ~4.5 |
| Agent small change | ~4 |
| Tab | ~1.5 |
| Trial tips + close | ~3 |
| Buffer / questions | ~2 |

**Total:** ~18–20 minutes with buffer.

---

*End of script. Rehearse twice with a timer; trim Option B or Tab if over.*
