'use strict';

const { defineConfig } = require('@playwright/test');

const APP_PATH = process.env.APP_PATH || '../ai-application';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

module.exports = defineConfig({
  testDir: './tests',
  // The AI simulator mode (PUT /api/test/ai-mode) is global to one app
  // instance, so tests must never run in parallel against it.
  workers: 1,
  // Deterministic mock AI: a failure is a real failure, do not mask it.
  retries: 0,
  timeout: 30000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm --prefix ${APP_PATH} start`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 15000,
  },
});
