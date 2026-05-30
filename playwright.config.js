const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 45000,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: {
    headless: true,
    viewport: { width: 1280, height: 900 },
    ignoreHTTPSErrors: true,
  },
});
