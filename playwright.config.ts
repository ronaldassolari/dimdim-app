import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'https://dimdim-snowy.vercel.app',
  },
  projects: [
    { name: 'api', testMatch: '**/*.spec.ts' },
  ],
});
