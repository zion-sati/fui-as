import { expect,test } from '@playwright/test';

import * as demo from './demo-test-support';

demo.registerDemoLifecycle(test);

test('advanced controls textarea restoring empty text shows the placeholder immediately', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Advanced controls demo text area');

  const textBounds = await demo.findSemanticBounds(page, 'Advanced controls demo text area');
  expect(textBounds).not.toBeNull();
  if (textBounds === null) {
    throw new Error('Expected text area bounds.');
  }
  await demo.clickSemanticLabelAtFraction(page, 'Advanced controls demo text area', 0.25, 0.14);
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('Hello world');
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('Backspace');

  await expect.poll(async () => {
    const editor = await demo.readHiddenTextEditorState(page);
    return editor === null ? null : {
      value: editor.value,
      absoluteStart: editor.absoluteStart,
      absoluteEnd: editor.absoluteEnd,
    };
  }).toEqual({
    value: '',
    absoluteStart: 0,
    absoluteEnd: 0,
  });
  const probeX = textBounds.x + 12;
  const probeY = textBounds.y + 12;
  const probeWidth = Math.max(80, Math.min(textBounds.width - 24, 220));
  const probeHeight = 24;
  const backgroundPixel = await demo.readScenePixel(
    page,
    textBounds.x + textBounds.width - 16,
    textBounds.y + textBounds.height - 16,
  );
  const afterClear = await demo.readSceneRegion(page, probeX, probeY, probeWidth, probeHeight);

  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  await page.mouse.click(
    (canvasBox?.x ?? 0) + textBounds.x + (textBounds.width * 0.92),
    (canvasBox?.y ?? 0) + textBounds.y + (textBounds.height * 0.86),
  );
  const afterPaddingClick = await demo.readSceneRegion(page, probeX, probeY, probeWidth, probeHeight);

  expect(demo.countPixelsDifferentFromColor(afterClear, backgroundPixel)).toBeGreaterThan(80);
  expect(demo.findChangedPixel(afterClear, afterPaddingClick)).toBeNull();
});

test('advanced controls textarea keeps a visible caret when empty', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Advanced controls demo text area');
  const textBounds = await demo.findSemanticBounds(page, 'Advanced controls demo text area');
  expect(textBounds).not.toBeNull();
  if (textBounds === null) {
    throw new Error('Expected text area bounds.');
  }

  await demo.clickSemanticLabelAtFraction(page, 'Advanced controls demo text area', 0.25, 0.14);
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('Backspace');

  await expect.poll(async () => {
    const node = await demo.readSemanticNode(page, 'Advanced controls demo text area');
    return node === null ? null : {
      roleName: node.roleName,
      multiline: node.state.multiline === true,
      hasBounds: node.bounds.width > 0 && node.bounds.height > 0,
    };
  }).toEqual({
    roleName: 'textbox',
    multiline: true,
    hasBounds: true,
  });

  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  await page.mouse.click((canvasBox?.x ?? 0) + 8, (canvasBox?.y ?? 0) + 8);
  await expect.poll(async () => {
    const editor = await demo.readHiddenTextEditorState(page);
    return editor?.focused ?? false;
  }).toBe(false);

  await page.mouse.click(
    (canvasBox?.x ?? 0) + textBounds.x + (textBounds.width * 0.5),
    (canvasBox?.y ?? 0) + textBounds.y + (textBounds.height * 0.72),
  );

  await expect.poll(async () => {
    const editor = await demo.readHiddenTextEditorState(page);
    return editor === null ? null : {
      value: editor.value,
      absoluteStart: editor.absoluteStart,
      absoluteEnd: editor.absoluteEnd,
    };
  }).toEqual({
    value: '',
    absoluteStart: 0,
    absoluteEnd: 0,
  });

  await expect.poll(async () => {
    const region = await demo.readSceneRegion(
      page,
      Math.floor(textBounds.x + 10),
      Math.floor(textBounds.y + 8),
      16,
      28,
    );
    return demo.countVisibleCaretPixels(region);
  }).toBeGreaterThan(0);
});

test('advanced controls empty textarea clicks refocus the editor and accept typing', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Advanced controls demo text area');
  const textBounds = await demo.findSemanticBounds(page, 'Advanced controls demo text area');
  expect(textBounds).not.toBeNull();
  if (textBounds === null) {
    throw new Error('Expected text area bounds.');
  }

  await demo.clickSemanticLabelAtFraction(page, 'Advanced controls demo text area', 0.25, 0.14);
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('Backspace');

  await page.evaluate(() => {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
  });
  await expect.poll(async () => {
    const editor = await demo.readHiddenTextEditorState(page);
    return editor?.focused ?? false;
  }).toBe(false);

  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  await page.mouse.click(
    (canvasBox?.x ?? 0) + textBounds.x + (textBounds.width * 0.5),
    (canvasBox?.y ?? 0) + textBounds.y + (textBounds.height * 0.72),
  );
  await expect.poll(async () => {
    const editor = await demo.readHiddenTextEditorState(page);
    return editor?.focused ?? false;
  }).toBe(true);

  await page.keyboard.type('A');
  await expect.poll(async () => await demo.readBridgeTextForSemanticLabel(page, 'Advanced controls demo text area')).toBe('A');
});

test('advanced controls textarea pasting keeps the end caret visible on a long non-wrapped line', async ({ page }) => {
  const longLine = 'W'.repeat(5000);

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Wrapping');
  await demo.clickSemanticLabel(page, 'Wrapping');
  await demo.scrollSemanticLabelIntoView(page, 'Advanced controls demo text area');
  const textBounds = await demo.findSemanticBounds(page, 'Advanced controls demo text area');
  expect(textBounds).not.toBeNull();
  if (textBounds === null) {
    throw new Error('Expected text area bounds.');
  }

  await demo.clickSemanticLabelAtFraction(page, 'Advanced controls demo text area', 0.25, 0.14);
  await demo.waitForHiddenTextInputFocus(page);

  await page.evaluate(() => {
    if (window.__bridgeLogs !== undefined) {
      window.__bridgeLogs.scrollEvents.length = 0;
    }
  });
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(longLine);

  await expect.poll(async () => {
    const editor = await demo.readHiddenTextEditorState(page);
    const scrolledToEnd = await page.evaluate(() => {
      const events = window.__bridgeLogs?.scrollEvents ?? [];
      return events.some((event) => event.offsetX > 0 && event.contentWidth > event.viewportWidth);
    });
    return editor === null ? null : {
      absoluteStart: editor.absoluteStart,
      absoluteEnd: editor.absoluteEnd,
      scrolledToEnd,
    };
  }).toEqual({
    absoluteStart: longLine.length,
    absoluteEnd: longLine.length,
    scrolledToEnd: true,
  });

  await expect.poll(async () => {
    const region = await demo.readSceneRegion(
      page,
      Math.max(0, Math.floor(textBounds.x + textBounds.width - 24)),
      Math.floor(textBounds.y + 8),
      16,
      28,
    );
    return demo.countVisibleCaretPixels(region);
  }).toBeGreaterThan(0);
});

test('advanced controls textarea keeps glyphs visible after repeated non-wrap pastes scroll beyond the layout box', async ({ page }) => {
  const phrase = 'Longer content so scrollbar policy is easy to spot.';

  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: demo.baseUrl });
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Wrapping');
  await demo.clickSemanticLabel(page, 'Wrapping');
  await demo.scrollSemanticLabelIntoView(page, 'Advanced controls demo text area');
  const textBounds = await demo.findSemanticBounds(page, 'Advanced controls demo text area');
  expect(textBounds).not.toBeNull();
  if (textBounds === null) {
    throw new Error('Expected text area bounds.');
  }

  await demo.clickSemanticLabelAtFraction(page, 'Advanced controls demo text area', 0.25, 0.14);
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('Backspace');
  await page.evaluate(async (text) => {
    await navigator.clipboard.writeText(text);
  }, phrase);

  for (let index = 0; index < 10; index += 1) {
    await page.keyboard.press('ControlOrMeta+V');
  }

  await expect.poll(async () => await demo.readBridgeTextForSemanticLabel(page, 'Advanced controls demo text area')).toBe(phrase.repeat(10));
  await expect.poll(async () => {
    const events = await page.evaluate(() => window.__bridgeLogs?.scrollEvents ?? []);
    return events.some((event) =>
      event.contentWidth > event.viewportWidth &&
      event.offsetX > event.viewportWidth);
  }).toBe(true);

  await expect.poll(async () => {
    const region = await demo.readSceneRegion(
      page,
      Math.floor(textBounds.x + 8),
      Math.floor(textBounds.y + 8),
      Math.floor(textBounds.width - 16),
      28,
    );
    return demo.countReadableTextPixels(region);
  }).toBeGreaterThan(100);
});

test('advanced controls textarea Select All plus Backspace clears non-wrap horizontal overflow', async ({ page }) => {
  const longLine = 'W'.repeat(5000);

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Wrapping');
  await demo.clickSemanticLabel(page, 'Wrapping');
  await demo.scrollSemanticLabelIntoView(page, 'Advanced controls demo text area');

  await demo.clickSemanticLabelAtFraction(page, 'Advanced controls demo text area', 0.25, 0.14);
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(longLine);

  await expect.poll(async () => {
    return await page.evaluate(() => {
      const events = window.__bridgeLogs?.scrollEvents ?? [];
      let best: { handle: string; contentWidth: number; viewportWidth: number; } | null = null;
      for (const event of events) {
        if (event.contentWidth <= event.viewportWidth || event.contentHeight <= 40) {
          continue;
        }
        if (best === null || event.contentWidth > best.contentWidth) {
          best = {
            handle: event.handle,
            contentWidth: event.contentWidth,
            viewportWidth: event.viewportWidth,
          };
        }
      }
      return best?.handle ?? null;
    });
  }).not.toBeNull();

  const scrollHandle = await page.evaluate(() => {
    const events = window.__bridgeLogs?.scrollEvents ?? [];
    let best: { handle: string; contentWidth: number; viewportWidth: number; } | null = null;
    for (const event of events) {
      if (event.contentWidth <= event.viewportWidth || event.contentHeight <= 40) {
        continue;
      }
      if (best === null || event.contentWidth > best.contentWidth) {
        best = {
          handle: event.handle,
          contentWidth: event.contentWidth,
          viewportWidth: event.viewportWidth,
        };
      }
    }
    return best?.handle ?? null;
  });

  if (scrollHandle === null) {
    throw new Error('Expected horizontal text area scroll handle.');
  }

  await page.evaluate((handleString) => {
    const runtime = window.EffinDomBrowserBridge?.getRuntime();
    if (runtime === undefined || runtime === null) {
      throw new Error('Expected runtime.');
    }
    runtime.resetLogs();
    runtime.ui._ui_set_scroll_offset(BigInt(handleString), 1_000_000, 0);
    runtime.commitFrame();
    runtime.flushPendingCommit();
  }, scrollHandle);

  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('Backspace');

  await expect.poll(async () => await demo.readBridgeTextForSemanticLabel(page, 'Advanced controls demo text area')).toBe('');

  await expect.poll(async () => {
    return await page.evaluate((handleString) => {
      const runtime = window.EffinDomBrowserBridge?.getRuntime();
      if (runtime === undefined || runtime === null) {
        throw new Error('Expected runtime.');
      }
      runtime.resetLogs();
      runtime.ui._ui_set_scroll_offset(BigInt(handleString), 1_000_000, 0);
      runtime.commitFrame();
      runtime.flushPendingCommit();
      const events = window.__bridgeLogs?.scrollEvents.filter((entry) => entry.handle === handleString) ?? [];
      return events.some((entry) => entry.offsetX > 0);
    }, scrollHandle);
  }).toBe(false);
});

test('PageUp and PageDown do not insert literal text into the demo text input', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Type here');

  await demo.clickSemanticLabel(page, 'Type here');
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('hello');
  await page.keyboard.press('PageDown');
  await page.keyboard.press('PageUp');

  await expect.poll(async () => await demo.readBridgeTextForSemanticLabel(page, 'Type here')).toBe('hello');
});

test('PageUp and PageDown do not insert literal text into the advanced controls textarea', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Advanced controls demo text area');

  await demo.clickSemanticLabelAtFraction(page, 'Advanced controls demo text area', 0.25, 0.14);
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('hello');
  await page.keyboard.press('PageDown');
  await page.keyboard.press('PageUp');

  await expect.poll(async () => await demo.readBridgeTextForSemanticLabel(page, 'Advanced controls demo text area')).toBe('hello');
});

test('advanced controls textarea reports horizontal overflow through the scrollbox when wrapping is off', async ({ page }) => {
  const longLine = 'This_is_a_very_long_line_that_should_exceed_the_text_area_viewport_width_and_force_the_multiline_scrollbox_to_own_horizontal_overflow_instead_of_the_text_node_self_scrolling_like_a_single_line_input';

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Advanced controls demo text area');

  await demo.clickSemanticLabelAtFraction(page, 'Advanced controls demo text area', 0.25, 0.2);
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type(longLine);

  await demo.scrollSemanticLabelIntoView(page, 'Wrapping');
  await demo.clickSemanticLabel(page, 'Wrapping');

  await expect.poll(async () => {
    return await page.evaluate(() => {
      const scrollEvents = window.__bridgeLogs?.scrollEvents ?? [];
      return scrollEvents.some((event) =>
        event.viewportHeight < 300 &&
        event.contentHeight <= 22 &&
        event.contentWidth > event.viewportWidth);
    });
  }).toBe(true);
});

test('advanced controls textarea touch caret drag autoscrolls horizontal overflow', async ({ page }) => {
  const longLine = 'abcdefghijklmnopqrstuvwxyz0123456789'.repeat(120);

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/?debug-logs=1`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Wrapping');
  await demo.clickSemanticLabel(page, 'Wrapping');
  await demo.scrollSemanticLabelIntoView(page, 'Advanced controls demo text area');

  await demo.clickSemanticLabelAtFraction(page, 'Advanced controls demo text area', 0.25, 0.14);
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(longLine);

  await expect.poll(async () => {
    const events = await page.evaluate(() => window.__bridgeLogs?.scrollEvents ?? []);
    return events.some((event) => event.offsetX > 0 && event.contentWidth > event.viewportWidth);
  }).toBe(true);
  const initialMaxOffset = await page.evaluate(() => {
    const events = window.__bridgeLogs?.scrollEvents ?? [];
    return events
      .filter((event) => event.contentWidth > event.viewportWidth)
      .reduce((maxOffset, event) => Math.max(maxOffset, event.offsetX), 0);
  });
  expect(initialMaxOffset).toBeGreaterThan(0);

  const textBounds = await demo.findSemanticBounds(page, 'Advanced controls demo text area');
  expect(textBounds).not.toBeNull();
  if (textBounds === null) {
    throw new Error('Expected text area bounds.');
  }

  await page.evaluate(() => {
    if (window.__bridgeLogs !== undefined) {
      window.__bridgeLogs.scrollEvents.length = 0;
    }
  });

  const y = Math.round(textBounds.y + Math.min(textBounds.height * 0.35, 28));
  const startX = Math.round(textBounds.x + (textBounds.width * 0.5));
  const endX = Math.round(textBounds.x - 12);
  await demo.dispatchTouchCanvasEvents(page, [
    { type: 'pointerdown', x: startX, y },
    { type: 'pointermove', x: endX, y },
    { type: 'pointerup', x: endX, y },
  ], 613);

  await expect.poll(async () => {
    const events = await page.evaluate(() => window.__bridgeLogs?.scrollEvents ?? []);
    return events.some((event) =>
      event.contentWidth > event.viewportWidth &&
      event.offsetX < initialMaxOffset);
  }).toBe(true);
});

test('advanced controls textarea keeps the skipped short-line gap near max horizontal scroll', async ({ page }) => {
  const longLineA = `${'W'.repeat(999)}A${'W'.repeat(1_000)}`;
  const longLineB = `${'W'.repeat(999)}B${'W'.repeat(1_000)}`;
  const shortLine = 'short gap';
  const combinedText = `${longLineA}\n${shortLine}\n${longLineB}`;

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Wrapping');
  await demo.clickSemanticLabel(page, 'Wrapping');
  await demo.scrollSemanticLabelIntoView(page, 'Advanced controls demo text area');

  await demo.clickSemanticLabelAtFraction(page, 'Advanced controls demo text area', 0.25, 0.14);
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(combinedText);

  await expect.poll(async () => {
    const editor = await demo.readHiddenTextEditorState(page);
    const bridgeText = await demo.readBridgeTextForSemanticLabel(page, 'Advanced controls demo text area');
    return editor === null ? null : {
      hiddenLength: editor.value.length,
      fullLength: bridgeText?.length ?? 0,
      bounded: editor.value.length <= 4096,
      absoluteStart: editor.absoluteStart,
      absoluteEnd: editor.absoluteEnd,
    };
  }).toEqual({
    hiddenLength: combinedText.length,
    fullLength: combinedText.length,
    bounded: true,
    absoluteStart: combinedText.length,
    absoluteEnd: combinedText.length,
  });
  await demo.setHiddenTextInputSelection(page, 0, 0);

  const textBounds = await demo.findSemanticBounds(page, 'Advanced controls demo text area');
  expect(textBounds).not.toBeNull();
  if (textBounds === null) {
    throw new Error('Expected text area bounds.');
  }

  const scrollHandle = await page.evaluate(() => {
    const events = window.__bridgeLogs?.scrollEvents ?? [];
    let best: { handle: string; contentWidth: number; contentHeight: number; viewportWidth: number; } | null = null;
    for (const event of events) {
      if (event.contentWidth <= event.viewportWidth || event.contentHeight <= 40) {
        continue;
      }
      if (best === null || event.contentWidth > best.contentWidth) {
        best = {
          handle: event.handle,
          contentWidth: event.contentWidth,
          contentHeight: event.contentHeight,
          viewportWidth: event.viewportWidth,
        };
      }
    }
    return best?.handle ?? null;
  });
  expect(scrollHandle).not.toBeNull();
  if (scrollHandle === null) {
    throw new Error('Expected horizontal text area scroll handle.');
  }

  const maxOffset = await page.evaluate((handleString) => {
    const runtime = window.EffinDomBrowserBridge?.getRuntime();
    if (runtime === undefined || runtime === null) {
      throw new Error('Expected runtime.');
    }
    runtime.ui._ui_set_scroll_offset(BigInt(handleString), 0, 0);
    runtime.commitFrame();
    runtime.flushPendingCommit();
    runtime.resetLogs();
    runtime.ui._ui_set_scroll_offset(BigInt(handleString), 1_000_000, 0);
    runtime.commitFrame();
    runtime.flushPendingCommit();
    const events = window.__bridgeLogs?.scrollEvents.filter((entry) => entry.handle === handleString) ?? [];
    return events.length === 0 ? 0 : (events[events.length - 1]?.offsetX ?? 0);
  }, scrollHandle);
  expect(maxOffset).toBeGreaterThan(200);

  await page.evaluate(async ({ handleString, offsetX }) => {
    const runtime = window.EffinDomBrowserBridge?.getRuntime();
    if (runtime === undefined || runtime === null) {
      throw new Error('Expected runtime.');
    }
    runtime.ui._ui_set_scroll_offset(BigInt(handleString), offsetX, 0);
    runtime.commitFrame();
    runtime.flushPendingCommit();
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { resolve(); });
      });
    });
  }, { handleString: scrollHandle, offsetX: 0 });

  const initialScrollMetrics = await page.evaluate((handleString) => {
    const events = window.__bridgeLogs?.scrollEvents.filter((entry) => entry.handle === handleString) ?? [];
    if (events.length === 0) {
      return null;
    }
    const latest = events[events.length - 1];
    return {
      contentHeight: latest.contentHeight,
      contentWidth: latest.contentWidth,
      viewportHeight: latest.viewportHeight,
      viewportWidth: latest.viewportWidth,
      offsetX: latest.offsetX,
    };
  }, scrollHandle);
  expect(initialScrollMetrics).not.toBeNull();
  if (initialScrollMetrics === null) {
    throw new Error('Expected initial scroll metrics.');
  }

  const sampleBrightRows = async (): Promise<number[]> => await page.evaluate(async ({ bounds }) => {
    const overlay = document.querySelector('[data-effindom-software-overlay="true"]');
    let context: CanvasRenderingContext2D | null = null;
    let width = 0;
    let height = 0;
    if (overlay instanceof HTMLCanvasElement) {
      context = overlay.getContext('2d');
      width = overlay.width;
      height = overlay.height;
    }
    if (context === null) {
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
      context = probe.getContext('2d');
      if (context === null) {
        throw new Error('Expected 2D probe context.');
      }
      context.drawImage(image, 0, 0);
      width = probe.width;
      height = probe.height;
    }

    const backgroundX = Math.max(0, Math.min(width - 1, Math.round(bounds.x + bounds.width - 16)));
    const backgroundY = Math.max(0, Math.min(height - 1, Math.round(bounds.y + bounds.height - 16)));
    const background = context.getImageData(backgroundX, backgroundY, 1, 1).data;
    const backgroundRed = background[0];
    const backgroundGreen = background[1];
    const backgroundBlue = background[2];
    const rows: number[] = [];
    for (let sampleY = Math.max(0, Math.round(bounds.y)); sampleY < Math.min(height, Math.round(bounds.y + bounds.height)); sampleY += 1) {
      const top = sampleY;
      const bottom = Math.max(top + 1, Math.min(height, sampleY + 1));
      const left = Math.max(0, Math.min(width - 1, Math.round(bounds.x + 8)));
      const right = Math.max(left + 1, Math.min(width, Math.round(bounds.x + bounds.width - 8)));
      const pixels = context.getImageData(left, top, right - left, bottom - top).data;
      let ink = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        const red = pixels[index] ?? 0;
        const green = pixels[index + 1] ?? 0;
        const blue = pixels[index + 2] ?? 0;
        const alpha = pixels[index + 3] ?? 0;
        if (alpha === 0) {
          continue;
        }
        const distance =
          Math.abs(red - backgroundRed) +
          Math.abs(green - backgroundGreen) +
          Math.abs(blue - backgroundBlue);
        if (distance > 80) {
          ink += 1;
        }
      }
      rows.push(ink);
    }
    return rows;
  }, { bounds: textBounds });

  const clusterCenters = (rows: number[], threshold: number): number[] => {
    const centers: number[] = [];
    const maxInk = rows.reduce((current, value) => Math.max(current, value), 0);
    const minInk = rows.reduce((current, value) => Math.min(current, value), maxInk);
    const activeRows = rows.filter((value) => value > threshold).length;
    const useValleys = activeRows > rows.length * 0.75 && maxInk - minInk > 20;
    let start = -1;
    for (let index = 0; index < rows.length; index += 1) {
      const value = rows[index] ?? 0;
      const active = useValleys ? value < maxInk - 20 : value > threshold;
      if (active && start < 0) {
        start = index;
        continue;
      }
      if (!active && start >= 0) {
        centers.push((start + index - 1) * 0.5);
        start = -1;
      }
    }
    if (start >= 0) {
      centers.push((start + rows.length - 1) * 0.5);
    }
    return centers;
  };

  const mergeNearbyCenters = (centers: number[], maxGap: number): number[] => {
    if (centers.length === 0) {
      return centers;
    }
    const merged: number[] = [];
    let groupStart = centers[0];
    let groupEnd = centers[0];
    for (let index = 1; index < centers.length; index += 1) {
      const center = centers[index];
      if ((center - groupEnd) <= maxGap) {
        groupEnd = center;
        continue;
      }
      merged.push((groupStart + groupEnd) * 0.5);
      groupStart = center;
      groupEnd = center;
    }
    merged.push((groupStart + groupEnd) * 0.5);
    return merged;
  };

  const initialRows = await sampleBrightRows();
  const initialCenters = mergeNearbyCenters(clusterCenters(initialRows, 10), 12);
  expect(initialCenters).toHaveLength(3);
  const singleLineGap = initialCenters[1] - initialCenters[0];

  const offsets = Array.from({ length: Math.min(Math.floor(maxOffset), 64) }, (_, index) =>
    Math.max(maxOffset - (index + 1), 0));
  for (const offset of offsets) {
    await page.evaluate(async ({ handleString, offsetX }) => {
      const runtime = window.EffinDomBrowserBridge?.getRuntime();
      if (runtime === undefined || runtime === null) {
        throw new Error('Expected runtime.');
      }
      runtime.ui._ui_set_scroll_offset(BigInt(handleString), offsetX, 0);
      runtime.commitFrame();
      runtime.flushPendingCommit();
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => { resolve(); });
        });
      });
    }, { handleString: scrollHandle, offsetX: offset });

    const scrolledMetrics = await page.evaluate((handleString) => {
    const events = window.__bridgeLogs?.scrollEvents.filter((entry) => entry.handle === handleString) ?? [];
      if (events.length === 0) {
        return null;
      }
      const latest = events[events.length - 1];
      return {
        contentHeight: latest.contentHeight,
        contentWidth: latest.contentWidth,
        viewportHeight: latest.viewportHeight,
        viewportWidth: latest.viewportWidth,
        offsetX: latest.offsetX,
      };
    }, scrollHandle);
    expect(scrolledMetrics).not.toBeNull();
    if (scrolledMetrics === null) {
      throw new Error(`Expected scrolled metrics for offset ${String(offset)}.`);
    }
    expect(Math.abs(scrolledMetrics.contentHeight - initialScrollMetrics.contentHeight), `offset=${String(offset)}`).toBeLessThanOrEqual(0.5);

    const scrolledRows = await sampleBrightRows();
    const scrolledCenters = mergeNearbyCenters(clusterCenters(scrolledRows, 10), 12);
    expect(scrolledCenters, `offset=${String(offset)} rows=${scrolledRows.join(',')}`).toHaveLength(2);
    expect(
      Math.abs((scrolledCenters[1] - scrolledCenters[0]) - (singleLineGap * 2)),
      `offset=${String(offset)} centers=${scrolledCenters.join(',')}`,
    ).toBeLessThanOrEqual(3);
  }
});
