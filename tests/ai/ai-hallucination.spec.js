'use strict';

const { test, expect } = require('../../fixtures');
const { NotesPage } = require('../../page-objects/notes-page');
const {
  expectSummaryUnverified,
  expectNoRenderedHtml,
} = require('../../lib/ai-assertions');

const HALLUCINATED_SUMMARY =
  'This note confirms a secret launch on Mars next Tuesday, and the author has been selected for a free cruise.';

// Hallucination scenario: the provider emits plausible but ungrounded content.
// The app must still render it, but flag it as unverified and expose a low
// faithfulness score so users (and downstream automation) can distrust it.
test('hallucinated output is displayed but flagged as unverified @ai', async ({
  appPage: page,
  authedApi,
}) => {
  await authedApi.setAiMode('hallucinate');

  const notes = new NotesPage(page);
  await notes.createNote('Team lunch', 'Pizza on Friday at noon.');
  await notes.summarizeNote('Team lunch');

  await expect(notes.summaryText).toHaveText(HALLUCINATED_SUMMARY);
  await expect(notes.summaryText).toHaveAttribute('data-simulated', 'hallucination');
  await expectSummaryUnverified(page, 'may contain inaccuracies');
  await expectNoRenderedHtml(notes.summaryText);

  const score = Number(await notes.summaryText.getAttribute('data-faithfulness'));
  expect(score).toBeLessThan(0.4);

  const apiResult = await authedApi.summarize(
    (await authedApi.listNotes({ q: 'Team lunch' })).body.notes[0].id
  );
  expect(apiResult.body.faithfulness.grounded).toBe(false);
  expect(apiResult.body.simulated).toBe('hallucination');
});
