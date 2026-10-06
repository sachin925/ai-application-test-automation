# AGENTS.md

## Project overview

Playwright-based test automation framework for the sibling
[AI Notes](../ai-application) app (Express + vanilla JS, session-cookie auth,
notes CRUD, AI "Summarize" with a deterministic mock provider). This repo is
standalone: it drives a running app instance over HTTP/UI and imports nothing
from the app repo.

First-class AI-quality scenario support is the point of the framework:
hallucination, prompt injection, provider resilience (failure/malformed/slow),
faithfulness scoring, and a real-LLM soft-property spec gated on
`OPENAI_API_KEY`.

Stack: Node.js (CommonJS, no build step), `@playwright/test` ^1.63.0 (only
dependency). Not a git repository as of 2026-10-06.

## Commands

- `npm install` — install dependencies (requires Node >= 18).
- `npm test` — full suite. The Playwright `webServer` auto-starts the app from
  `APP_PATH` (default `../ai-application`) unless one is already running at
  `BASE_URL` (default `http://localhost:3000`).
- `npm run test:core` / `npm run test:ai` / `npm run test:real-llm` — grep the
  `@core`, `@ai`, `@real-llm` tags.
- `npm run report` — open the HTML report of the last run.

Verified on 2026-10-06: 23 passed, 1 skipped (`@real-llm` without
`OPENAI_API_KEY`), both auto-start and reuse-existing-server paths.

## Layout

- `playwright.config.js` — `workers: 1`, `retries: 0`, `timeout: 30000`,
  trace `retain-on-failure`, HTML report, `webServer` config.
- `fixtures/index.js` — extended fixtures: `api` (unauthenticated `AppClient`),
  `authedApi` (logged-in API client), `appPage` (logged-in page with seed data
  restored and AI mode `normal`), plus an `afterEach` AI-mode leak guard.
- `lib/app-client.js` — HTTP wrapper: test hooks (`reset`, `seed`, `ai-mode`),
  auth, notes CRUD, summarize.
- `lib/ai-assertions.js` — `expectSummaryGrounded`, `expectSummaryUnverified`,
  `expectNoRenderedHtml` (app renders AI output via `textContent`; any child
  element under `summary-text` means markup injection).
- `lib/injection-corpus.js` — prompt-injection/XSS payloads for the
  `ai-injection` matrix.
- `page-objects/` — `LoginPage`, `NotesPage` (editor, two-step delete,
  search/sort, summary panel).
- `tests/core/` — auth + notes CRUD/search/sort (`@core`).
- `tests/ai/` — `ai-baseline`, `ai-hallucination`, `ai-injection`,
  `ai-resilience`, `ai-faithfulness` (`@ai`), `ai-real-llm` (`@real-llm`).

## Conventions (load-bearing — do not regress)

- **Never raise `workers` above 1** against a single app instance: the AI
  simulator mode (`PUT /api/test/ai-mode`) is global.
- **Keep `retries: 0`**: the mock AI is deterministic.
- Every test that needs state must use the `appPage`/`authedApi` fixtures —
  they restore seed data and set the AI mode to `normal`. The `appPage`
  fixture also resets the mode in teardown; the `afterEach` guard in
  `fixtures/index.js` fails the run if a non-normal mode leaks.
- Tag new tests `@core`, `@ai`, or `@real-llm` so the npm suite scripts work.
- Locate UI elements by `data-testid` (the app guarantees them).

## App facts the framework relies on

- Test hooks: `POST /api/test/reset` (data + AI mode), `GET /api/test/seed`,
  `GET/PUT /api/test/ai-mode` with modes `normal | hallucinate | malformed |
  slow | error` and optional `delayMs`.
- Summarize returns `{ provider, summary, faithfulness: { score, grounded } }`,
  `grounded = score >= 0.4`; `error` mode adds `fallback: true`;
  `malformed` mode → 502 `invalid_ai_output`.
- UI exposes `data-provider`, `data-faithfulness`, `data-simulated` on
  `summary-text`, plus `summary-verified`/`summary-warning` badges and `toast`.
- The note title input is HTML `required`: a truly empty title is blocked
  client-side; the `title_required` API/toast path is exercised with a
  whitespace-only title.
- Delete is a two-step inline confirmation; the confirm click detaches the row
  when the DELETE resolves — wait for detachment instead of re-clicking.

## Security considerations

- No secrets in this repo. `.env` is gitignored; `.env.example` documents
  `BASE_URL`, `APP_PATH`, `OPENAI_API_KEY`, `OPENAI_MODEL`.
- Do not commit a real `OPENAI_API_KEY`; real-LLM tests are opt-in via env.

## Maintenance note for AI agents

This file reflects the repo as of 2026-10-06 and was verified against actual
runs. If you add suites, fixtures, or change config, update the Layout and
Conventions sections with the same level of verified detail.
