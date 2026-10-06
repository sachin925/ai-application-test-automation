'use strict';

const { test, expect } = require('../../fixtures');
const { NotesPage } = require('../../page-objects/notes-page');
const { expectSummaryGrounded } = require('../../lib/ai-assertions');

// Baseline for every other AI scenario: in normal mock mode the provider is
// deterministic, grounded, and the UI marks the output as verified.
test('mock summary is deterministic, grounded, and flagged verified @ai', async ({
  appPage: page,
  authedApi,
}) => {
  const first = await authedApi.summarize('note_seed_5');
  const second = await authedApi.summarize('note_seed_5');
  expect(first.status).toBe(200);
  expect(first.body.summary).toBe(second.body.summary);
  expect(first.body.provider).toBe('mock');
  expect(first.body.faithfulness.grounded).toBe(true);

  const notes = new NotesPage(page);
  await notes.summarizeNote('Test automation ideas');
  await expect(notes.summaryText).toHaveText(first.body.summary);
  await expect(notes.summaryText).toHaveAttribute('data-provider', 'mock');
  await expectSummaryGrounded(page);
});
