import { test, expect } from '@playwright/test';

test('GET /api/health returns ok', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(json.status).toBe('ok');
  expect(json.db).toBe('connected');
});
