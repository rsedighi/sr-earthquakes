# BayTremor — Lead-Gen Redesign Spec & Design System

Blueprint for a brand-new look & feel that turns earthquake curiosity into
qualified leads (insurance, retrofit, preparedness). Build this in Figma first,
then convert frames to code via the Figma Dev Mode MCP.

Grounded in the existing codebase:
- Base surface `#0a0a0a` (`theme-color` in `BaseLayout.astro`)
- Fonts: Geist Sans / Geist Mono (`tailwind.config.ts`)
- Risk model: `computeRiskScore` → `RiskBand` (`Low | Moderate | High | Very High`)
- Lead categories: `insurance | retrofit | preparedness | general` (`CTAS` in `home-risk-report.tsx`)
- Lead qualifiers: `ownership`, `home_age`, `foundation_type`, `has_insurance`, `consent` (`0003_leads.sql`)
- Analytics: `track()` → Datadog RUM

---

## 1. Design principles (the 3 jobs of every screen)

1. **Authority & trust** — credible enough that a homeowner hands over contact + property details. Cite USGS data, show privacy/consent, use precise typography.
2. **Personalized urgency** — the risk score is the emotional hook. Make *their* number, *their* fault, *their* address the hero.
3. **One obvious next action** — a single dominant CTA per view. Never dilute with competing buttons.

Anti-goals: decorative color noise, more than one primary CTA per view, hiding the value (risk report) behind the form.

---

## 2. Design tokens

### 2.1 Color

Keep the dark, data-forward base. Semantic risk colors are **reserved** — never used decoratively — so risk always reads instantly.

**Neutrals (surfaces & text)**
| Token | Value | Use |
|---|---|---|
| `bg/base` | `#0a0a0a` | Page background |
| `bg/surface` | `#141414` | Cards |
| `bg/surface-2` | `#1e1e1e` | Raised / hover |
| `border/subtle` | `rgba(255,255,255,0.08)` | Card borders |
| `border/strong` | `rgba(255,255,255,0.16)` | Focus / active |
| `text/primary` | `#fafafa` | Headings |
| `text/secondary` | `#a1a1aa` | Body |
| `text/muted` | `#71717a` | Captions, legal |

**Risk (semantic — maps 1:1 to `bandColors()`)**
| Band | Text | Accent | Figma token |
|---|---|---|---|
| Low | `#34d399` | `#10b981` | `risk/low` |
| Moderate | `#fbbf24` | `#f59e0b` | `risk/moderate` |
| High | `#fb923c` | `#f97316` | `risk/high` |
| Very High | `#f87171` | `#ef5344` | `risk/very-high` |

**Action (CTA — one accent, reserved for conversion)**
| Token | Value | Use |
|---|---|---|
| `action/primary` | `#06b6d4` (accent.cyan) | Primary CTA fill |
| `action/primary-hover` | `#22d3ee` | Hover |
| `action/on-primary` | `#0a0a0a` | Text on CTA |

Rule: `action/primary` appears **only** on the single primary CTA of a view. Risk colors never used for buttons; CTA color never used for data.

### 2.2 Typography (Geist)

| Style | Font / size / weight | Use |
|---|---|---|
| `display` | Geist Sans, 48–64, 700 | Risk score numeral, hero |
| `h1` | Geist Sans, 32, 700 | Page title |
| `h2` | Geist Sans, 24, 600 | Section |
| `h3` | Geist Sans, 18, 600 | Card title |
| `body` | Geist Sans, 16, 400 | Paragraph |
| `body-sm` | Geist Sans, 14, 400 | Secondary |
| `caption` | Geist Sans, 12, 500 | Labels, legal, consent |
| `data` | Geist Mono, 14–16, 500 | Magnitudes, distances, coords |

Mono is reserved for numeric/scientific data (Mw, km, lat/lon) — reinforces authority.

### 2.3 Spacing, radius, elevation

- Spacing scale (4px base): `4, 8, 12, 16, 24, 32, 48, 64`.
- Radius: `sm 8`, `md 12`, `lg 16`, `xl 24`, `full 9999`.
- Elevation: cards use border + subtle shadow `0 1px 2px rgba(0,0,0,0.4)`; modals `0 20px 60px rgba(0,0,0,0.6)`.
- Existing motion tokens to reuse: `fade-in`, `slide-up`, `pulse-gentle`, `ripple` (`tailwind.config.ts`).

---

## 3. Core components (build as Figma components w/ variants)

1. **RiskGauge** — radial 0–100 gauge. Variants: `band = Low|Moderate|High|VeryHigh`. Center = `display` numeral + `headline`. Ring stroke = risk accent.
2. **AddressCard** — "Your home" chip: pin icon + address + edit action. Anchors personalization.
3. **RiskFactorBar** — labeled bar (`points / maxPoints`) for the 4 `RiskFactor`s. Variant per band color.
4. **CtaCard** — icon + title + subtitle + button. Variants: `insurance | retrofit | preparedness` (colors from `CTAS`). This is the conversion unit.
5. **LeadForm** — progressive fields mapped to `leads`: contact → property qualifiers → consent. Variants: `step = 1|2|3`, `state = default|error|loading|success`.
6. **ConsentBlock** — checkbox + exact `consent_text` + privacy link. Compliance-critical, never pre-checked.
7. **TrustBar** — "Data: USGS", "Your info is private", partner/badge row.
8. **StatChip** — mono metric (felt count, max Mw, quakes within radius) from `RiskScore.stats`.
9. **Button** — variants: `primary | secondary | ghost`, `size = sm|md|lg`, states.
10. **NavBar / Footer** — reskin of existing.

---

## 4. Screen-by-screen (funnel-first frames to design)

Design these mobile-first (390px) then desktop (1280px).

### 4.1 Landing / Address entry
- Hero: one line value prop — *"How safe is your home in the next big Bay Area quake?"*
- Single input: address autocomplete + one primary CTA *"Check my home's risk"*.
- Below-fold trust: USGS data, live quake count, "80+ cities".
- Goal: maximize address submissions. No competing links above the fold.

### 4.2 Personalized Risk Report — conversion centerpiece (`home-risk-report.tsx`)
Layout order (top → bottom):
1. `AddressCard` (their home).
2. `RiskGauge` (their score + `headline`) — the emotional peak.
3. `summary` sentence + `StatChip` row.
4. `RiskFactorBar` x4 (transparency = trust).
5. **CTA zone**: 3 `CtaCard`s. Prioritize by band — Very High/High leads with `insurance` + `retrofit`; Low/Moderate leads with `preparedness`.
- Value is shown *before* the ask. CTA cards open the LeadForm modal pre-tagged with `category`.

### 4.3 Lead-capture modal (`LeadForm`)
- Progressive, 3 short steps (reduce friction):
  - Step 1: name, email (required), phone.
  - Step 2: property qualifiers — `ownership`, `home_age`, `foundation_type`, `has_insurance` (these make the lead sellable; frame as "so we match you accurately").
  - Step 3: `ConsentBlock` (explicit opt-in) + submit.
- Carry the risk snapshot (`risk_score`, `risk_band`, `nearest_fault`) silently into the payload.
- States: `loading`, `error`, `success`.

### 4.4 Thank-you / post-submit
- Confirm + set expectations ("a licensed partner will reach out").
- Second conversion: offer the *other* category (e.g. after insurance → preparedness kit).

### 4.5 Engagement surfaces (reskin, feed the funnel)
- Live / History / Learn tabs (`dashboard/`) and `my-neighborhood.tsx`: apply new tokens; add contextual entry points back to the Risk Report ("See your home's risk").

---

## 5. Conversion + measurement

Wire these `track()` events (extend existing Datadog RUM):
- `address_submitted`, `risk_report_viewed { band, score }`
- `cta_clicked { category }`, `lead_form_step { step }`
- `lead_submitted { category, band }`, `lead_form_abandoned { step }`

A/B candidates: CTA copy, form length (1-step vs 3-step), gauge vs number-only, CTA ordering by band.

---

## 6. Figma file structure (so Dev Mode MCP conversion is clean)

```
📄 BayTremor Lead-Gen
├─ 🎨 Foundations        (color/type/spacing/effect styles = tokens)
├─ 🧩 Components         (section 3, with variants + Auto Layout)
├─ 📱 Screens — Mobile   (section 4 frames, 390px)
├─ 🖥 Screens — Desktop  (section 4 frames, 1280px)
└─ 🔀 Flows              (arrows: Landing → Report → Form → Thank-you)
```

Conversion-readiness rules:
- Use **Figma Variables** for all tokens (Dev Mode MCP emits them as CSS/Tailwind vars).
- Name layers semantically (`RiskGauge/VeryHigh`, not `Group 12`).
- Use **Auto Layout** everywhere → maps to flexbox/Tailwind cleanly.
- Match component names to intended React component names.

---

## 7. Build sequence

1. Foundations (tokens) → 2. Components → 3. Mobile Report screen (highest ROI) → 4. Lead-capture modal → 5. Landing → 6. Thank-you → 7. Reskin engagement tabs.

Ship the Report + Form first; that pair drives the majority of lead value.
