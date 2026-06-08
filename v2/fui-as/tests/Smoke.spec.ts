import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

import { startStaticServer, type StaticServerHandle } from './static_server';

declare global {
  interface Window {
    __fuiAsReady?: boolean;
    __fuiAsError?: string;
    __fuiAsState?: {
      readonly commandWordCount: number;
      readonly commandWords: readonly number[];
      readonly rootHandle: string | null;
    };
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', '..', '..', 'public');
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

let server: StaticServerHandle;
let baseUrl: string;

function screenshotPath(name: string): string {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  return path.join(SCREENSHOT_DIR, name);
}

test.beforeAll(async () => {
  server = await startStaticServer(PUBLIC_DIR, 11_300);
  baseUrl = `http://127.0.0.1:${String(server.port)}`;
});

test.afterAll(async () => {
  await server.close();
});

test('renders the fui-as smoke through the browser bridge', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto(`${baseUrl}/v2/fui-as/index.html`);

  await expect.poll(async () => {
    return await page.evaluate(() => {
      if (window.__fuiAsError !== undefined) return `error:${window.__fuiAsError}`;
      return window.__fuiAsReady === true ? 'ready' : 'pending';
    });
  }).toBe('ready');

  if (errors.length > 0) throw new Error(`Page errors: ${errors.join('; ')}`);

  const state = await page.evaluate(() => window.__fuiAsState);
  expect(state).toBeDefined();
  if (state === undefined) throw new Error('Expected fui-as state.');
  expect(state.commandWordCount).toBeGreaterThan(0);
  expect(state.rootHandle).not.toBeNull();

  await page.screenshot({ path: screenshotPath('fui-as-smoke.png') });
});
