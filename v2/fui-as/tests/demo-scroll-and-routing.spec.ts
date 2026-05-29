import { expect, test } from '@playwright/test';

import * as demo from './demo-test-support';

demo.registerDemoLifecycle(test);

test('wheel scrolling over the gap and scrollbar track scrolls the list', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?wheel-routing=1`);
  await demo.waitForDemoReady(page);

  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox === null) {
    throw new Error('Expected scene canvas bounds.');
  }

  const wheelTargets = await page.evaluate(() => {
    const firstItem = (window.__bridgeSemanticTree ?? []).find((node) => node.label === 'Item 0');
    if (firstItem === undefined) {
      throw new Error('Expected first list item bounds.');
    }
    return {
      gapX: firstItem.bounds.x + firstItem.bounds.width + 8,
      trackX: firstItem.bounds.x + firstItem.bounds.width + 12,
      trackOuterX: firstItem.bounds.x + firstItem.bounds.width + 16,
      y: firstItem.bounds.y + 12,
    };
  });

  const beforeGapWheel = await demo.readFirstVisibleItemIndex(page);
  await page.mouse.move(canvasBox.x + wheelTargets.gapX, canvasBox.y + wheelTargets.y);
  await page.mouse.wheel(0, 160);
  await expect.poll(async () => await demo.readFirstVisibleItemIndex(page)).toBeGreaterThan(beforeGapWheel);

  const beforeTrackWheel = await demo.readFirstVisibleItemIndex(page);
  await page.mouse.move(canvasBox.x + wheelTargets.trackX, canvasBox.y + wheelTargets.y);
  await page.mouse.wheel(0, 160);
  await expect.poll(async () => await demo.readFirstVisibleItemIndex(page)).toBeGreaterThan(beforeTrackWheel);

  const beforeOuterTrackWheel = await demo.readFirstVisibleItemIndex(page);
  await page.mouse.move(canvasBox.x + wheelTargets.trackOuterX, canvasBox.y + wheelTargets.y + 208);
  await page.mouse.wheel(0, 160);
  await expect.poll(async () => await demo.readFirstVisibleItemIndex(page)).toBeGreaterThan(beforeOuterTrackWheel);
});

test('coarse-pointer wheel scrolling over the gap and scrollbar track still scrolls the list', async ({ page }) => {
  await demo.forceCoarsePointer(page);
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?wheel-routing=1`);
  await demo.waitForDemoReady(page);

  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox === null) {
    throw new Error('Expected scene canvas bounds.');
  }

  const wheelTargets = await page.evaluate(() => {
    const firstItem = (window.__bridgeSemanticTree ?? []).find((node) => node.label === 'Item 0');
    if (firstItem === undefined) {
      throw new Error('Expected first list item bounds.');
    }
    return {
      gapX: firstItem.bounds.x + firstItem.bounds.width + 8,
      trackX: firstItem.bounds.x + firstItem.bounds.width + 12,
      trackOuterX: firstItem.bounds.x + firstItem.bounds.width + 16,
      y: firstItem.bounds.y + 12,
    };
  });

  const beforeGapWheel = await demo.readFirstVisibleItemIndex(page);
  await page.mouse.move(canvasBox.x + wheelTargets.gapX, canvasBox.y + wheelTargets.y);
  await page.mouse.wheel(0, 160);
  await expect.poll(async () => await demo.readFirstVisibleItemIndex(page)).toBeGreaterThan(beforeGapWheel);

  const beforeTrackWheel = await demo.readFirstVisibleItemIndex(page);
  await page.mouse.move(canvasBox.x + wheelTargets.trackX, canvasBox.y + wheelTargets.y);
  await page.mouse.wheel(0, 160);
  await expect.poll(async () => await demo.readFirstVisibleItemIndex(page)).toBeGreaterThan(beforeTrackWheel);

  const beforeOuterTrackWheel = await demo.readFirstVisibleItemIndex(page);
  await page.mouse.move(canvasBox.x + wheelTargets.trackOuterX, canvasBox.y + wheelTargets.y + 208);
  await page.mouse.wheel(0, 160);
  await expect.poll(async () => await demo.readFirstVisibleItemIndex(page)).toBeGreaterThan(beforeOuterTrackWheel);
});

test('touch dragging over the gap, track, and thumb scrolls the list', async ({ page }) => {
  await demo.forceCoarsePointer(page);
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?wheel-routing=1`);
  await demo.waitForDemoReady(page);

  const touchTargets = await page.evaluate(() => {
    const firstItem = (window.__bridgeSemanticTree ?? []).find((node) => node.label === 'Item 0');
    if (firstItem === undefined) {
      throw new Error('Expected first list item bounds.');
    }
    return {
      gapX: firstItem.bounds.x + firstItem.bounds.width + 8,
      trackX: firstItem.bounds.x + firstItem.bounds.width + 12,
      trackOuterX: firstItem.bounds.x + firstItem.bounds.width + 16,
      trackY: firstItem.bounds.y + 12,
      thumbY: firstItem.bounds.y + 4,
    };
  });

  const beforeGapSwipe = await demo.readFirstVisibleItemIndex(page);
  await demo.touchSwipeCanvasPoint(page, touchTargets.gapX, touchTargets.trackY, 72, 301);
  await expect.poll(async () => await demo.readFirstVisibleItemIndex(page)).toBeGreaterThan(beforeGapSwipe);

  const beforeTrackSwipe = await demo.readFirstVisibleItemIndex(page);
  await demo.touchSwipeCanvasPoint(page, touchTargets.trackX, touchTargets.trackY, 72, 302);
  await expect.poll(async () => await demo.readFirstVisibleItemIndex(page)).toBeGreaterThan(beforeTrackSwipe);

  const beforeOuterTrackSwipe = await demo.readFirstVisibleItemIndex(page);
  await demo.touchSwipeCanvasPoint(page, touchTargets.trackOuterX, touchTargets.trackY + 208, 72, 302);
  await expect.poll(async () => await demo.readFirstVisibleItemIndex(page)).toBeGreaterThan(beforeOuterTrackSwipe);

  const beforeThumbSwipe = await demo.readFirstVisibleItemIndex(page);
  await demo.touchSwipeCanvasPoint(page, touchTargets.trackX, touchTargets.thumbY, 72, 303);
  await expect.poll(async () => await demo.readFirstVisibleItemIndex(page)).toBeGreaterThan(beforeThumbSwipe);
});

test('coarse-pointer horizontal wheel over the bottom scrollbar track scrolls the dashboard', async ({ page }) => {
  await demo.forceCoarsePointer(page);
  await page.setViewportSize({ width: 430, height: 932 });
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?wheel-routing=1`);
  await demo.waitForDemoReady(page);

  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox === null) {
    throw new Error('Expected scene canvas bounds.');
  }

  const before = await page.evaluate(() => {
    return (window.__bridgeSemanticTree ?? []).find((node) => node.label === 'EffinDom FUI-AS Demo')?.bounds.x ?? null;
  });
  expect(before).not.toBeNull();
  if (before === null) {
    throw new Error('Expected main panel heading bounds.');
  }

  const railPoint = await demo.findBottomHorizontalShellRailPoint(page);
  await page.mouse.move(canvasBox.x + railPoint.x, canvasBox.y + railPoint.y);
  await page.mouse.wheel(180, 0);

  await expect.poll(async () => {
    return await page.evaluate(() => {
      return (window.__bridgeSemanticTree ?? []).find((node) => node.label === 'EffinDom FUI-AS Demo')?.bounds.x ?? null;
    });
  }).toBeLessThan(before - 120);
});

test('coarse-pointer horizontal touch fling over the bottom scrollbar track scrolls the dashboard', async ({ page }) => {
  await demo.forceCoarsePointer(page);
  await page.setViewportSize({ width: 430, height: 932 });
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?wheel-routing=1`);
  await demo.waitForDemoReady(page);

  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox === null) {
    throw new Error('Expected scene canvas bounds.');
  }

  const before = await page.evaluate(() => {
    return (window.__bridgeSemanticTree ?? []).find((node) => node.label === 'EffinDom FUI-AS Demo')?.bounds.x ?? null;
  });
  expect(before).not.toBeNull();
  if (before === null) {
    throw new Error('Expected main panel heading bounds.');
  }

  const railPoint = await demo.findBottomHorizontalShellRailPoint(page);
  await demo.touchSwipeCanvasVector(page, railPoint.x, railPoint.y, -180, 0, 305);

  await expect.poll(async () => {
    return await page.evaluate(() => {
      return (window.__bridgeSemanticTree ?? []).find((node) => node.label === 'EffinDom FUI-AS Demo')?.bounds.x ?? null;
    });
  }).toBeLessThan(before - 120);
});

test('coarse-pointer horizontal touch keeps minor cross-axis jitter locked to the primary scroll axis', async ({ page }) => {
  await demo.forceCoarsePointer(page);
  await page.setViewportSize({ width: 430, height: 932 });
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?wheel-routing=1`);
  await demo.waitForDemoReady(page);

  const before = await demo.findSemanticBounds(page, 'EffinDom FUI-AS Demo');
  expect(before).not.toBeNull();
  if (before === null) {
    throw new Error('Expected main panel heading bounds.');
  }

  const railPoint = await demo.findBottomHorizontalShellRailPoint(page);
  const after = await demo.touchTraceCanvasPathAndReadLabel(
    page,
    'EffinDom FUI-AS Demo',
    railPoint.x,
    railPoint.y,
    [
      { x: railPoint.x - 36, y: railPoint.y + 4 },
      { x: railPoint.x - 124, y: railPoint.y + 8 },
    ],
    309,
  );

  expect(after.x).toBeLessThan(before.x - 24);
  expect(Math.abs(after.y - before.y)).toBeLessThan(8);
});

test('touch pull-to-refresh works from the Scrollable list heading and reverses while the finger stays down', async ({ page }) => {
  await demo.forceCoarsePointer(page);
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await demo.waitForDemoReady(page);

  const heading = await demo.findSemanticBounds(page, 'Scrollable list');
  expect(heading).not.toBeNull();
  if (heading === null) {
    throw new Error('Expected Scrollable list heading bounds.');
  }

  const startX = Math.round(heading.x + (heading.width * 0.5));
  const startY = Math.round(heading.y + Math.min(heading.height * 0.5, 14));

  await demo.dispatchTouchCanvasEvents(page, [
    { type: 'pointerdown', x: startX, y: startY },
    { type: 'pointermove', x: startX, y: startY + 32 },
    { type: 'pointermove', x: startX, y: startY + 94 },
  ], 401);

  await expect.poll(async () => {
    return (await demo.readPullToRefreshOverlay(page))?.armed ?? 'missing';
  }).toBe('true');
  const armedOverlay = await demo.readPullToRefreshOverlay(page);
  expect(armedOverlay).not.toBeNull();
  expect(armedOverlay?.visible).toBe('true');
  expect(armedOverlay?.armed).toBe('true');
  const armedOpacity = armedOverlay?.opacity ?? 0;

  await demo.dispatchTouchCanvasEvents(page, [
    { type: 'pointermove', x: startX, y: startY + 38 },
  ], 401);

  const reversedOverlay = await demo.readPullToRefreshOverlay(page);
  expect(reversedOverlay).not.toBeNull();
  expect(reversedOverlay?.visible).toBe('true');
  expect(reversedOverlay?.armed).toBe('false');
  expect(reversedOverlay?.opacity ?? 0).toBeGreaterThan(0);
  expect(reversedOverlay?.opacity ?? 0).toBeLessThan(armedOpacity);
  expect(reversedOverlay?.transform).not.toBe(armedOverlay?.transform ?? '');

  await demo.dispatchTouchCanvasEvents(page, [
    { type: 'pointerup', x: startX, y: startY + 38 },
  ], 401);

  await expect.poll(async () => {
    return (await demo.readPullToRefreshOverlay(page))?.visible ?? 'missing';
  }).toBe('false');
  expect(await demo.readNavigationType(page)).toBe('navigate');

  await demo.dispatchTouchCanvasEvents(page, [
    { type: 'pointerdown', x: startX, y: startY },
    { type: 'pointermove', x: startX, y: startY + 32 },
    { type: 'pointermove', x: startX, y: startY + 94 },
    { type: 'pointerup', x: startX, y: startY + 94 },
  ], 402);

  await demo.waitForDemoReady(page);
  expect(await demo.readNavigationType(page)).toBe('reload');
});

test('wheel scrolling inside the nested scroll sandbox stays on the inner viewport', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 900 });
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?wheel-routing=1`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Nested scroll sandbox');

  const beforeInner = await demo.findSemanticBounds(page, 'Nested origin marker');
  const beforeOuter = await demo.findSemanticBounds(page, 'Control foundations');
  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(beforeInner).not.toBeNull();
  expect(beforeOuter).not.toBeNull();
  expect(canvasBox).not.toBeNull();
  if (beforeInner === null || beforeOuter === null || canvasBox === null) {
    throw new Error('Expected nested and outer demo bounds.');
  }

  await page.mouse.move(
    canvasBox.x + beforeInner.x + Math.min(beforeInner.width * 0.5, 56),
    canvasBox.y + beforeInner.y + Math.min(beforeInner.height * 0.5, 10),
  );
  await page.mouse.wheel(180, 180);

  await expect.poll(async () => {
    return await demo.findSemanticBounds(page, 'Nested origin marker');
  }).not.toBeNull();
  const afterInner = await demo.findSemanticBounds(page, 'Nested origin marker');
  const afterOuter = await demo.findSemanticBounds(page, 'Control foundations');
  expect(afterInner).not.toBeNull();
  expect(afterOuter).not.toBeNull();
  if (afterInner === null || afterOuter === null) {
    throw new Error('Expected nested and outer demo bounds after wheel scroll.');
  }

  expect(afterInner.x).toBeLessThan(beforeInner.x - 24);
  expect(afterInner.y).toBeLessThan(beforeInner.y - 24);
  expect(Math.abs(afterOuter.x - beforeOuter.x)).toBeLessThan(8);
  expect(Math.abs(afterOuter.y - beforeOuter.y)).toBeLessThan(8);
});

test('coarse-pointer diagonal touch inside the nested scroll sandbox stays on the inner viewport', async ({ page }) => {
  await demo.forceCoarsePointer(page);
  await page.setViewportSize({ width: 960, height: 900 });
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Nested scroll sandbox');

  const beforeInner = await demo.findSemanticBounds(page, 'Nested origin marker');
  const beforeOuter = await demo.findSemanticBounds(page, 'Control foundations');
  expect(beforeInner).not.toBeNull();
  expect(beforeOuter).not.toBeNull();
  if (beforeInner === null || beforeOuter === null) {
    throw new Error('Expected nested and outer demo bounds.');
  }

  const startX = beforeInner.x + Math.min(beforeInner.width * 0.5, 56);
  const startY = beforeInner.y + Math.min(beforeInner.height * 0.5, 10);
  const afterInner = await demo.touchTraceCanvasPathAndReadLabel(
    page,
    'Nested origin marker',
    startX,
    startY,
    [
      { x: startX - 36, y: startY - 44 },
      { x: startX - 124, y: startY - 136 },
    ],
    411,
  );
  const afterOuter = await demo.findSemanticBounds(page, 'Control foundations');
  expect(afterOuter).not.toBeNull();
  if (afterOuter === null) {
    throw new Error('Expected outer demo bounds after nested touch scroll.');
  }

  expect(afterInner.x).toBeLessThan(beforeInner.x - 24);
  expect(afterInner.y).toBeLessThan(beforeInner.y - 24);
  expect(Math.abs(afterOuter.x - beforeOuter.x)).toBeLessThan(8);
  expect(Math.abs(afterOuter.y - beforeOuter.y)).toBeLessThan(8);
});

test('blank space beside the nested scroll sandbox ignores clipped text hover and scroll ownership', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 900 });
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?wheel-routing=1`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Nested scroll sandbox');

  const beforeInner = await demo.findSemanticBounds(page, 'Nested origin marker');
  const beforeOuter = await demo.findSemanticBounds(page, 'Control foundations');
  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(beforeInner).not.toBeNull();
  expect(beforeOuter).not.toBeNull();
  expect(canvasBox).not.toBeNull();
  if (beforeInner === null || beforeOuter === null || canvasBox === null) {
    throw new Error('Expected nested and outer demo bounds.');
  }

  const blankX = beforeInner.x + 300;
  const blankY = beforeInner.y + Math.min(beforeInner.height * 0.5, 10);
  await page.mouse.move(canvasBox.x + blankX, canvasBox.y + blankY);

  await expect.poll(async () => {
    return await page.locator('#fui-canvas').evaluate((element) => getComputedStyle(element).cursor);
  }).not.toBe('text');

  await page.mouse.wheel(0, 180);

  await expect.poll(async () => {
    return await demo.findSemanticBounds(page, 'Control foundations');
  }).not.toBeNull();

  const afterInner = await demo.findSemanticBounds(page, 'Nested origin marker');
  const afterOuter = await demo.findSemanticBounds(page, 'Control foundations');
  expect(afterInner).not.toBeNull();
  expect(afterOuter).not.toBeNull();
  if (afterInner === null || afterOuter === null) {
    throw new Error('Expected nested and outer demo bounds after blank-space wheel scroll.');
  }

  expect(afterOuter.y).toBeLessThan(beforeOuter.y - 24);
  expect(Math.abs(afterInner.x - beforeInner.x)).toBeLessThan(8);
  expect(Math.abs((afterInner.y - beforeInner.y) - (afterOuter.y - beforeOuter.y))).toBeLessThan(8);
});

test('clicking the nested origin marker does not jump the inner horizontal scroll position', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 900 });
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?wheel-routing=1`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Nested scroll sandbox');

  const beforeInner = await demo.findSemanticBounds(page, 'Nested origin marker');
  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(beforeInner).not.toBeNull();
  expect(canvasBox).not.toBeNull();
  if (beforeInner === null || canvasBox === null) {
    throw new Error('Expected nested origin marker bounds.');
  }

  await page.mouse.move(
    canvasBox.x + beforeInner.x + 12,
    canvasBox.y + beforeInner.y + Math.min(beforeInner.height * 0.5, 10),
  );

  await page.mouse.click(
    canvasBox.x + beforeInner.x + 12,
    canvasBox.y + beforeInner.y + Math.min(beforeInner.height * 0.5, 10),
  );

  const afterInner = await demo.findSemanticBounds(page, 'Nested origin marker');
  expect(afterInner).not.toBeNull();
  if (afterInner === null) {
    throw new Error('Expected nested origin marker bounds after click.');
  }

  expect(Math.abs(afterInner.x - beforeInner.x)).toBeLessThan(8);
});

test('PageDown with no focused control uses the containing scrollview after pointer-up on selectable text', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 900 });
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?wheel-routing=1`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Nested scroll sandbox');

  const beforeInner = await demo.findSemanticBounds(page, 'Nested origin marker');
  const beforeOuter = await demo.findSemanticBounds(page, 'Control foundations');
  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(beforeInner).not.toBeNull();
  expect(beforeOuter).not.toBeNull();
  expect(canvasBox).not.toBeNull();
  if (beforeInner === null || beforeOuter === null || canvasBox === null) {
    throw new Error('Expected nested and outer demo bounds.');
  }

  await page.mouse.click(
    canvasBox.x + beforeInner.x + 12,
    canvasBox.y + beforeInner.y + Math.min(beforeInner.height * 0.5, 10),
  );
  await page.locator('#fui-canvas').focus();

  await page.keyboard.press('PageDown');

  await expect.poll(async () => {
    return await demo.findSemanticBounds(page, 'Nested origin marker');
  }).not.toBeNull();

  const afterInner = await demo.findSemanticBounds(page, 'Nested origin marker');
  const afterOuter = await demo.findSemanticBounds(page, 'Control foundations');
  expect(afterInner).not.toBeNull();
  expect(afterOuter).not.toBeNull();
  if (afterInner === null || afterOuter === null) {
    throw new Error('Expected nested and outer demo bounds after keyboard paging.');
  }

  expect(afterInner.y).toBeLessThan(beforeInner.y - 80);
  expect(Math.abs(afterOuter.y - beforeOuter.y)).toBeLessThan(8);
});

test('ArrowDown with no focused control scrolls the containing scrollview after pointer-up on selectable text', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 900 });
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?wheel-routing=1`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Nested scroll sandbox');

  const beforeInner = await demo.findSemanticBounds(page, 'Nested origin marker');
  const beforeOuter = await demo.findSemanticBounds(page, 'Control foundations');
  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(beforeInner).not.toBeNull();
  expect(beforeOuter).not.toBeNull();
  expect(canvasBox).not.toBeNull();
  if (beforeInner === null || beforeOuter === null || canvasBox === null) {
    throw new Error('Expected nested and outer demo bounds.');
  }

  await page.mouse.click(
    canvasBox.x + beforeInner.x + 12,
    canvasBox.y + beforeInner.y + Math.min(beforeInner.height * 0.5, 10),
  );
  await page.locator('#fui-canvas').focus();

  await page.keyboard.press('ArrowDown');

  await expect.poll(async () => {
    return await demo.findSemanticBounds(page, 'Nested origin marker');
  }).not.toBeNull();

  const afterInner = await demo.findSemanticBounds(page, 'Nested origin marker');
  const afterOuter = await demo.findSemanticBounds(page, 'Control foundations');
  expect(afterInner).not.toBeNull();
  expect(afterOuter).not.toBeNull();
  if (afterInner === null || afterOuter === null) {
    throw new Error('Expected nested and outer demo bounds after ArrowDown.');
  }

  expect(afterInner.y).toBeLessThan(beforeInner.y - 24);
  expect(Math.abs(afterOuter.y - beforeOuter.y)).toBeLessThan(8);
});

test('ArrowRight with no focused control scrolls the containing scrollview after pointer-up inside the nested sandbox', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 900 });
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?wheel-routing=1`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Nested scroll sandbox');

  const beforeInner = await demo.findSemanticBounds(page, 'Nested origin marker');
  const beforeOuter = await demo.findSemanticBounds(page, 'Control foundations');
  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(beforeInner).not.toBeNull();
  expect(beforeOuter).not.toBeNull();
  expect(canvasBox).not.toBeNull();
  if (beforeInner === null || beforeOuter === null || canvasBox === null) {
    throw new Error('Expected nested and outer demo bounds.');
  }

  await page.mouse.click(
    canvasBox.x + beforeInner.x + 12,
    canvasBox.y + beforeInner.y + Math.min(beforeInner.height * 0.5, 10),
  );
  await page.locator('#fui-canvas').focus();

  await page.keyboard.press('ArrowRight');

  await expect.poll(async () => {
    return await demo.findSemanticBounds(page, 'Nested origin marker');
  }).not.toBeNull();

  const afterInner = await demo.findSemanticBounds(page, 'Nested origin marker');
  const afterOuter = await demo.findSemanticBounds(page, 'Control foundations');
  expect(afterInner).not.toBeNull();
  expect(afterOuter).not.toBeNull();
  if (afterInner === null || afterOuter === null) {
    throw new Error('Expected nested and outer demo bounds after ArrowRight.');
  }

  expect(afterInner.x).toBeLessThan(beforeInner.x - 24);
  expect(Math.abs(afterOuter.x - beforeOuter.x)).toBeLessThan(8);
});

test('ArrowDown after pointer-up on the scrollable list heading uses the descendant list viewport', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 900 });
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await demo.waitForDemoReady(page);

  const beforeFirstVisible = await demo.readFirstVisibleItemIndex(page);
  const beforeHeading = await demo.findSemanticBounds(page, 'Scrollable list');
  const beforeMain = await demo.findSemanticBounds(page, 'Interactive color preview');
  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(beforeHeading).not.toBeNull();
  expect(beforeMain).not.toBeNull();
  expect(canvasBox).not.toBeNull();
  if (beforeHeading === null || beforeMain === null || canvasBox === null) {
    throw new Error('Expected sidebar heading, main content, and canvas bounds.');
  }

  await page.mouse.click(
    canvasBox.x + beforeHeading.x + Math.min(beforeHeading.width * 0.5, 80),
    canvasBox.y + beforeHeading.y + (beforeHeading.height * 0.5),
  );
  await page.locator('#fui-canvas').focus();

  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');

  await expect.poll(async () => {
    return await demo.readFirstVisibleItemIndex(page);
  }).toBeGreaterThan(beforeFirstVisible);

  const afterFirstVisible = await demo.readFirstVisibleItemIndex(page);
  const afterMain = await demo.findSemanticBounds(page, 'Interactive color preview');
  expect(afterMain).not.toBeNull();
  if (afterMain === null) {
    throw new Error('Expected main content bounds after ArrowDown.');
  }

  expect(afterFirstVisible).toBeGreaterThan(beforeFirstVisible);
  expect(Math.abs(afterMain.y - beforeMain.y)).toBeLessThan(8);
});

test('ArrowDown before any pointer-up uses the topmost visible scrollview', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 900 });
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await demo.waitForDemoReady(page);

  const beforeFirstVisible = await demo.readFirstVisibleItemIndex(page);
  const beforeSidebar = await demo.findSemanticBounds(page, 'Scrollable list');
  const beforeMain = await demo.findSemanticBounds(page, 'Interactive color preview');
  expect(beforeSidebar).not.toBeNull();
  expect(beforeMain).not.toBeNull();
  if (beforeSidebar === null || beforeMain === null) {
    throw new Error('Expected sidebar and main content bounds.');
  }

  await page.locator('#fui-canvas').focus();
  await page.keyboard.press('ArrowDown');

  await expect.poll(async () => {
    return await demo.findSemanticBounds(page, 'Interactive color preview');
  }).not.toBeNull();

  const afterFirstVisible = await demo.readFirstVisibleItemIndex(page);
  const afterSidebar = await demo.findSemanticBounds(page, 'Scrollable list');
  const afterMain = await demo.findSemanticBounds(page, 'Interactive color preview');
  expect(afterSidebar).not.toBeNull();
  expect(afterMain).not.toBeNull();
  if (afterSidebar === null || afterMain === null) {
    throw new Error('Expected sidebar and main content bounds after ArrowDown.');
  }

  expect(afterMain.y).toBeLessThan(beforeMain.y - 24);
  expect(afterSidebar.y).toBe(beforeSidebar.y);
  expect(afterFirstVisible).toBe(beforeFirstVisible);
});

test('ArrowRight before any pointer-up can scroll the first matching horizontal scrollview', async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 });
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await demo.waitForDemoReady(page);

  const beforeHeading = await demo.findSemanticBounds(page, 'EffinDom FUI-AS Demo');
  expect(beforeHeading).not.toBeNull();
  if (beforeHeading === null) {
    throw new Error('Expected main panel heading bounds.');
  }

  await page.locator('#fui-canvas').focus();
  await page.keyboard.press('ArrowRight');

  await expect.poll(async () => {
    return await demo.findSemanticBounds(page, 'EffinDom FUI-AS Demo');
  }).not.toBeNull();

  const afterHeading = await demo.findSemanticBounds(page, 'EffinDom FUI-AS Demo');
  expect(afterHeading).not.toBeNull();
  if (afterHeading === null) {
    throw new Error('Expected main panel heading bounds after ArrowRight.');
  }

  expect(afterHeading.x).toBeLessThan(beforeHeading.x - 24);
});

test('PageDown on a focused text input scrolls the main content without moving the sidebar', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 900 });
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Type here');

  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  const inputBounds = await demo.findSemanticBounds(page, 'Type here');
  const beforeMain = await demo.findSemanticBounds(page, 'Media assets');
  const beforeSidebar = await demo.findSemanticBounds(page, 'Scrollable list');
  expect(canvasBox).not.toBeNull();
  expect(inputBounds).not.toBeNull();
  expect(beforeMain).not.toBeNull();
  expect(beforeSidebar).not.toBeNull();
  if (canvasBox === null || inputBounds === null || beforeMain === null || beforeSidebar === null) {
    throw new Error('Expected text input, main content, and sidebar bounds.');
  }

  await page.mouse.click(
    canvasBox.x + inputBounds.x + Math.min(inputBounds.width * 0.5, 80),
    canvasBox.y + inputBounds.y + (inputBounds.height * 0.5),
  );
  await demo.waitForHiddenTextInputFocus(page);

  await page.keyboard.press('PageDown');

  await expect.poll(async () => {
    return await demo.findSemanticBounds(page, 'Media assets');
  }).not.toBeNull();

  const afterMain = await demo.findSemanticBounds(page, 'Media assets');
  const afterSidebar = await demo.findSemanticBounds(page, 'Scrollable list');
  expect(afterMain).not.toBeNull();
  expect(afterSidebar).not.toBeNull();
  if (afterMain === null || afterSidebar === null) {
    throw new Error('Expected main content and sidebar bounds after PageDown.');
  }

  expect(afterMain.y).toBeLessThan(beforeMain.y - 80);
  expect(Math.abs(afterSidebar.y - beforeSidebar.y)).toBeLessThan(8);
});

test('wide demo shell keeps the auto horizontal scrollbar hidden when content fits', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 800 });
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await demo.waitForDemoReady(page);

  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  const mainHeadingBounds = await demo.findSemanticBounds(page, 'EffinDom FUI-AS Demo');
  expect(mainHeadingBounds).not.toBeNull();
  if (canvasBox === null || mainHeadingBounds === null) {
    throw new Error('Expected scene canvas and main heading bounds.');
  }

  const sample = await demo.readScenePixel(
    page,
    canvasBox.x + mainHeadingBounds.x + (mainHeadingBounds.width * 0.5),
    canvasBox.y + canvasBox.height - 12,
  );
  expect(sample.red).toBeGreaterThan(180);
  expect(sample.green).toBeGreaterThan(180);
  expect(sample.blue).toBeGreaterThan(180);

  await page.mouse.move(
    canvasBox.x + mainHeadingBounds.x + (mainHeadingBounds.width * 0.5),
    canvasBox.y + canvasBox.height - 12,
  );
  await expect.poll(async () => {
    return await page.locator('#fui-canvas').evaluate((element) => getComputedStyle(element).cursor);
  }).not.toBe('grab');
});

test('portrait demo shell can horizontally scroll the dashboard into view', async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 });
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?wheel-routing=1`);
  await demo.waitForDemoReady(page);

  const before = await page.evaluate(() => {
    return (window.__bridgeSemanticTree ?? []).find((node) => node.label === 'EffinDom FUI-AS Demo')?.bounds.x ?? null;
  });
  expect(before).not.toBeNull();
  if (before === null) {
    throw new Error('Expected main panel heading bounds.');
  }

  await demo.touchSwipeCanvasVector(page, 120, 120, -180, 0, 304);

  await expect.poll(async () => {
    return await page.evaluate(() => {
      return (window.__bridgeSemanticTree ?? []).find((node) => node.label === 'EffinDom FUI-AS Demo')?.bounds.x ?? null;
    });
  }).toBeLessThan(before - 120);
});

test('wheel scrolling outside the list viewport does not latch onto the nearest scroll view', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?wheel-routing=1`);
  await demo.waitForDemoReady(page);

  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox === null) {
    throw new Error('Expected scene canvas bounds.');
  }

  const outsideWheelTarget = await page.evaluate(() => {
    const firstItem = (window.__bridgeSemanticTree ?? []).find((node) => node.label === 'Item 0');
    if (firstItem === undefined) {
      throw new Error('Expected first list item bounds.');
    }
    return {
      x: Math.max(8, firstItem.bounds.x - 24),
      y: firstItem.bounds.y + 12,
    };
  });

  const beforeOutsideWheel = await demo.readFirstVisibleItemIndex(page);
  await page.mouse.move(canvasBox.x + outsideWheelTarget.x, canvasBox.y + outsideWheelTarget.y);
  await page.mouse.wheel(0, 160);
  await page.waitForTimeout(150);
  expect(await demo.readFirstVisibleItemIndex(page)).toBe(beforeOutsideWheel);
});

test('dragging selection at the list edge auto-scrolls without hanging the demo', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?selection-edge=1`);
  await demo.waitForDemoReady(page);

  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox === null) {
    throw new Error('Expected demo canvas to be measurable.');
  }

  const dragPoints = await page.evaluate(() => {
    const firstItem = (window.__bridgeSemanticTree ?? []).find((node) => node.label === 'Item 0');
    if (firstItem === undefined) {
      throw new Error('Expected first list item bounds.');
    }
    // Start and move within Item 0's per-row SelectionArea so the drag is
    // fully inside the VirtualList's selection island.  Auto-scroll fires
    // when the pointer leaves the scroll viewport toward the canvas bottom.
    return {
      startX: firstItem.bounds.x + 4,
      startY: firstItem.bounds.y + (firstItem.bounds.height * 0.5),
      midX: firstItem.bounds.x + firstItem.bounds.width - 4,
      midY: firstItem.bounds.y + (firstItem.bounds.height * 0.5),
    };
  });

  await page.mouse.move(canvasBox.x + dragPoints.startX, canvasBox.y + dragPoints.startY);
  await page.mouse.down();
  await page.mouse.move(
    canvasBox.x + dragPoints.midX,
    canvasBox.y + dragPoints.midY,
    { steps: 16 },
  );
  await page.mouse.move(
    canvasBox.x + dragPoints.midX,
    canvasBox.y + canvasBox.height - 8,
    { steps: 24 },
  );

  await page.waitForTimeout(250);
  const firstVisibleAfterFirstHold = await demo.readFirstVisibleItemIndex(page);
  expect(firstVisibleAfterFirstHold).toBeGreaterThan(0);
  expect(firstVisibleAfterFirstHold).toBeLessThan(1000);

  await page.waitForTimeout(250);
  const firstVisibleAfterSecondHold = await demo.readFirstVisibleItemIndex(page);
  expect(firstVisibleAfterSecondHold).toBeGreaterThanOrEqual(firstVisibleAfterFirstHold);
  expect(firstVisibleAfterSecondHold).toBeLessThan(1000);

  const responsivenessProbe = await page.evaluate(() => {
    return {
      ready: window.__fuiAsReady === true,
      firstVisible: (window.__bridgeSemanticTree ?? []).find((item) => item.label.startsWith('First visible item '))?.label ?? null,
    };
  });
  expect(responsivenessProbe.ready).toBe(true);
  expect(responsivenessProbe.firstVisible).not.toBeNull();

  await page.mouse.up();

  const selectionLength = await page.evaluate(() => (window.__fuiDemoSelectionText ?? '').length);
  expect(selectionLength).toBe(0);
});

test('exposes debug console helpers and structured logs', async ({ page }) => {
  const debugMessages: string[] = [];
  page.on('console', (message) => {
    debugMessages.push(message.text());
  });

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?debug-logs=1`);
  await demo.waitForDemoReady(page);
  await expect.poll(async () => {
    return await page.evaluate(() => (window.__bridgeSemanticTree ?? []).map((node) => node.label));
  }).toEqual(expect.arrayContaining([
    'Click me',
    'Focus me, then press keys. Last key: (none)',
  ]));
  debugMessages.length = 0;

  await page.evaluate(async () => {
    const buttonNode = (window.__bridgeSemanticTree ?? []).find((node) => node.label === 'Click me');
    const keyTargetNode = (window.__bridgeSemanticTree ?? []).find((node) => node.label === 'Focus me, then press keys. Last key: (none)');
    const runtime = window.EffinDomBrowserBridge?.getRuntime();
    if (window.__fui_debug === undefined || buttonNode === undefined || keyTargetNode === undefined || runtime === undefined || runtime === null) {
      throw new Error('Expected debug api, runtime, button, and key target.');
    }
    const buttonHandle = runtime.getHandleFromPoint(
      buttonNode.bounds.x + (buttonNode.bounds.width * 0.5),
      buttonNode.bounds.y + (buttonNode.bounds.height * 0.5),
    );
    const keyTargetHandle = runtime.getHandleFromPoint(
      keyTargetNode.bounds.x + (keyTargetNode.bounds.width * 0.5),
      keyTargetNode.bounds.y + (keyTargetNode.bounds.height * 0.5),
    );
    await window.__fui_debug.pointerEvent(
      1,
      buttonHandle,
      buttonNode.bounds.x + (buttonNode.bounds.width * 0.5),
      buttonNode.bounds.y + (buttonNode.bounds.height * 0.5),
    );
    await window.__fui_debug.pointerEvent(
      2,
      buttonHandle,
      buttonNode.bounds.x + (buttonNode.bounds.width * 0.5),
      buttonNode.bounds.y + (buttonNode.bounds.height * 0.5),
    );
    await window.__fui_debug.focusChanged(keyTargetHandle, true);
    await window.__fui_debug.keyEvent(1, 'z');
  });

  expect(debugMessages.some((message) => message.includes('[fui:Event] pointer type=down'))).toBe(true);
  expect(debugMessages.some((message) => message.includes('[fui:Event] key type=down key=z'))).toBe(true);
  expect(debugMessages.some((message) => message.includes('[fui:Signal] value changed to'))).toBe(true);
  expect(debugMessages.some((message) => message.includes('[fui:Action] HandlerAction invoked with'))).toBe(true);
});
