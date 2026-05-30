import { expect, test } from '@playwright/test';

import * as demo from './demo-test-support';

demo.registerDemoLifecycle(test);

test('demo renders the texture-backed media sample', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?media-assets=1`);
  await demo.waitForDemoReady(page);

  const canvas = page.locator('#fui-canvas');
  const canvasBox = await canvas.boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox === null) {
    throw new Error('Expected scene canvas bounds.');
  }

  await demo.scrollSemanticLabelIntoView(page, 'Media assets');

  let textureBounds = await demo.findSemanticBounds(page, 'Bridge loaded texture sample');
  await expect.poll(async () => {
    textureBounds = await demo.findSemanticBounds(page, 'Bridge loaded texture sample');
    return textureBounds !== null;
  }).toBe(true);
  if (textureBounds === null) {
    throw new Error('Expected texture sample bounds in semantic tree.');
  }

  await expect.poll(async () => {
    const bounds = await demo.findSemanticBounds(page, 'Bridge loaded texture sample');
    if (bounds === null) {
      return 0;
    }
    return Math.min(bounds.width, bounds.height);
  }).toBeGreaterThan(16);

  textureBounds = await demo.findSemanticBounds(page, 'Bridge loaded texture sample');
  if (textureBounds === null) {
    throw new Error('Expected texture sample bounds after media swap-in.');
  }
  const textureSampleBounds = textureBounds;

  await expect.poll(async () => {
    const samplePoints = [
      [0.2, 0.2],
      [0.8, 0.2],
      [0.2, 0.8],
      [0.8, 0.8],
    ];
    for (const [xFraction, yFraction] of samplePoints) {
      const pixel = await demo.readScenePixel(
        page,
        canvasBox.x + textureSampleBounds.x + (textureSampleBounds.width * xFraction),
        canvasBox.y + textureSampleBounds.y + (textureSampleBounds.height * yFraction),
      );
      if (pixel.alpha > 200 && pixel.blue > 180 && pixel.blue > pixel.red && pixel.blue > pixel.green) {
        return true;
      }
    }
    return false;
  }).toBe(true);
});

test('demo still boots when a dashboard texture 404s', async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const isExpectedMissingTextureError = (message: string): boolean => {
    if (
      message.includes('[fui_host] texture') &&
      message.includes('demo-secondary-texture.png') &&
      message.includes('404')
    ) {
      return true;
    }
    return message.includes('Failed to load resource') && message.includes('404');
  };
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  await page.route('**/demo-secondary-texture.png', async (route) => {
    await route.fulfill({ status: 404, body: 'missing test texture' });
  });

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?media-assets=1`);
  await demo.waitForDemoReady(page, 20000);
  await demo.scrollSemanticLabelIntoView(page, 'Media assets');

  await expect.poll(() => {
    return consoleErrors.some((message) => (
      message.includes('[fui_host] texture') &&
      message.includes('demo-secondary-texture.png') &&
      message.includes('404')
    ));
  }).toBe(true);

  const unexpectedConsoleErrors = consoleErrors.filter((message) => !isExpectedMissingTextureError(message));
  expect(unexpectedConsoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test('demo still boots when a lazy custom font 404s', async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  let interceptedFontRequests = 0;
  const isExpectedMissingFontError = (message: string): boolean => {
    if (message.includes('Failed to load resource') && message.includes('404')) {
      return true;
    }
    return message.includes('NotoSansMono-Regular.ttf') && message.includes('404');
  };
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  await page.route('**/v2/fonts/NotoSansMono-Regular.ttf', async (route) => {
    interceptedFontRequests += 1;
    await route.fulfill({ status: 404, body: 'missing test font' });
  });

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page, 20000);
  await page.evaluate(() => {
    const withCallbacks = window as Window & {
      __effindomCallbacks?: { onRequestFontLoad?: (fontId: number, url: string) => void };
    };
    withCallbacks.__effindomCallbacks?.onRequestFontLoad?.(990_001, '/v2/fonts/NotoSansMono-Regular.ttf');
  });

  await expect.poll(() => {
    return interceptedFontRequests;
  }).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => window.__fuiAsReady)).toBe(true);

  const unexpectedConsoleErrors = consoleErrors.filter((message) => !isExpectedMissingFontError(message));
  expect(unexpectedConsoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test('advanced controls rich text proof renders the mono override and emoji stack', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(
    page,
    'This first sample proves a RichText container default plus a per-span monospace override.',
  );
  const descriptionBounds = await demo.findSemanticBounds(page, 'Static rich text description');
  const firstHintBounds = await demo.findSemanticBounds(
    page,
    'This first sample proves a RichText container default plus a per-span monospace override.',
  );
  const secondHintBounds = await demo.findSemanticBounds(
    page,
    'This second sample covers helper-span decorations and the color emoji face.',
  );
  expect(descriptionBounds).not.toBeNull();
  expect(firstHintBounds).not.toBeNull();
  expect(secondHintBounds).not.toBeNull();
  if (descriptionBounds === null || firstHintBounds === null || secondHintBounds === null) {
    throw new Error('Expected RichText proof surrounding text bounds.');
  }

  await expect.poll(async () => {
    const top = descriptionBounds.y + descriptionBounds.height + 4;
    const bottom = firstHintBounds.y - 4;
    const region = await demo.readSceneRegion(
      page,
      Math.floor(descriptionBounds.x),
      Math.floor(top),
      Math.ceil(descriptionBounds.width),
      Math.max(1, Math.floor(bottom - top)),
    );
    return demo.countReadableTextPixels(region);
  }).toBeGreaterThan(30);

  await expect.poll(async () => {
    const top = firstHintBounds.y + firstHintBounds.height + 8;
    const bottom = secondHintBounds.y - 4;
    const region = await demo.readSceneRegion(
      page,
      Math.floor(firstHintBounds.x),
      Math.floor(top),
      Math.ceil(firstHintBounds.width),
      Math.max(1, Math.floor(bottom - top)),
    );
    return demo.countGreenTextPixels(region);
  }).toBeGreaterThan(20);
});

test('advanced controls rich text copies rich clipboard payloads with keyboard shortcuts', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: demo.baseUrl });
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(
    page,
    'This first sample proves a RichText container default plus a per-span monospace override.',
  );
  const firstHintBounds = await demo.findSemanticBounds(
    page,
    'This first sample proves a RichText container default plus a per-span monospace override.',
  );
  const secondHintBounds = await demo.findSemanticBounds(
    page,
    'This second sample covers helper-span decorations and the color emoji face.',
  );
  expect(firstHintBounds).not.toBeNull();
  expect(secondHintBounds).not.toBeNull();
  if (firstHintBounds === null || secondHintBounds === null) {
    throw new Error('Expected RichText helper bounds.');
  }

  const helperHandle = await demo.findClipboardSelectableHandleInRegion(page, {
    x: firstHintBounds.x,
    y: firstHintBounds.y + firstHintBounds.height + 6,
    width: firstHintBounds.width,
    height: Math.max(12, secondHintBounds.y - firstHintBounds.y - firstHintBounds.height - 12),
  }, 'emoji-');
  await demo.selectEntireTextHandle(page, helperHandle.handle);
  const selectedText = helperHandle.text;

  await page.keyboard.press('ControlOrMeta+C');

  await expect.poll(async () => (await demo.readClipboardSnapshot(page)).text).toBe(selectedText);
  await expect.poll(async () => {
    const snapshot = await demo.readClipboardSnapshot(page);
    return {
      hasHtml: snapshot.types.includes('text/html'),
      hasRichJson: snapshot.types.includes('web application/x-effindom-richtext+json'),
      html: snapshot.html,
      richJson: snapshot.richJson,
    };
  }).toMatchObject({
    hasHtml: true,
    hasRichJson: true,
  });
  const snapshot = await demo.readClipboardSnapshot(page);
  expect(snapshot.html).toContain('data-effindom-richtext="1"');
  expect(snapshot.html).toContain('background-color:');
  expect(snapshot.richJson).toContain('"emoji- "');
  expect(snapshot.richJson).toContain('NotoColorEmoji');
  expect(snapshot.richJson).toContain('"fontUrl"');
});

test('advanced controls rich text context-menu copy uses the rich clipboard pipeline', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: demo.baseUrl });
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(
    page,
    'This first sample proves a RichText container default plus a per-span monospace override.',
  );
  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  const firstHintBounds = await demo.findSemanticBounds(
    page,
    'This first sample proves a RichText container default plus a per-span monospace override.',
  );
  const secondHintBounds = await demo.findSemanticBounds(
    page,
    'This second sample covers helper-span decorations and the color emoji face.',
  );
  expect(firstHintBounds).not.toBeNull();
  expect(secondHintBounds).not.toBeNull();
  if (canvasBox === null || firstHintBounds === null || secondHintBounds === null) {
    throw new Error('Expected RichText helper bounds.');
  }

  const helperHandle = await demo.findClipboardSelectableHandleInRegion(page, {
    x: firstHintBounds.x,
    y: firstHintBounds.y + firstHintBounds.height + 6,
    width: firstHintBounds.width,
    height: Math.max(12, secondHintBounds.y - firstHintBounds.y - firstHintBounds.height - 12),
  }, 'emoji-');
  const helperBounds = await demo.readUiHandleBounds(page, helperHandle.handle);
  await demo.selectEntireTextHandle(page, helperHandle.handle);
  const selectedText = helperHandle.text;
  expect(helperBounds).not.toBeNull();
  if (helperBounds === null) {
    throw new Error('Expected helper RichText bounds.');
  }

  await page.mouse.click(
    canvasBox.x + helperBounds.x + (helperBounds.width * 0.5),
    canvasBox.y + helperBounds.y + (helperBounds.height * 0.5),
    { button: 'right' },
  );
  await expect.poll(async () => await demo.readContextMenuLabels(page)).toEqual(['Copy', 'Select All', 'Reload Page']);
  const copyBounds = await demo.findSemanticBounds(page, 'Copy');
  expect(copyBounds).not.toBeNull();
  if (copyBounds === null) {
    throw new Error('Expected Copy menu item bounds.');
  }
  await page.mouse.click(
    canvasBox.x + copyBounds.x + (copyBounds.width * 0.5),
    canvasBox.y + copyBounds.y + (copyBounds.height * 0.5),
  );

  await expect.poll(async () => (await demo.readClipboardSnapshot(page)).text).toBe(selectedText);
  const snapshot = await demo.readClipboardSnapshot(page);
  expect(snapshot.types).toContain('text/html');
  expect(snapshot.types).toContain('web application/x-effindom-richtext+json');
  expect(snapshot.richJson).toContain('"helpers"');
});
