import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: path.join(__dirname, 'tests'),
  testMatch: [
    'Smoke.spec.ts',
    'AppManager.spec.ts',
    'DemoMfe.spec.ts',
    'PersistedRestorePolicy.spec.ts',
    'demo-*.spec.ts',
  ],
  timeout: 60_000,
  retries: 1,
  workers: 1,
  use: {
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
      },
    },
  ],
  reporter: [
    ['list'],
    ['html', { outputFolder: path.join(__dirname, 'tests', 'report'), open: 'never' }],
  ],
});
