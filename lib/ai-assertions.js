'use strict';

const { expect } = require('@playwright/test');

// The app mirrors the API faithfulness verdict into the UI:
// summary-verified is shown when faithfulness.grounded is true (and the
// provider did not fall back), summary-warning otherwise.
const GROUNDED_THRESHOLD = 0.4;

async function summaryFaithfulnessScore(summaryLocator) {
  return Number(await summaryLocator.getAttribute('data-faithfulness'));
}

async function expectSummaryGrounded(page) {
  const summary = page.getByTestId('summary-text');
  await expect(page.getByTestId('summary-verified')).toBeVisible();
  await expect(page.getByTestId('summary-warning')).toBeHidden();
  const score = await summaryFaithfulnessScore(summary);
  expect(
    score,
    `expected grounded summary with faithfulness >= ${GROUNDED_THRESHOLD}, got ${score}`
  ).toBeGreaterThanOrEqual(GROUNDED_THRESHOLD);
}

async function expectSummaryUnverified(page, warningText) {
  const warning = page.getByTestId('summary-warning');
  await expect(warning).toBeVisible();
  await expect(warning).toContainText(warningText);
  await expect(page.getByTestId('summary-verified')).toBeHidden();
}

// The app renders AI output via textContent. Any child element under
// summary-text means provider output was interpreted as markup.
async function expectNoRenderedHtml(summaryLocator) {
  await expect(summaryLocator.locator('*')).toHaveCount(0);
}

module.exports = {
  expectSummaryGrounded,
  expectSummaryUnverified,
  expectNoRenderedHtml,
  summaryFaithfulnessScore,
  GROUNDED_THRESHOLD,
};
