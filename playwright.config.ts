import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:3100';
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'], launchOptions: { channel: 'chrome' } } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'], browserName: 'chromium', launchOptions: { channel: 'chrome' } } }
  ],
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1 --port 3100',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { NEXTAUTH_SECRET: 'e2e-test-secret-keep-local-32-characters', ENABLE_PRICE_PERSISTENCE: 'false', ENABLE_CONNECTOR_LOGS: 'false', ...(process.env.E2E_DATABASE_URL ? { DATABASE_URL: process.env.E2E_DATABASE_URL } : {}) }
  }
});
