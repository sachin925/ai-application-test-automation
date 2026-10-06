'use strict';

const { test, expect } = require('../../fixtures');
const { NotesPage } = require('../../page-objects/notes-page');
const { expectNoRenderedHtml } = require('../../lib/ai-assertions');
const { INJECTION_PAYLOADS } = require('../../lib/injection-corpus');

// Prompt-injection scenario: hostile note content must be treated as data —
// never followed as instructions, never rendered as executable markup.
for (const payload of INJECTION_PAYLOADS) {
  test(`prompt injection (${payload.name}) is treated as data @ai`, async ({ appPage: page }) => {
    const notes = new NotesPage(page);
    await notes.createNote('Injection attempt', payload.body);
    await notes.summarizeNote('Injection attempt');

    const summary = notes.summaryText;
    await expect(summary).toContainText(payload.mustContain);
    // The mock summarizer always echoes data as "Summary: <title>. <body>".
    const text = await summary.innerText();
    expect(
      text.startsWith('Summary: Injection attempt.'),
      `summary "${text}" does not look like an echo of note data`
    ).toBe(true);

    await expectNoRenderedHtml(summary);
    expect(await page.evaluate(() => window.__pwned)).toBeUndefined();
  });
}
