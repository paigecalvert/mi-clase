# Supabase Migration Summary

This app started as a self-contained Express/Postgres/MinIO/LibreTranslate app with Helm/on-prem packaging. The current direction is Supabase-first: keep the app simple to run, make it easy to deploy publicly, and defer on-prem concerns until they are useful again.

## Goal

Build a personal SaaS-style Spanish class notes app that is easy to use and easy to deploy.

The target architecture is:

```text
React/Vite
  -> Supabase Auth
  -> Supabase Postgres
  -> Supabase Storage
  -> Supabase Edge Function
    -> Azure Translator
```

## Phase 1: Remove Replicated Platform Packaging

Removed Replicated-specific release and support-bundle code, including:

- KOTS/Embedded Cluster manifests
- Replicated Helm SDK dependency
- support-bundle chart resources and app UI
- Replicated SDK proxy code
- CI jobs that created releases, customers, channels, and CMX clusters

Why:

- The immediate goal shifted away from packaging for the Replicated Platform.
- Keeping Replicated-specific code would add noise while learning SaaS/Supabase patterns.
- On-prem can be revisited later from a cleaner baseline.

## Phase 2: Simplify Local Dependencies

Removed Redis because it was not used by app features.

Redis only appeared in:

- startup logging
- health check output
- Docker Compose
- Helm chart plumbing

Why:

- No user-facing workflow read from or wrote to Redis.
- Removing unused infrastructure makes the app easier to reason about and cheaper to deploy.

## Phase 3: Add Supabase Auth

Added Supabase Auth to the React app using `@supabase/supabase-js`.

Files added:

- `client/src/supabaseClient.js`
- `client/src/Auth.jsx`

Why:

- Supabase Auth provides managed sign-up, sign-in, sessions, and browser-safe auth tokens.
- It lets each user have their own app data without building custom auth from scratch.
- The frontend uses the publishable Supabase key, which is designed to be visible in browser code.

## Phase 4: Move App Data To Supabase Postgres

Created `supabase/schema.sql` to define:

- `classes`
- `notes`
- `vocabulary`
- `homework`
- `homework_files`
- `quizzes`
- `quiz_words`

Added Row Level Security policies so users can only access records they own.

Ownership model:

- `classes.user_id` points to the Supabase Auth user.
- `quizzes.user_id` points to the Supabase Auth user.
- notes, vocabulary, and homework inherit ownership through their parent class.
- quiz words inherit ownership through their parent quiz.

Why:

- Single-user accounts are enough for this app.
- Organizations and memberships would add complexity without current value.
- SQL in the repo documents the database shape and can be rerun when resetting the test app.

## Phase 5: Add A Frontend Supabase Data Layer

Added `client/src/api.js`.

Why:

- Supabase queries are more detailed than the old `fetch('/api/...')` calls.
- Keeping queries in one file keeps UI components focused on UI state and rendering.
- The data layer adapts Supabase nested responses to the shape the existing components expect.
- It gives one place to adjust table/query details later.

## Phase 6: Move Translation To A Supabase Edge Function

Added:

- `supabase/functions/translate/index.ts`

The React app now calls:

```js
supabase.functions.invoke('translate', ...)
```

The Edge Function calls Azure Translator using secrets stored in Supabase:

- `AZURE_TRANSLATOR_ENDPOINT`
- `AZURE_TRANSLATOR_REGION`
- `AZURE_TRANSLATOR_KEY`

Why:

- Translation API keys should not live in browser code.
- Edge Functions provide a small server-side runtime without keeping an Express server around.
- Azure Translator has a useful free tier and is more reliable than unauthenticated public LibreTranslate.

## Phase 7: Move Homework Files To Supabase Storage

Added:

- `supabase/storage.sql`
- Supabase Storage helpers in `client/src/api.js`

Files are stored in a private `homework-files` bucket. Object paths are prefixed with the signed-in user's ID:

```text
<user-id>/classes/<class-id>/homework/<homework-id>/<file-id>.<ext>
```

Why:

- Notes, titles, descriptions, and metadata belong in Postgres.
- Uploaded binary files belong in object storage.
- Private storage plus signed URLs gives controlled access without exposing files publicly.
