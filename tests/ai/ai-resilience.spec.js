'use strict';

const { test, expect } = require('../../fixtures');
const { NotesPage } = require('../../page-objects/notes-page');
const { expectSummaryUnverified } = require('../../lib/ai-assertions');

// Resilience scenarios: a well-behaved AI feature degrades gracefully when the
// provider fails, returns garbage, or is painfully slow.
test('provider failure falls back transparently instead of crashing @ai', async ({
  appPage: page,
  authedApi,
}) => {
  await authedApi.setAiMode('error');

  const apiResult = await authedApi.summarize('note_seed_5');
  expect(apiResult.body.fallback).toBe(true);
  expect(apiResult.body.error).toBe('ai_provider_failed');

  const notes = new NotesPage(page);
  await notes.summarizeNote('Test automation ideas');
  await expect(notes.summaryText).toHaveAttribute('data-provider', 'mock');
  await expect(notes.summaryText).toHaveText(apiResult.body.summary);
  await expectSummaryUnverified(page, 'AI provider unavailable');
});

test('malformed provider output is rejected with a clean error @ai', async ({
  appPage: page,
  authedApi,
}) => {
  await authedApi.setAiMode('malformed');

  const apiResult = await authedApi.summarize('note_seed_5');
  expect(apiResult.status).toBe(502);
  expect(apiResult.body.error).toBe('invalid_ai_output');

  const notes = new NotesPage(page);
  await notes.noteItem('Test automation ideas').getByTestId('note-summarize-button').click();
  await expect(notes.toast).toBeVisible();
  await expect(notes.toast).toContainText('invalid_ai_output');
  await expect(notes.summaryPanel).toBeHidden();
});

test('slow response keeps the loading state visible until the result @ai', async ({
  appPage: page,
  authedApi,
}) => {
  await authedApi.setAiMode('slow', 2500);

  const notes = new NotesPage(page);
  await notes.noteItem('Test automation ideas').getByTestId('note-summarize-button').click();
  await expect(notes.summaryLoading).toBeVisible();
  await expect(notes.summaryLoading).toBeHidden();
  await expect(notes.summaryText).toBeVisible();
  await expect(notes.summaryVerified).toBeVisible();
});

test('reset hook restores both data and AI mode @ai', async ({ appPage: page, authedApi }) => {
  await authedApi.setAiMode('hallucinate');
  await authedApi.deleteNote('note_seed_1');

  await authedApi.reset();

  expect((await authedApi.getAiMode()).mode).toBe('normal');
  const seed = await authedApi.seed();
  expect(seed.notes).toHaveLength(5);
  await expect(page.getByTestId('note-item')).toHaveCount(5);
});
