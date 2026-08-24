# Sukoon — Build Progress & Handoff Notes

Written so a fresh session (Claude Code or otherwise) can pick this up without
re-explaining everything from chat history.

## What this is

Sukoon is a mobile-first consumer health app (PCOS, fertility, sleep,
anxiety/depression, habit change, general health) combining personalized
plans, daily tracking, an AI companion, education, and human experts.

## Repo layout

```
Sukoon-App/
  index.html, api/, conversation/, scripts/, package.json
    → The ORIGINAL chat app. Vanilla HTML/CSS/JS + Vercel serverless
      functions (Groq + OpenRouter). Still deployed as its own separate
      Vercel project (root directory left blank/default), but as of
      2026-08-24 **nothing in sukoon-webapp links to it anymore** — see
      "Sukoon companion chat ported in-app" below. Its logic was
      manually ported (not shared/imported) into sukoon-webapp; this
      original copy was left untouched as the porting source, not
      because anything still depends on it. Decommissioning this
      Vercel project is an open decision for the human, not done yet.

  sukoon-design-assets/
    → Mascot, header art, color palette (SVG + PNG + webp), pulled
      directly from the chat app so they match exactly. See
      README_DESIGN_ASSETS.txt inside for what each file is.

  sukoon-webapp/
    → The main app: React + Vite, plain CSS (no Tailwind), design
      tokens ported 1:1 from the chat app's CSS variables
      (src/styles/tokens.css). Deployed as a SECOND, separate Vercel
      project with Root Directory set to `sukoon-webapp`. Now has its
      own Supabase-backed auth/persistence and its own in-app port of
      the companion chat (see 2026-08-24 section below) — it's no
      longer just "the new frontend for the old chat app's backend."

  docs/  (this folder)
    PROGRESS.md — this file
    reference-screenshots/ — the target designs the human provided
    current-build-screenshots/ — what's actually live, for comparison
```

## Why two Vercel projects

One repo, two independent deployments, each with their own env vars
(same var name is NOT shared between projects — each needs its own
entry even if the value happens to be identical):

1. **Chat project** (root directory blank) — needs `GROQ_API_KEY` and
   `OPENROUTER_API_KEY`. As of 2026-08-24 this project is orphaned
   (nothing links to it) but still deployed; see note above.
2. **Webapp project** (root directory `sukoon-webapp`) — needs:
   - `GROQ_API_KEY` — for `plan-quiz.js`, `doctor-concierge.js`,
     `companion-classify.js`.
   - `OPENROUTER_API_KEY` (added 2026-08-24) — for `companion-chat.js`.
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (added 2026-08-24) —
     client-side Supabase auth/persistence. **Must be prefixed
     `VITE_`, not `NEXT_PUBLIC_`** — see the Supabase section below,
     this exact mistake already happened once via the Supabase↔Vercel
     integration defaulting to Next.js naming.
   - `VITE_CHAT_APP_URL` — **no longer used** as of 2026-08-24
     (`ChatEmbed.jsx`, the iframe that read it, was deleted). Safe to
     remove, not urgent.

Both projects were 404ing at various points during initial setup due
to Root Directory misconfiguration and missing env vars — both are now
confirmed working.

## Architecture decisions already made (don't re-litigate)

- **Chat tab = ported in-app, no longer an iframe (reversed 2026-08-24).**
  Originally the original chat app was embedded as-is via
  `<iframe src={VITE_CHAT_APP_URL}>`, specifically so the hand-tuned
  prompt/safety/crisis-routing logic would never have to be touched.
  The human explicitly asked to lift that constraint on 2026-08-24 ("the
  whole code exists to simply use it to make it into a new in-app
  companion") so it could access this app's login session and
  Supabase-stored profile/plan/tracking data — an iframe to a separate
  Vercel project can never have that access by construction. See the
  "Sukoon companion chat ported in-app" section below for the full
  story, including a faithful-port strategy that still preserves that
  original logic (same statement order, no simplification of the
  safety-relevant parts) even though it's no longer isolated in an
  iframe.
- **Plain CSS over Tailwind**, using the ported token variables, to match
  the bespoke illustrated aesthetic without fighting a utility system.
- **No router library** — navigation is plain React state
  (`App.jsx`: `stage` for onboarding, `tab` for the bottom nav).
- **Bottom nav = Home · Plan · Track · Care · Sukoon · You** (6 tabs, as of
  2026-08-21 — was 5, see the big restructure noted in the status table and
  Navigation section below). "Care" is `Experts.jsx`, promoted to a
  top-level tab; it used to be reached only from a Home banner via a
  separate `homeView` state, which no longer exists. "Sukoon" is now
  `Companion.jsx` (was `ChatEmbed.jsx`'s iframe, replaced 2026-08-24 —
  see below).
- **Onboarding = Splash → Auth (sign up/log in) → About You → Choose
  Journey → Plan Questionnaire → main app** (Auth inserted 2026-08-24,
  right after Splash — every onboarding answer now ties to a real
  Supabase account from the start, no anonymous-then-migrate logic).
  `App.jsx` carries a `profile` state object (name, gender,
  age, tags, location, chosen `journeys`, quiz `answers`, generated
  `plan`) threaded down as a prop to `Home`/`Plan`/`Profile`. This didn't
  exist before 2026-08-21 — `AboutYou`'s and `ChooseJourney`'s answers used
  to be silently discarded by `App.jsx`.
- App name is **Sukoon**; the bottom-nav chat tab is also labeled
  **Sukoon** (renamed from "Chat" at the human's request early on —
  Sukoon used to refer to the chat app specifically, now it's the whole
  product, including this tab).

## Screen-by-screen status

Human's own words: "for the build, we can do page by page."
Compare `reference-screenshots/` vs `current-build-screenshots/` for each.

| Screen | File(s) | Status |
|---|---|---|
| Start (splash) | `src/screens/Splash.jsx/.css` | **Parked at ~80%, 2026-08-21 — human's own estimate.** Good enough to move on, but human flagged three specific things to revisit later: (1) the 3D mascot needs further work (not just the earlier "not fully happy" — still open), (2) UI component placement/hierarchy needs refinement, (3) reduce information density (likely the feature-icon row and/or footer, which currently carries a lot: 4 feature chips + CTA + account link + divider + 3 social buttons + secure line). Don't assume this screen is finished — these are known, deliberately-deferred gaps, not oversights. Build history below for context on decisions already made (background image, mascot asset, contrast fixes, layout bug fixes). On 2026-08-20 this was rebuilt to match `reference-screenshots/01-start.png` by cropping that mockup's own illustration. On 2026-08-21 the human shared a separate TanStack Router + Tailwind prototype (not part of this codebase — no router/Tailwind/TypeScript exists here, see architecture decisions above) showing a preferred visual direction; that *look* was ported into our existing plain-CSS component rather than adopting the new stack: title is now "Sukoon Health" with a circular leaf badge, tagline sits in a translucent pill, each feature is a light icon square over a separate dark label chip, and the CTA is a glassy blurred pill with a purple glow. The human then supplied the prototype's actual source images, which now back the screen directly: `sukoon-webapp/public/brand/start-hero-scene.jpg` (full sunrise-over-Himalaya illustration, used as a single full-bleed `background-size:cover` — no CSS-constructed sky gradient needed since the photo already has one) and `mascot-cloud.png` (a glossy 3D-rendered cloud with real alpha transparency, replacing the flatter `sukoon-logo-mascot.svg`). The human isn't fully happy with the 3D mascot yet — kept as a working draft. A follow-up information-hierarchy/readability pass (same day) shrank the mascot 132px→84px, added a layered `text-shadow` to the "Sukoon Health" wordmark (it sits directly over the sun disc and was unreadable as plain white text), added matching shadows to the other unbacked white text (CTA label, "Create an account" line, divider, secure line) as contrast insurance against the photo, and replaced the two-button Google/Apple social row with a smaller 3-up grid — hand-drawn inline SVGs for the Google and Apple marks (no brand-icon package installed) plus a `Phone` (lucide) option for OTP login, chosen over Facebook/WhatsApp since phone-OTP is the more standard pattern for an Indian consumer health app and there's no real "Sign in with WhatsApp" OAuth flow. Re-verified at all three breakpoints plus a clean build.

A second same-day follow-up caught real regressions from that pass. The human reported the feature/social icons had become unreadable, the mascot no longer looked centred, and the title/tagline looked off-alignment and smaller — asked "why did you change the placements" and asked for a formal WCAG readability check before finalizing. Investigated with actual measurements rather than eyeballing: a script sampling the real composited pixels (hero photo × gradient × any chip) behind every text element and computing WCAG 2.1 contrast ratios found the `text-shadow`-only approach for the wordmark was **a real failure — 1.73:1 against the required 3:1** (large bold text), because it sat almost exactly on the sun disc and text-shadow doesn't count toward formal contrast, only solid foreground/background color does. Everything else already passed comfortably (6.4–18:1). Separately, `getBoundingClientRect` measurements showed the mascot and the wordmark's *box* were both already exactly at viewport-center — no positioning bug — but the leaf badge sat only to the right of the title text *inside* the flex row, which centered the box while visually shifting the readable text ~13px left of true center; that reads as "off-center" even though it technically wasn't. Fixes: the wordmark became an opaque blurred pill (same treatment as tagline/feature labels) with the leaf as a `position:absolute` corner badge — fixed contrast (8.06:1) and the centering illusion together. Feature icons went back up to 46px, social icons to 19px.

A **third** same-day round: the human felt the opaque pill hid the sun completely and asked to go back to shadow-only text for the title (explicitly accepting the contrast trade-off — "maybe it's ok"), plus wanted the tagline repositioned so the sun stays mostly visible through it. Reverting the wordmark's chip surfaced a real, previously-masked layout bug: `.splash__mascot` (an `<img>`, inline by default) and `.splash__wordmark` (`display:inline-block`) were **inline siblings on the same line**, not stacked — they had only ever appeared correctly stacked because the wordmark (padded pill, or later a wide flex row) was wide enough to force a wrap. Once the wordmark got narrower, they fit side-by-side and the mascot visibly drifted left. Fixed properly rather than relying on wrap-coincidence again: `.splash__mascot` is now `display:block; margin:0 auto`, `.splash__wordmark` is `display:flex; justify-content:center` (guaranteed own line, full width) wrapping a new inner `.splash__wordmark-inner` span that does the old shrink-to-fit/badge-anchor job, and `.splash__tagline` is `display:block; width:fit-content; margin:auto`. Re-measured: mascot/wordmark-text/tagline all land at exactly 187.5px center on a 375px viewport. For the sun: the wordmark reverted to shadow-only text per the human's explicit request (contrast is knowingly below WCAG at this position — ~1.77:1 against a 3:1 requirement, sun now fully visible through/around it); the tagline kept a much lighter frosted chip, tuned by iterating its alpha against the same live contrast script — 0.58 opacity lands at 5.08:1 (passes 4.5:1) while still letting most of the sun's glow show through, versus the earlier fully-opaque 0.68 that blocked it outright. Re-verified at 375×812, 375×667, and a clean `npm run build`. |
| Onboarding — About You | `src/screens/onboarding/AboutYou.jsx/.css` | **Re-verified live 2026-08-21; one real bug fixed; now the 1st onboarding step.** Human asked to swap the onboarding order — name/info now comes before journey selection (see `App.jsx` stage order below). The Age field also rendered both the native `<select>`'s OS dropdown arrow and a custom `ChevronDown` icon stacked next to each other (no `appearance: none` on the `<select>`) — fixed in `AboutYou.css`. Otherwise close to reference; same emoji-vs-illustrated-icon gap as Choose Journey applies to the "Anything we should know?" tag icons (reference has small icons per tag, e.g. droplet/clipboard/moon; this build has plain text chips). |
| Onboarding — Choose Journey | `src/screens/onboarding/ChooseJourney.jsx/.css` | **Re-verified live 2026-08-21; now the 2nd onboarding step** (was 1st — human asked to swap it with About You). Genuinely close to reference: layout, selection state (card tint + purple border + filled checkmark), and the Continue button's enabled/disabled treatment all match. Only visible gap is icon style — reference uses custom painterly illustrations per category (uterus, lotus, brain, nuts bowl, yoga mat, stethoscope), this build uses plain OS emoji instead. Same asset problem as the splash mascot/hero photo — would need real icon files, not something to fake. Left as-is; flag to human if custom icons matter enough to source. `JOURNEYS` (id/emoji/title/desc) was lifted out of this file into `src/data/journeys.js` so other screens can share it without duplicating the list. |
| Onboarding — Plan Questionnaire (new) | `src/screens/onboarding/PlanQuestionnaire.jsx/.css` | **New, 2026-08-21.** Added after "Choose Journey," modeled on a reference tool the human linked (https://pcos-root-plan.tiiny.site — a one-question-at-a-time conversational quiz). 5 questions (goal, concerns, activity level, current medical support, reminder timing), one per screen, reusing `OnboardingHeader` and the existing `.chip`/`.chip-row` styling from `AboutYou.css` — no new input CSS. Only "What's your name?" was actually observed in the reference tool before the trail went cold; the other 4 questions are an inferred, reasonable set for a lifestyle-plan intake, not verbatim from the source. On the last question, "Generate my plan" calls `buildPlan()` (see below) and the result feeds `App.jsx`'s `profile.plan`. |
| Home | `src/screens/Home.jsx/.css` | **Rebuilt 2026-08-21, content only** (human: "don't change the visualization" — same `.card`/`.section-title`/`ProgressRing`/`TopBar` primitives throughout, no new visual language). Replaced the old 6-item emoji domain grid and the Home-nested "Talk to Experts" banner with 5 new sections per the human's own spec: journey destination (derived from `profile.journeys` via `journeys.js`), a 7-day calendar strip (today highlighted, dot on mock event days — reuses the day-column loop pattern), a "Today's Plan" snippet (current phase from `profile.plan`, taps through to the Plan tab), an "Upcoming Medical Consultations" card (taps through to Care), and a new "Sukoon noticed" insight card (2-3 canned mascot-voiced messages, one shown per visit — copy is a first draft, not final). |
| Plan | `src/screens/Plan.jsx/.css` | **Restructured 2026-08-21 into a full roadmap.** The old standalone "Today's Focus" card is gone (superseded by Home's teaser of the same data — single source of truth is `profile.plan.phases`, no duplication). New "Full Roadmap" section: one stacked card per phase (title, status badge, `ProgressRing`), only the *current* phase auto-expands its action list, others are tap-to-expand. "Weekly Overview" (7-day bar chart + streak stats) **moved to Track** (human's call, given "Plan = roadmap" vs "Track = trends"). Daily Progress and the full Upcoming Reminders list are unchanged. Light mode only; reference also showed a dark-mode variant, still not addressed. |
| Track | `src/screens/Track.jsx/.css` | **Extended 2026-08-21.** Kept "Today's log" and the add button as-is; replaced the old static placeholder with the "Weekly Overview" moved from Plan (unchanged content, just relocated) plus a new "Water intake this week" trend chart, reusing the same hand-rolled bar-chart pattern (no chart library in the project, none added). Single metric for now, not a multi-metric switcher. |
| Care (was "Talk to Experts") | `src/screens/Experts.jsx/.css` | Same screen, **promoted to its own bottom-nav tab 2026-08-21** (previously only reachable via a Home banner + `homeView` state, which no longer exists). No `onBack` is passed anymore since it's a top-level tab now — `TopBar` already omits its header row entirely when `onBack` is absent, so no `Experts.jsx` change was needed for that. (The `onBack`-driven click-through bug fixed earlier the same day, see Navigation section, only ever affected `OnboardingHeader`, not this screen's `TopBar`.) **Redesigned 2026-08-24** to match a human-supplied reference screenshot: new `src/components/ExpertCard.jsx/.css` (photo-card style — avatar with verified badge + online-status dot, tag pills, rating/experience/distance meta row, Online + Book pill buttons), used across all three modes (By Doctor, Visit a Clinic, Online Consultation). `src/data/experts.js` gained `tags`/`verified: true`/`hours` fields to feed the new card. See the "Sukoon companion chat ported in-app" section below for the rest of that day's work. |
| Profile ("You") | `src/screens/Profile.jsx/.css` | **2026-08-21:** the hardcoded `"PCOS Care · Mental Well-being"` subtitle is now `journeyLabel(profile.journeys)`, genuinely derived from what the user picked in onboarding. First-pass otherwise; no reference screenshot provided. **2026-08-24:** sign-out button wired to `onSignOut` (was dead UI) — calls `supabase.auth.signOut()`, which resets `App.jsx` state and returns to Splash. |
| Auth (new) | `src/screens/Auth.jsx/.css` | **New, 2026-08-24.** Email+password sign up / log in toggle screen, inserted right after Splash in the onboarding flow (see Navigation section). Handles Supabase's "check your inbox to confirm" state after signup. Chosen over phone/WhatsApp OTP specifically to avoid Twilio/WhatsApp Business setup — see "Supabase persistence + auth" section below. **No forgot-password flow yet — real gap, not built.** |
| Sukoon (was "Chat") | `src/screens/Companion.jsx/.css` | **Fully replaced 2026-08-24** — was `src/screens/ChatEmbed.jsx/.css`, a bare iframe wrapping the untouched root chat app; that file is now deleted (confirmed zero remaining references before removal). This is now a real in-app screen: a faithful React port of the root app's entire companion-chat engine (crisis detection, the motivational-interviewing state machine, MITI self-coding, memory extraction — all of it), with the addition of live access to this app's login session and Supabase-stored profile/plan/tracking data, which an iframe to a separate Vercel project could never have. Full story, architecture, and the multi-round bug-fix history (loading spinner, env vars, header art, icon/footer fidelity, typing-glow) are in the dedicated section below — this was the single biggest piece of work done this session and the table row doesn't do it justice, read that section before touching this screen again. |

## Navigation

Onboarding order (`App.jsx` `stage`): **Splash → About You → Choose Journey → main app** (swapped 2026-08-21 at human's request — was Splash → Choose Journey → About You).

**Real bug found and fixed 2026-08-21 (a correction to an earlier note in this file):** both onboarding back buttons (`OnboardingHeader`, used by both About You and Choose Journey) were reported by a previous claim here as "confirmed working live" — that check was invalid. It called `element.click()` via JS, which invokes the DOM node directly and bypasses real browser hit-testing. The human reported back navigation broken in three separate real browsers (including a private window, ruling out cache), which prompted re-testing with `document.elementFromPoint()` at the button's actual on-screen coordinates — the real hit-testing path any mouse/touch click goes through. That returned `.onboarding-header__content`, not the back button: `.onboarding-header__back` uses `float: left` (removing it from normal flow), so its following sibling `.onboarding-header__content` still spans the full header width including over the float, and with both sharing `z-index: 2`, the later-in-DOM element wins paint order and silently absorbs the click — even though nothing is visibly drawn there. Fixed by bumping `.onboarding-header__back` to `z-index: 3` in `OnboardingHeader.css`. Re-verified with the same `elementFromPoint` method: now resolves inside the button. **Lesson: `element.click()` is not a valid stand-in for a real click when verifying that something is clickable — it proves the handler works, not that a real pointer event would ever reach it. Use `document.elementFromPoint()` at the element's actual rect, or a real coordinate-based click, when the question is "does clicking this work."**

`TopBar`'s back button does not have this bug — it doesn't use `float`, so its siblings stack normally rather than overlapping.

**Bottom nav is now 6 tabs** (`src/components/BottomNav.jsx`, 2026-08-21): Home · Plan · Track · Care · Sukoon · You. Bottom-nav tabs have no "back" concept by design — Care (formerly the Home-nested "Talk to Experts") is now a direct tab like the others, no back button, since `homeView` state was removed entirely from `App.jsx`.

## Shared components (edit once, affects multiple screens)

- `src/components/TopBar.jsx/.css` — header used on Home/Plan/Track/Care/Profile. Supports an optional `onBack` prop (renders a back chevron instead of the header row when passed — as of 2026-08-21, nothing currently passes it; kept for any future screen that's reached as a pushed sub-view rather than a top-level tab, same pattern used successfully for the now-retired Home→Experts nesting). **2026-08-21: removed the hamburger menu icon, the "more options" (⋯) icon, and the "Need help now" pill** — all three had zero `onClick` handler anywhere in the codebase (confirmed by grep), so they were fully dead UI on every screen that used `TopBar`. Home's tagline ("What's on your mind today?") was also removed at the human's request. If a real menu/help/more-options destination gets built later, re-add the relevant button then rather than restoring the placeholder.
- `src/components/OnboardingHeader.jsx/.css` — header used on the three onboarding screens (About You, Choose Journey, and the new Plan Questionnaire).
- `src/components/BottomNav.jsx/.css` — the 6-tab bar (was 5, see above). Font-size/icon-size trimmed slightly (0.68rem→0.6rem, 22px→20px icons) to fit 6 labels at 375px without wrapping.
- `src/components/ProgressRing.jsx` — circular progress, used on Plan and now also Home.
- `src/data/journeys.js` (new, 2026-08-21) — the `JOURNEYS` list (id/emoji/title/desc), lifted out of `ChooseJourney.jsx` so `Home`/`Profile`/the plan generator can share one source of truth via `journeyLabel()`/`journeyEmoji()`/`journeyById()`.
- `src/data/planTemplates.js` (new, 2026-08-21) — `buildPlan(journeyIds, answers)`, the mock roadmap generator. One fixed 3-phase framework used for every journey (Lifestyle Foundations → Medical Care & Supervision → Consistency & Tracking — confirmed with the human: any lifestyle/age-based condition needs this same combination), with per-journey action content (`JOURNEY_ACTIONS`) filling each phase. If more than one journey was chosen, 1-2 actions from the secondary journey(s) get merged into the primary journey's phases (capped at 4 actions/phase).

## Porting the real Plan Questionnaire — IMPLEMENTED 2026-08-21, live-tested same day (see fix below)

Human shared the full source of the reference tool (https://pcos-root-plan.tiiny.site), confirmed going the AI-backed route (Option A below), confirmed the Vercel deployment shape, and asked to build it. Built the same session. **What's not yet verified: the actual live Groq call** — Vite's dev server doesn't execute `api/*.js` (that's Vercel-only runtime), so this was verified locally with the frontend logic exercised against a mocked `fetch` response, not a real API round-trip. First deploy is the real test — see "To deploy" below.

**Files added/changed:**
- `sukoon-webapp/api/plan-quiz.js` (new) — the serverless endpoint, copied from `api/groq-classify.js`'s pattern (native Groq call, key server-side only).
- `sukoon-webapp/src/data/planQuizPrompt.js` (new) — `buildSystemPrompt(profile)`, adapted from the reference's system prompt: same 14 questions, same `<<<PLAN>>>` JSON contract, but re-voiced for Sukoon and **told to skip name/age if already known from onboarding** and to weight its questions toward whichever journey(s) the user already picked.
- `sukoon-webapp/src/data/aiPlanMapper.js` (new) — `extractAiPlan()`/`messageBeforePlan()` (parse the `<<<PLAN>>>` block out of a reply) and `mapAiPlanToAppPlan()`, the deliberate "not 1:1" translation: `plate`+`movement` → the "Lifestyle Foundations" phase's actions, `tests`+`clinician` → "Medical Care & Supervision", `timeline` → "Consistency & Tracking" — so the existing phases/`ProgressRing`/Home-snippet machinery keeps working unchanged, while `typeProfile`/`tests`/`timeline` are also kept in full fidelity as their own fields for the two new dedicated Plan-tab sections (below) rather than being flattened into plain action-item text and losing their notes/tags.
- `sukoon-webapp/src/screens/onboarding/PlanQuestionnaire.jsx` — fully rewritten from the chip-select wizard into a real chat thread (assistant/user bubbles, free-text input, typing-dots while loading, `**bold**` markdown rendering since the prompt uses it for the question itself). Includes an **approximate** progress bar (user-turn count / 14, capped at 90% until a plan is actually returned) — this is the "1/n questions" indicator asked for earlier; approximate because an adaptive LLM conversation doesn't have a fixed length. Also has an error-recovery path: if the API call fails, a "Skip for now, use a starter plan instead" link falls back to the old static `buildPlan()` template generator (kept around specifically for this) rather than dead-ending the user.
- `sukoon-webapp/src/screens/Plan.jsx` / `.css` — two new sections: "My Likely Type" (driver/overlay/rule-out tags + explanation, only rendered when `profile.plan.typeProfile` exists) and "Tests to Get" (each test with its note and a colored tag badge — priority/confirmatory/rule_out/base).
- `sukoon-webapp/src/App.jsx` — `PlanQuestionnaire` now receives the full `profile` object (was just `journeys`) so it can personalize/skip questions.

**Quick-reply chips added 2026-08-21** (human's request: "you have capable keys as well instead of just typing as in the original questionnaire" — unlike the reference tool, which is pure free-text). For 6 of the 14 questions with a short natural answer set (periods, post-meal energy, gut, diet type, work situation, main goal), `planQuizPrompt.js`'s system prompt now instructs the AI to append a machine-readable `QUICK_REPLIES: Option A | Option B | Option C` line with an exact hardcoded option set per question. `aiPlanMapper.js` gained `extractQuickReplies(replyText)` to strip that line from the displayed bubble and return the parsed options. `PlanQuestionnaire.jsx` renders those options as tappable chips (reusing the app's existing global `.chip`/`.chip-row` classes from `AboutYou.css` — no new visual pattern) right above the input row; tapping one sends it immediately like a typed answer, and the chip row clears once a new message goes out. Verified locally end-to-end via a mocked `fetch` (real Groq call still untested — see "To deploy" below): chips render, tapping sends and clears correctly, later free-text-only questions correctly show no chips. **Caught a real bug in the process**: the Send button was wired as `onClick={send}` instead of `onClick={() => send()}`, so React's click event was passed as `send`'s new `overrideText` parameter, throwing `(overrideText ?? input).trim is not a function` and silently breaking manual sending entirely. Fixed.

**Two real CSS bugs found and fixed during this pass** (both classic specificity/source-order traps, worth remembering for this codebase): (1) the generic `.plan-screen__badge` base rule was declared *after* all its color modifiers in the file — equal specificity, so the later generic rule was winning and silently flattening every badge (phase status AND the new test tags) to the same sage color; fixed by moving the base rule before its modifiers. (2) `.plan-screen__phase-text span` (an element+class descendant selector) was beating `.plan-screen__badge--current`'s single-class selector on specificity, so "Current"'s text stayed the muted default color instead of white; fixed by qualifying the modifiers as `.plan-screen__badge.plan-screen__badge--current` etc. (two classes, higher specificity than one class + one element). Both were caught by an actual screenshot check, not assumed away — worth re-checking badge colors specifically if this file gets touched again.

### Five-item follow-up round, 2026-08-21

Human asked for five changes in one batch after the live test above passed. All verified locally via the browser preview (mocked `fetch` for the AI parts) before committing.

1. **Only PCOS Care is selectable on Choose Journey.** The other 5 journeys render greyed out with a "Coming soon" tag and `disabled`/non-clickable — not removed, just inert, since only PCOS content actually exists end-to-end right now (`ChooseJourney.jsx`'s new `ENABLED_JOURNEYS` set gates this; trivial to re-enable others later by adding their id).
2. **Skip-to-home added in two places.** `ChooseJourney.jsx` and `PlanQuestionnaire.jsx` both now always show a "Skip for now, take me to the app" link (the questionnaire's skip link existed before but was only shown after an error — now it's visible from question 1 onward). Both paths land on the home screen with a starter plan from the existing `buildPlan()` template generator (`planTemplates.js`), same one already used as the AI-questionnaire's error fallback.
3. **Care tab's expert list is now exactly**: Dr. Deepika Verma (Gynaecologist, Reproductive Specialist), Dr. Aditi Sharma (MD, Psychiatrist), Priyanka Dey (Nutritionist) — real names/roles the human gave, replacing the old placeholder mock names.
4. **Care tab restructured into a specialty → browse-mode flow.** Tapping a specialty (Gynaecology/Fertility/Psychiatry/Nutrition) now actually selects it (was previously dead UI, no `onClick`) and reveals a 3-way toggle: **By Doctor** (filtered expert list, tagged per specialty — Dr. Verma covers both gynae & fertility), **Visit a Clinic** (city chips → mock clinic address/hours per city — Mumbai/Delhi/Bangalore), **Online Consultation** (mock time-slot chips). Any of the three "Book"/"Choose"/slot taps shows a dismissible inline confirmation card — still fully mocked (no real booking backend), consistent with the rest of the app's fidelity level.
5. **"Keep the original report" + PDF/WhatsApp/Email, per human's chosen option ("Download + share links").** Two real gaps closed: (a) `aiPlanMapper.js` was flattening the AI's rich output into plain phase-action strings and discarding the original `plate`/`movement`/`clinician` tip lists — added a `raw: aiPlan` field so the full, unflattened AI output survives in `profile.plan.raw`; (b) new `src/data/planReport.js` (`buildReportSections`/`buildReportSummaryText`) turns that raw output into a consistent report structure, and new `src/utils/downloadPlanPdf.js` renders it as a real client-generated PDF via `jspdf` (new dependency — no backend/cost, per the human's choice). `Plan.jsx` gained a "Your Full Report" section (only shown when `profile.plan.raw` exists, i.e. a real AI plan, not the skip-path starter plan) with three buttons: **Download PDF** (confirmed generating a real `application/pdf` blob), **WhatsApp** (opens `wa.me` with the full report as pre-filled text), **Email** (opens `mailto:` with the same text as the body). Both share buttons explicitly ask the person to attach the already-downloaded PDF themselves — **neither WhatsApp's `wa.me` links nor a plain `mailto:` can auto-attach a file from a webpage**, that's a real platform constraint, not an oversight. True one-click automated sending would need a paid backend service (WhatsApp Business API for WhatsApp — expensive/complex, explicitly out of scope; a transactional email service like Resend for email — feasible later if wanted, same pattern as `GROQ_API_KEY`).

**Bundle size note**: `jspdf` added ~130KB gzip to the main JS bundle (verified via `npm run build`) — a real, known cost of doing real client-side PDF generation with zero backend, matching the human's explicit choice. Not code-split; fine at this app's current size, worth revisiting only if bundle size becomes an actual problem.

### Care tab redesign follow-up + bug fix, 2026-08-21

Two things landed right after the batch above, in a second commit, both verified live in the browser preview (mocked `fetch` for the AI parts) before committing:

1. **Broken import caught before it shipped further.** `Plan.jsx` was importing `downloadPlanPdf` from `../utils/downloadPlanPdf.js`, but the actual file is `src/utils/planPdf.js` — the mismatch would have crashed the Plan tab's "Your Full Report" section the moment `profile.plan.raw` existed. Fixed the import path.
2. **Journey card badge overlap fixed.** The "Coming soon" tag on disabled journey cards was `position: absolute` at the bottom-right, which overlapped the description text whenever it wrapped to 3 lines (e.g. "Nutrition & Lifestyle"). Changed to a normal flow element below the description instead.
3. **Care tab's clinic flow replaced the 3-city mock with one real location**: Woodhouse Healthcare Speciality Clinic, Nehru Chowk, Bhopal, phone `+91 91096 98953` — both provided by the human. The clinic card now shows a **Directions** link (real `google.com/maps/search` URL built from the name+address) and a **Call** link (`tel:`), styled as small pill buttons, Google-Maps-card style per the human's reference.
4. **By-Doctor mode now shows per-doctor connect options directly on each card** (not just a generic "Book" button): a clinic pill (opens Maps), an Online pill (requests an online consult with that specific doctor), and a Call pill — addressing the human's ask that "options on how to connect with them should be visible" without needing to first switch the top-level browse-mode toggle.

Verified in-browser: both onboarding-restriction fixes (badge no longer overlaps), the real clinic's Directions/Call links resolve to the correct URLs, Online Consultation slot-tap produces a dismissible confirmation, and the Plan tab's "My Likely Type" / "Tests to Get" / "Your Full Report" sections all render correctly from a mocked full AI plan — including confirming the WhatsApp share button builds the complete, correctly-formatted report text and the PDF downloads with no console errors.

### First live test, 2026-08-21 — found a real bug, fixed, re-verified live

Human added `GROQ_API_KEY` to the `sukoon-webapp` Vercel project and pushed; tested the deployed app end-to-end (`https://sukoon-app-eta.vercel.app`) through real onboarding → questionnaire → a real message send. Confirmed: the `sukoon-webapp` project's Root Directory, routing, and `GROQ_API_KEY` are all wired correctly — `/api/plan-quiz` is reachable and authenticates fine. But the actual Groq call failed with `"The model llama-3.3-70b-versatile does not exist or you do not have access to it."` — that model has been retired/is unavailable on this Groq account. Cross-checked against the frozen root app's chat/classify calls (`index.html`'s `FOCUS_MODEL`/`READINESS_MODEL`/`QUICK_REPLY_MODEL`, all `openai/gpt-oss-120b`), which are confirmed working in production on the same Groq key. Fixed `sukoon-webapp/api/plan-quiz.js` to use `"openai/gpt-oss-120b"` instead, pushed, and **re-verified live**: real Groq replies now come back correctly (network requests show `200`, not `404`), the periods question's quick-reply chips rendered exactly as specified, and tapping "Regular" sent it and correctly moved to the next (chip-less, free-text) question. The AI-backed questionnaire is now confirmed genuinely working end-to-end in production, not just locally mocked.

### To deploy (do this before it works at all)

1. In Vercel, open the **`sukoon-webapp` project's** settings (not the root/chat-app project) → Environment Variables → add `GROQ_API_KEY` (same secret value already used by the root project's `GROQ_API_KEY` is fine to reuse, or issue a fresh key — either way it's a separate env var entry scoped to this project).
2. Push to `main` — Vercel auto-deploys `sukoon-webapp` on every push, and `sukoon-webapp/api/plan-quiz.js` will be picked up automatically as a serverless function (zero extra Vercel config needed, no `vercel.json` required for a plain `.js` function).
3. **This stays at 2 Vercel projects total** — the new function deploys as part of the existing `sukoon-webapp` project, not a new one, since Vercel scopes `api/` folders to whichever project's Root Directory contains them.
4. First real test: go through the full onboarding flow on the live deployment and confirm a real Groq reply comes back (check the browser Network tab for the `/api/plan-quiz` call, and Vercel's function logs if it errors — `console.error` calls in `plan-quiz.js` will show up there).

### What the reference tool actually is (this matters — it's not what we built)

**⚠ Security note, not a build task:** the reference tool's source has a live Groq API key hardcoded directly in client-side JS (`DEMO_KEY = 'gsk_...'`), shipped to a public static site — anyone can view-source and use it. Flagged to the human directly; they may want to revoke it on Groq's console independent of any of this work. **Do not port that pattern.** If we go the AI-backed route below, the key must live server-side, exactly like the existing chat app already does it (`api/chat.js` — a Vercel function that keeps `GROQ_API_KEY` out of the browser). That pattern already exists in this repo and should be reused, not reinvented.

### What the reference tool actually is (this matters — it's not what we built)

Our `PlanQuestionnaire.jsx` is a **static, local, rule-based** 5-question chip-select wizard that deterministically maps answers to one of a few canned plan templates (`buildPlan()` in `planTemplates.js`) — no network call, no AI.

The reference tool is a **real LLM conversation**: free-text chat with Groq (`llama-3.3-70b-versatile`), driven by one large system prompt that tells the model to ask ~14 questions one at a time in natural language, then — after ~14 exchanges — emit a structured JSON block (`<<<PLAN>>>...<<<END_PLAN>>>`) that the frontend parses and renders as a rich result card. The model is doing real work here: interpreting free-text answers, classifying the user into a "driver" profile, and writing personalised copy. This is a materially different (and materially more expensive/complex) feature than what exists today.

**Reference's 14 questions, in order** (from its system prompt): first name, age, height & weight, period regularity (regular 21-35 days / irregular / mostly absent), acne/unwanted hair/hair thinning (which ones), fatigue/cravings/belly weight, which symptom bothers them most, post-meal energy pattern, gut symptoms (bloating/IBS/antibiotics), diet type (veg/vegan/non-veg/pescatarian), cuisine, food avoidances, work situation (desk/active/shift/WFH/student), main goal (fertility/weight/skin & hair/energy/regular cycles/general health). Our current 5 questions are a much shorter, inferred approximation of this.

**Reference's output structure** (the `<<<PLAN>>>` JSON) is much richer than our `{ phases: [...] }`:
- `profile`: a `title` + `mainDriver` (one of: Insulin-driven / Gut-inflammation-driven / Androgen-driven / Stress-driven) + optional `overlay` (androgen/metabolic/stress) + `ruleOut` (always thyroid/prolactin) + a 2-sentence `explanation` referencing the user's own words.
- `tests`: array of `{ name, note, tag }` where tag is `priority | confirmatory | rule_out | base` — e.g. always TSH+prolactin (rule_out) and Vitamin D+lipids (base); fasting insulin+OGTT if insulin-driven (priority); testosterone/DHEAS if androgen (confirmatory); CRP/ESR if gut-driven (confirmatory).
- `plate` (3 short diet tips, cuisine-aware) + `plateNote`.
- `movement` (2-3 tips, matched to work type) + `movementNote`.
- `clinician` (2-4 things to discuss with a real doctor, explicitly "don't start on your own") + `clinicianNote`.
- `timeline`: 3 checkpoints (`1-2 WEEKS`, `2-3 MONTHS`, `~3 MONTHS`) each with a `when`/`what`.

Visually, the reference is a scrolling chat thread (assistant/user bubbles, typing-dots loading state), not a one-question-per-screen wizard like ours.

### Decision (2026-08-21): Option A — fully AI-backed, matching the reference. Built same session — see "IMPLEMENTED" summary and file list above.

**Still open:**
1. ~~Live-deploy verification~~ — **done, 2026-08-21**, see "First live test" above. Confirmed working end-to-end on Vercel with a real Groq call.
2. Exact question list is the reference's 14, kept close to verbatim (re-voiced, not reworded question-by-question) — human hasn't reviewed the adapted prompt text itself yet.
3. `profile.journeys` is passed to the AI as context (told to weight questions toward the chosen journey(s)) but the model's actual behavior here is unverified without a live run.
4. Whether the `plate`/`movement`→lifestyle, `tests`/`clinician`→medical, `timeline`→consistency mapping (see `aiPlanMapper.js` above) is the right long-term shape, or should evolve once real AI output can be seen — it's a reasoned first cut, not signed off as final.

## Supabase persistence + auth + AI context wiring, 2026-08-24

Session goal stated by the human: finalize the app across two work streams —
backend/database integration, and content. Backend chosen first. Everything
in this section and the next was done in one continuous session.

**Auth.** Email+password via Supabase Auth, explicitly chosen over phone/WhatsApp
OTP because of Twilio/WhatsApp Business setup friction. New `Auth.jsx/.css`
screen, inserted right after Splash (see Navigation section for the new
onboarding order). No forgot-password flow — real, known gap.

**Schema.** `sukoon-webapp/supabase/schema.sql` (new) — two tables:
- `profiles` (id, name, gender, age, tags, location, journeys, quiz_answers,
  plan — all jsonb/array as appropriate — created_at, updated_at)
- `tracking` (user_id, habit_log/periods/symptom_log/weight_log jsonb,
  created_at, updated_at)

Both have Row Level Security scoped to `auth.uid()`, plus a
`SECURITY DEFINER` trigger (`handle_new_user()`) that auto-inserts empty
`profiles`/`tracking` rows the moment someone signs up, so the rest of the
app never has to special-case "row doesn't exist yet."

**Data layer.** `sukoon-webapp/src/data/db.js` (new) — `fetchUserData(userId)`,
`saveProfileFields(userId, fields)`, `saveTracking(userId, tracking)`.
Handles camelCase (app-side) ↔ snake_case (DB-side) mapping, and deliberately
never throws on a Supabase query error — logs and returns empty defaults
instead, so a transient DB hiccup can't crash the app.

**`App.jsx` rewrite.** Added `"loading"`/`"auth"` stages, a
`resumeStageFor(profile)` helper that resumes a returning user at the right
onboarding step (`!name → "about"`, `!journeys.length → "journey"`,
`!plan.phases.length → "plan-quiz"`, else straight into the app — so nobody
who already finished onboarding ever sees it again), a session-bootstrap
`useEffect` that calls `supabase.auth.getSession()` on load, and every
tracking mutator (`toggleHabit`, `logPeriodToday`, `logSymptom`, `logWeight`)
plus the three onboarding-continue handlers now persist via
`saveProfileFields`/`saveTracking` in addition to updating local state.

**Client setup / config-error surfacing.** `src/lib/supabaseClient.js` reads
`import.meta.env.VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`. If either is
missing or `createClient` throws, it exports a `supabaseConfigError` string
instead of a client; `App.jsx` renders a visible "Configuration problem"
message with the exact missing var names instead of silently rendering a
blank/broken app. This surfaced a real deployment issue on the first
deploy — see "Bug-fix rounds" below.

**AI context wiring.** New `src/data/profileContext.js` —
`summarizePlan(plan)`/`summarizeTracking(tracking)`, pure functions
returning short natural-language strings (or `null` if there's nothing to
summarize yet). Both `planQuizPrompt.js` (Plan Quiz) and
`doctorConciergePrompt.js` (Doctor Concierge) now include the user's tags,
location, existing plan summary, and tracking summary in their system
prompt's "ALREADY KNOWN" block — so a returning user isn't re-asked things
the app already knows, and the AI can reference their actual plan/tracking
naturally. Same two summarizers are reused a third time by the Companion
port below, rather than writing a third summarization path.

## Sukoon companion chat ported in-app, 2026-08-24

**Why.** The bottom-nav Sukoon tab used to be `<iframe src={VITE_CHAT_APP_URL}>`
pointing at the original root chat app's own separate Vercel deployment —
deliberately, so the hand-tuned prompt/safety/crisis logic would never need
to be touched. The human explicitly asked to lift that this session: "the
whole code exists to simply use it to make it into a new in-app companion."
An iframe to a separate Vercel project can never see this app's login
session or Supabase data by construction — porting was the only way to get
the companion access to the user's actual plan/tracking, matching what Plan
Quiz and Doctor Concierge already had.

**Explicit ground rules, agreed before writing any code:**
- **Faithful port, not a rewrite.** This is a mental-health-adjacent,
  safety-tuned feature (crisis detection, an MI state machine, a
  self-evaluation loop, MITI coaching-quality scoring). Goal was relocation,
  same statement order throughout, not simplification.
- **Chat transcripts stay ephemeral** — explicit decision, no Supabase
  persistence for conversation history in this pass. Only the original
  app's own `localStorage`-based memory-fact extraction and MITI aggregate
  stats carry over, using the **same localStorage keys** as the root app
  (`sukoon_memory`, `sukoon_memory_enabled`, `sukoon_mi_aggregate`,
  `sukoon_model`) — safe since it's a different origin already.
- `api/chat-stream.js` (the edge/streaming variant in the root app) is
  confirmed unused by its own frontend — out of scope, not ported.

**Architecture — three-layer split**, because ~900 lines of tuned state
machine is not incidental UI glue:
- `src/lib/companionEngine.js` (new, ~700 lines) — all the ported logic, no
  React. `createCompanionState()` + `createCompanionEngine(callbacks)`
  returning `{ sendMessage, init, setProfile, setMemoryEnabled,
  forgetMemory, getDebugSnapshot, resetAggregate, setModel, showHelp,
  MODEL_OPTIONS }`. The original's ~30 module-level `let`s became one
  `state` object closed over by the engine instance — same closure shape as
  the original, just not module-global.
- `src/hooks/useCompanionEngine.js` (new) — thin React binding
  (`useState`/`useEffect`/`useRef` only), wires engine callbacks
  (`onBubble`, `onUpdateBubble`, `onClearQuickReplies`, `onTypingStart/End`,
  `onSendingChange`, `onCompactChange`, `onMemoryChange`,
  `onFidelityUpdate`) to React state.
- `src/screens/Companion.jsx/.css` (new) — rendering only.

Ported near-line-for-line, same branch/priority order as the source
(`index.html`'s inline JS + `conversation/prompt.js`): crisis detection
(`isCrisisMessage`/`CRISIS_PATTERNS`), the classify/focus/readiness
pipeline, the full MI note-builder chain (`buildStateNote`,
`buildArbiterNote` and its priority chain — `directAskNote ||
maxReachedNote || thinReplyNote || tensionNote || focusChangedNote ||
ventCheckNote || otherStateNote || readinessNote || stageDefaultNote` —
copied exactly, not reordered), `evaluateReply`/`auditComplexFlag`,
`codeCompanionTurn` (MITI coding), `extractMemory`,
`splitIntoBubbles`/`renderBubbleSequence`, `maybeAttachQuickReplies`. DOM
manipulation became callbacks (`onBubble`, `onUpdateBubble`) instead of
`appendChild`/`getElementById`.

**Prompt.** `src/data/companionPrompt.js` (new) — verbatim copy of the root
`conversation/prompt.js` (both `CANONICAL_SYSTEM_PROMPT` and
`SPECIFIC_QUESTION_SYSTEM_PROMPT` untouched, with a provenance comment
noting it's a manually-synced copy — the two files will drift over time if
either is edited without updating the other), plus one additive change:
`buildConversationPrompt` now accepts a `userContext` string, pushed first
into `dynamicParts` (ahead of memory/scope) when present. `userContext` is
built fresh every turn in `companionEngine.js` via
`buildUserContextBlock(profile)`, reusing `summarizePlan`/`summarizeTracking`
from `profileContext.js` — same pattern as Plan Quiz/Doctor Concierge, no
duplicated summarization logic.

**API routes.** `sukoon-webapp/api/companion-chat.js` (new) — copy of root
`api/chat.js` (OpenRouter-backed; needed a new `OPENROUTER_API_KEY` env var
on the `sukoon-webapp` Vercel project — see env var list above).
`sukoon-webapp/api/companion-classify.js` (new) — copy of root
`api/groq-classify.js` (Groq-direct; reuses the already-configured
`GROQ_API_KEY`, no new env var needed).

**Deliberate scope cuts:**
- **Model picker `<select>` dropped, plumbing kept.** It was a dev tool per
  the source's own comment; letting end users swap the tuned model for an
  untuned one was judged a small real risk with no user benefit.
  `MODEL_OPTIONS`/`setModel` etc. all still work via `localStorage.sukoon_model`
  for engineer QA, just no visible UI. The header's "⋮ more" popover
  collapsed to a single direct Memory icon button as a result.
  Debug panel (5-tap-the-mascot gesture, MITI instrumentation viewer) was
  kept as-is — zero visible change from the source.

**Verification ceiling, same as the Supabase work**: this sandbox's network
policy blocks outbound calls to hosts not on its allowlist (confirmed for
`supabase.co`; `openrouter.ai`/`api.groq.com` were never independently
tested but are almost certainly the same). Everything here was verified as
far as the sandbox allows — clean `npm run build`, the screen rendering
correctly against a mocked/local profile, no React console errors — but
**real multi-turn conversation behavior (crisis-phrase handling, quick
replies, memory extraction, which arbiter note actually gets picked) has
never been verified live by anyone yet**, including the human — see Open
items below.

### Bug-fix rounds after the initial merge (all 2026-08-24)

The human reported these one at a time after merging; each was root-caused
and fixed as its own small PR rather than batched:

1. **App stuck on loading spinner forever.** `supabase.auth.getSession().then(...)`
   in `App.jsx` had no `.catch()` — any rejection left `stage` at
   `"loading"` permanently with no visible error and nothing in the UI to
   act on. Fixed by adding `.catch()` (falls back to `"splash"` + logs the
   error) and wrapping the `onAuthed` post-login profile fetch in
   `try/catch` with the same fallback. (Both fixes are visible in the
   current `App.jsx` — see the session-bootstrap `useEffect` and the `Auth`
   screen's `onAuthed` handler.)
2. **Supabase env vars missing/misnamed.** The Supabase↔Vercel integration
   pushed vars under Next.js naming (`NEXT_PUBLIC_SUPABASE_URL` etc.)
   instead of the `VITE_` prefix Vite requires. This is not a naming
   convention — Vite strips any env var not prefixed `VITE_` out of the
   client bundle at build time, as a hard security boundary, regardless of
   what name the code asks for. `supabaseConfigError` (see above) correctly
   surfaced this as a visible "Configuration problem" screen rather than a
   silent blank page. Fix was adding `VITE_SUPABASE_URL`/
   `VITE_SUPABASE_ANON_KEY` as **new** env vars in Vercel (values copied
   from the existing `NEXT_PUBLIC_*` ones), not renaming the originals —
   the `NEXT_PUBLIC_*` vars may still be read by other tooling/the old
   integration, so they were left alone.
3. **AI backend appeared to not respond** (instant identical fallback
   replies every time). Diagnosed as the real `/api/companion-chat` call
   failing fast, but this sandbox cannot reach the live Vercel deployment
   to inspect the actual error (confirmed blocked via curl). Human
   self-resolved by re-pasting the `OPENROUTER_API_KEY` value in
   Vercel — implies the original key was stale/incorrect. OpenRouter
   confirmed working after that; **Groq-backed classifiers not
   independently confirmed** (human's own words: "not sure about groq
   though. probably it's functional").
4. **Header art missing.** Added `.companion__header-bg`/
   `.companion__header-scrim` divs + CSS, reusing the same
   `/brand/sukoon-header-art.webp` asset and mask-image-fade-plus-scrim
   pattern `TopBar.css` already uses elsewhere in the app.
5. **Send button, "more" button, Memory chevron, tagline leaf icon, and
   hero-divider not matching the original.** The initial port had
   substituted `lucide-react`'s generic icons for several of the source's
   bespoke inline SVGs (most visibly the send button). Human called this
   out directly and raised general concern about porting fidelity, since
   this is meant to be *exactly the same code*, not a redesign. Fixed by
   extracting the exact original SVGs from the root `index.html` and
   cross-checking byte-for-byte via `grep`/Python before considering each
   one resolved — this became the standing verification method for every
   subsequent icon/asset fix in this round. Also fixed while cross-checking:
   hero top padding (was 30px, source is 10px).
6. **Footer missing a line.** Original has both a disclaimer line *and* a
   separate "Breathe · Pause · Be kind"-style tagline-footer line with a
   leaf icon; the port only had the disclaimer. Added the missing
   `<p className="companion__tagline-footer">` + matching CSS (hidden in
   compact mode, matching source behavior).
7. **Typing indicator had a glow halo the human didn't remember from the
   original.** Verified rigorously against source first — the glow ellipse
   genuinely exists in `index.html` with identical markup/CSS, confirmed by
   rendering the port in isolation against a fresh extraction of the
   original and comparing screenshots directly; this was not a porting bug.
   Rather than keep re-litigating "is this actually different," the human
   was asked to make an explicit design call given the two matched — chose
   to remove the glow going forward. Implemented as
   `.companion-typing-glow { display: none; }` in `Companion.css`.

**Verification technique used throughout**: a temporary local test harness
(`companion-test.html` + `src/companion-test-main.jsx`) rendered
`Companion.jsx` in isolation against a mock profile, bypassing the
now-unreachable-from-this-sandbox Supabase auth flow, screenshotted via
Playwright with a locally-available Chromium — then deleted every time
(`rm` + `git status --short` confirmed clean) before committing, so no
stray test files ever landed in a commit.

**Deleted as cleanup**: `src/screens/ChatEmbed.jsx`, `ChatEmbed.css` (confirmed
zero remaining references first). `VITE_CHAT_APP_URL` is consequently unused
— see env var list above.

## Suggested next steps, in order

1. ~~Rebuild the **Start/splash screen**~~ — **parked at ~80% by human's own
   call on 2026-08-21**, not finished. Known follow-ups when it's picked
   back up: mascot needs more work, UI component placement/hierarchy
   needs refinement, and information density needs to come down. See
   status table above for full history.
2. Onboarding (About You, Choose Journey) is close to reference; the new
   Plan Questionnaire has no reference to compare against (see Open
   items below) but is functionally verified end-to-end.
3. Home, Track, and Profile still have no *reference screenshots* in the
   original design sense — they were rebuilt 2026-08-21 from the human's
   own written content spec instead (see status table), not a mockup.
   Still worth flagging to the human rather than assuming "done."
4. Vercel auto-deploys `sukoon-webapp` on every push to `main` (no
   Root Directory changes needed anymore — that's already fixed).
5. **Verify real multi-turn Companion conversation behavior on the live
   deployment** (2026-08-24) — nobody has confirmed crisis-phrase handling,
   quick replies, memory extraction, or which arbiter note actually gets
   picked in a real conversation yet. Only UI/error-path behavior and one
   confirmation that "OpenRouter seems to work" exist so far. This is the
   single most important thing to verify next given it's a
   safety-critical feature — see the Companion section above for full
   context.
6. **Content work stream is still fully open** (2026-08-24) — the session's
   two declared work streams were backend/database (this session's focus)
   and content; content hasn't been started. Includes: canned Home-screen
   copy ("Sukoon noticed" messages, still first-draft), the full Plan
   Questionnaire port to match the real reference tool's 14 questions (see
   "Porting the real Plan Questionnaire" section — still a scaffold), and
   custom illustrated icons replacing emoji placeholders.
7. **Decommission the old root chat-app Vercel project** — open decision
   for the human, not done. Nothing in `sukoon-webapp` links to it anymore
   as of 2026-08-24 (see "Why two Vercel projects" above), but it's still
   deployed and still costs a `GROQ_API_KEY`/`OPENROUTER_API_KEY` pair if
   left running.
8. **Build a forgot-password flow** — real, currently-missing gap in
   `Auth.jsx` (2026-08-24).

## Open items / things not yet decided

- Dark mode for the Plan screen (shown in reference but not yet built)
- Whether Home and Track need their own reference designs from the human
- Splash illustration source is resolved (cropped from the reference
  screenshot itself, see status table) — no longer open.
- **Plan Questionnaire's exact question list** (2026-08-21) — only "What's
  your name?" was actually observed in the referenced tool
  (pcos-root-plan.tiiny.site); the other 4 questions were inferred, not
  confirmed word-for-word with the human. Revisit if the human has a
  specific list in mind.
- **The questionnaire built here is explicitly a first-pass scaffold, not
  the final port** — confirmed twice by the human on 2026-08-21. First,
  right after reviewing this build: "in the future, we will have to port
  the questionnaire to this app, and the results integrated into the plan
  tab." Then again after seeing it live: "i see that you haven't
  integrated the same questionnaire as the link that i had shared with
  you. it's fine, but we will need to modify it." Read both as: a fuller
  port of the actual reference questionnaire's real question set — and a
  tighter integration of its results into Plan — is still expected future
  work, not something this pass finished. Don't treat
  `PlanQuestionnaire.jsx` / `buildPlan()` as done; they're the scaffold
  this future work replaces or substantially extends. **Human explicitly
  said to hold off on this — do not start it without being asked.**
- **Question-progress indicator should be more visual** (human, 2026-08-21):
  "when we are asking the questions, we should put in some sort of tab or
  something saying 1/n questions." Currently `PlanQuestionnaire.jsx`
  already shows a plain text subtitle ("Question 1 of 5") via
  `OnboardingHeader`'s subtitle prop — the human wants something more
  visual (progress bar, step dots/tabs), not just text. **Also explicitly
  told to hold off — do not implement without being asked.**
- **Quiz → Home/Plan connection wasn't visually obvious** (human, same
  message: "i couldn't see how the first screens and questionnaire led
  to this home screen"). Completing the quiz currently jumps straight to
  Home with no transition or confirmation that a plan was just built —
  worth a "your plan is ready" moment or some other visible link between
  finishing the quiz and what shows up on Home/Plan, when this area gets
  revisited.
- **"Sukoon noticed" copy** (2026-08-21) — the 2-3 canned messages on Home
  are a first draft, not signed-off final copy.
- **Custom illustrated icons** — Choose Journey, its tag chips, and Home's
  old domain grid all use plain emoji where the original reference/prior
  design intent called for custom painterly illustrations. Needs real
  icon assets to close, same as the splash mascot/hero-photo situation.
  Still open as of 2026-08-24, unchanged this session.
- **Forgot-password flow** (2026-08-24) — `Auth.jsx` has sign up and log in,
  no password-reset path. Real gap, not yet built.
- **Old root chat-app Vercel project decommissioning** (2026-08-24) — it's
  orphaned (nothing links to it) but still deployed; whether/when to tear
  it down is the human's call, not done.
- **Real multi-turn Companion behavior is unverified live** (2026-08-24) —
  crisis detection, quick replies, memory extraction, and the MI arbiter's
  note selection have only been checked against source code and local/mocked
  rendering, never a real conversation on the live deployment. This
  sandbox cannot reach the deployed app to test it directly (network policy
  blocks `supabase.co`/likely `openrouter.ai`/`api.groq.com` too) — needs a
  human (or a session with unblocked network access) to actually have a
  conversation with it and watch for: crisis-phrase responses, quick-reply
  correctness, whether memory facts get extracted/reused correctly across
  turns, and whether `userContext` (the new profile/plan/tracking summary
  injected into the prompt) causes any tone drift like over-familiar
  name-dropping — flagged as a specific risk to watch for when this was
  built.
- **Two prompt files will drift** — `sukoon-webapp/src/data/companionPrompt.js`
  is a manually-synced copy of the root `conversation/prompt.js`, not a
  shared import (same pattern as `planQuizPrompt.js`/`doctorConciergePrompt.js`
  already established). If the source prompt is ever tuned further, remember
  to port the change into `companionPrompt.js` too, and vice versa.
- **State-of-the-world reminders for whoever picks this up** (2026-08-24):
  the `sukoon-webapp` Vercel project now needs 4 env vars, not 2 —
  `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY` (see "Why two Vercel projects" above for the
  full list and the `VITE_` vs `NEXT_PUBLIC_` gotcha that already bit us
  once). On GitHub, clicking a PR's "Update branch" button merges `main`
  INTO the PR branch — it does not merge the PR itself; use "Merge pull
  request" to actually land it. Also: pushing new commits to a branch after
  its PR has already been merged does NOT reopen that PR or create a new
  one automatically — those commits sit orphaned until a fresh PR is opened
  for them. Both of these caused real confusion this session (twice, for
  the second one) — worth remembering before repeating either mistake.
