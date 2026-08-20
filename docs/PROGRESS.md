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
| Start (splash) | `src/screens/Splash.jsx/.css` | **Furthest from reference.** Human said current version "isn't even close." Reference has a warm sunrise scene with a woman meditating (journal, lantern, plant) — that illustration was never provided as an asset, so the current version approximates with a dark gradient over the mountain header art instead. This is the human's requested starting point for the next round of polish. |
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

1. Rebuild the **Start/splash screen** — this is where the human wants to
   resume. It needs to feel much closer to `reference-screenshots/01-start.png`.
   No matching illustration asset exists; either ask the human for one,
   generate/commission an equivalent, or get the gradient/mood closer
   using only the existing header art.
2. Then proceed screen-by-screen in the order above, using each
   reference screenshot as the target.
3. Home, Track, and Profile have no reference screenshots — flag this to
   the human rather than assuming the first-pass version is "done."
4. Vercel auto-deploys `sukoon-webapp` on every push to `main` (no
   Root Directory changes needed anymore — that's already fixed).

## Open items / things not yet decided

- Dark mode for the Plan screen (shown in reference but not yet built)
- Whether Home and Track need their own reference designs from the human
- Whether the splash illustration will be human-provided or AI-generated
