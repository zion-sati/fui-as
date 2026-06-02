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
    __fuiAsSetSmokeSpacing?: (value: number) => void;
    __startSmokeEchoWorker?: () => void;
    __startSmokeFailWorker?: () => void;
    __startSmokeMissingWorker?: () => void;
    __startSmokeCancelableWorker?: () => void;
    __cancelSmokeWorker?: () => void;
    __getSmokeWorkerProgressCount?: () => number;
    __getSmokeWorkerCompleteCount?: () => number;
    __getSmokeWorkerErrorCount?: () => number;
    __getSmokeWorkerPhase?: () => number;
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', '..', '..', 'public');
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

let server: StaticServerHandle;
let baseUrl: string;
const SMOKE_SVG_URL = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%' viewBox='0 0 100 50' preserveAspectRatio='xMinYMin meet'><rect width='100' height='50' fill='%23006cff'/></svg>";

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

test('renders the smoke row through the browser bridge', async ({ page }) => {
  await page.goto(`${baseUrl}/v2/fui-as/index.html`);

  await expect.poll(async () => {
    return await page.evaluate(() => {
      if (window.__fuiAsError !== undefined) {
        return `error:${window.__fuiAsError}`;
      }
      return window.__fuiAsReady === true ? 'ready' : 'pending';
    });
  }).toBe('ready');

  const state = await page.evaluate(() => window.__fuiAsState);
  expect(state).toBeDefined();
  if (state === undefined) {
    throw new Error('Expected FUI smoke state to be available.');
  }
  const readyState = state;
  expect(readyState.commandWordCount).toBeGreaterThan(0);
  expect(readyState.rootHandle).not.toBeNull();

  await expect.poll(async () => {
    return await page.evaluate(() => {
      const canvas = document.getElementById('fui-canvas');
      if (!(canvas instanceof HTMLCanvasElement)) {
        return 0;
      }
      const image = new Image();
      const loaded = new Promise<void>((resolve, reject) => {
        image.addEventListener('load', () => { resolve(); }, { once: true });
        image.addEventListener('error', () => { reject(new Error('Failed to decode scene image.')); }, { once: true });
      });
      image.src = canvas.toDataURL();
      return loaded.then(() => {
        const probe = document.createElement('canvas');
        probe.width = canvas.width;
        probe.height = canvas.height;
        const context = probe.getContext('2d');
        if (context === null) {
          return 0;
        }
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, probe.width, probe.height).data;
        let nonTransparent = 0;
        for (let index = 3; index < pixels.length; index += 4) {
          if ((pixels[index] ?? 0) !== 0) {
            nonTransparent += 1;
          }
        }
        return nonTransparent;
      });
    });
  }).toBeGreaterThan(500);

  await expect.poll(async () => {
    return await page.evaluate(() => {
      return (window.__bridgeSemanticTree ?? []).length;
    });
  }).toBe(3);

  const projected = await page.evaluate(() => {
    return (window.__bridgeSemanticTree ?? []).map((node) => ({
      roleName: node.roleName,
      handle: node.handle,
      label: node.label,
      bounds: node.bounds,
    }));
  });
  const left = projected.find((node) => node.label === 'left');
  const right = projected.find((node) => node.label === 'right');
  expect(left).toBeDefined();
  expect(right).toBeDefined();
  if (left === undefined || right === undefined) {
    throw new Error('Expected left/right semantic nodes.');
  }
  expect(left.roleName).toBe('heading');
  expect(right.roleName).toBe('heading');
  expect(left.bounds.x).toBeLessThan(right.bounds.x);

  await page.evaluate(() => {
    window.__fuiAsSetSmokeSpacing?.(96);
  });

  await expect.poll(async () => {
    return await page.evaluate(() => {
      const nodes = window.__bridgeSemanticTree ?? [];
      const leftNode = nodes.find((node) => node.label === 'left');
      const rightNode = nodes.find((node) => node.label === 'right');
      if (leftNode === undefined || rightNode === undefined) {
        return -1;
      }
      return rightNode.bounds.x - leftNode.bounds.x;
    });
  }).toBeGreaterThan(right.bounds.x - left.bounds.x);

  await page.screenshot({ path: screenshotPath('fui-as-row-layout.png') });
});

test('smoke SVG render matches browser rasterization for a percentage-root SVG', async ({ page }) => {
  await page.goto(`${baseUrl}/v2/fui-as/index.html`);

  await expect.poll(async () => {
    return await page.evaluate(() => {
      if (window.__fuiAsError !== undefined) {
        return `error:${window.__fuiAsError}`;
      }
      return window.__fuiAsReady === true ? 'ready' : 'pending';
    });
  }).toBe('ready');

  await expect.poll(async () => {
    return await page.evaluate(() => {
      const node = (window.__bridgeSemanticTree ?? []).find((entry) => entry.label === 'smoke svg');
      return node?.bounds ?? null;
    });
  }).not.toBeNull();
  const svgBounds = await page.evaluate(() => {
    const node = (window.__bridgeSemanticTree ?? []).find((entry) => entry.label === 'smoke svg');
    return node?.bounds ?? null;
  });

  const blueBounds = await page.evaluate((rawBounds: { x: number; y: number; width: number; height: number; } | null) => {
    if (rawBounds === null) {
      throw new Error('Expected smoke SVG semantic bounds.');
    }
    const canvas = document.getElementById('fui-canvas');
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Expected smoke canvas.');
    }
    const scaleX = canvas.width / Math.max(canvas.clientWidth, 1);
    const scaleY = canvas.height / Math.max(canvas.clientHeight, 1);
    const sampleX = Math.max(0, Math.floor(rawBounds.x * scaleX));
    const sampleY = Math.max(0, Math.floor(rawBounds.y * scaleY));
    const sampleWidth = Math.max(1, Math.ceil(rawBounds.width * scaleX));
    const sampleHeight = Math.max(1, Math.ceil(rawBounds.height * scaleY));
    const probe = document.createElement('canvas');
    probe.width = canvas.width;
    probe.height = canvas.height;
    const context = probe.getContext('2d');
    if (context === null) {
      throw new Error('Expected probe context.');
    }
    context.drawImage(canvas, 0, 0);
    const pixels = context.getImageData(sampleX, sampleY, sampleWidth, sampleHeight).data;
    let minX = sampleWidth;
    let minY = sampleHeight;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < sampleHeight; y += 1) {
      for (let x = 0; x < sampleWidth; x += 1) {
        const offset = ((y * sampleWidth) + x) * 4;
        const red = pixels[offset] ?? 0;
        const green = pixels[offset + 1] ?? 0;
        const blue = pixels[offset + 2] ?? 0;
        const alpha = pixels[offset + 3] ?? 0;
        if (alpha < 200 || blue <= red + 40 || blue <= green + 20) {
          continue;
        }
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
    if (maxX < minX || maxY < minY) {
      throw new Error('Expected visible blue SVG pixels.');
    }
    return {
      width: sampleWidth,
      height: sampleHeight,
      occupiedWidth: (maxX - minX) + 1,
      occupiedHeight: (maxY - minY) + 1,
      minY,
    };
  }, svgBounds);
  const browserReference = await page.evaluate(async ({
    svgUrl,
    sampleWidth,
    sampleHeight,
  }: {
    svgUrl: string;
    sampleWidth: number;
    sampleHeight: number;
  }) => {
    const image = new Image();
    const loaded = new Promise<void>((resolve, reject) => {
      image.addEventListener('load', () => { resolve(); }, { once: true });
      image.addEventListener('error', () => { reject(new Error('Failed to load browser reference SVG.')); }, { once: true });
    });
    image.src = svgUrl;
    await loaded;
    const probe = document.createElement('canvas');
    probe.width = sampleWidth;
    probe.height = sampleHeight;
    const context = probe.getContext('2d');
    if (context === null) {
      throw new Error('Expected browser reference context.');
    }
    context.drawImage(image, 0, 0, sampleWidth, sampleHeight);
    const pixels = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
    let minX = sampleWidth;
    let minY = sampleHeight;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < sampleHeight; y += 1) {
      for (let x = 0; x < sampleWidth; x += 1) {
        const offset = ((y * sampleWidth) + x) * 4;
        const red = pixels[offset] ?? 0;
        const green = pixels[offset + 1] ?? 0;
        const blue = pixels[offset + 2] ?? 0;
        const alpha = pixels[offset + 3] ?? 0;
        if (alpha < 200 || blue <= red + 40 || blue <= green + 20) {
          continue;
        }
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
    if (maxX < minX || maxY < minY) {
      throw new Error('Expected visible browser reference SVG pixels.');
    }
    return {
      width: sampleWidth,
      height: sampleHeight,
      occupiedWidth: (maxX - minX) + 1,
      occupiedHeight: (maxY - minY) + 1,
      minY,
    };
  }, {
    svgUrl: SMOKE_SVG_URL,
    sampleWidth: blueBounds.width,
    sampleHeight: blueBounds.height,
  });

  expect(Math.abs(blueBounds.occupiedWidth - browserReference.occupiedWidth)).toBeLessThanOrEqual(2);
  expect(Math.abs(blueBounds.occupiedHeight - browserReference.occupiedHeight)).toBeLessThanOrEqual(2);
  expect(Math.abs(blueBounds.minY - browserReference.minY)).toBeLessThanOrEqual(2);
});

test('smoke startup reports a readable null-child error', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  await page.goto(`${baseUrl}/v2/fui-as/index.html?debug-null-child=1`);

  await expect.poll(async () => {
    return await page.evaluate(() => window.__fuiAsError ?? null);
  }).toContain('node must not be null');

  expect(consoleErrors.length).toBeGreaterThan(0);
  expect(consoleErrors.some((message) => message.includes('node must not be null'))).toBe(true);
});

test('smoke worker completes through the first-party worker pipeline', async ({ page }) => {
  await page.goto(`${baseUrl}/v2/fui-as/index.html`);

  await expect.poll(async () => {
    return await page.evaluate(() => window.__fuiAsReady === true ? 'ready' : (window.__fuiAsError ?? 'pending'));
  }).toBe('ready');

  await page.evaluate(() => {
    window.__startSmokeEchoWorker?.();
  });

  await expect.poll(async () => {
    return await page.evaluate(() => ({
      progress: window.__getSmokeWorkerProgressCount?.() ?? 0,
      complete: window.__getSmokeWorkerCompleteCount?.() ?? 0,
      error: window.__getSmokeWorkerErrorCount?.() ?? 0,
      phase: window.__getSmokeWorkerPhase?.() ?? 0,
    }));
  }).toMatchObject({
    progress: 1,
    complete: 1,
    error: 0,
    phase: 2,
  });
});

test('every first-party worker manifest entry exports the shared worker callback ABI', async ({ page }) => {
  await page.goto(`${baseUrl}/v2/fui-as/index.html`);

  const workerExports = await page.evaluate(async ({ appBaseUrl }) => {
    const manifestUrl = `${appBaseUrl}/worker-manifest.json`;
    const manifestResponse = await fetch(manifestUrl);
    if (!manifestResponse.ok) {
      throw new Error(`Failed to fetch worker manifest: ${manifestResponse.status}`);
    }
    const manifest = await manifestResponse.json() as {
      readonly entries?: Record<string, string>;
    };
    const exportsByEntry: Record<string, string[]> = {};
    for (const [entryName, entryPath] of Object.entries(manifest.entries ?? {})) {
      const workerUrl = new URL(entryPath, `${appBaseUrl}/`).toString();
      const workerResponse = await fetch(workerUrl);
      if (!workerResponse.ok) {
        throw new Error(`Failed to fetch worker module ${entryName}: ${workerResponse.status}`);
      }
      const module = await WebAssembly.compile(await workerResponse.arrayBuffer());
      exportsByEntry[entryName] = WebAssembly.Module.exports(module)
        .map((item) => `${item.kind}:${item.name}`)
        .sort();
    }
    return exportsByEntry;
  }, {
    appBaseUrl: `${baseUrl}/v2/fui-as`,
  });

  for (const [entryName, exports] of Object.entries(workerExports)) {
    expect(exports, `${entryName} is missing the shared worker callback ABI`).toEqual(expect.arrayContaining([
      'function:__fui_on_fetch_complete',
      'function:__fui_on_fetch_error',
      'function:__fui_worker_text_buffer',
      'function:__fui_worker_text_buffer_size',
    ]));
  }
});

test('smoke worker reports startup resolution failures', async ({ page }) => {
  await page.goto(`${baseUrl}/v2/fui-as/index.html`);

  await expect.poll(async () => {
    return await page.evaluate(() => window.__fuiAsReady === true ? 'ready' : (window.__fuiAsError ?? 'pending'));
  }).toBe('ready');

  await page.evaluate(() => {
    window.__startSmokeMissingWorker?.();
  });

  await expect.poll(async () => {
    return await page.evaluate(() => ({
      complete: window.__getSmokeWorkerCompleteCount?.() ?? 0,
      error: window.__getSmokeWorkerErrorCount?.() ?? 0,
      phase: window.__getSmokeWorkerPhase?.() ?? 0,
    }));
  }).toMatchObject({
    complete: 0,
    error: 1,
    phase: 3,
  });
});

test('smoke worker cancellation propagates through the yield-based cancel path', async ({ page }) => {
  await page.goto(`${baseUrl}/v2/fui-as/index.html`);

  await expect.poll(async () => {
    return await page.evaluate(() => window.__fuiAsReady === true ? 'ready' : (window.__fuiAsError ?? 'pending'));
  }).toBe('ready');

  await page.evaluate(() => {
    window.__startSmokeCancelableWorker?.();
  });

  await expect.poll(async () => {
    return await page.evaluate(() => window.__getSmokeWorkerProgressCount?.() ?? 0);
  }).toBeGreaterThan(0);

  await page.evaluate(() => {
    window.__cancelSmokeWorker?.();
  });

  await expect.poll(async () => {
    return await page.evaluate(() => ({
      complete: window.__getSmokeWorkerCompleteCount?.() ?? 0,
      error: window.__getSmokeWorkerErrorCount?.() ?? 0,
      phase: window.__getSmokeWorkerPhase?.() ?? 0,
    }));
  }).toMatchObject({
    complete: 0,
    error: 1,
    phase: 3,
  });
});
