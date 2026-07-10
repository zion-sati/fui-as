import { expect,test,type Page } from '@playwright/test';

import * as demo from './demo-test-support';

demo.registerDemoLifecycle(test);

async function findVisiblePointForSemanticLabel(
  page: Page,
  label: string,
): Promise<{ x: number; y: number; }> {
  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox === null) {
    throw new Error('Expected scene canvas bounds.');
  }
  for (let attempt = 0; attempt < 36; attempt += 1) {
    const target = await page.evaluate((targetLabel) => {
      const candidates = (window.__bridgeSemanticTree ?? []).filter((item) => item.label === targetLabel);
      if (candidates.length === 0) {
        return null;
      }
      return candidates.map((node) => ({ handle: node.handle }));
    }, label);
    if (target === null) {
      await page.mouse.move(canvasBox.x + (canvasBox.width * 0.5), canvasBox.y + Math.min(canvasBox.height - 48, 260));
      await page.mouse.wheel(0, 220);
      await page.waitForTimeout(80);
      continue;
    }
    const point = await page.evaluate(({ targets, width, height }) => {
      const runtime = window.EffinDomBrowserBridge?.getRuntime();
      if (runtime === undefined || runtime === null) {
        throw new Error('Expected runtime.');
      }
      const targetHandles = new Set(targets.map((target) => target.handle));
      for (let y = 40; y < height - 40; y += 10) {
        for (let x = 32; x < width - 32; x += 10) {
          if (targetHandles.has(runtime.getHandleFromPoint(x, y).toString())) {
            return { x, y };
          }
        }
      }
      return null;
    }, { targets: target, width: canvasBox.width, height: canvasBox.height });
    if (point !== null) {
      return point;
    }
    await page.mouse.move(canvasBox.x + (canvasBox.width * 0.5), canvasBox.y + Math.min(canvasBox.height - 48, 260));
    await page.mouse.wheel(0, 220);
    await page.waitForTimeout(80);
  }
  throw new Error(`Unable to find visible hit-test point for ${label}.`);
}

async function findCurrentVisiblePointForSemanticLabel(
  page: Page,
  label: string,
): Promise<{ x: number; y: number; } | null> {
  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox === null) {
    throw new Error('Expected scene canvas bounds.');
  }
  return await page.evaluate(({ targetLabel, width, height }) => {
    const runtime = window.EffinDomBrowserBridge?.getRuntime();
    if (runtime === undefined || runtime === null) {
      throw new Error('Expected runtime.');
    }
    const targets = (window.__bridgeSemanticTree ?? [])
      .filter((item) => item.label === targetLabel)
      .map((item) => item.handle);
    if (targets.length === 0) {
      return null;
    }
    const targetHandles = new Set(targets);
    for (let y = 40; y < height - 40; y += 8) {
      for (let x = 32; x < width - 32; x += 8) {
        if (targetHandles.has(runtime.getHandleFromPoint(x, y).toString())) {
          return { x, y };
        }
      }
    }
    return null;
  }, { targetLabel: label, width: canvasBox.width, height: canvasBox.height });
}

async function touchLongPressCanvasPoint(
  page: Page,
  point: { x: number; y: number; },
  pointerId: number,
): Promise<void> {
  await page.evaluate(({ sceneX, sceneY, touchPointerId }) => {
    const canvas = document.getElementById('fui-canvas');
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Expected scene canvas.');
    }
    const rect = canvas.getBoundingClientRect();
    canvas.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      pointerId: touchPointerId,
      pointerType: 'touch',
      isPrimary: true,
      button: 0,
      buttons: 1,
      clientX: rect.left + sceneX,
      clientY: rect.top + sceneY,
    }));
  }, { sceneX: point.x, sceneY: point.y, touchPointerId: pointerId });
  await page.waitForTimeout(680);
  await page.evaluate(({ sceneX, sceneY, touchPointerId }) => {
    const canvas = document.getElementById('fui-canvas');
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Expected scene canvas.');
    }
    const rect = canvas.getBoundingClientRect();
    canvas.dispatchEvent(new PointerEvent('pointerup', {
      bubbles: true,
      cancelable: true,
      pointerId: touchPointerId,
      pointerType: 'touch',
      isPrimary: true,
      button: 0,
      buttons: 0,
      clientX: rect.left + sceneX,
      clientY: rect.top + sceneY,
    }));
  }, { sceneX: point.x, sceneY: point.y, touchPointerId: pointerId });
  await page.waitForTimeout(120);
}

async function nativeTouchLongPressCanvasPoint(
  page: Page,
  point: { x: number; y: number; },
  pointerId: number,
): Promise<void> {
  const client = await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: point.x, y: point.y, id: pointerId, radiusX: 6, radiusY: 6, force: 1 }],
  });
  await page.waitForTimeout(680);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await page.waitForTimeout(160);
  await client.detach();
}

async function touchLongPressSemanticLabelAtFraction(
  page: Page,
  label: string,
  xFraction: number,
  yFraction: number,
  pointerId: number,
): Promise<void> {
  const bounds = await demo.findSemanticBounds(page, label);
  expect(bounds).not.toBeNull();
  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  if (bounds === null || canvasBox === null) {
    throw new Error(`Expected semantic bounds and canvas for ${label}.`);
  }
  const x = bounds.x + (bounds.width * xFraction);
  const y = bounds.y + (bounds.height * yFraction);
  await page.evaluate(({ sceneX, sceneY, touchPointerId }) => {
    const canvas = document.getElementById('fui-canvas');
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Expected scene canvas.');
    }
    const rect = canvas.getBoundingClientRect();
    canvas.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      pointerId: touchPointerId,
      pointerType: 'touch',
      isPrimary: true,
      button: 0,
      buttons: 1,
      clientX: rect.left + sceneX,
      clientY: rect.top + sceneY,
    }));
  }, { sceneX: x, sceneY: y, touchPointerId: pointerId });
  await page.waitForTimeout(680);
  await page.evaluate(({ sceneX, sceneY, touchPointerId }) => {
    const canvas = document.getElementById('fui-canvas');
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Expected scene canvas.');
    }
    const rect = canvas.getBoundingClientRect();
    canvas.dispatchEvent(new PointerEvent('pointerup', {
      bubbles: true,
      cancelable: true,
      pointerId: touchPointerId,
      pointerType: 'touch',
      isPrimary: true,
      button: 0,
      buttons: 0,
      clientX: rect.left + sceneX,
      clientY: rect.top + sceneY,
    }));
  }, { sceneX: x, sceneY: y, touchPointerId: pointerId });
  await page.waitForTimeout(120);
}

async function touchTapSemanticLabel(page: Page, label: string, pointerId: number): Promise<void> {
  const target = await page.evaluate((targetLabel) => {
    const candidates = (window.__bridgeSemanticTree ?? []).filter((node) => node.label === targetLabel);
    const canvas = document.getElementById('fui-canvas');
    const runtime = window.EffinDomBrowserBridge?.getRuntime();
    if (candidates.length === 0 || !(canvas instanceof HTMLCanvasElement) || runtime === undefined || runtime === null) {
      throw new Error(`Expected semantic target and canvas for ${targetLabel}.`);
    }
    for (let index = candidates.length - 1; index >= 0; index -= 1) {
      const candidate = candidates[index];
      const x = candidate.bounds.x + (candidate.bounds.width * 0.5);
      const y = candidate.bounds.y + (candidate.bounds.height * 0.5);
      if (runtime.getHandleFromPoint(x, y).toString() === candidate.handle) {
        return { x, y };
      }
    }
    const target = candidates[candidates.length - 1];
    return {
      x: target.bounds.x + (target.bounds.width * 0.5),
      y: target.bounds.y + (target.bounds.height * 0.5),
    };
  }, label);
  await page.evaluate(({ sceneX, sceneY, touchPointerId }) => {
    const canvas = document.getElementById('fui-canvas');
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Expected scene canvas.');
    }
    const rect = canvas.getBoundingClientRect();
    canvas.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      pointerId: touchPointerId,
      pointerType: 'touch',
      isPrimary: true,
      button: 0,
      buttons: 1,
      clientX: rect.left + sceneX,
      clientY: rect.top + sceneY,
    }));
  }, { sceneX: target.x, sceneY: target.y, touchPointerId: pointerId });
  await page.waitForTimeout(80);
  await page.evaluate(({ sceneX, sceneY, touchPointerId }) => {
    const canvas = document.getElementById('fui-canvas');
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Expected scene canvas.');
    }
    const rect = canvas.getBoundingClientRect();
    canvas.dispatchEvent(new PointerEvent('pointerup', {
      bubbles: true,
      cancelable: true,
      pointerId: touchPointerId,
      pointerType: 'touch',
      isPrimary: true,
      button: 0,
      buttons: 0,
      clientX: rect.left + sceneX,
      clientY: rect.top + sceneY,
    }));
  }, { sceneX: target.x, sceneY: target.y, touchPointerId: pointerId });
  await page.waitForTimeout(120);
}

async function readCrossSelectionEndpointRects(
  page: Page,
  areaHandle: string,
): Promise<{
  start: { x: number; y: number; width: number; height: number };
  end: { x: number; y: number; width: number; height: number };
} | null> {
  return await page.evaluate((handleString) => {
    const runtime = window.EffinDomBrowserBridge?.getRuntime();
    if (runtime === undefined || runtime === null) {
      throw new Error('Expected runtime.');
    }
    const ui = runtime.ui;
    const ptr = BigInt(Number(ui._malloc(8 * 4)));
    const offset = Number(ptr);
    try {
      const copied = ui._ui_copy_cross_selection_endpoint_rects(BigInt(handleString), ptr);
      if (copied === 0) {
        return null;
      }
      const view = new DataView(ui.HEAPU8.buffer);
      return {
        start: {
          x: view.getFloat32(offset, true),
          y: view.getFloat32(offset + 4, true),
          width: view.getFloat32(offset + 8, true),
          height: view.getFloat32(offset + 12, true),
        },
        end: {
          x: view.getFloat32(offset + 16, true),
          y: view.getFloat32(offset + 20, true),
          width: view.getFloat32(offset + 24, true),
          height: view.getFloat32(offset + 28, true),
        },
      };
    } finally {
      ui._free(ptr);
    }
  }, areaHandle);
}

async function dragTouchCanvasPointWithoutRelease(
  page: Page,
  start: { x: number; y: number },
  end: { x: number; y: number },
  pointerId: number,
): Promise<void> {
  await page.evaluate(({ startPoint, endPoint, touchPointerId }) => {
    const canvas = document.getElementById('fui-canvas');
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Expected scene canvas.');
    }
    const rect = canvas.getBoundingClientRect();
    const dispatch = (type: string, point: { x: number; y: number }): void => {
      canvas.dispatchEvent(new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: touchPointerId,
        pointerType: 'touch',
        isPrimary: true,
        button: 0,
        buttons: type === 'pointerup' ? 0 : 1,
        clientX: rect.left + point.x,
        clientY: rect.top + point.y,
      }));
    };
    dispatch('pointerdown', startPoint);
    dispatch('pointermove', {
      x: startPoint.x + ((endPoint.x - startPoint.x) * 0.35),
      y: startPoint.y + ((endPoint.y - startPoint.y) * 0.35),
    });
    dispatch('pointermove', {
      x: startPoint.x + ((endPoint.x - startPoint.x) * 0.7),
      y: startPoint.y + ((endPoint.y - startPoint.y) * 0.7),
    });
    dispatch('pointermove', endPoint);
  }, { startPoint: start, endPoint: end, touchPointerId: pointerId });
  await page.waitForTimeout(120);
}

async function releaseTouchCanvasPoint(
  page: Page,
  point: { x: number; y: number },
  pointerId: number,
): Promise<void> {
  await page.evaluate(({ endPoint, touchPointerId }) => {
    const canvas = document.getElementById('fui-canvas');
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Expected scene canvas.');
    }
    const rect = canvas.getBoundingClientRect();
    canvas.dispatchEvent(new PointerEvent('pointerup', {
      bubbles: true,
      cancelable: true,
      pointerId: touchPointerId,
      pointerType: 'touch',
      isPrimary: true,
      button: 0,
      buttons: 0,
      clientX: rect.left + endPoint.x,
      clientY: rect.top + endPoint.y,
    }));
  }, { endPoint: point, touchPointerId: pointerId });
  await page.waitForTimeout(120);
}

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
    return Math.abs(scrolledButtonBounds.y - tooltipButtonBounds.y) > 1;
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

  const firstVisibleLabel = `Item ${String(await demo.readFirstVisibleItemIndex(page))}`;
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
    return await page.evaluate(() => window.__fuiSelectionText ?? '');
  }).not.toBe('');
  const initialSelection = await page.evaluate(() => window.__fuiSelectionText ?? '');

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
  const verticalSelection = await page.evaluate(() => window.__fuiSelectionText ?? '');
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
    return await page.evaluate(() => window.__fuiSelectionText ?? '');
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
    return await page.evaluate(() => window.__fuiSelectionText ?? '');
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
    return await page.evaluate(() => window.__fuiSelectionText ?? '');
  }).toBe('Scrollable list');

  await page.mouse.click(clickX, clickY);

  await expect.poll(async () => {
    return await page.evaluate(() => window.__fuiSelectionText ?? '');
  }).toBe('');
});

test('mobile long press on advanced TextArea shows selection handles and toolbar', async ({ page }) => {
  const textAreaLabel = 'Advanced controls demo text area';

  await demo.forceCoarsePointer(page);
  await page.setViewportSize({ width: 430, height: 932 });
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);

  const point = await findVisiblePointForSemanticLabel(page, textAreaLabel);
  await nativeTouchLongPressCanvasPoint(page, point, 701);

  await expect.poll(async () => await demo.readContextMenuLabels(page)).toEqual(['Cut', 'Copy', 'Paste', 'More']);
  await expect.poll(async () => {
    const selection = await demo.readHiddenTextEditorState(page);
    return selection === null ? null : {
      start: selection.absoluteStart,
      end: selection.absoluteEnd,
    };
  }).not.toBeNull();
  await expect.poll(async () => {
    const selection = await demo.readHiddenTextEditorState(page);
    return selection === null ? null : selection.end > selection.start;
  }).toBe(true);

  await touchTapSemanticLabel(page, 'More', 703);
  await expect.poll(async () => await demo.readContextMenuLabels(page)).toEqual(['Select all', '<']);
  await touchTapSemanticLabel(page, 'Select all', 704);

  await expect.poll(async () => {
    const selection = await demo.readHiddenTextEditorState(page);
    return selection === null ? null : {
      start: selection.absoluteStart,
      end: selection.absoluteEnd,
      length: selection.value.length,
    };
  }).toEqual({ start: 0, end: 80, length: 80 });
});

test('mobile TextArea selection handle drag works from the visible handle child', async ({ page }) => {
  const textAreaLabel = 'Advanced controls demo text area';

  await demo.forceCoarsePointer(page);
  await page.setViewportSize({ width: 430, height: 932 });
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);

  const point = await findVisiblePointForSemanticLabel(page, textAreaLabel);
  await nativeTouchLongPressCanvasPoint(page, point, 711);

  const initialSelection = await demo.readHiddenTextEditorState(page);
  expect(initialSelection).not.toBeNull();
  if (initialSelection === null) {
    throw new Error('Expected initial TextArea selection.');
  }

  const selectionHandles = await page.evaluate(async () => {
    const runtime = window.EffinDomBrowserBridge?.getRuntime();
    const tree = await window.__fui_debug?.getDebugTree();
    if (runtime === undefined || runtime === null || tree === undefined || typeof runtime.ui._ui_preserves_selection_on_pointer_down !== 'function') {
      throw new Error('Expected runtime selection handle query.');
    }
    const preservesSelectionOnPointerDown = runtime.ui._ui_preserves_selection_on_pointer_down;
    const handles = tree.nodes
      .filter((node) => node.visibleBounds.width > 0 &&
        node.visibleBounds.height > 0 &&
        preservesSelectionOnPointerDown(BigInt(node.handle)) === 1 &&
        Math.round(node.visibleBounds.width) === 90 &&
        Math.round(node.visibleBounds.height) === 90)
      .map((node) => ({ handle: node.handle, bounds: node.visibleBounds }))
      .sort((left, right) => left.bounds.x - right.bounds.x);
    if (handles.length === 0) {
      throw new Error('Expected visible selection handle.');
    }
    return handles;
  });
  expect(selectionHandles.length).toBeGreaterThanOrEqual(2);
  const startHandle = selectionHandles[0];
  const stationaryEndHandle = selectionHandles[1];

  const start = {
    x: startHandle.bounds.x + 63,
    y: startHandle.bounds.y + 34,
  };
  const dragEnd = {
    x: stationaryEndHandle.bounds.x + stationaryEndHandle.bounds.width + 80,
    y: start.y + 36,
  };
  await expect.poll(async () => {
    return await page.evaluate((args) => {
      const runtime = window.EffinDomBrowserBridge?.getRuntime();
      if (runtime === undefined || runtime === null) {
        return 0;
      }
      const hit = runtime.getHandleFromPoint(args.x, args.y);
      return runtime.ui._ui_preserves_selection_on_pointer_down?.(hit) ?? 0;
    }, { x: start.x, y: start.y });
  }, { timeout: 10000 }).toBe(1);

  await dragTouchCanvasPointWithoutRelease(
    page,
    start,
    dragEnd,
    712,
  );
  await expect.poll(async () => {
    return await page.evaluate(async (handle) => {
      const tree = await window.__fui_debug?.getDebugTree();
      const node = tree?.nodes.find((entry) => entry.handle === handle.handle);
      return node === undefined ? null : Math.round(node.visibleBounds.x);
    }, stationaryEndHandle);
  }, { timeout: 10000 }).toBe(Math.round(stationaryEndHandle.bounds.x));
  await releaseTouchCanvasPoint(page, dragEnd, 712);

  const finalSelection = await demo.readHiddenTextEditorState(page);
  expect(finalSelection).not.toBeNull();
  expect(finalSelection?.end).toBeGreaterThan(finalSelection?.start ?? 0);
  expect({
    start: finalSelection?.absoluteStart,
    end: finalSelection?.absoluteEnd,
  }).not.toEqual({
    start: initialSelection.absoluteStart,
    end: initialSelection.absoluteEnd,
  });
});

test('mobile toolbar Select all expands a touch word selection in the dashboard', async ({ page }) => {
  await demo.forceCoarsePointer(page);
  await page.setViewportSize({ width: 430, height: 932 });
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?mobile-selection=1`);
  await demo.waitForDemoReady(page);

  await touchLongPressSemanticLabelAtFraction(page, 'Scrollable list', 0.22, 0.5, 702);
  await expect.poll(async () => await demo.readContextMenuLabels(page)).toEqual(['Copy', 'Select all']);
  await expect.poll(async () => {
    return await page.evaluate(() => window.__fuiSelectionText ?? '');
  }).toBe('Scrollable');
});

test('mobile touch handle drag updates selection live when crossing nested scroll boundary', async ({ page }) => {
  await demo.forceCoarsePointer(page);
  await page.setViewportSize({ width: 960, height: 900 });
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?mobile-selection=1`);
  await demo.waitForDemoReady(page);
  const nestedOriginPoint = await findVisiblePointForSemanticLabel(page, 'Nested origin marker');

  await page.evaluate(() => {
    if (window.__bridgeLogs !== undefined) {
      window.__bridgeLogs.crossSelectionChanges.length = 0;
    }
  });
  await touchLongPressCanvasPoint(page, nestedOriginPoint, 708);
  await expect.poll(async () => {
    return await page.evaluate(() => window.__fuiSelectionText ?? '');
  }).toBe('Nested');

  const areaHandle = await page.evaluate(() => {
    const changes = window.__bridgeLogs?.crossSelectionChanges ?? [];
    return changes.length === 0 ? '' : changes[changes.length - 1]?.areaHandle ?? '';
  });
  expect(areaHandle).not.toBe('');

  const endpointRects = await readCrossSelectionEndpointRects(page, areaHandle);
  expect(endpointRects).not.toBeNull();
  const parentTextPoint = await findCurrentVisiblePointForSemanticLabel(page, 'Nested scroll sandbox');
  expect(parentTextPoint).not.toBeNull();
  if (endpointRects === null || parentTextPoint === null) {
    throw new Error('Expected endpoint rects and visible parent heading point.');
  }

  const startHandlePoint = {
    x: endpointRects.start.x - 8,
    y: endpointRects.start.y + endpointRects.start.height + 20,
  };

  await dragTouchCanvasPointWithoutRelease(page, startHandlePoint, parentTextPoint, 709);

  const beforeReleaseSelection = await page.evaluate(() => window.__fuiSelectionText ?? '');
  await releaseTouchCanvasPoint(page, parentTextPoint, 709);

  const afterReleaseSelection = await page.evaluate(() => window.__fuiSelectionText ?? '');
  const parentBoundaryText = 'Nested scroll sandbox';
  expect(afterReleaseSelection).toContain(parentBoundaryText);
  expect(beforeReleaseSelection).toContain(parentBoundaryText);
});

test('mobile toolbar Select all targets the touched advanced title text node', async ({ page }) => {
  await demo.forceCoarsePointer(page);
  await page.setViewportSize({ width: 430, height: 932 });
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);

  const point = await page.evaluate(() => {
    const target = (window.__bridgeSemanticTree ?? [])
      .filter((node) => node.label === 'Advanced controls')
      .find((node) => node.bounds.width > 200 && node.bounds.height > 50);
    if (target === undefined) {
      throw new Error('Expected large Advanced controls heading.');
    }
    return {
      x: target.bounds.x + 12,
      y: target.bounds.y + 18,
    };
  });
  await touchLongPressCanvasPoint(page, point, 705);
  await expect.poll(async () => await demo.readContextMenuLabels(page)).toEqual(['Copy', 'Select all']);

  await touchTapSemanticLabel(page, 'Select all', 706);
  await touchTapSemanticLabel(page, 'Copy', 707);

  await expect.poll(async () => {
    const writes = await page.evaluate(() => window.__bridgeLogs?.clipboardWrites ?? []);
    return writes.length == 0 ? '' : writes[writes.length - 1] ?? '';
  }).toBe('Advanced controls');
});
