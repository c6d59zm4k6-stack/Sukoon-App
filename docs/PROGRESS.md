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
      functions (Groq + OpenRouter). DO NOT MODIFY — this is frozen by
      explicit request. Deployed as its own separate Vercel project
      (root directory left blank/default).

  sukoon-design-assets/
    → Mascot, header art, color palette (SVG + PNG + webp), pulled
      directly from the chat app so they match exactly. See
      README_DESIGN_ASSETS.txt inside for what each file is.

  sukoon-webapp/
    → The NEW app being built: React + Vite, plain CSS (no Tailwind),
      design tokens ported 1:1 from the chat app's CSS variables
      (src/styles/tokens.css). Deployed as a SECOND, separate Vercel
      project with Root Directory set to `sukoon-webapp`.

  docs/  (this folder)
    PROGRESS.md — this file
    reference-screenshots/ — the target designs the human provided
    current-build-screenshots/ — what's actually live, for comparison
```

## Why two Vercel projects

One repo, two independent deployments:
1. **Chat project** — root directory blank, needs env vars
   `GROQ_API_KEY` and `OPENROUTER_API_KEY`.
2. **Webapp project** — root directory `sukoon-webapp`, needs env var
   `VITE_CHAT_APP_URL` set to the chat project's live URL (this is what
   the Chat tab's iframe points at — see `src/screens/ChatEmbed.jsx`).

Both were 404ing at various points during setup due to Root Directory
misconfiguration and missing env vars — both are now confirmed working
per the human ("navigation seems to be working").

## Architecture decisions already made (don't re-litigate)

- **Chat tab = iframe**, not a rewrite. The original chat app is embedded
  as-is via `<iframe src={VITE_CHAT_APP_URL}>`. This was chosen
  specifically so the hand-tuned prompt/safety/crisis-routing logic in
  the chat app never has to be touched or reimplemented.
- **Plain CSS over Tailwind**, using the ported token variables, to match
  the bespoke illustrated aesthetic without fighting a utility system.
- **No router library** — navigation is plain React state
  (`App.jsx`: `stage` for onboarding, `tab` for the bottom nav).
- **Bottom nav = Home · Plan · Track · Care · Sukoon · You** (6 tabs, as of
  2026-08-21 — was 5, see the big restructure noted in the status table and
  Navigation section below). "Care" is `Experts.jsx`, promoted to a
  top-level tab; it used to be reached only from a Home banner via a
  separate `homeView` state, which no longer exists. "Sukoon" is
  `ChatEmbed.jsx`, renamed from "Chat" at the human's request — still just
  the iframe, only the label changed.
- **Onboarding = Splash → About You → Choose Journey → Plan Questionnaire →
  main app** (4 steps, was 3 before the questionnaire was added — see
  status table). `App.jsx` carries a `profile` state object (name, gender,
  age, tags, location, chosen `journeys`, quiz `answers`, generated
  `plan`) threaded down as a prop to `Home`/`Plan`/`Profile`. This didn't
  exist before 2026-08-21 — `AboutYou`'s and `ChooseJourney`'s answers used
  to be silently discarded by `App.jsx`.
- App name is **Sukoon**; the chat tab itself is just labeled **Chat**
  (this was a naming correction partway through — Sukoon used to refer
  to the chat app specifically, now it's the whole product).

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
| Care (was "Talk to Experts") | `src/screens/Experts.jsx/.css` | Same screen, **promoted to its own bottom-nav tab 2026-08-21** (previously only reachable via a Home banner + `homeView` state, which no longer exists). No `onBack` is passed anymore since it's a top-level tab now — `TopBar` already omits its header row entirely when `onBack` is absent, so no `Experts.jsx` change was needed for that. (The `onBack`-driven click-through bug fixed earlier the same day, see Navigation section, only ever affected `OnboardingHeader`, not this screen's `TopBar`.) |
| Profile ("You") | `src/screens/Profile.jsx/.css` | **2026-08-21:** the hardcoded `"PCOS Care · Mental Well-being"` subtitle is now `journeyLabel(profile.journeys)`, genuinely derived from what the user picked in onboarding. First-pass otherwise; no reference screenshot provided. |
| Sukoon (was "Chat") | `src/screens/ChatEmbed.jsx/.css` | Just an iframe wrapper — the actual UI is the untouched chat app. Only the bottom-nav label changed (2026-08-21), this screen itself is untouched. |

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

## Porting the real Plan Questionnaire — IMPLEMENTED 2026-08-21 (untested live — see below)

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
1. Live-deploy verification — see "To deploy" above. Nothing below matters until this is confirmed working end-to-end on Vercel.
2. Exact question list is the reference's 14, kept close to verbatim (re-voiced, not reworded question-by-question) — human hasn't reviewed the adapted prompt text itself yet.
3. `profile.journeys` is passed to the AI as context (told to weight questions toward the chosen journey(s)) but the model's actual behavior here is unverified without a live run.
4. Whether the `plate`/`movement`→lifestyle, `tests`/`clinician`→medical, `timeline`→consistency mapping (see `aiPlanMapper.js` above) is the right long-term shape, or should evolve once real AI output can be seen — it's a reasoned first cut, not signed off as final.

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
