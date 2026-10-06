'use strict';

const { test, expect } = require('../../fixtures');

// Faithfulness sweep: every seed note must produce a grounded summary in
// normal mode. Catches regressions in the faithfulness pipeline itself
// (e.g. scoring drift, stopword handling) that a single-note baseline can miss.
test('all seed notes produce grounded summaries @ai', async ({ appPage, authedApi }) => {
  const seed = await authedApi.seed();

  for (const note of seed.notes) {
    const result = await authedApi.summarize(note.id);
    expect(result.status).toBe(200);
    expect(result.body.summary.length).toBeGreaterThan(0);
    expect(result.body.faithfulness.score, `faithfulness for "${note.title}"`).toBeGreaterThanOrEqual(0.4);
    expect(result.body.faithfulness.grounded, `grounded for "${note.title}"`).toBe(true);
  }
});

test('faithfulness score is stable across repeated calls @ai', async ({ appPage, authedApi }) => {
  const first = await authedApi.summarize('note_seed_4');
  const second = await authedApi.summarize('note_seed_4');
  expect(first.body.faithfulness.score).toBe(second.body.faithfulness.score);
});
