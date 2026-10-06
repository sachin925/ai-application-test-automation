'use strict';

const { test: base, expect } = require('@playwright/test');
const { AppClient } = require('../lib/app-client');

const USER = { email: 'demo@ainotes.app', password: 'password123' };

const test = base.extend({
  // Unauthenticated API client for auth-negative and hook-level checks.
  api: async ({ request }, use) => {
    await use(new AppClient(request));
  },

  // API client with a logged-in session cookie (the request fixture shares
  // cookie storage with the page's browser context).
  authedApi: async ({ request }, use) => {
    const client = new AppClient(request);
    await client.reset();
    const { status } = await client.login(USER.email, USER.password);
    if (status !== 200) throw new Error(`seed login failed: ${status}`);
    await use(client);
  },

  // Logged-in page with guaranteed known state: seed data restored and the
  // AI simulator in normal mode.
  appPage: async ({ page, request }, use) => {
    const client = new AppClient(request);
    await client.reset();
    await client.setAiMode('normal');
    await page.goto('/login');
    await page.getByTestId('email-input').fill(USER.email);
    await page.getByTestId('password-input').fill(USER.password);
    await page.getByTestId('login-button').click();
    await expect(page.getByTestId('notes-list')).toBeVisible();
    await use(page);
    // Teardown: leave the shared simulator in normal mode even if the test
    // body failed, so a mode change can never poison the next test.
    await client.setAiMode('normal');
  },
});

// The AI simulator mode is global to the app instance. appPage resets it
// before every test that uses it, so a non-normal mode afterwards means a
// test leaked state — fail loudly instead of poisoning the next test.
test.afterEach(async ({ request }) => {
  const res = await request.get('/api/test/ai-mode');
  if (res.ok()) {
    const mode = await res.json();
    expect(mode.mode).toBe('normal');
  }
});

module.exports = { test, expect, USER };
