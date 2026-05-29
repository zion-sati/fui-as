import { expect, test } from '@playwright/test';

import * as demo from './demo-test-support';

demo.registerDemoLifecycle(test);

test('demo tooltip sample opens as multiline on hover and hides on leave', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?tooltip-sample=1`);
  await demo.waitForDemoReady(page);

  await demo.scrollSemanticLabelIntoView(page, 'Tooltip sample');
  const tooltipButtonBounds = await demo.findSemanticBounds(page, 'Tooltip sample');
  expect(tooltipButtonBounds).not.toBeNull();
  if (tooltipButtonBounds === null) {
    throw new Error('Expected Tooltip sample button bounds.');
  }

  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox === null) {
    throw new Error('Expected scene canvas bounds.');
  }

  const buildHoverProbeRegion = (bounds: { x: number; y: number; width: number; height: number; }) => {
    const hoverX = bounds.x + (bounds.width * 0.5);
    const hoverY = bounds.y + (bounds.height * 0.5);
    return {
      x: Math.max(0, Math.min(Math.floor(canvasBox.width) - 320, Math.floor(hoverX) - 24)),
      y: Math.max(0, Math.min(Math.floor(canvasBox.height) - 180, Math.floor(hoverY) - 110)),
      width: 320,
      height: 180,
    };
  };
  const tooltipProbeRegion = {
    ...buildHoverProbeRegion(tooltipButtonBounds),
  };
  const multilineProbeRegion = {
    x: tooltipProbeRegion.x,
    y: Math.max(
      0,
      Math.min(
        Math.floor(canvasBox.height) - 32,
        Math.floor(tooltipButtonBounds.y + tooltipButtonBounds.height + 64),
      ),
    ),
    width: tooltipProbeRegion.width,
    height: 28,
  };
  const outsideProbeX = Math.max(
    24,
    Math.min(
      Math.floor(canvasBox.width) - 24,
      tooltipProbeRegion.x + tooltipProbeRegion.width + 120,
    ),
  );
  const outsideProbeY = Math.max(
    24,
    Math.min(
      Math.floor(canvasBox.height) - 24,
      tooltipProbeRegion.y + 24,
    ),
  );
  const beforeHover = await demo.readSceneRegion(
    page,
    tooltipProbeRegion.x,
    tooltipProbeRegion.y,
    tooltipProbeRegion.width,
    tooltipProbeRegion.height,
  );
  const beforeOutside = await demo.readScenePixel(page, outsideProbeX, outsideProbeY);
  const beforeMultiline = await demo.readSceneRegion(
    page,
    multilineProbeRegion.x,
    multilineProbeRegion.y,
    multilineProbeRegion.width,
    multilineProbeRegion.height,
  );

  await demo.hoverSemanticLabel(page, 'Tooltip sample');

  let afterHover = beforeHover;
  await expect.poll(async () => {
    afterHover = await demo.readSceneRegion(
      page,
      tooltipProbeRegion.x,
      tooltipProbeRegion.y,
      tooltipProbeRegion.width,
      tooltipProbeRegion.height,
    );
    return demo.findChangedPixel(beforeHover, afterHover) !== null;
  }).toBe(true);
  await expect.poll(async () => {
    const afterMultiline = await demo.readSceneRegion(
      page,
      multilineProbeRegion.x,
      multilineProbeRegion.y,
      multilineProbeRegion.width,
      multilineProbeRegion.height,
    );
    return demo.findChangedPixel(beforeMultiline, afterMultiline) !== null;
  }).toBe(true);
  const afterOutside = await demo.readScenePixel(page, outsideProbeX, outsideProbeY);
  expect(afterOutside).toEqual(beforeOutside);

  await page.mouse.move(24, 24);

  await expect.poll(async () => {
    const afterLeave = await demo.readSceneRegion(
      page,
      tooltipProbeRegion.x,
      tooltipProbeRegion.y,
      tooltipProbeRegion.width,
      tooltipProbeRegion.height,
    );
    return demo.findChangedPixel(beforeHover, afterLeave) === null;
  }).toBe(true);
});

test('demo hover tooltip dismisses when scrolling starts', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?tooltip-sample=1`);
  await demo.waitForDemoReady(page);

  await demo.scrollSemanticLabelIntoView(page, 'Tooltip sample');
  const tooltipButtonBounds = await demo.findSemanticBounds(page, 'Tooltip sample');
  expect(tooltipButtonBounds).not.toBeNull();
  if (tooltipButtonBounds === null) {
    throw new Error('Expected Tooltip sample button bounds.');
  }

  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox === null) {
    throw new Error('Expected scene canvas bounds.');
  }

  const buildProbeRegion = (bounds: { x: number; y: number; width: number; height: number; }) => {
    const hoverX = bounds.x + (bounds.width * 0.5);
    const hoverY = bounds.y + (bounds.height * 0.5);
    return {
      x: Math.max(0, Math.min(Math.floor(canvasBox.width) - 260, Math.floor(hoverX) - 24)),
      y: Math.max(0, Math.min(Math.floor(canvasBox.height) - 130, Math.floor(hoverY) - 110)),
      width: 260,
      height: 130,
    };
  };
  const tooltipProbeRegion = buildProbeRegion(tooltipButtonBounds);
  const beforeHover = await demo.readSceneRegion(page, tooltipProbeRegion.x, tooltipProbeRegion.y, tooltipProbeRegion.width, tooltipProbeRegion.height);

  await demo.hoverSemanticLabel(page, 'Tooltip sample');

  await expect.poll(async () => {
    const afterHover = await demo.readSceneRegion(page, tooltipProbeRegion.x, tooltipProbeRegion.y, tooltipProbeRegion.width, tooltipProbeRegion.height);
    return demo.findChangedPixel(beforeHover, afterHover) !== null;
  }).toBe(true);

  await page.mouse.move(
    canvasBox.x + tooltipButtonBounds.x + (tooltipButtonBounds.width * 0.5),
    canvasBox.y + tooltipButtonBounds.y + (tooltipButtonBounds.height * 0.5),
  );
  await page.mouse.wheel(0, 160);

  let scrolledButtonBounds = tooltipButtonBounds;
  await expect.poll(async () => {
    const nextBounds = await demo.findSemanticBounds(page, 'Tooltip sample');
    if (nextBounds !== null) {
      scrolledButtonBounds = nextBounds;
    }
    return Math.abs((scrolledButtonBounds?.y ?? 0) - tooltipButtonBounds.y) > 1;
  }).toBe(true);

  const scrolledProbeRegion = buildProbeRegion(scrolledButtonBounds);
  const beforeLeaveAfterScroll = await demo.readSceneRegion(
    page,
    scrolledProbeRegion.x,
    scrolledProbeRegion.y,
    scrolledProbeRegion.width,
    scrolledProbeRegion.height,
  );

  await page.mouse.move(24, 24);

  await expect.poll(async () => {
    const afterLeave = await demo.readSceneRegion(
      page,
      scrolledProbeRegion.x,
      scrolledProbeRegion.y,
      scrolledProbeRegion.width,
      scrolledProbeRegion.height,
    );
    return demo.findChangedPixel(beforeLeaveAfterScroll, afterLeave) === null;
  }).toBe(true);
});

test('touch dragging from visible static text in the main panel keeps scrolling', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?debug-logs=1`);
  await demo.waitForDemoReady(page);

  await demo.scrollSemanticLabelIntoView(page, 'Interactive color preview');
  await demo.touchSwipeSemanticLabel(page, 'Interactive color preview', 72, 201);

  const hueBefore = await demo.findSemanticBounds(page, 'Hue 210 deg');
  expect(hueBefore).not.toBeNull();
  if (hueBefore === null) {
    throw new Error('Expected Hue semantic bounds after initial touch scroll.');
  }

  await demo.touchSwipeSemanticLabel(page, 'Hue 210 deg', 72, 202);

  await expect.poll(async () => await demo.findSemanticBounds(page, 'Hue 210 deg')).not.toBeNull();
  const hueAfter = await demo.findSemanticBounds(page, 'Hue 210 deg');
  expect(hueAfter).not.toBeNull();
  expect((hueAfter?.y ?? 0)).toBeLessThan(hueBefore.y);
});

test('touch dragging from panel padding beside the preview heading keeps scrolling', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?debug-logs=1`);
  await demo.waitForDemoReady(page);

  await demo.scrollSemanticLabelIntoView(page, 'Interactive color preview');
  const headingBounds = await demo.findSemanticBounds(page, 'Interactive color preview');
  expect(headingBounds).not.toBeNull();
  if (headingBounds === null) {
    throw new Error('Expected preview heading bounds.');
  }

  const before = await demo.findSemanticBounds(page, 'Hue 210 deg');
  expect(before).not.toBeNull();
  if (before === null) {
    throw new Error('Expected Hue semantic bounds before padding touch scroll.');
  }

  const startX = Math.max(8, Math.round(headingBounds.x - 12));
  const startY = Math.round(headingBounds.y + Math.min(headingBounds.height * 0.5, 10));
  await demo.touchSwipeCanvasPoint(page, startX, startY, 72, 204);

  await expect.poll(async () => await demo.findSemanticBounds(page, 'Hue 210 deg')).not.toBeNull();
  const after = await demo.findSemanticBounds(page, 'Hue 210 deg');
  expect(after).not.toBeNull();
  expect((after?.y ?? 0)).toBeLessThan(before.y);
});

test('keeps scrollbar thumb dragging and cursor capture outside the track', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?scrollbar-capture=1`);
  await demo.waitForDemoReady(page);

  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox === null) {
    throw new Error('Expected scene canvas bounds.');
  }

  const scrollbarThumb = await page.evaluate(() => {
    const title = (window.__bridgeSemanticTree ?? []).find((node) => node.label === 'Scrollable list');
    const firstItem = (window.__bridgeSemanticTree ?? []).find((node) => node.label === 'Item 0');
    if (title === undefined || firstItem === undefined) {
      throw new Error('Expected scrollable list heading and first item bounds.');
    }
    return {
      x: firstItem.bounds.x + firstItem.bounds.width + 22,
      y: firstItem.bounds.y - 3,
    };
  });

  const scrollbarX = canvasBox.x + scrollbarThumb.x;
  const scrollbarStartY = canvasBox.y + scrollbarThumb.y;
  const outsideTrackX = scrollbarX + 24;

  await page.mouse.move(scrollbarX, scrollbarStartY);
  await expect.poll(async () => {
    return await page.locator('#fui-canvas').evaluate((element) => getComputedStyle(element).cursor);
  }).toBe('grab');

  await page.mouse.down();
  await expect.poll(async () => {
    return await page.locator('#fui-canvas').evaluate((element) => getComputedStyle(element).cursor);
  }).toBe('grabbing');

  await page.mouse.move(outsideTrackX, scrollbarStartY + 40, { steps: 6 });
  await expect.poll(async () => {
    return await page.locator('#fui-canvas').evaluate((element) => getComputedStyle(element).cursor);
  }).toBe('grabbing');

  await page.mouse.move(outsideTrackX, scrollbarStartY + 260, { steps: 12 });
  await expect.poll(async () => await demo.readFirstVisibleItemIndex(page)).toBeGreaterThan(5);
  await expect.poll(async () => {
    return await page.locator('#fui-canvas').evaluate((element) => getComputedStyle(element).cursor);
  }).toBe('grabbing');

  await page.mouse.up();
  await expect.poll(async () => {
    return await page.locator('#fui-canvas').evaluate((element) => getComputedStyle(element).cursor);
  }).toBe('default');
});

test('rounded sidebar shell clips scrolled rows and scrollbar chrome at the bottom edge', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await demo.waitForDemoReady(page);

  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox === null) {
    throw new Error('Expected scene canvas bounds.');
  }

  const listHeadingBounds = await demo.findSemanticBounds(page, 'Scrollable list');
  expect(listHeadingBounds).not.toBeNull();
  if (listHeadingBounds === null) {
    throw new Error('Expected sidebar heading bounds.');
  }

  await page.mouse.move(
    canvasBox.x + listHeadingBounds.x + 120,
    canvasBox.y + listHeadingBounds.y + 220,
  );
  await expect.poll(async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const firstVisible = await demo.readFirstVisibleItemIndex(page);
      if (firstVisible >= 200) {
        return firstVisible;
      }
      await page.mouse.wheel(0, 1200);
      await page.waitForTimeout(80);
    }
    return await demo.readFirstVisibleItemIndex(page);
  }).toBeGreaterThanOrEqual(200);

  const firstVisibleLabel = `Item ${await demo.readFirstVisibleItemIndex(page)}`;
  const firstVisibleBounds = await demo.findSemanticBounds(page, firstVisibleLabel);
  expect(firstVisibleBounds).not.toBeNull();
  if (firstVisibleBounds === null) {
    throw new Error('Expected first visible row bounds.');
  }

  const bottomRailPixel = await demo.readScenePixel(
    page,
    canvasBox.x + firstVisibleBounds.x + firstVisibleBounds.width + 8,
    canvasBox.y + canvasBox.height - 36,
  );
  const bottomCutoutPixel = await demo.readScenePixel(
    page,
    canvasBox.x + firstVisibleBounds.x + firstVisibleBounds.width + 22,
    canvasBox.y + canvasBox.height - 18,
  );

  expect(demo.minimumRgb(bottomRailPixel)).toBeGreaterThan(220);
  expect(demo.minimumRgb(bottomCutoutPixel)).toBeGreaterThan(220);
});

test('shift arrow down extends an existing wrapped selection through the browser harness', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?selection-vertical=1`);
  await demo.waitForDemoReady(page);

  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox === null) {
    throw new Error('Expected scene canvas bounds.');
  }

  const selectionRegion = await page.evaluate(() => {
    const heading = (window.__bridgeSemanticTree ?? []).find((item) => item.label === 'Scrollable list');
    if (heading === undefined) {
      throw new Error('Expected sidebar heading bounds.');
    }
    return heading.bounds;
  });

  const selectionStartX = canvasBox.x + selectionRegion.x + 8;
  const selectionStartY = canvasBox.y + selectionRegion.y + (selectionRegion.height * 0.5);
  const selectionEndX = selectionStartX + Math.min(56, Math.max(selectionRegion.width - 16, 24));

  await page.mouse.move(selectionStartX, selectionStartY);
  await page.mouse.down();
  await page.mouse.move(selectionEndX, selectionStartY, { steps: 8 });
  await page.mouse.up();

  await expect.poll(async () => {
    return await page.evaluate(() => window.__fuiDemoSelectionText ?? '');
  }).not.toBe('');
  const initialSelection = await page.evaluate(() => window.__fuiDemoSelectionText ?? '');

  await page.evaluate(() => {
    if (window.__bridgeLogs !== undefined) {
      window.__bridgeLogs.crossSelectionChanges.length = 0;
    }
  });
  await page.keyboard.down('Shift');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.up('Shift');

  await expect.poll(async () => {
    return await page.evaluate(() => window.__bridgeLogs?.crossSelectionChanges.length ?? 0);
  }).toBeGreaterThan(0);
  const verticalSelection = await page.evaluate(() => window.__fuiDemoSelectionText ?? '');
  expect(verticalSelection.length).toBeGreaterThanOrEqual(initialSelection.length);
});

test('double-clicking selectable text selects the clicked word in the demo', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?double-click-selection=1`);
  await demo.waitForDemoReady(page);

  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox === null) {
    throw new Error('Expected scene canvas bounds.');
  }

  const selectionRegion = await demo.findSemanticBounds(page, 'Scrollable list');
  expect(selectionRegion).not.toBeNull();
  if (selectionRegion === null) {
    throw new Error('Expected selectable heading bounds.');
  }

  const clickX = canvasBox.x + selectionRegion.x + 24;
  const clickY = canvasBox.y + selectionRegion.y + (selectionRegion.height * 0.5);

  await page.mouse.dblclick(clickX, clickY);

  await expect.poll(async () => {
    return await page.evaluate(() => window.__fuiDemoSelectionText ?? '');
  }).toBe('Scrollable');
});

test('triple-clicking selectable text selects the clicked paragraph in the demo', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?triple-click-selection=1`);
  await demo.waitForDemoReady(page);

  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox === null) {
    throw new Error('Expected scene canvas bounds.');
  }

  const selectionRegion = await demo.findSemanticBounds(page, 'Scrollable list');
  expect(selectionRegion).not.toBeNull();
  if (selectionRegion === null) {
    throw new Error('Expected selectable heading bounds.');
  }

  const clickX = canvasBox.x + selectionRegion.x + 24;
  const clickY = canvasBox.y + selectionRegion.y + (selectionRegion.height * 0.5);

  await page.mouse.click(clickX, clickY, { clickCount: 3 });

  await expect.poll(async () => {
    return await page.evaluate(() => window.__fuiDemoSelectionText ?? '');
  }).toBe('Scrollable list');
});

test('plain text context-menu select-all clears when clicking the selection in the demo', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?double-click-selection=1`);
  await demo.waitForDemoReady(page);

  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox === null) {
    throw new Error('Expected scene canvas bounds.');
  }

  const selectionRegion = await demo.findSemanticBounds(page, 'Scrollable list');
  expect(selectionRegion).not.toBeNull();
  if (selectionRegion === null) {
    throw new Error('Expected selectable heading bounds.');
  }

  const clickX = canvasBox.x + selectionRegion.x + 24;
  const clickY = canvasBox.y + selectionRegion.y + (selectionRegion.height * 0.5);

  await demo.rightClickSemanticLabel(page, 'Scrollable list');
  await expect.poll(async () => await demo.readContextMenuLabels(page)).toEqual(['Copy', 'Select All', 'Reload Page']);
  const selectAllBounds = await demo.findSemanticBounds(page, 'Select All');
  expect(selectAllBounds).not.toBeNull();
  if (selectAllBounds === null) {
    throw new Error('Expected Select All menu item bounds.');
  }
  await page.mouse.click(
    canvasBox.x + selectAllBounds.x + (selectAllBounds.width * 0.5),
    canvasBox.y + selectAllBounds.y + (selectAllBounds.height * 0.5),
  );

  await expect.poll(async () => {
    return await page.evaluate(() => window.__fuiDemoSelectionText ?? '');
  }).toBe('Scrollable list');

  await page.mouse.click(clickX, clickY);

  await expect.poll(async () => {
    return await page.evaluate(() => window.__fuiDemoSelectionText ?? '');
  }).toBe('');
});
