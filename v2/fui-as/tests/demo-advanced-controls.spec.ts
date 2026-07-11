import { expect,test } from '@playwright/test';

import * as demo from './demo-test-support';

demo.registerDemoLifecycle(test);

test('advanced controls route keeps the shared action button and nav-label hit areas activatable', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Ping advanced controls');

  await demo.clickSemanticLabel(page, 'Ping advanced controls');

  await expect.poll(async () => {
    return await page.evaluate(() =>
      (window as Window & { __getAdvancedControlsActionCount?: () => number }).__getAdvancedControlsActionCount?.() ?? null,
    );
  }).toBe(1);

  await demo.scrollSemanticLabelIntoView(page, 'Dashboard');
  await demo.clickSemanticLabel(page, 'Dashboard');
  await demo.waitForDemoReady(page);

  await expect(page).toHaveURL(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
});

test('advanced controls route exposes the TextArea playground and toggles read-only semantics', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Read-only');

  await expect.poll(async () => {
    const node = await demo.readSemanticNode(page, 'Advanced controls demo text area');
    return node === null ? null : {
      roleName: node.roleName,
      multiline: node.state.multiline === true,
      readonly: node.state.readonly === true,
    };
  }).toEqual({
    roleName: 'textbox',
    multiline: true,
    readonly: false,
  });

  await demo.clickSemanticLabel(page, 'Read-only');
  await expect.poll(async () => {
    const node = await demo.readSemanticNode(page, 'Advanced controls demo text area');
    return node?.state.readonly === true;
  }).toBe(true);
});

test('advanced controls route showcases explicit scroll content size on the animation sample', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Scroll to logical tail');

  await demo.clickSemanticLabel(page, 'Scroll to logical tail');

  await expect.poll(async () => {
    return await page.evaluate(() => {
      return (window as Window & { __getAdvancedControlsAnimationTargetCode?: () => number })
        .__getAdvancedControlsAnimationTargetCode?.() ?? -1;
    });
  }).toBe(3);
});

test('advanced controls route keeps hot-swap notes semantics tied to rendered copy', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);

  const labels = await page.evaluate(() => (window.__bridgeSemanticTree ?? []).map((node) => node.label));

  expect(labels).toContain('Hot-swap notes');
  expect(labels).toContain(
    'Explore TextArea behavior with live wrapping, read-only, scrollbar, line-height, and visibility controls.',
  );
  expect(labels).not.toContain('Advanced controls notes heading');
  expect(labels).not.toContain('Advanced controls highlight 1');
});

test('advanced controls route resolves custom fonts from /v2/fonts', async ({ page }) => {
  const fontResponses: { pathname: string; status: number }[] = [];
  page.on('response', (response) => {
    const pathname = new URL(response.url()).pathname;
    if (!pathname.includes('/fonts/')) {
      return;
    }
    fontResponses.push({
      pathname,
      status: response.status(),
    });
  });

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Custom DejaVu FontStack sample 🌍');

  await expect.poll(() =>
    fontResponses.some((response) => response.pathname === '/v2/fonts/DejaVuSans.ttf' && response.status === 200),
  ).toBe(true);
  await expect.poll(() =>
    fontResponses.some((response) => response.pathname === '/v2/fonts/NotoColorEmoji.ttf' && response.status === 200),
  ).toBe(true);

  expect(fontResponses.filter((response) => response.pathname.startsWith('/fonts/'))).toEqual([]);
  expect(fontResponses.filter((response) => response.status >= 400)).toEqual([]);
});

test('advanced controls route keeps the scrollbar policy radios inside the section layout', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Horizontal scrollbar: Never');

  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox === null) {
    throw new Error('Expected scene canvas bounds.');
  }

  const verticalAuto = await demo.readSemanticNode(page, 'Hide vertical scrollbar');
  const horizontalNever = await demo.readSemanticNode(page, 'Horizontal scrollbar: Never');
  expect(verticalAuto?.roleName).toBe('checkbox');
  expect(horizontalNever?.roleName).toBe('radio');
  expect((verticalAuto?.bounds.x ?? 0) + (verticalAuto?.bounds.width ?? 0)).toBeLessThanOrEqual(canvasBox.width - 12);
  expect((horizontalNever?.bounds.x ?? 0) + (horizontalNever?.bounds.width ?? 0)).toBeLessThanOrEqual(canvasBox.width - 12);
});

test('advanced controls route toggles textarea line-height mode', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Line height: Normal');

  await expect.poll(async () => {
    return await demo.readSemanticLabelByPrefix(page, 'Read-only: ');
  }).toContain('Line height: normal');

  await demo.clickSemanticLabel(page, 'Line height: Fixed 28 px');

  await expect.poll(async () => {
    return await demo.readSemanticLabelByPrefix(page, 'Read-only: ');
  }).toContain('Line height: fixed 28px');
});

test('advanced controls route showcases transition and smooth-scroll animation demos', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Emphasize preview card');

  const previewBounds = await demo.findSemanticBounds(page, 'Animation preview card');
  expect(previewBounds).not.toBeNull();
  if (previewBounds === null) {
    throw new Error('Expected animation preview card bounds.');
  }

  const previewProbe = {
    x: Math.floor(previewBounds.x + Math.max(20, previewBounds.width - 36)),
    y: Math.floor(previewBounds.y + Math.max(20, previewBounds.height - 36)),
  };
  const beforePreviewPixel = await demo.readScenePixel(page, previewProbe.x, previewProbe.y);

  await demo.clickSemanticLabel(page, 'Emphasize preview card');

  await expect.poll(async () => {
    const nextPixel = await demo.readScenePixel(page, previewProbe.x, previewProbe.y);
    return demo.pixelDifferenceMagnitude(beforePreviewPixel, nextPixel);
  }).toBeGreaterThan(80);

  const viewportBounds = await demo.findSemanticBounds(page, 'Animation sample scroll viewport');
  expect(viewportBounds).not.toBeNull();
  if (viewportBounds === null) {
    throw new Error('Expected animation sample scroll viewport bounds.');
  }
  const beforeScrollSignature = await demo.readSceneRegionSignature(
    page,
    viewportBounds.x + 8,
    viewportBounds.y + 8,
    viewportBounds.width - 16,
    viewportBounds.height - 16,
  );

  await demo.scrollSemanticLabelIntoView(page, 'Scroll to final sample');
  await demo.clickSemanticLabel(page, 'Scroll to final sample');

  await expect.poll(async () => {
    return await page.evaluate(() =>
      (window as Window & { __getAdvancedControlsAnimationTargetCode?: () => number })
        .__getAdvancedControlsAnimationTargetCode?.() ?? -1,
    );
  }).toBe(2);

  await expect.poll(async () => {
    return await demo.readSceneRegionSignature(
      page,
      viewportBounds.x + 8,
      viewportBounds.y + 8,
      viewportBounds.width - 16,
      viewportBounds.height - 16,
    );
  }).not.toBe(beforeScrollSignature);
});

test('advanced controls button tones stay stable after pointer interaction', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Scroll to final sample');

  const calmBounds = await demo.findSemanticBounds(page, 'Set calm preview');
  const tailBounds = await demo.findSemanticBounds(page, 'Scroll to logical tail');
  expect(calmBounds).not.toBeNull();
  expect(tailBounds).not.toBeNull();
  if (calmBounds === null || tailBounds === null) {
    throw new Error('Expected advanced-controls button bounds.');
  }

  const calmBefore = await demo.readSceneRegionSignature(
    page,
    calmBounds.x + 6,
    calmBounds.y + 6,
    calmBounds.width - 12,
    calmBounds.height - 12,
  );
  const tailBefore = await demo.readSceneRegionSignature(
    page,
    tailBounds.x + 6,
    tailBounds.y + 6,
    tailBounds.width - 12,
    tailBounds.height - 12,
  );

  await demo.clickSemanticLabel(page, 'Scroll to final sample');

  await expect.poll(async () => {
    return await page.evaluate(() =>
      (window as Window & { __getAdvancedControlsAnimationTargetCode?: () => number })
        .__getAdvancedControlsAnimationTargetCode?.() ?? -1,
    );
  }).toBe(2);

  await expect.poll(async () => {
    return {
      calm: await demo.readSceneRegionSignature(
        page,
        calmBounds.x + 6,
        calmBounds.y + 6,
        calmBounds.width - 12,
        calmBounds.height - 12,
      ),
      tail: await demo.readSceneRegionSignature(
        page,
        tailBounds.x + 6,
        tailBounds.y + 6,
        tailBounds.width - 12,
        tailBounds.height - 12,
      ),
    };
  }).toEqual({
    calm: calmBefore,
    tail: tailBefore,
  });
});

test('advanced controls route streams prime-search progress into the worker demo and completes', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Start prime worker');

  await demo.clickSemanticLabel(page, 'Start prime worker');

  await expect.poll(async () => {
    const label = await demo.readWorkerStatusLabel(page);
    if (label === null) {
      return -1;
    }
    const match = /Progress: (\d+)%/.exec(label);
    return match === null ? -1 : Number.parseInt(match[1], 10);
  }).toBeGreaterThan(0);

  await expect.poll(async () => {
    return await demo.readWorkerStatusLabel(page);
  }, { timeout: 10000 }).toContain('Worker status: complete • Progress: 100%');

  await expect.poll(async () => {
    return await demo.readWorkerDetailLabel(page);
  }).toContain('Largest prime after 5s: ');
});

test('advanced controls route can cooperatively cancel the prime worker demo', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Start prime worker');

  await demo.clickSemanticLabel(page, 'Start prime worker');

  await expect.poll(async () => {
    const label = await demo.readWorkerStatusLabel(page);
    if (label === null) {
      return -1;
    }
    const match = /Progress: (\d+)%/.exec(label);
    return match === null ? -1 : Number.parseInt(match[1], 10);
  }).toBeGreaterThan(0);

  await demo.clickSemanticLabel(page, 'Cancel prime worker');

  await expect.poll(async () => {
    return await demo.readWorkerStatusLabel(page);
  }).toContain('Worker status: cancelled');

  await expect.poll(async () => {
    return await demo.readWorkerDetailLabel(page);
  }).toContain('Prime search cancelled after yielding at ');
});

test('advanced controls route accepts metadata-first external file drops on the retained target', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'External file drop target');

  const targetBounds = await demo.findSemanticBounds(page, 'External file drop target');
  expect(targetBounds).not.toBeNull();
  if (targetBounds === null) {
    throw new Error('Expected external file drop target bounds.');
  }

  const dropPoint = {
    x: Math.floor(targetBounds.x + (targetBounds.width * 0.5)),
    y: Math.floor(targetBounds.y + (targetBounds.height * 0.5)),
  };
  const dataTransfer = await page.evaluateHandle(() => {
    const value = new DataTransfer();
    value.items.add(new File(['todo: ship'], 'todo.txt', { type: 'text/plain' }));
    return value;
  });
  const sceneSurface = page.locator('[data-effindom-canvas-size-source]');
  await sceneSurface.dispatchEvent('dragenter', {
    bubbles: true,
    cancelable: true,
    clientX: dropPoint.x,
    clientY: dropPoint.y,
    dataTransfer,
  });
  await sceneSurface.dispatchEvent('dragover', {
    bubbles: true,
    cancelable: true,
    clientX: dropPoint.x,
    clientY: dropPoint.y,
    dataTransfer,
  });

  await expect.poll(async () => {
    return await demo.readSemanticLabelByPrefix(page, 'External drop status: ');
  }).toContain('hovering 1 file');

  await sceneSurface.dispatchEvent('drop', {
    bubbles: true,
    cancelable: true,
    clientX: dropPoint.x,
    clientY: dropPoint.y,
    dataTransfer,
  });
  await dataTransfer.dispose();

  await expect.poll(async () => {
    return await demo.readSemanticLabelByPrefix(page, 'External drop status: ');
  }).toContain('dropped 1 file');
  await expect.poll(async () => {
    return await demo.readSemanticLabelByPrefix(page, 'External drop items: ');
  }).toContain('todo.txt (file, text/plain, 10 bytes)');
});

test('advanced controls route copies a dropped file through the worker-backed save demo', async ({ page }) => {
  await page.addInitScript(() => {
    const textEncoder = new TextEncoder();
    const textDecoder = new TextDecoder();
    (window as Window & {
      __demoCopiedFileText?: string;
      __demoCopiedFileName?: string;
      __demoCopiedFileAborted?: boolean;
      showSaveFilePicker?: (options?: { suggestedName?: string }) => Promise<{
        readonly name: string;
        createWritable(): Promise<{
          write(data: string | ArrayBuffer | ArrayBufferView | Blob): Promise<void>;
          close(): Promise<void>;
          abort(): Promise<void>;
        }>;
      }>;
    }).showSaveFilePicker = (options) => {
      const chunks: Uint8Array[] = [];
      const fileName = options?.suggestedName ?? 'worker-copy.txt';
      return Promise.resolve({
        name: fileName,
        createWritable() {
          return Promise.resolve({
            async write(data) {
              if (typeof data === 'string') {
                chunks.push(textEncoder.encode(data));
                return;
              }
              if (data instanceof Blob) {
                chunks.push(new Uint8Array(await data.arrayBuffer()));
                return;
              }
              if (data instanceof ArrayBuffer) {
                chunks.push(new Uint8Array(data));
                return;
              }
              if (ArrayBuffer.isView(data)) {
                chunks.push(new Uint8Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)));
                return;
              }
              throw new Error('Unsupported write payload.');
            },
            close() {
              let total = 0;
              for (const chunk of chunks) {
                total += chunk.length;
              }
              const merged = new Uint8Array(total);
              let offset = 0;
              for (const chunk of chunks) {
                merged.set(chunk, offset);
                offset += chunk.length;
              }
              (window as Window & { __demoCopiedFileText?: string; __demoCopiedFileName?: string }).__demoCopiedFileText = textDecoder.decode(merged);
              (window as Window & { __demoCopiedFileText?: string; __demoCopiedFileName?: string }).__demoCopiedFileName = fileName;
              return Promise.resolve();
            },
            abort() {
              (window as Window & { __demoCopiedFileAborted?: boolean }).__demoCopiedFileAborted = true;
              return Promise.resolve();
            },
          });
        },
      });
    };
  });

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'External file drop target');

  const targetBounds = await demo.findSemanticBounds(page, 'External file drop target');
  expect(targetBounds).not.toBeNull();
  if (targetBounds === null) {
    throw new Error('Expected external file drop target bounds.');
  }

  const dropPoint = {
    x: Math.floor(targetBounds.x + (targetBounds.width * 0.5)),
    y: Math.floor(targetBounds.y + (targetBounds.height * 0.5)),
  };
  const dataTransfer = await page.evaluateHandle(() => {
    const value = new DataTransfer();
    value.items.add(new File(['todo: ship'], 'todo.txt', { type: 'text/plain' }));
    return value;
  });
  const sceneSurface = page.locator('[data-effindom-canvas-size-source]');
  await sceneSurface.dispatchEvent('dragenter', {
    bubbles: true,
    cancelable: true,
    clientX: dropPoint.x,
    clientY: dropPoint.y,
    dataTransfer,
  });
  await sceneSurface.dispatchEvent('dragover', {
    bubbles: true,
    cancelable: true,
    clientX: dropPoint.x,
    clientY: dropPoint.y,
    dataTransfer,
  });
  await sceneSurface.dispatchEvent('drop', {
    bubbles: true,
    cancelable: true,
    clientX: dropPoint.x,
    clientY: dropPoint.y,
    dataTransfer,
  });
  await dataTransfer.dispose();

  await demo.scrollSemanticLabelIntoView(page, 'Save dropped file copy');
  await demo.clickSemanticLabel(page, 'Save dropped file copy');

  await expect.poll(async () => {
    return await demo.readSemanticLabelByPrefix(page, 'External drop status: ');
  }).toContain('worker copied 10 bytes');

  await expect.poll(async () => {
    return await page.evaluate(() =>
      (window as Window & { __demoCopiedFileText?: string }).__demoCopiedFileText ?? null,
    );
  }).toBe('todo: ship');

  await expect.poll(async () => {
    return await page.evaluate(() =>
      (window as Window & { __demoCopiedFileName?: string }).__demoCopiedFileName ?? null,
    );
  }).toBe('todo-copy.txt');
});

test('advanced controls route resolves late cancellation when the worker completes before cancel takes effect', async ({ page }) => {
  await page.addInitScript(() => {
    class FakeWorker {
      private readonly listeners: Partial<Record<string, ((event: Event) => void)[]>> = {
        message: [],
        error: [],
      };
      private terminated = false;

      addEventListener(type: string, listener: (event: Event) => void): void {
        const bucket = this.listeners[type];
        if (bucket !== undefined) {
          bucket.push(listener);
        }
      }

      removeEventListener(type: string, listener: (event: Event) => void): void {
        const bucket = this.listeners[type];
        if (bucket === undefined) {
          return;
        }
        const index = bucket.indexOf(listener);
        if (index >= 0) {
          bucket.splice(index, 1);
        }
      }

      postMessage(message: { type: string; wasmUrl?: string; entryName?: string }): void {
        if (this.terminated) {
          return;
        }
        if (message.type === 'start') {
          (window as Window & { __advancedControlsWorkerStart?: { wasmUrl?: string; entryName?: string } }).__advancedControlsWorkerStart = {
            wasmUrl: message.wasmUrl,
            entryName: message.entryName,
          };
          queueMicrotask(() => {
            if (this.terminated) {
              return;
            }
            this.emit('message', new MessageEvent('message', {
              data: { type: 'progress', text: '80' },
            }));
          });
          return;
        }
        if (message.type === 'cancel') {
          queueMicrotask(() => {
            if (this.terminated) {
              return;
            }
            this.emit('message', new MessageEvent('message', {
              data: { type: 'complete', text: '104729' },
            }));
          });
        }
      }

      terminate(): void {
        this.terminated = true;
      }

      private emit(type: string, event: Event): void {
        const bucket = this.listeners[type];
        if (bucket === undefined) {
          return;
        }
        for (const listener of bucket) {
          listener(event);
        }
      }
    }

    Object.defineProperty(window, 'Worker', {
      configurable: true,
      writable: true,
      value: FakeWorker,
    });
  });

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Start prime worker');

  await demo.clickSemanticLabel(page, 'Start prime worker');

  await expect.poll(async () => {
    return await page.evaluate(() => (window as Window & {
      __advancedControlsWorkerStart?: { wasmUrl?: string; entryName?: string };
    }).__advancedControlsWorkerStart ?? null);
  }).toEqual({
    wasmUrl: `${demo.baseUrl}/v2/fui-as/demo/workers/advanced_controls_workers.wasm`,
    entryName: 'largestPrimeCalculatorWorker',
  });

  await expect.poll(async () => {
    return await demo.readWorkerStatusLabel(page);
  }).toContain('Worker status: running • Progress: 80%');

  await demo.clickSemanticLabel(page, 'Cancel prime worker');

  await expect.poll(async () => {
    return await demo.readWorkerStatusLabel(page);
  }).toContain('Worker status: complete • Progress: 100%');

  await expect.poll(async () => {
    return await demo.readWorkerDetailLabel(page);
  }).toContain('Largest prime after 5s: 104729');
});

test('advanced controls route reorders the retained drag list through the phase-4 demo', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Reorder demo viewport');

  await demo.dragSemanticLabelToSemanticLabel(
    page,
    'Drag grip for Add drag reorder demo',
    'Audit font shard cache',
  );

  await expect.poll(async () => {
    return await demo.readSemanticLabelByPrefix(page, 'Reorder order: ');
  }).toContain('Document Core rename | Add drag reorder demo | Audit font shard cache');

  await expect.poll(async () => {
    return await demo.readSemanticLabelByPrefix(page, 'Reorder drag status: ');
  }).toContain('moved Add drag reorder demo to slot 2');
});

test('advanced controls route picks up and drops a reorder row by touch long press', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Native CDP touch injection is Chromium-only.');
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, get: () => 5 });
  });
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Reorder demo viewport');
  await page.waitForTimeout(400);

  const sourceBounds = await demo.findSemanticBounds(page, 'Drag grip for Document Core rename');
  const viewportBounds = await demo.findSemanticBounds(page, 'Reorder demo viewport');
  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  if (sourceBounds === null || viewportBounds === null || canvasBox === null) {
    throw new Error('Expected touch reorder bounds.');
  }
  const start = {
    x: canvasBox.x + sourceBounds.x + sourceBounds.width * 0.5,
    y: canvasBox.y + sourceBounds.y + sourceBounds.height * 0.5,
  };
  const end = {
    x: canvasBox.x + viewportBounds.x + viewportBounds.width * 0.5,
    y: canvasBox.y + viewportBounds.y + viewportBounds.height * 0.75,
  };
  const client = await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ ...start, id: 71, radiusX: 8, radiusY: 8, force: 1 }],
  });
  await page.waitForTimeout(900);
  await expect.poll(async () => {
    return await demo.readSemanticLabelByPrefix(page, 'Reorder drag status: ');
  }).toContain('dragging Document Core rename');
  for (let step = 1; step <= 8; step += 1) {
    const progress = step / 8;
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{
        x: start.x + (end.x - start.x) * progress,
        y: start.y + (end.y - start.y) * progress,
        id: 71,
        radiusX: 8,
        radiusY: 8,
        force: 1,
      }],
    });
    await page.waitForTimeout(35);
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

  await expect.poll(async () => {
    return await demo.readSemanticLabelByPrefix(page, 'Reorder drag status: ');
  }).toContain('moved Document Core rename');
  await expect.poll(async () => {
    return await demo.readSemanticLabelByPrefix(page, 'Reorder order: ');
  }).not.toContain('Reorder order: Document Core rename | Audit font shard cache');
});

test('advanced controls route shows drag-preview and cursor feedback while a reorder drag is active', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Reorder demo viewport');

  const sourceBounds = await demo.findSemanticBounds(page, 'Drag grip for Add drag reorder demo');
  const targetBounds = await demo.findSemanticBounds(page, 'Audit font shard cache');
  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(sourceBounds).not.toBeNull();
  expect(targetBounds).not.toBeNull();
  expect(canvasBox).not.toBeNull();
  if (sourceBounds === null || targetBounds === null || canvasBox === null) {
    throw new Error('Expected reorder drag bounds.');
  }

  const startX = canvasBox.x + sourceBounds.x + (sourceBounds.width * 0.5);
  const startY = canvasBox.y + sourceBounds.y + (sourceBounds.height * 0.5);
  const endX = canvasBox.x + targetBounds.x + (targetBounds.width * 0.5);
  const endY = canvasBox.y + targetBounds.y + (targetBounds.height * 0.5);

  await page.mouse.move(startX, startY);
  await expect.poll(async () => {
    return await page.locator('#fui-canvas').evaluate((element) => getComputedStyle(element).cursor);
  }).toBe('grab');

  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps: 10 });

  await expect.poll(async () => {
    return await page.locator('#fui-canvas').evaluate((element) => getComputedStyle(element).cursor);
  }).toBe('move');
  await expect.poll(async () => {
    return await demo.readSemanticLabelByPrefix(page, 'Reorder drag preview for ');
  }).toContain('Add drag reorder demo');
  await expect.poll(async () => {
    return await demo.readSemanticLabelByPrefix(page, 'Reorder drag status: ');
  }).toContain('preview slot 2');

  await page.mouse.up();

  await expect.poll(async () => {
    return await page.locator('#fui-canvas').evaluate((element) => getComputedStyle(element).cursor);
  }).not.toBe('move');
});

test('advanced controls route cancels the reorder drag without moving items when released outside a drop target', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Reorder demo viewport');

  const beforeOrder = await demo.readSemanticLabelByPrefix(page, 'Reorder order: ');
  const sourceBounds = await demo.findSemanticBounds(page, 'Drag grip for Add drag reorder demo');
  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(sourceBounds).not.toBeNull();
  expect(canvasBox).not.toBeNull();
  if (sourceBounds === null || canvasBox === null) {
    throw new Error('Expected reorder drag source bounds.');
  }

  await page.mouse.move(
    canvasBox.x + sourceBounds.x + (sourceBounds.width * 0.5),
    canvasBox.y + sourceBounds.y + (sourceBounds.height * 0.5),
  );
  await page.mouse.down();
  await page.mouse.move(canvasBox.x + 24, canvasBox.y + 24, { steps: 10 });
  await expect.poll(async () => {
    return await page.locator('#fui-canvas').evaluate((element) => getComputedStyle(element).cursor);
  }).toBe('grabbing');
  await page.mouse.up();

  await expect.poll(async () => {
    return await demo.readSemanticLabelByPrefix(page, 'Reorder order: ');
  }).toBe(beforeOrder);

  await expect.poll(async () => {
    return await demo.readSemanticLabelByPrefix(page, 'Reorder drag status: ');
  }).toContain('cancelled Add drag reorder demo');
});

test('advanced controls route auto-scrolls the reorder viewport while dragging near its bottom edge', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Reorder demo viewport');

  const sourceBounds = await demo.findSemanticBounds(page, 'Drag grip for Document Core rename');
  const targetBounds = await demo.findSemanticBounds(page, 'Add drag reorder demo');
  const viewportBounds = await demo.findSemanticBounds(page, 'Reorder demo viewport');
  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(sourceBounds).not.toBeNull();
  expect(targetBounds).not.toBeNull();
  expect(viewportBounds).not.toBeNull();
  expect(canvasBox).not.toBeNull();
  if (sourceBounds === null || targetBounds === null || viewportBounds === null || canvasBox === null) {
    throw new Error('Expected reorder viewport bounds.');
  }

  const startX = canvasBox.x + sourceBounds.x + (sourceBounds.width * 0.5);
  const startY = canvasBox.y + sourceBounds.y + (sourceBounds.height * 0.5);
  const edgeX = canvasBox.x + targetBounds.x + (targetBounds.width * 0.5);
  const edgeY = canvasBox.y + viewportBounds.y + viewportBounds.height - 6;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(edgeX, edgeY, { steps: 12 });

  await expect.poll(async () => {
    const label = await demo.readSemanticLabelByPrefix(page, 'Reorder viewport status: ');
    const match = label === null ? null : /offset (\d+)/.exec(label);
    return match === null ? 0 : Number.parseInt(match[1], 10);
  }).toBeGreaterThan(0);

  await page.waitForTimeout(300);
  await page.mouse.up();

  await expect.poll(async () => {
    return await demo.readSemanticLabelByPrefix(page, 'Reorder order: ');
  }).not.toContain('Reorder order: Document Core rename | Audit font shard cache');
});

test('advanced controls route keeps inner reorder drops working when the outer routed page is already scrolled', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.moveSemanticLabelNearCanvasBottom(page, 'Reorder demo viewport', 28);

  await demo.dragSemanticLabelToSemanticLabel(
    page,
    'Drag grip for Audit font shard cache',
    'Document Core rename',
  );

  await expect.poll(async () => {
    return {
      first: await demo.readSemanticLabelByPrefix(page, 'Reorder item 1: '),
      second: await demo.readSemanticLabelByPrefix(page, 'Reorder item 2: '),
    };
  }).toEqual({
    first: 'Reorder item 1: Audit font shard cache',
    second: 'Reorder item 2: Document Core rename',
  });
});
