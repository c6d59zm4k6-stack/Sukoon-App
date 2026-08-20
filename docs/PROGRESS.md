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
  (`App.jsx`: `stage` for onboarding, `tab` for the bottom nav). Fine at
  this scale (5 tabs + 2 onboarding steps + splash).
- **Bottom nav = Home · Plan · Track · Chat · You** (5 tabs). "Talk to
  Experts" is NOT its own tab — it's reached from Home (see
  `homeView` state in `App.jsx`). Confirmed with the human.
- App name is **Sukoon**; the chat tab itself is just labeled **Chat**
  (this was a naming correction partway through — Sukoon used to refer
  to the chat app specifically, now it's the whole product).

## Screen-by-screen status

Human's own words: "for the build, we can do page by page."
Compare `reference-screenshots/` vs `current-build-screenshots/` for each.

| Screen | File(s) | Status |
|---|---|---|
| Start (splash) | `src/screens/Splash.jsx/.css` | **Done, 2026-08-21.** On 2026-08-20 this was rebuilt to match `reference-screenshots/01-start.png` by cropping that mockup's own illustration. On 2026-08-21 the human shared a separate TanStack Router + Tailwind prototype (not part of this codebase — no router/Tailwind/TypeScript exists here, see architecture decisions above) showing a preferred visual direction; that *look* was ported into our existing plain-CSS component rather than adopting the new stack: title is now "Sukoon Health" with a circular leaf badge, tagline sits in a translucent pill, each feature is a light icon square over a separate dark label chip, and the CTA is a glassy blurred pill with a purple glow. The human then supplied the prototype's actual source images, which now back the screen directly: `sukoon-webapp/public/brand/start-hero-scene.jpg` (full sunrise-over-Himalaya illustration, used as a single full-bleed `background-size:cover` — no CSS-constructed sky gradient needed since the photo already has one) and `mascot-cloud.png` (a glossy 3D-rendered cloud with real alpha transparency, replacing the flatter `sukoon-logo-mascot.svg`). The human isn't fully happy with the 3D mascot yet — kept as a working draft. A follow-up information-hierarchy/readability pass (same day) shrank the mascot 132px→84px, added a layered `text-shadow` to the "Sukoon Health" wordmark (it sits directly over the sun disc and was unreadable as plain white text), added matching shadows to the other unbacked white text (CTA label, "Create an account" line, divider, secure line) as contrast insurance against the photo, and replaced the two-button Google/Apple social row with a smaller 3-up grid — hand-drawn inline SVGs for the Google and Apple marks (no brand-icon package installed) plus a `Phone` (lucide) option for OTP login, chosen over Facebook/WhatsApp since phone-OTP is the more standard pattern for an Indian consumer health app and there's no real "Sign in with WhatsApp" OAuth flow. Re-verified at all three breakpoints plus a clean build.

A second same-day follow-up caught real regressions from that pass. The human reported the feature/social icons had become unreadable, the mascot no longer looked centred, and the title/tagline looked off-alignment and smaller — asked "why did you change the placements" and asked for a formal WCAG readability check before finalizing. Investigated with actual measurements rather than eyeballing: a script sampling the real composited pixels (hero photo × gradient × any chip) behind every text element and computing WCAG 2.1 contrast ratios found the `text-shadow`-only approach for the wordmark was **a real failure — 1.73:1 against the required 3:1** (large bold text), because it sat almost exactly on the sun disc and text-shadow doesn't count toward formal contrast, only solid foreground/background color does. Everything else already passed comfortably (6.4–18:1). Separately, `getBoundingClientRect` measurements showed the mascot and the wordmark's *box* were both already exactly at viewport-center — no positioning bug — but the leaf badge sat only to the right of the title text *inside* the flex row, which centered the box while visually shifting the readable text ~13px left of true center; that reads as "off-center" even though it technically wasn't. Fixes: the wordmark became an opaque blurred pill (same treatment as tagline/feature labels) with the leaf as a `position:absolute` corner badge — fixed contrast (8.06:1) and the centering illusion together. Feature icons went back up to 46px, social icons to 19px.

A **third** same-day round: the human felt the opaque pill hid the sun completely and asked to go back to shadow-only text for the title (explicitly accepting the contrast trade-off — "maybe it's ok"), plus wanted the tagline repositioned so the sun stays mostly visible through it. Reverting the wordmark's chip surfaced a real, previously-masked layout bug: `.splash__mascot` (an `<img>`, inline by default) and `.splash__wordmark` (`display:inline-block`) were **inline siblings on the same line**, not stacked — they had only ever appeared correctly stacked because the wordmark (padded pill, or later a wide flex row) was wide enough to force a wrap. Once the wordmark got narrower, they fit side-by-side and the mascot visibly drifted left. Fixed properly rather than relying on wrap-coincidence again: `.splash__mascot` is now `display:block; margin:0 auto`, `.splash__wordmark` is `display:flex; justify-content:center` (guaranteed own line, full width) wrapping a new inner `.splash__wordmark-inner` span that does the old shrink-to-fit/badge-anchor job, and `.splash__tagline` is `display:block; width:fit-content; margin:auto`. Re-measured: mascot/wordmark-text/tagline all land at exactly 187.5px center on a 375px viewport. For the sun: the wordmark reverted to shadow-only text per the human's explicit request (contrast is knowingly below WCAG at this position — ~1.77:1 against a 3:1 requirement, sun now fully visible through/around it); the tagline kept a much lighter frosted chip, tuned by iterating its alpha against the same live contrast script — 0.58 opacity lands at 5.08:1 (passes 4.5:1) while still letting most of the sun's glow show through, versus the earlier fully-opaque 0.68 that blocked it outright. Re-verified at 375×812, 375×667, and a clean `npm run build`. |
| Onboarding — Choose Journey | `src/screens/onboarding/ChooseJourney.jsx/.css` | Close to reference, minor polish possible |
| Onboarding — About You | `src/screens/onboarding/AboutYou.jsx/.css` | Close to reference |
| Home | `src/screens/Home.jsx/.css` | First-pass; not directly based on a reference screenshot (none was provided for Home specifically) — built from the product brief instead |
| Plan | `src/screens/Plan.jsx/.css` | Close to reference (light mode only was built; reference also showed a dark-mode variant, not yet addressed) |
| Track | `src/screens/Track.jsx/.css` | First-pass; no reference screenshot was provided for this screen either |
| Talk to Experts | `src/screens/Experts.jsx/.css` | Close to reference, not yet re-verified live since last edit |
| Profile ("You") | `src/screens/Profile.jsx/.css` | First-pass; no reference screenshot provided |
| Chat | `src/screens/ChatEmbed.jsx/.css` | Just an iframe wrapper — the actual UI is the untouched chat app |

## Shared components (edit once, affects multiple screens)

- `src/components/TopBar.jsx/.css` — header used on Plan/Track/Experts/Profile
- `src/components/OnboardingHeader.jsx/.css` — header used on the two onboarding screens
- `src/components/BottomNav.jsx/.css` — the 5-tab bar
- `src/components/ProgressRing.jsx` — circular progress used on Plan

## Suggested next steps, in order

1. ~~Rebuild the **Start/splash screen**~~ — done 2026-08-20, see status
   table above. Worth a final human eyeball against
   `reference-screenshots/01-start.png` before moving on.
2. Proceed screen-by-screen in the order above, using each
   reference screenshot as the target.
3. Home, Track, and Profile have no reference screenshots — flag this to
   the human rather than assuming the first-pass version is "done."
4. Vercel auto-deploys `sukoon-webapp` on every push to `main` (no
   Root Directory changes needed anymore — that's already fixed).

## Open items / things not yet decided

- Dark mode for the Plan screen (shown in reference but not yet built)
- Whether Home and Track need their own reference designs from the human
- Splash illustration source is resolved (cropped from the reference
  screenshot itself, see status table) — no longer open.
