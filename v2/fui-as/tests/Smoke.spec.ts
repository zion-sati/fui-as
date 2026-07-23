import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

import { startStaticServer, type StaticServerHandle } from './static_server';

const EXPECTED_EFFINDOM_CORE_ABI_VERSION = 2;
const EXPECTED_EFFINDOM_UI_ABI_VERSION = 1;

declare global {
  interface Window {
    __fuiReady?: boolean;
    __fuiError?: string;
    __fuiState?: {
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

test('mounts an AssemblyScript app through the FUI-AS adapter over the raw runtime package', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto(`${baseUrl}/v2/fui-as/index.html`);

  await expect.poll(async () => {
    return await page.evaluate(() => {
      if (window.__fuiError !== undefined) return `error:${window.__fuiError}`;
      return window.__fuiReady === true ? 'ready' : 'pending';
    });
  }).toBe('ready');

  if (errors.length > 0) throw new Error(`Page errors: ${errors.join('; ')}`);
  await expect(page).toHaveTitle('EffinDOM • FUI-AS smoke');

  const state = await page.evaluate(() => window.__fuiState);
  expect(state).toBeDefined();
  if (state === undefined) throw new Error('Expected fui-as state.');
  expect(state.commandWordCount).toBeGreaterThan(0);
  expect(state.rootHandle).not.toBeNull();

  const abiVersions = await page.evaluate(() => {
    const runtime = window.EffinDomBrowserBridge?.getRuntime();
    return {
      core: runtime?.core._ed_get_abi_version?.() ?? 0,
      ui: runtime?.ui._ui_get_abi_version?.() ?? 0,
    };
  });
  expect(abiVersions).toEqual({
    core: EXPECTED_EFFINDOM_CORE_ABI_VERSION,
    ui: EXPECTED_EFFINDOM_UI_ABI_VERSION,
  });

  await page.screenshot({ path: screenshotPath('fui-as-smoke.png') });
});
