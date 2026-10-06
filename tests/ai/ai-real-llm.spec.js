'use strict';

const { test, expect } = require('../../fixtures');
const { NotesPage } = require('../../page-objects/notes-page');

// With a real LLM, output is non-deterministic: assert soft properties
// (shape, bounds, grounding handling) instead of exact text.
// Requires the app to run with OPENAI_API_KEY set; skipped otherwise.
test('real LLM output satisfies soft properties @real-llm', async ({ appPage: page }) => {
  test.skip(!process.env.OPENAI_API_KEY, 'Set OPENAI_API_KEY to run against a real LLM');

  const notes = new NotesPage(page);
  await notes.summarizeNote('Test automation ideas');

  const text = await notes.summaryText.innerText();
  expect(text.length).toBeGreaterThan(10);
  expect(text.length).toBeLessThan(400);
  // Whatever the faithfulness outcome, the UI must surface a verdict.
  await expect(
    notes.summaryVerified.or(notes.summaryWarning)
  ).toBeVisible();
});
