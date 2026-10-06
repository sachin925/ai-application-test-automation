# AI Application Test Automation

Playwright-based test automation framework for the
[AI Notes](../ai-application) app — a small Express + vanilla-JS notes app with
an AI "Summarize" feature — with first-class support for AI-quality test
scenarios (hallucination, prompt injection, provider resilience, faithfulness).

The framework is standalone: it drives a running app instance over HTTP/UI and
imports nothing from the app repo.

## Setup

```bash
npm install
npx playwright install   # once per machine, if browsers are missing
```

## Running

```bash
npm test                 # full suite; auto-starts the app via webServer
npm run test:core        # auth + notes CRUD/search/sort only (@core)
npm run test:ai          # AI scenario suites only (@ai)
npm run test:real-llm    # real-LLM soft-property spec (@real-llm, needs OPENAI_API_KEY)
npm run report           # open the HTML report of the last run
```

Configuration is env-driven (see `.env.example`):

| Variable | Default | Purpose |
|---|---|---|
| `BASE_URL` | `http://localhost:3000` | Running app instance to test. |
| `APP_PATH` | `../ai-application` | App checkout used by the `webServer` auto-start. |
| `OPENAI_API_KEY` | unset | Enables the `@real-llm` spec against a real model. |

If an app is already running at `BASE_URL`, Playwright reuses it
(`reuseExistingServer`); otherwise it runs `npm --prefix $APP_PATH start`.

## Layout

```
fixtures/index.js          test fixtures: api, authedApi, appPage + AI-mode leak guard
lib/app-client.js          API wrapper (test hooks, auth, notes CRUD, summarize)
lib/ai-assertions.js       reusable AI assertions (grounded / unverified / no-rendered-HTML)
lib/injection-corpus.js    prompt-injection + XSS payload corpus
page-objects/              LoginPage, NotesPage (summary panel, two-step delete, search/sort)
tests/core/                auth, CRUD, validation, search/sort (@core)
tests/ai/                  AI scenario suites (@ai, @real-llm)
```

## AI scenario taxonomy

The app's AI simulator (`PUT /api/test/ai-mode`) makes each failure mode
deterministic. Suites in `tests/ai/`:

| Scenario | Mode | What it proves |
|---|---|---|
| Baseline (`ai-baseline`) | `normal` | Deterministic, grounded output shown as verified |
| Hallucination (`ai-hallucination`) | `hallucinate` | Ungrounded output rendered but flagged unverified, faithfulness < 0.4, `data-simulated` exposed |
| Prompt injection (`ai-injection`) | `normal` | Corpus of hostile payloads treated as data — echoed, never executed, never rendered as HTML |
| Provider failure (`ai-resilience`) | `error` | Graceful fallback with transparent warning |
| Malformed output (`ai-resilience`) | `malformed` | 502 + clean `invalid_ai_output` toast, no broken UI state |
| Latency (`ai-resilience`) | `slow` | Loading state visible until the result arrives |
| Faithfulness sweep (`ai-faithfulness`) | `normal` | Every seed note grounds; scores stable across calls |
| Real LLM (`ai-real-llm`) | `normal` + `OPENAI_API_KEY` | Non-deterministic output still satisfies soft properties; gated by env |

## Conventions

- Tests run serially (`workers: 1`) — the AI simulator mode is global to the
  app instance. Do not raise this against a single app instance.
- `retries: 0` — the mock AI is deterministic; a failure is a real failure.
- The `appPage` fixture restores seed data and sets the simulator to `normal`
  before each test, and resets the mode in teardown; an `afterEach` guard in
  `fixtures/index.js` fails any run that leaks a non-normal mode.
- Tag tests `@core`, `@ai`, or `@real-llm` to keep the grep-based suite scripts
  meaningful.
