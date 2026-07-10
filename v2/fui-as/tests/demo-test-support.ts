import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect,type Page } from '@playwright/test';

import type { BridgeState, EffinDomCallbacks } from '@effindomv2/runtime';
import type { HarnessDebugApi } from '../browser/src/common-harness';
import { startStaticServer,type StaticServerHandle } from './static_server';

export { fs,path };

declare global {
  interface Window {
    __fuiReady?: boolean;
    __fuiError?: string;
    __fuiState?: {
      readonly commandWordCount: number;
      readonly commandWords: readonly number[];
      readonly rootHandle: string | null;
    };
    __bridgeTextByHandle?: Record<string, string>;
    __bridgeActiveEditorWindow?: {
      readonly handle: string | null;
      readonly text: string;
      readonly docStart: number;
      readonly docEnd: number;
    };
    __fuiSelectionText?: string;
    __fui_debug?: HarnessDebugApi;
    __effindomCallbacks?: EffinDomCallbacks;
    EffinDomBrowserBridge?: BridgeState;
  }
}

export interface RenderedPixel {
  readonly red: number;
  readonly green: number;
  readonly blue: number;
  readonly alpha: number;
}

export interface SceneRegionSnapshot {
  readonly width: number;
  readonly height: number;
  readonly pixels: readonly number[];
}

export function minimumRgb(pixel: RenderedPixel): number {
  return Math.min(pixel.red, pixel.green, pixel.blue);
}

export function pixelDifferenceMagnitude(before: RenderedPixel, after: RenderedPixel): number {
  return Math.abs(before.red - after.red) +
    Math.abs(before.green - after.green) +
    Math.abs(before.blue - after.blue) +
    Math.abs(before.alpha - after.alpha);
}

export const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PUBLIC_DIR = path.join(__dirname, '..', '..', '..', 'public');
export const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

export let server: StaticServerHandle;
export let baseUrl: string;

export function screenshotPath(name: string): string {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  return path.join(SCREENSHOT_DIR, name);
}

export async function readScenePixel(page: Page, x: number, y: number): Promise<RenderedPixel> {
  return await page.evaluate(async ({ sampleX, sampleY }: { sampleX: number; sampleY: number }) => {
    const overlay = document.querySelector('[data-effindom-software-overlay="true"]');
    if (overlay instanceof HTMLCanvasElement) {
      const context = overlay.getContext('2d');
      if (context !== null) {
        const clampedX = Math.max(0, Math.min(overlay.width - 1, Math.round(sampleX)));
        const clampedY = Math.max(0, Math.min(overlay.height - 1, Math.round(sampleY)));
        const pixel = context.getImageData(clampedX, clampedY, 1, 1).data;
        return {
          red: pixel[0],
          green: pixel[1],
          blue: pixel[2],
          alpha: pixel[3],
        };
      }
    }

    const canvas = document.getElementById('fui-canvas');
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Expected scene canvas.');
    }

    const image = new Image();
    const loaded = new Promise<void>((resolve, reject) => {
      image.addEventListener('load', () => { resolve(); }, { once: true });
      image.addEventListener('error', () => { reject(new Error('Failed to decode scene image.')); }, { once: true });
    });
    image.src = canvas.toDataURL();
    await loaded;

    const probe = document.createElement('canvas');
    probe.width = canvas.width;
    probe.height = canvas.height;
    const context = probe.getContext('2d');
    if (context === null) {
      throw new Error('Expected 2D probe context.');
    }
    context.drawImage(image, 0, 0);
    const clampedX = Math.max(0, Math.min(probe.width - 1, Math.round(sampleX)));
    const clampedY = Math.max(0, Math.min(probe.height - 1, Math.round(sampleY)));
    const pixel = context.getImageData(clampedX, clampedY, 1, 1).data;
    return {
      red: pixel[0],
      green: pixel[1],
      blue: pixel[2],
      alpha: pixel[3],
    };
  }, { sampleX: x, sampleY: y });
}

export async function readSceneRegionSignature(
  page: Page,
  x: number,
  y: number,
  width: number,
  height: number,
): Promise<string> {
  return await page.evaluate(async ({
    sampleX,
    sampleY,
    sampleWidth,
    sampleHeight,
  }: {
    sampleX: number;
    sampleY: number;
    sampleWidth: number;
    sampleHeight: number;
  }) => {
    async function sampleCanvas(canvas: HTMLCanvasElement): Promise<string> {
      let sourceCanvas = canvas;
      let context = sourceCanvas.getContext('2d');
      if (context === null) {
        const image = new Image();
        const loaded = new Promise<void>((resolve, reject) => {
          image.addEventListener('load', () => { resolve(); }, { once: true });
          image.addEventListener('error', () => { reject(new Error('Failed to decode scene image.')); }, { once: true });
        });
        image.src = canvas.toDataURL();
        await loaded;

        const probe = document.createElement('canvas');
        probe.width = canvas.width;
        probe.height = canvas.height;
        context = probe.getContext('2d');
        if (context === null) {
          throw new Error('Expected 2D probe context.');
        }
        context.drawImage(image, 0, 0);
        sourceCanvas = probe;
      }
      const widthPx = Math.max(1, Math.round(sampleWidth));
      const heightPx = Math.max(1, Math.round(sampleHeight));
      const originX = Math.max(0, Math.min(sourceCanvas.width - 1, Math.round(sampleX)));
      const originY = Math.max(0, Math.min(sourceCanvas.height - 1, Math.round(sampleY)));
      const maxX = Math.min(sourceCanvas.width - 1, originX + widthPx - 1);
      const maxY = Math.min(sourceCanvas.height - 1, originY + heightPx - 1);
      const columns = 6;
      const rows = 6;
      const parts = new Array<string>();
      for (let row = 0; row < rows; row += 1) {
        const probeY = originY + Math.floor(((maxY - originY) * row) / Math.max(1, rows - 1));
        for (let column = 0; column < columns; column += 1) {
          const probeX = originX + Math.floor(((maxX - originX) * column) / Math.max(1, columns - 1));
          const pixel = context.getImageData(probeX, probeY, 1, 1).data;
          parts.push(
            [
              pixel[0],
              pixel[1],
              pixel[2],
              pixel[3],
            ].join(':'),
          );
        }
      }
      return parts.join('|');
    }

    const overlay = document.querySelector('[data-effindom-software-overlay="true"]');
    if (overlay instanceof HTMLCanvasElement) {
      return await sampleCanvas(overlay);
    }

    const canvas = document.getElementById('fui-canvas');
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Expected scene canvas.');
    }
    return await sampleCanvas(canvas);
  }, { sampleX: x, sampleY: y, sampleWidth: width, sampleHeight: height });
}

export async function readSceneRegion(page: Page, x: number, y: number, width: number, height: number): Promise<SceneRegionSnapshot> {
  return await page.evaluate(async (
    region: { sampleX: number; sampleY: number; sampleWidth: number; sampleHeight: number },
  ) => {
    const readRegion = (source: HTMLCanvasElement): SceneRegionSnapshot => {
      const context = source.getContext('2d');
      if (context === null) {
        throw new Error('Expected 2D context.');
      }
      const clampedX = Math.max(0, Math.min(source.width - 1, Math.round(region.sampleX)));
      const clampedY = Math.max(0, Math.min(source.height - 1, Math.round(region.sampleY)));
      const clampedWidth = Math.max(1, Math.min(source.width - clampedX, Math.round(region.sampleWidth)));
      const clampedHeight = Math.max(1, Math.min(source.height - clampedY, Math.round(region.sampleHeight)));
      const pixels = context.getImageData(clampedX, clampedY, clampedWidth, clampedHeight).data;
      return {
        width: clampedWidth,
        height: clampedHeight,
        pixels: Array.from(pixels),
      };
    };

    const overlay = document.querySelector('[data-effindom-software-overlay="true"]');
    if (overlay instanceof HTMLCanvasElement) {
      return readRegion(overlay);
    }

    const canvas = document.getElementById('fui-canvas');
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Expected scene canvas.');
    }

    const image = new Image();
    const loaded = new Promise<void>((resolve, reject) => {
      image.addEventListener('load', () => { resolve(); }, { once: true });
      image.addEventListener('error', () => { reject(new Error('Failed to decode scene image.')); }, { once: true });
    });
    image.src = canvas.toDataURL();
    await loaded;

    const probe = document.createElement('canvas');
    probe.width = canvas.width;
    probe.height = canvas.height;
    const context = probe.getContext('2d');
    if (context === null) {
      throw new Error('Expected 2D probe context.');
    }
    context.drawImage(image, 0, 0);
    return readRegion(probe);
  }, {
    sampleX: x,
    sampleY: y,
    sampleWidth: width,
    sampleHeight: height,
  });
}

export async function readHiddenTextEditorState(page: Page): Promise<{
  tagName: string;
  value: string;
  start: number;
  end: number;
  absoluteStart: number;
  absoluteEnd: number;
  docStart: number;
  docEnd: number;
  focused: boolean;
  direction: string | null;
} | null> {
  return await page.evaluate(() => {
    const activeElement = document.activeElement;
    const editor = (
      (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) &&
      activeElement.dataset.effindomHiddenEditor === 'true'
        ? activeElement
        : document.querySelector<HTMLInputElement | HTMLTextAreaElement>('input[data-effindom-hidden-editor="true"], textarea[data-effindom-hidden-editor="true"]')
    );
    if (editor === null) {
      return null;
    }
    const activeEditorWindow = window.__bridgeActiveEditorWindow;
    const start = editor.selectionStart ?? 0;
    const end = editor.selectionEnd ?? start;
    const docStart = activeEditorWindow?.docStart ?? 0;
    return {
      tagName: editor.tagName.toLowerCase(),
      value: editor.value,
      start,
      end,
      absoluteStart: docStart + start,
      absoluteEnd: docStart + end,
      docStart,
      docEnd: activeEditorWindow === undefined ? docStart + editor.value.length : activeEditorWindow.docEnd,
      focused: document.activeElement === editor,
      direction: editor.selectionDirection,
    };
  });
}

export async function waitForDemoReady(page: Page, timeout = 5000): Promise<void> {
  await expect.poll(async () => {
    return await page.evaluate(() => {
      if (window.__fuiError !== undefined) {
        return `error:${window.__fuiError}`;
      }
      return window.__fuiReady === true ? 'ready' : 'pending';
    });
  }, { timeout }).toBe('ready');
}

export async function readWorkerStatusLabel(page: Page): Promise<string | null> {
  return await page.evaluate(() =>
    (window.__bridgeSemanticTree ?? []).find((node) => node.label.startsWith('Worker status: '))?.label ?? null,
  );
}

export async function readWorkerDetailLabel(page: Page): Promise<string | null> {
  return await page.evaluate(() =>
    (window.__bridgeSemanticTree ?? []).find((node) => node.label.startsWith('Largest prime after 5s: ') || node.label.startsWith('Prime search cancelled after yielding at ') || node.label.startsWith('Prime search progress: ') || node.label.startsWith('Cancellation requested.'))?.label ?? null,
  );
}

export async function readSemanticLabelByPrefix(page: Page, prefix: string): Promise<string | null> {
  return await page.evaluate((targetPrefix: string) => {
    return (window.__bridgeSemanticTree ?? []).find((node) => node.label.startsWith(targetPrefix))?.label ?? null;
  }, prefix);
}

export async function readFirstVisibleItemIndex(page: Page): Promise<number> {
  return await page.evaluate(() => {
    const node = (window.__bridgeSemanticTree ?? []).find((item) => item.label.startsWith('First visible item '));
    if (node === undefined) {
      throw new Error('Expected first visible item label.');
    }
    return Number.parseInt(node.label.slice('First visible item '.length), 10);
  });
}

export async function readTopVisibleListItemIndex(page: Page): Promise<number> {
  return await page.evaluate(() => {
    const candidates = (window.__bridgeSemanticTree ?? [])
      .filter((item) => /^Item \d+$/.test(item.label))
      .map((item) => ({
        label: item.label,
        y: item.bounds.y,
      }));
    if (candidates.length === 0) {
      throw new Error('Expected visible virtual list item labels.');
    }
    candidates.sort((left, right) => left.y - right.y);
    const label = candidates[0].label;
    return Number.parseInt(label.slice('Item '.length), 10);
  });
}

export async function findSemanticBounds(page: Page, label: string): Promise<{ x: number; y: number; width: number; height: number; } | null> {
  return await page.evaluate((targetLabel: string) => {
    const node = (window.__bridgeSemanticTree ?? []).find((item) =>
      item.label === targetLabel || item.label.startsWith(targetLabel + ','));
    if (node === undefined) {
      return null;
    }
    const runtime = window.EffinDomBrowserBridge?.getRuntime();
    const canvas = document.getElementById('fui-canvas');
    if (runtime === undefined || runtime === null || !(canvas instanceof HTMLCanvasElement)) {
      return node.bounds;
    }
    const targetHandle = BigInt(node.handle);
    const stride = 6;
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (let y = Math.floor(stride / 2); y < canvas.height; y += stride) {
      for (let x = Math.floor(stride / 2); x < canvas.width; x += stride) {
        if (runtime.getHandleFromPoint(x, y) !== targetHandle) {
          continue;
        }
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
    if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
      if (node.state.multiline !== true) {
        const ui = runtime.ui;
        const ptr = BigInt(Number(ui._malloc(16)));
        const offset = Number(ptr);
        try {
          const found = ui._ui_get_bounds(targetHandle, ptr, ptr + 4n, ptr + 8n, ptr + 12n);
          if (found !== 0) {
            const view = new DataView(ui.HEAPU8.buffer);
            return {
              x: view.getFloat32(offset, true),
              y: view.getFloat32(offset + 4, true),
              width: view.getFloat32(offset + 8, true),
              height: view.getFloat32(offset + 12, true),
            };
          }
        } finally {
          ui._free(ptr);
        }
      }
      return node.bounds;
    }
    return {
      x: Math.max(0, minX - (stride / 2)),
      y: Math.max(0, minY - (stride / 2)),
      width: Math.min(canvas.width, maxX + (stride / 2)) - Math.max(0, minX - (stride / 2)),
      height: Math.min(canvas.height, maxY + (stride / 2)) - Math.max(0, minY - (stride / 2)),
    };
  }, label);
}

export async function readBridgeTextForSemanticLabel(page: Page, label: string): Promise<string | null> {
  return await page.evaluate((targetLabel: string) => {
    const node = (window.__bridgeSemanticTree ?? []).find((item) => item.label === targetLabel);
    if (node === undefined) {
      return null;
    }
    return window.__bridgeTextByHandle?.[node.handle] ?? null;
  }, label);
}

export async function findClipboardSelectableHandleInRegion(
  page: Page,
  region: { x: number; y: number; width: number; height: number; },
  expectedText: string,
): Promise<{ handle: string; text: string; x: number; y: number; }> {
  const candidates = await page.evaluate((searchRegion) => {
    const runtime = window.EffinDomBrowserBridge?.getRuntime();
    if (runtime === undefined || runtime === null) {
      throw new Error('Expected runtime.');
    }
    const unique = new Map<string, { handle: string; x: number; y: number; hits: number; }>();
    const minX = Math.floor(searchRegion.x + 2);
    const maxX = Math.floor(searchRegion.x + searchRegion.width - 2);
    const minY = Math.floor(searchRegion.y + 2);
    const maxY = Math.floor(searchRegion.y + searchRegion.height - 2);
    for (let y = minY; y <= maxY; y += 4) {
      for (let x = minX; x <= maxX; x += 6) {
        const handle = runtime.getHandleFromPoint(x, y);
        if (handle === 0n) {
          continue;
        }
        const handleKey = handle.toString();
        const existing = unique.get(handleKey);
        if (existing === undefined) {
          unique.set(handleKey, { handle: handleKey, x, y, hits: 1 });
        } else {
          existing.hits += 1;
        }
      }
    }
    return [...unique.values()].sort((left, right) => right.hits - left.hits);
  }, region);
  for (const candidate of candidates) {
    await selectEntireTextHandle(page, candidate.handle);
    await page.keyboard.press('ControlOrMeta+C');
    const snapshot = await readClipboardSnapshot(page);
    if (snapshot.text.includes(expectedText)) {
      return {
        handle: candidate.handle,
        text: snapshot.text,
        x: candidate.x,
        y: candidate.y,
      };
    }
  }
  return await page.evaluate((expectedSubstring: string) => {
    const matches = Object.entries(window.__bridgeTextByHandle ?? {}).find(([, text]) =>
      text.includes(expectedSubstring));
    if (matches === undefined) {
      throw new Error(`Expected text handle containing "${expectedSubstring}".`);
    }
    return {
      handle: matches[0],
      text: matches[1],
      x: 0,
      y: 0,
    };
  }, expectedText);
}

export async function selectEntireTextHandle(page: Page, handle: string): Promise<void> {
  await page.evaluate((handleString: string) => {
    const runtime = window.EffinDomBrowserBridge?.getRuntime();
    if (runtime === undefined || runtime === null) {
      throw new Error('Expected runtime.');
    }
    const ui = runtime.ui;
    const handleArg = ui.usesMemory64 === true ? BigInt(handleString) : Number(handleString);
    ui._ui_request_focus(handleArg);
    ui._ui_set_text_selection_range(handleArg, 0, 0xffff);
    runtime.commitFrame();
    runtime.flushPendingCommit();
  }, handle);
}

export async function readClipboardSnapshot(page: Page): Promise<{
  text: string;
  types: string[];
  html: string | null;
  richJson: string | null;
}> {
  return await page.evaluate(async () => {
    const text = await navigator.clipboard.readText();
    const clipboard = navigator.clipboard as Omit<Clipboard, 'read'> & { read?: Clipboard['read'] };
    if (clipboard.read === undefined) {
      return {
        text,
        types: ['text/plain'],
        html: null,
        richJson: null,
      };
    }
    const items = await clipboard.read();
    if (items.length === 0) {
      return {
        text,
        types: [],
        html: null,
        richJson: null,
      };
    }
    const item = items[0];
    const types = [...item.types].sort();
    const html = item.types.includes('text/html')
      ? await (await item.getType('text/html')).text()
      : null;
    const richMime = 'web application/x-effindom-richtext+json';
    const richJson = item.types.includes(richMime)
      ? await (await item.getType(richMime)).text()
      : null;
    return {
      text,
      types,
      html,
      richJson,
    };
  });
}

export async function findSemanticRoleBounds(page: Page, roleName: string): Promise<{ x: number; y: number; width: number; height: number; } | null> {
  return await page.evaluate((targetRoleName: string) => {
    const node = (window.__bridgeSemanticTree ?? []).find((item) => item.roleName === targetRoleName);
    return node?.bounds ?? null;
  }, roleName);
}

export async function readSemanticNode(page: Page, label: string): Promise<{
  roleName: string;
  state: Record<string, unknown>;
  bounds: { x: number; y: number; width: number; height: number; };
} | null> {
  return await page.evaluate((targetLabel: string) => {
    const node = (window.__bridgeSemanticTree ?? []).find((item) =>
      item.label === targetLabel || item.label.startsWith(targetLabel + ','));
    if (node === undefined) {
      return null;
    }
    return {
      roleName: node.roleName,
      state: { ...node.state },
      bounds: { ...node.bounds },
    };
  }, label);
}

export async function readUiHandleBounds(
  page: Page,
  handle: string,
): Promise<{ x: number; y: number; width: number; height: number; } | null> {
  return await page.evaluate((handleString: string) => {
    const runtime = window.EffinDomBrowserBridge?.getRuntime();
    if (runtime === undefined || runtime === null) {
      throw new Error('Expected runtime.');
    }
    const ui = runtime.ui;
    const ptr = BigInt(Number(ui._malloc(16)));
    const offset = Number(ptr);
    try {
      const found = ui._ui_get_bounds(BigInt(handleString), ptr, ptr + 4n, ptr + 8n, ptr + 12n);
      if (found === 0) {
        return null;
      }
      const view = new DataView(ui.HEAPU8.buffer);
      return {
        x: view.getFloat32(offset, true),
        y: view.getFloat32(offset + 4, true),
        width: view.getFloat32(offset + 8, true),
        height: view.getFloat32(offset + 12, true),
      };
    } finally {
      ui._free(ptr);
    }
  }, handle);
}

export async function clickSemanticLabel(page: Page, label: string): Promise<void> {
  const bounds = await findSemanticBounds(page, label);
  expect(bounds).not.toBeNull();
  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  const x = (canvasBox?.x ?? 0) + (bounds?.x ?? 0) + ((bounds?.width ?? 0) / 2);
  const y = (canvasBox?.y ?? 0) + (bounds?.y ?? 0) + ((bounds?.height ?? 0) / 2);
  await page.mouse.click(x, y);
}

export async function hoverSemanticLabel(page: Page, label: string): Promise<void> {
  const bounds = await findSemanticBounds(page, label);
  expect(bounds).not.toBeNull();
  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  const x = (canvasBox?.x ?? 0) + (bounds?.x ?? 0) + ((bounds?.width ?? 0) / 2);
  const y = (canvasBox?.y ?? 0) + (bounds?.y ?? 0) + ((bounds?.height ?? 0) / 2);
  await page.mouse.move(x, y);
}

export async function rightClickSemanticLabel(page: Page, label: string): Promise<void> {
  const bounds = await findSemanticBounds(page, label);
  expect(bounds).not.toBeNull();
  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  const x = (canvasBox?.x ?? 0) + (bounds?.x ?? 0) + ((bounds?.width ?? 0) / 2);
  const y = (canvasBox?.y ?? 0) + (bounds?.y ?? 0) + ((bounds?.height ?? 0) / 2);
  await page.mouse.click(x, y, { button: 'right' });
}

export async function clickSemanticLabelAtFraction(page: Page, label: string, xFraction: number, yFraction: number): Promise<void> {
  const bounds = await findSemanticBounds(page, label);
  expect(bounds).not.toBeNull();
  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  const x = (canvasBox?.x ?? 0) + (bounds?.x ?? 0) + ((bounds?.width ?? 0) * xFraction);
  const y = (canvasBox?.y ?? 0) + (bounds?.y ?? 0) + ((bounds?.height ?? 0) * yFraction);
  await page.mouse.click(x, y);
}

export async function hoverSemanticLabelAtFraction(page: Page, label: string, xFraction: number, yFraction: number): Promise<void> {
  const bounds = await findSemanticBounds(page, label);
  expect(bounds).not.toBeNull();
  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  const x = (canvasBox?.x ?? 0) + (bounds?.x ?? 0) + ((bounds?.width ?? 0) * xFraction);
  const y = (canvasBox?.y ?? 0) + (bounds?.y ?? 0) + ((bounds?.height ?? 0) * yFraction);
  await page.mouse.move(x, y);
}

export async function dragSemanticLabelBetweenFractions(
  page: Page,
  label: string,
  startXFraction: number,
  startYFraction: number,
  endXFraction: number,
  endYFraction: number,
): Promise<void> {
  const bounds = await findSemanticBounds(page, label);
  expect(bounds).not.toBeNull();
  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  const startX = (canvasBox?.x ?? 0) + (bounds?.x ?? 0) + ((bounds?.width ?? 0) * startXFraction);
  const startY = (canvasBox?.y ?? 0) + (bounds?.y ?? 0) + ((bounds?.height ?? 0) * startYFraction);
  const endX = (canvasBox?.x ?? 0) + (bounds?.x ?? 0) + ((bounds?.width ?? 0) * endXFraction);
  const endY = (canvasBox?.y ?? 0) + (bounds?.y ?? 0) + ((bounds?.height ?? 0) * endYFraction);
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: 8 });
  await page.mouse.up();
}

export async function dragSemanticLabelToSemanticLabel(
  page: Page,
  sourceLabel: string,
  targetLabel: string,
  sourceXFraction = 0.5,
  sourceYFraction = 0.5,
  targetXFraction = 0.5,
  targetYFraction = 0.5,
): Promise<void> {
  const sourceBounds = await findSemanticBounds(page, sourceLabel);
  const targetBounds = await findSemanticBounds(page, targetLabel);
  expect(sourceBounds).not.toBeNull();
  expect(targetBounds).not.toBeNull();
  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  const startX = (canvasBox?.x ?? 0) + (sourceBounds?.x ?? 0) + ((sourceBounds?.width ?? 0) * sourceXFraction);
  const startY = (canvasBox?.y ?? 0) + (sourceBounds?.y ?? 0) + ((sourceBounds?.height ?? 0) * sourceYFraction);
  const endX = (canvasBox?.x ?? 0) + (targetBounds?.x ?? 0) + ((targetBounds?.width ?? 0) * targetXFraction);
  const endY = (canvasBox?.y ?? 0) + (targetBounds?.y ?? 0) + ((targetBounds?.height ?? 0) * targetYFraction);
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: 10 });
  await page.mouse.up();
}

export async function readHiddenInputSelection(page: Page): Promise<{
  start: number;
  end: number;
  focused: boolean;
  direction: string | null;
} | null> {
  return await page.evaluate(() => {
    const activeElement = document.activeElement;
    const editor = (
      (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) &&
      activeElement.dataset.effindomHiddenEditor === 'true'
        ? activeElement
        : document.querySelector<HTMLInputElement | HTMLTextAreaElement>('input[data-effindom-hidden-editor="true"], textarea[data-effindom-hidden-editor="true"]')
    );
    if (editor === null) {
      return null;
    }
    const start = editor.selectionStart ?? 0;
    const end = editor.selectionEnd ?? start;
    return {
      start,
      end,
      focused: document.activeElement === editor,
      direction: editor.selectionDirection,
    };
  });
}

export async function waitForHiddenTextInputFocus(page: Page): Promise<void> {
  await expect.poll(async () => {
    return await page.evaluate(() => {
      const activeElement = document.activeElement;
      return (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) &&
        activeElement.dataset.effindomHiddenEditor === 'true';
    });
  }).toBe(true);
}

export async function setHiddenTextInputSelection(page: Page, start: number, end: number = start): Promise<void> {
  await page.evaluate(({ selectionStart, selectionEnd }) => {
    const activeElement = document.activeElement;
    const editor = (
      (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) &&
      activeElement.dataset.effindomHiddenEditor === 'true'
        ? activeElement
        : document.querySelector<HTMLInputElement | HTMLTextAreaElement>('input[data-effindom-hidden-editor="true"], textarea[data-effindom-hidden-editor="true"]')
    );
    if (editor === null) {
      throw new Error('Expected hidden bridge editor.');
    }
    const activeEditorWindow = window.__bridgeActiveEditorWindow;
    const runtime = window.EffinDomBrowserBridge?.getRuntime();
    const activeHandle = activeEditorWindow?.handle ?? null;
    if (runtime !== null && runtime !== undefined && activeHandle !== null && window.__effindomCallbacks?.onSelectionChanged !== undefined) {
      const handleArg = runtime.ui.usesMemory64 === true ? BigInt(activeHandle) : Number(activeHandle);
      window.__effindomCallbacks.onSelectionChanged(handleArg, selectionStart, selectionEnd);
      runtime.commitFrame();
      runtime.flushPendingCommit();
    }
    const nextDocStart = window.__bridgeActiveEditorWindow?.docStart ?? 0;
    editor.focus();
    editor.setSelectionRange(selectionStart - nextDocStart, selectionEnd - nextDocStart);
  }, { selectionStart: start, selectionEnd: end });
}

export async function scrollSemanticLabelIntoView(page: Page, label: string): Promise<void> {
  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  const desiredY = 220;
  const probePoints = [
    {
      x: (canvasBox?.x ?? 0) + 32,
      y: (canvasBox?.y ?? 0) + 32,
    },
    {
      x: (canvasBox?.x ?? 0) + Math.max(48, Math.min((canvasBox?.width ?? 0) - 48, (canvasBox?.width ?? 0) * 0.5)),
      y: (canvasBox?.y ?? 0) + 40,
    },
    {
      x: (canvasBox?.x ?? 0) + 32,
      y: (canvasBox?.y ?? 0) + Math.max(56, Math.min((canvasBox?.height ?? 0) - 56, (canvasBox?.height ?? 0) * 0.2)),
    },
    {
      x: (canvasBox?.x ?? 0) + Math.max(48, Math.min((canvasBox?.width ?? 0) - 48, (canvasBox?.width ?? 0) * 0.5)),
      y: (canvasBox?.y ?? 0) + Math.max(56, Math.min((canvasBox?.height ?? 0) - 56, (canvasBox?.height ?? 0) * 0.2)),
    },
  ];
  for (let attempt = 0; attempt < 42; attempt += 1) {
    const probe = probePoints[attempt % probePoints.length] ?? probePoints[0];
    const bounds = await findSemanticBounds(page, label);
    if (bounds === null) {
      const searchDirection = attempt < 18 ? 1 : -1;
      const searchDistance = attempt < 18 ? 420 : 840;
      await page.mouse.move(probe.x, probe.y);
      await page.mouse.wheel(0, searchDistance * searchDirection);
      await page.waitForTimeout(80);
      continue;
    }
    if (bounds.y >= 48 && (bounds.y + bounds.height) <= ((canvasBox?.height ?? 0) - 32)) {
      return;
    }
    const delta = Math.max(-720, Math.min(720, bounds.y - desiredY));
    await page.mouse.move(probe.x, probe.y);
    await page.mouse.wheel(0, delta);
    await page.waitForTimeout(80);
  }
  throw new Error(`Unable to bring ${label} into view.`);
}

export async function moveSemanticLabelNearCanvasBottom(page: Page, label: string, bottomMargin: number): Promise<void> {
  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  const targetBottom = (canvasBox?.height ?? 0) - bottomMargin;
  const probePoints = [
    {
      x: (canvasBox?.x ?? 0) + 32,
      y: (canvasBox?.y ?? 0) + 32,
    },
    {
      x: (canvasBox?.x ?? 0) + Math.max(48, Math.min((canvasBox?.width ?? 0) - 48, (canvasBox?.width ?? 0) * 0.5)),
      y: (canvasBox?.y ?? 0) + 40,
    },
  ];
  for (let attempt = 0; attempt < 14; attempt += 1) {
    const probe = probePoints[attempt % probePoints.length] ?? probePoints[0];
    const bounds = await findSemanticBounds(page, label);
    if (bounds === null) {
      await page.mouse.move(probe.x, probe.y);
      await page.mouse.wheel(0, 420);
      await page.waitForTimeout(80);
      continue;
    }
    const boundsBottom = bounds.y + bounds.height;
    if (boundsBottom >= targetBottom && boundsBottom <= ((canvasBox?.height ?? 0) - 8)) {
      return;
    }
    const delta = Math.max(-720, Math.min(720, boundsBottom - targetBottom));
    await page.mouse.move(probe.x, probe.y);
    await page.mouse.wheel(0, delta);
    await page.waitForTimeout(80);
  }
  throw new Error(`Unable to move ${label} near the canvas bottom.`);
}

export async function clickSliderThumb(
  page: Page,
  label: string,
  valueNow: number,
  valueMin: number,
  valueMax: number,
): Promise<void> {
  const bounds = await findSemanticBounds(page, label);
  expect(bounds).not.toBeNull();
  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  const thumbSize = Math.min(bounds?.width ?? 0, bounds?.height ?? 0);
  const trackLength = Math.max(bounds?.width ?? 0, bounds?.height ?? 0);
  const available = trackLength - thumbSize;
  const fraction = valueMax > valueMin ? (valueNow - valueMin) / (valueMax - valueMin) : 0;
  const x = (canvasBox?.x ?? 0) + (bounds?.x ?? 0) + (thumbSize / 2) + (available * fraction);
  const y = (canvasBox?.y ?? 0) + (bounds?.y ?? 0) + ((bounds?.height ?? 0) / 2);
  await page.mouse.click(x, y);
}

export async function touchSwipeSemanticLabel(page: Page, label: string, deltaY: number, pointerId: number): Promise<void> {
  await page.evaluate(({ targetLabel, dragDeltaY, touchPointerId }) => {
    const target = (window.__bridgeSemanticTree ?? []).find((item) => item.label === targetLabel);
    const canvas = document.getElementById('fui-canvas');
    if (target === undefined || !(canvas instanceof HTMLCanvasElement)) {
      throw new Error(`Expected semantic target and canvas for ${targetLabel}.`);
    }
    const rect = canvas.getBoundingClientRect();
    const startX = target.bounds.x + 12;
    const startY = target.bounds.y + Math.min(target.bounds.height * 0.5, 10);
    const dispatch = (type: string, x: number, y: number): void => {
      canvas.dispatchEvent(new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: touchPointerId,
        pointerType: 'touch',
        isPrimary: true,
        button: 0,
        buttons: type === 'pointerup' ? 0 : 1,
        clientX: rect.left + x,
        clientY: rect.top + y,
      }));
    };
    dispatch('pointerdown', startX, startY);
    dispatch('pointermove', startX, startY - 24);
    dispatch('pointermove', startX, startY - dragDeltaY);
    dispatch('pointerup', startX, startY - dragDeltaY);
  }, { targetLabel: label, dragDeltaY: deltaY, touchPointerId: pointerId });
  await page.waitForTimeout(150);
}

export async function touchSwipeCanvasPoint(
  page: Page,
  startX: number,
  startY: number,
  deltaY: number,
  pointerId: number,
): Promise<void> {
  await page.evaluate(({ dragStartX, dragStartY, dragDeltaY, touchPointerId }) => {
    const canvas = document.getElementById('fui-canvas');
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Expected scene canvas.');
    }
    const rect = canvas.getBoundingClientRect();
    const dispatch = (type: string, x: number, y: number): void => {
      canvas.dispatchEvent(new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: touchPointerId,
        pointerType: 'touch',
        isPrimary: true,
        button: 0,
        buttons: type === 'pointerup' ? 0 : 1,
        clientX: rect.left + x,
        clientY: rect.top + y,
      }));
    };
    dispatch('pointerdown', dragStartX, dragStartY);
    dispatch('pointermove', dragStartX, dragStartY - 24);
    dispatch('pointermove', dragStartX, dragStartY - dragDeltaY);
    dispatch('pointerup', dragStartX, dragStartY - dragDeltaY);
  }, { dragStartX: startX, dragStartY: startY, dragDeltaY: deltaY, touchPointerId: pointerId });
  await page.waitForTimeout(150);
}

export async function touchSwipeCanvasVector(
  page: Page,
  startX: number,
  startY: number,
  deltaX: number,
  deltaY: number,
  pointerId: number,
): Promise<void> {
  await page.evaluate(({ dragStartX, dragStartY, dragDeltaX, dragDeltaY, touchPointerId }) => {
    const canvas = document.getElementById('fui-canvas');
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Expected scene canvas.');
    }
    const rect = canvas.getBoundingClientRect();
    const dispatch = (type: string, x: number, y: number): void => {
      canvas.dispatchEvent(new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: touchPointerId,
        pointerType: 'touch',
        isPrimary: true,
        button: 0,
        buttons: type === 'pointerup' ? 0 : 1,
        clientX: rect.left + x,
        clientY: rect.top + y,
      }));
    };
    dispatch('pointerdown', dragStartX, dragStartY);
    dispatch('pointermove', dragStartX + (dragDeltaX * 0.2), dragStartY + (dragDeltaY * 0.2));
    dispatch('pointermove', dragStartX + dragDeltaX, dragStartY + dragDeltaY);
    dispatch('pointerup', dragStartX + dragDeltaX, dragStartY + dragDeltaY);
  }, { dragStartX: startX, dragStartY: startY, dragDeltaX: deltaX, dragDeltaY: deltaY, touchPointerId: pointerId });
  await page.waitForTimeout(150);
}

export async function dispatchTouchCanvasEvents(
  page: Page,
  events: { type: string; x: number; y: number }[],
  pointerId: number,
): Promise<void> {
  await page.evaluate(({ touchEvents, touchPointerId }) => {
    const canvas = document.getElementById('fui-canvas');
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Expected scene canvas.');
    }
    const rect = canvas.getBoundingClientRect();
    for (const event of touchEvents) {
      canvas.dispatchEvent(new PointerEvent(event.type, {
        bubbles: true,
        cancelable: true,
        pointerId: touchPointerId,
        pointerType: 'touch',
        isPrimary: true,
        button: 0,
        buttons: event.type === 'pointerup' ? 0 : 1,
        clientX: rect.left + event.x,
        clientY: rect.top + event.y,
      }));
    }
  }, { touchEvents: events, touchPointerId: pointerId });
  await page.waitForTimeout(80);
}

export async function readPullToRefreshOverlay(page: Page): Promise<{
  hidden: boolean;
  visible: string | null;
  armed: string | null;
  opacity: number;
  transform: string;
} | null> {
  return await page.evaluate(() => {
    const overlay = document.getElementById('effindom-pull-to-refresh');
    if (!(overlay instanceof HTMLDivElement)) {
      return null;
    }
    const style = getComputedStyle(overlay);
    return {
      hidden: overlay.hidden,
      visible: overlay.dataset.visible ?? null,
      armed: overlay.dataset.armed ?? null,
      opacity: Number.parseFloat(style.opacity),
      transform: style.transform,
    };
  });
}

export async function readNavigationType(page: Page): Promise<string> {
  return await page.evaluate(() => {
    const entry = performance.getEntriesByType('navigation')[0];
    return entry instanceof PerformanceNavigationTiming ? entry.type : 'missing';
  });
}

export async function touchTraceCanvasPathAndReadLabel(
  page: Page,
  label: string,
  startX: number,
  startY: number,
  points: readonly { x: number; y: number; }[],
  pointerId: number,
): Promise<{ x: number; y: number; width: number; height: number; }> {
  return await page.evaluate(({ targetLabel, dragStartX, dragStartY, dragPoints, touchPointerId }) => {
    const canvas = document.getElementById('fui-canvas');
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Expected scene canvas.');
    }
    const rect = canvas.getBoundingClientRect();
    const dispatch = (type: string, x: number, y: number): void => {
      canvas.dispatchEvent(new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: touchPointerId,
        pointerType: 'touch',
        isPrimary: true,
        button: 0,
        buttons: type === 'pointerup' ? 0 : 1,
        clientX: rect.left + x,
        clientY: rect.top + y,
      }));
    };

    dispatch('pointerdown', dragStartX, dragStartY);
    for (const point of dragPoints) {
      dispatch('pointermove', point.x, point.y);
    }

    const node = (window.__bridgeSemanticTree ?? []).find((item) => item.label === targetLabel);
    if (node === undefined) {
      throw new Error(`Expected semantic label "${targetLabel}".`);
    }

    const lastPoint = dragPoints.at(-1) ?? { x: dragStartX, y: dragStartY };
    dispatch('pointerup', lastPoint.x, lastPoint.y);
    return { ...node.bounds };
  }, {
    targetLabel: label,
    dragStartX: startX,
    dragStartY: startY,
    dragPoints: points,
    touchPointerId: pointerId,
  });
}

export async function forceCoarsePointer(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'maxTouchPoints', {
      configurable: true,
      get: () => 5,
    });
    const originalMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = (query: string): MediaQueryList => {
      if (query === '(pointer: coarse)') {
        return {
          matches: true,
          media: query,
          onchange: null,
          addEventListener() { return undefined; },
          removeEventListener() { return undefined; },
          addListener() { return undefined; },
          removeListener() { return undefined; },
          dispatchEvent() { return false; },
        } as MediaQueryList;
      }
      return originalMatchMedia(query);
    };
  });
}

export async function findBottomHorizontalShellRailPoint(page: Page): Promise<{ x: number; y: number; }> {
  return await page.evaluate(() => {
    const runtime = window.EffinDomBrowserBridge?.getRuntime();
    const canvas = document.getElementById('fui-canvas');
    if (runtime === undefined || runtime === null || !(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Expected runtime and scene canvas.');
    }

    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    const ui = runtime.ui;
    const readBounds = (handle: bigint): { x: number; y: number; width: number; height: number; } | null => {
      const ptr = BigInt(Number(ui._malloc(16)));
      const offset = Number(ptr);
      try {
        const found = ui._ui_get_bounds(handle, ptr, ptr + 4n, ptr + 8n, ptr + 12n);
        if (found === 0) {
          return null;
        }
        const view = new DataView(ui.HEAPU8.buffer);
        return {
          x: view.getFloat32(offset, true),
          y: view.getFloat32(offset + 4, true),
          width: view.getFloat32(offset + 8, true),
          height: view.getFloat32(offset + 12, true),
        };
      } finally {
        ui._free(ptr);
      }
    };

    let bestX = -1;
    let bestY = -1;
    let bestWidth = 0;
    const startY = Math.max(0, height - 48);
    const endX = Math.max(8, width - 8);

    for (let y = startY; y < height; y += 2) {
      for (let x = 8; x <= endX; x += 4) {
        const handle = runtime.getHandleFromPoint(x, y);
        if (handle === 0n) {
          continue;
        }
        const bounds = readBounds(handle);
        if (bounds === null) {
          continue;
        }
        if (bounds.height > 24 || bounds.y < height - 40 || bounds.width < 40) {
          continue;
        }
        if (bounds.width > bestWidth) {
          bestWidth = bounds.width;
          bestX = bounds.x + (bounds.width * 0.5);
          bestY = Math.max(bounds.y + 1, Math.min(bounds.y + (bounds.height * 0.5), height - 2));
        }
      }
    }

    if (bestX < 0 || bestY < 0) {
      throw new Error('Expected a bottom horizontal shell rail point.');
    }
    return {
      x: bestX,
      y: bestY,
    };
  });
}

export async function readContextMenuLabels(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    return (window.__bridgeSemanticTree ?? [])
      .map((item) => item.label)
      .filter((label) =>
        label === 'Undo' ||
        label === 'Redo' ||
        label === 'Cut' ||
        label === 'Back' ||
        label === 'Forward' ||
        label === 'Copy' ||
        label === 'Paste' ||
        label === 'More' ||
        label === '<' ||
        label === 'Select All' ||
        label === 'Select all' ||
        label === 'Open Link' ||
        label === 'Open Link in New Tab' ||
        label === 'Open Image' ||
        label === 'Open Image in New Tab' ||
        label === 'Reload Page');
  });
}

export async function readUrlPreview(page: Page): Promise<{ text: string; hidden: boolean; visible: string | null; }> {
  return await page.evaluate(() => {
    const bar = document.getElementById('fui-url-bar');
    if (!(bar instanceof HTMLElement)) {
      return {
        text: '',
        hidden: true,
        visible: null,
      };
    }
    return {
      text: bar.textContent,
      hidden: bar.hidden,
      visible: bar.dataset.visible ?? null,
    };
  });
}

export function findChangedPixel(
  before: SceneRegionSnapshot,
  after: SceneRegionSnapshot,
): { x: number; y: number; before: RenderedPixel; after: RenderedPixel } | null {
  const width = Math.min(before.width, after.width);
  const height = Math.min(before.height, after.height);
  const beforePixels = before.pixels;
  const afterPixels = after.pixels;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = ((y * width) + x) * 4;
      const beforeRed = beforePixels[offset] ?? 0;
      const beforeGreen = beforePixels[offset + 1] ?? 0;
      const beforeBlue = beforePixels[offset + 2] ?? 0;
      const beforeAlpha = beforePixels[offset + 3] ?? 0;
      const afterRed = afterPixels[offset] ?? 0;
      const afterGreen = afterPixels[offset + 1] ?? 0;
      const afterBlue = afterPixels[offset + 2] ?? 0;
      const afterAlpha = afterPixels[offset + 3] ?? 0;
      if (
        beforeRed !== afterRed ||
        beforeGreen !== afterGreen ||
        beforeBlue !== afterBlue ||
        beforeAlpha !== afterAlpha
      ) {
        return {
          x,
          y,
          before: { red: beforeRed, green: beforeGreen, blue: beforeBlue, alpha: beforeAlpha },
          after: { red: afterRed, green: afterGreen, blue: afterBlue, alpha: afterAlpha },
        };
      }
    }
  }
  return null;
}

export function countPixelsDifferentFromColor(
  region: SceneRegionSnapshot,
  color: RenderedPixel,
  threshold = 8,
): number {
  let count = 0;
  for (let y = 0; y < region.height; y += 1) {
    for (let x = 0; x < region.width; x += 1) {
      const offset = ((y * region.width) + x) * 4;
      const red = region.pixels[offset] ?? 0;
      const green = region.pixels[offset + 1] ?? 0;
      const blue = region.pixels[offset + 2] ?? 0;
      const alpha = region.pixels[offset + 3] ?? 0;
      if (
        Math.abs(red - color.red) > threshold ||
        Math.abs(green - color.green) > threshold ||
        Math.abs(blue - color.blue) > threshold ||
        Math.abs(alpha - color.alpha) > threshold
      ) {
        count += 1;
      }
    }
  }
  return count;
}

export function countBlueDominantPixels(region: SceneRegionSnapshot): number {
  let count = 0;
  for (let y = 0; y < region.height; y += 1) {
    for (let x = 0; x < region.width; x += 1) {
      const offset = ((y * region.width) + x) * 4;
      const red = region.pixels[offset] ?? 0;
      const green = region.pixels[offset + 1] ?? 0;
      const blue = region.pixels[offset + 2] ?? 0;
      const alpha = region.pixels[offset + 3] ?? 0;
      if (alpha > 32 && blue > red + 20 && blue > green + 20) {
        count += 1;
      }
    }
  }
  return count;
}

export function countVisibleCaretPixels(region: SceneRegionSnapshot): number {
  let count = 0;
  for (let y = 0; y < region.height; y += 1) {
    for (let x = 0; x < region.width; x += 1) {
      const offset = ((y * region.width) + x) * 4;
      const red = region.pixels[offset] ?? 0;
      const green = region.pixels[offset + 1] ?? 0;
      const blue = region.pixels[offset + 2] ?? 0;
      const alpha = region.pixels[offset + 3] ?? 0;
      const brightest = Math.max(red, green, blue);
      const darkest = Math.min(red, green, blue);
      if (alpha > 32 && brightest >= 100 && (brightest - darkest) >= 30) {
        count += 1;
      }
    }
  }
  return count;
}

export function countReadableTextPixels(region: SceneRegionSnapshot): number {
  let count = 0;
  for (let y = 0; y < region.height; y += 1) {
    for (let x = 0; x < region.width; x += 1) {
      const offset = ((y * region.width) + x) * 4;
      const red = region.pixels[offset] ?? 0;
      const green = region.pixels[offset + 1] ?? 0;
      const blue = region.pixels[offset + 2] ?? 0;
      const alpha = region.pixels[offset + 3] ?? 0;
      if (alpha > 32 && red >= 120 && green >= 120 && blue >= 120) {
        count += 1;
      }
    }
  }
  return count;
}

export function countGreenTextPixels(region: SceneRegionSnapshot): number {
  let count = 0;
  for (let y = 0; y < region.height; y += 1) {
    for (let x = 0; x < region.width; x += 1) {
      const offset = ((y * region.width) + x) * 4;
      const red = region.pixels[offset] ?? 0;
      const green = region.pixels[offset + 1] ?? 0;
      const blue = region.pixels[offset + 2] ?? 0;
      const alpha = region.pixels[offset + 3] ?? 0;
      if (alpha > 80 && green > red + 10 && green > blue + 5 && green > 90) {
        count += 1;
      }
    }
  }
  return count;
}

export function findBlueDominantBounds(region: SceneRegionSnapshot): { minX: number; minY: number; maxX: number; maxY: number; } | null {
  let minX = region.width;
  let minY = region.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < region.height; y += 1) {
    for (let x = 0; x < region.width; x += 1) {
      const offset = ((y * region.width) + x) * 4;
      const red = region.pixels[offset] ?? 0;
      const green = region.pixels[offset + 1] ?? 0;
      const blue = region.pixels[offset + 2] ?? 0;
      const alpha = region.pixels[offset + 3] ?? 0;
      if (alpha < 180 || blue <= (red + 24) || blue <= (green + 8)) {
        continue;
      }
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) {
    return null;
  }
  return { minX, minY, maxX, maxY };
}

interface DemoLifecycleRegistrar {
  beforeAll(callback: () => Promise<void>): void;
  afterAll(callback: () => Promise<void>): void;
}

export function registerDemoLifecycle(test: DemoLifecycleRegistrar): void {
  test.beforeAll(async () => {
    server = await startStaticServer(PUBLIC_DIR, 11_301);
    baseUrl = `http://127.0.0.1:${String(server.port)}`;
  });

  test.afterAll(async () => {
    await server.close();
  });
}
