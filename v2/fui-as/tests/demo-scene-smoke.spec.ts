import { expect, test } from '@playwright/test';

import * as demo from './demo-test-support';

demo.registerDemoLifecycle(test);

test('repaints consistently across repeated reloads', async ({ page }) => {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?reload=${String(attempt)}`);
    await expect.poll(async () => {
      return await page.evaluate(() => {
        if (window.__fuiError !== undefined) {
          return `error:${window.__fuiError}`;
        }
        return window.__fuiReady === true ? 'ready' : 'pending';
      });
    }).toBe('ready');

    await expect.poll(async () => {
      return (await demo.readScenePixel(page, 24, 24)).alpha;
    }).toBeGreaterThan(220);
  }
});

test('idles when the demo has no pending work', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?idle-check=1`);

  await demo.waitForDemoReady(page);

  await page.waitForTimeout(100);

  const stats = await page.evaluate(async () => {
    const runtime = window.EffinDomBrowserBridge?.getRuntime();
    if (runtime === null || runtime === undefined) {
      throw new Error('Bridge runtime is not ready.');
    }

    const counts = {
      appFrameCalls: 0,
      commitCalls: 0,
      renderCalls: 0,
    };

    const originalRunAppFrameController = runtime.runAppFrameController.bind(runtime);
    runtime.runAppFrameController = ((timestampMs: number) => {
      counts.appFrameCalls += 1;
      originalRunAppFrameController(timestampMs);
    });

    const originalCommitFrame = runtime.commitFrame.bind(runtime);
    runtime.commitFrame = (() => {
      counts.commitCalls += 1;
      originalCommitFrame();
    });

    const originalRenderFrame = runtime.core._ed_render_frame.bind(runtime.core);
    runtime.core._ed_render_frame = ((timestampMs: number) => {
      counts.renderCalls += 1;
      originalRenderFrame(timestampMs);
    });

    await new Promise<void>((resolve) => {
      window.setTimeout(() => { resolve(); }, 600);
    });

    runtime.runAppFrameController = originalRunAppFrameController;
    runtime.commitFrame = originalCommitFrame;
    runtime.core._ed_render_frame = originalRenderFrame;
    return counts;
  });

  expect(stats.appFrameCalls).toBeLessThanOrEqual(2);
  expect(stats.commitCalls).toBeLessThanOrEqual(2);
  expect(stats.renderCalls).toBeLessThanOrEqual(2);
});

test('renders the interactive fui-as demo scene', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);

  await demo.waitForDemoReady(page);

  const state = await page.evaluate(() => window.__fuiState);
  expect(state).toBeDefined();
  if (state === undefined) {
    throw new Error('Expected FUI demo state to be available.');
  }
  expect(state.commandWordCount).toBeGreaterThan(0);
  expect(state.commandWordCount).toBeLessThan(12000);
  expect(state.rootHandle).not.toBeNull();

  await expect.poll(async () => {
    return (await demo.readScenePixel(page, 24, 24)).alpha;
  }).toBeGreaterThan(220);

  const initialCanvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(initialCanvasBox).not.toBeNull();
  if (initialCanvasBox === null) {
    throw new Error('Expected demo canvas to be measurable.');
  }

  await expect.poll(async () => {
    return await page.evaluate(() => {
      return (window.__bridgeSemanticTree ?? []).map((node) => node.label);
    });
  }).toEqual(expect.arrayContaining([
    'EffinDom FUI-AS Demo',
    'Scrollable list',
    'Dashboard sample',
    'Interactive color preview',
    'Item 0',
  ]));
});

test('dashboard media semantics do not project native broken-image elements', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?media-semantics=1`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Media assets');

  await expect.poll(async () => {
    return await page.evaluate(() => {
      const shadow = document.getElementById('semantic-layer')?.shadowRoot;
      return Array.from(shadow?.querySelectorAll('[role="img"]') ?? []).length;
    });
  }).toBeGreaterThan(0);

  const projectedTags = await page.evaluate(() => {
    const shadow = document.getElementById('semantic-layer')?.shadowRoot;
    return Array.from(shadow?.querySelectorAll('[role="img"]') ?? []).map((element) => element.tagName);
  });
  expect(projectedTags).not.toContain('IMG');
  expect(projectedTags.every((tagName) => tagName === 'DIV')).toBe(true);
});

test('toggles light and dark mode from the demo sidebar', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?theme-toggle=1`);
  await demo.waitForDemoReady(page);

  await expect(page.locator('#theme-mode-value')).toHaveText('Dark');
  await expect(page.locator('#toggle-theme-mode')).toHaveText('Switch to light mode');

  await page.locator('#toggle-theme-mode').click();
  await expect(page.locator('#theme-mode-value')).toHaveText('Light');
  await expect(page.locator('#toggle-theme-mode')).toHaveText('Switch to dark mode');

  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox === null) {
    throw new Error('Expected scene canvas bounds.');
  }

  await demo.scrollSemanticLabelIntoView(page, 'Open dialog');
  const openDialogBounds = await demo.findSemanticBounds(page, 'Open dialog');
  expect(openDialogBounds).not.toBeNull();
  if (openDialogBounds === null) {
    throw new Error('Expected Open dialog button bounds.');
  }

  await demo.clickSemanticLabel(page, 'Open dialog');

  let dialogBounds = await demo.findSemanticRoleBounds(page, 'dialog');
  await expect.poll(async () => {
    dialogBounds = await demo.findSemanticRoleBounds(page, 'dialog');
    return dialogBounds !== null;
  }).toBe(true);
  if (dialogBounds === null) {
    throw new Error('Expected dialog bounds in semantic tree.');
  }
  const dialogRegion = dialogBounds;

  await expect.poll(async () => {
    const pixel = await demo.readScenePixel(
      page,
      canvasBox.x + dialogRegion.x + (dialogRegion.width * 0.82),
      canvasBox.y + dialogRegion.y + (dialogRegion.height * 0.18),
    );
    return Math.min(pixel.red, pixel.green, pixel.blue);
  }).toBeGreaterThan(220);

  await page.locator('#toggle-theme-mode').click();
  await expect(page.locator('#theme-mode-value')).toHaveText('Dark');
  await expect(page.locator('#toggle-theme-mode')).toHaveText('Switch to light mode');
  await expect.poll(async () => {
    const pixel = await demo.readScenePixel(
      page,
      canvasBox.x + dialogRegion.x + (dialogRegion.width * 0.82),
      canvasBox.y + dialogRegion.y + (dialogRegion.height * 0.18),
    );
    return pixel.blue - pixel.red;
  }).toBeGreaterThan(20);
});

test('shows the control foundations demo focus state and inherited disabled scope', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?control-foundations=1`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Scoped child activations 0');
  await page.evaluate(() => {
    (window as Window & { __activateDemoFoundationsScopedAction?: () => void }).__activateDemoFoundationsScopedAction?.();
  });
  await expect.poll(async () => {
    return await page.evaluate(() => {
      return (window.__bridgeSemanticTree ?? []).some((node) => node.label === 'Scoped child activations 1');
    });
  }).toBe(true);

  await page.evaluate(() => {
    (window as Window & { __focusDemoFoundationsScopedAction?: () => void }).__focusDemoFoundationsScopedAction?.();
  });

  await expect.poll(async () => {
    return await page.evaluate(() => {
      return (window.__bridgeSemanticTree ?? []).some((node) => node.label === 'Scoped child focus: focused');
    });
  }).toBe(true);

  await page.evaluate(() => {
    (window as Window & { __toggleDemoFoundationsScope?: () => void }).__toggleDemoFoundationsScope?.();
  });

  await expect.poll(async () => {
    return await page.evaluate(() => {
      const labels = (window.__bridgeSemanticTree ?? []).map((node) => node.label);
      return labels.includes('Scoped parent: disabled via parent container') &&
        labels.includes('Scoped child focus: unfocused') &&
        labels.includes('Enable scoped child');
    });
  }).toBe(true);

  await page.evaluate(() => {
    (window as Window & { __activateDemoFoundationsScopedAction?: () => void }).__activateDemoFoundationsScopedAction?.();
  });

  await expect.poll(async () => {
    return await page.evaluate(() => {
      const labels = (window.__bridgeSemanticTree ?? []).map((node) => node.label);
      return labels.includes('Scoped child activations 1');
    });
  }).toBe(true);

  await page.evaluate(() => {
    (window as Window & { __toggleDemoFoundationsScope?: () => void }).__toggleDemoFoundationsScope?.();
  });

  await expect.poll(async () => {
    return await page.evaluate(() => {
      const labels = (window.__bridgeSemanticTree ?? []).map((node) => node.label);
      return labels.includes('Scoped parent: enabled') &&
        labels.includes('Disable scoped child');
    });
  }).toBe(true);

  await page.evaluate(() => {
    (window as Window & { __activateDemoFoundationsScopedAction?: () => void }).__activateDemoFoundationsScopedAction?.();
  });

  await expect.poll(async () => {
    return await page.evaluate(() => {
      return (window.__bridgeSemanticTree ?? []).some((node) => node.label === 'Scoped child activations 2');
    });
  }).toBe(true);
});

test('rounded foundations scope clips child content at the card edge', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?control-foundations=1`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Scoped child activations 0');

  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  const activationsBounds = await demo.findSemanticBounds(page, 'Scoped child activations 0');
  expect(activationsBounds).not.toBeNull();
  if (canvasBox === null || activationsBounds === null) {
    throw new Error('Expected foundations clip sample bounds.');
  }

  const lowerLeftClipPixel = await demo.readScenePixel(
    page,
    canvasBox.x + activationsBounds.x - 12,
    canvasBox.y + activationsBounds.y + activationsBounds.height + 2,
  );
  const lowerCenterClipPixel = await demo.readScenePixel(
    page,
    canvasBox.x + activationsBounds.x + 80,
    canvasBox.y + activationsBounds.y + activationsBounds.height + 6,
  );

  expect(demo.minimumRgb(lowerLeftClipPixel)).toBeGreaterThan(220);
  expect(demo.minimumRgb(lowerCenterClipPixel)).toBeGreaterThan(220);
});

test('common controls stay interactive in the demo scene', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?common-controls=1`);
  await demo.waitForDemoReady(page);

  await demo.scrollSemanticLabelIntoView(page, 'Email updates');

  await expect(page.getByRole('checkbox', { name: 'Email updates' })).toBeAttached();
  await expect(page.getByRole('checkbox', { name: 'Review state' })).toBeAttached();
  await expect(page.getByRole('radio', { name: 'System' })).toBeAttached();

  await demo.clickSemanticLabel(page, 'Email updates');
  await expect.poll(async () => await demo.readSemanticNode(page, 'Email updates')).toMatchObject({
    roleName: 'checkbox',
    state: { checked: 'true' },
  });

  await demo.scrollSemanticLabelIntoView(page, 'Review state');
  await demo.clickSemanticLabel(page, 'Review state');
  await expect.poll(async () => await demo.readSemanticNode(page, 'Review state')).toMatchObject({
    roleName: 'checkbox',
    state: { checked: 'false' },
  });

  await demo.scrollSemanticLabelIntoView(page, 'Focus mode');
  await demo.clickSemanticLabel(page, 'Focus mode');
  await expect.poll(async () => await demo.readSemanticNode(page, 'Focus mode')).toMatchObject({
    roleName: 'switch',
    state: { checked: 'false' },
  });

  await demo.scrollSemanticLabelIntoView(page, 'Immersive');
  await demo.clickSemanticLabel(page, 'Immersive');
  await expect.poll(async () => await demo.readSemanticNode(page, 'Immersive')).toMatchObject({
    roleName: 'radio',
    state: { checked: 'true' },
  });

  await demo.scrollSemanticLabelIntoView(page, 'Slider');
  await expect(page.getByRole('slider', { name: 'Slider', exact: true })).toBeAttached();
  await demo.clickSliderThumb(page, 'Slider', 40, 0, 100);
  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => await demo.readSemanticNode(page, 'Slider')).toMatchObject({
    roleName: 'slider',
    state: { valueNow: 45 },
  });

  await demo.scrollSemanticLabelIntoView(page, 'Balanced');
  await expect(page.getByRole('combobox', { name: 'Balanced' })).toBeAttached();
  await demo.clickSemanticLabel(page, 'Balanced');
  await expect.poll(async () => await demo.readSemanticNode(page, 'Quality first')).toMatchObject({
    roleName: 'listitem',
  });
  await demo.clickSemanticLabel(page, 'Quality first');
  await expect(page.getByRole('combobox', { name: 'Quality first' })).toBeAttached();
});

test('read-only text input clips text inside its padded client area', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?common-controls=1`);
  await demo.waitForDemoReady(page);

  await demo.scrollSemanticLabelIntoView(page, 'Read-only selection sample');
  const inputBounds = await demo.findSemanticBounds(page, 'Read-only selection sample');
  expect(inputBounds).not.toBeNull();
  if (inputBounds === null) {
    throw new Error('Expected read-only text input semantic bounds.');
  }

  const sampleY = Math.round(inputBounds.y + (inputBounds.height * 0.5));
  const leftPaddingPixel = await demo.readScenePixel(
    page,
    Math.round(inputBounds.x - 4),
    sampleY,
  );
  const rightPaddingPixel = await demo.readScenePixel(
    page,
    Math.round(inputBounds.x + inputBounds.width + 4),
    sampleY,
  );

  expect(rightPaddingPixel).toEqual(leftPaddingPixel);
});

test('demo read-only text input keeps textbox caret navigation without allowing edits', async ({ page }) => {
  const readonlyText = 'Read-only selection sample';

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?common-controls=1`);
  await demo.waitForDemoReady(page);

  await demo.scrollSemanticLabelIntoView(page, 'Read-only selection sample');
  await demo.clickSemanticLabelAtFraction(page, 'Read-only selection sample', 0.98, 0.5);
  await demo.waitForHiddenTextInputFocus(page);

  await expect.poll(async () => {
    return await page.evaluate(() => {
      const input = document.querySelector('input[data-effindom-hidden-editor="true"]');
      if (!(input instanceof HTMLInputElement)) {
        throw new Error('Expected hidden bridge input.');
      }
      return {
        readOnly: input.readOnly,
        start: input.selectionStart,
        end: input.selectionEnd,
      };
    });
  }).toMatchObject({ readOnly: true });
  const initialSelection = await page.evaluate(() => {
    const input = document.querySelector('input[data-effindom-hidden-editor="true"]');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('Expected hidden bridge input.');
    }
    return {
      start: input.selectionStart ?? 0,
      end: input.selectionEnd ?? 0,
    };
  });
  expect(initialSelection.start).toBe(initialSelection.end);
  expect(initialSelection.start).toBeGreaterThan(0);

  await page.keyboard.press('ArrowLeft');
  await expect.poll(async () => {
    return await page.evaluate(() => {
      const input = document.querySelector('input[data-effindom-hidden-editor="true"]');
      if (!(input instanceof HTMLInputElement)) {
        throw new Error('Expected hidden bridge input.');
      }
      return {
        start: input.selectionStart,
        end: input.selectionEnd,
      };
    });
  }).toEqual({ start: initialSelection.start - 1, end: initialSelection.end - 1 });

  await page.keyboard.down('Shift');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.up('Shift');
  await expect.poll(async () => {
    return await page.evaluate(() => {
      const input = document.querySelector('input[data-effindom-hidden-editor="true"]');
      if (!(input instanceof HTMLInputElement)) {
        throw new Error('Expected hidden bridge input.');
      }
      return {
        start: input.selectionStart,
        end: input.selectionEnd,
        direction: input.selectionDirection,
      };
    });
  }).toEqual({ start: initialSelection.start - 2, end: initialSelection.end - 1, direction: 'backward' });

  await page.keyboard.type('X');
  await page.keyboard.press('Backspace');
  await expect.poll(async () => {
    return await page.evaluate(() => {
      const input = document.querySelector('input[data-effindom-hidden-editor="true"]');
      if (!(input instanceof HTMLInputElement)) {
        throw new Error('Expected hidden bridge input.');
      }
      return input.value;
    });
  }).toBe(readonlyText);
});

test('demo sliders keep the restored cross-axis bounds in the browser path', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?common-controls=1`);
  await demo.waitForDemoReady(page);

  await demo.scrollSemanticLabelIntoView(page, 'Slider');
  const horizontalBounds = await demo.findSemanticBounds(page, 'Slider');
  expect(horizontalBounds).not.toBeNull();
  if (horizontalBounds === null) {
    throw new Error('Expected horizontal slider semantic bounds.');
  }

  await demo.scrollSemanticLabelIntoView(page, 'Vertical slider');
  const verticalBounds = await demo.findSemanticBounds(page, 'Vertical slider');
  expect(verticalBounds).not.toBeNull();
  if (verticalBounds === null) {
    throw new Error('Expected vertical slider semantic bounds.');
  }

  expect(Math.round(horizontalBounds.height)).toBe(30);
  expect(Math.round(verticalBounds.width)).toBe(30);
});

test('demo sliders keep the thumb centered inside the browser-rendered shell', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?common-controls=1`);
  await demo.waitForDemoReady(page);

  await demo.scrollSemanticLabelIntoView(page, 'Slider');
  const horizontalBounds = await demo.findSemanticBounds(page, 'Slider');
  expect(horizontalBounds).not.toBeNull();
  if (horizontalBounds === null) {
    throw new Error('Expected horizontal slider bounds.');
  }
  const horizontalRegion = await demo.readSceneRegion(
    page,
    Math.floor(horizontalBounds.x),
    Math.floor(horizontalBounds.y),
    Math.ceil(horizontalBounds.width),
    Math.ceil(horizontalBounds.height),
  );
  const horizontalThumb = demo.findBlueDominantBounds(horizontalRegion);
  expect(horizontalThumb).not.toBeNull();
  if (horizontalThumb === null) {
    throw new Error('Expected horizontal slider thumb pixels.');
  }
  const horizontalTopGap = horizontalThumb.minY;
  const horizontalBottomGap = (horizontalRegion.height - 1) - horizontalThumb.maxY;
  expect(Math.abs(horizontalTopGap - horizontalBottomGap)).toBeLessThanOrEqual(1);

  await demo.scrollSemanticLabelIntoView(page, 'Vertical slider');
  const verticalBounds = await demo.findSemanticBounds(page, 'Vertical slider');
  expect(verticalBounds).not.toBeNull();
  if (verticalBounds === null) {
    throw new Error('Expected vertical slider bounds.');
  }
  const verticalRegion = await demo.readSceneRegion(
    page,
    Math.floor(verticalBounds.x),
    Math.floor(verticalBounds.y),
    Math.ceil(verticalBounds.width),
    Math.ceil(verticalBounds.height),
  );
  const verticalThumb = demo.findBlueDominantBounds(verticalRegion);
  expect(verticalThumb).not.toBeNull();
  if (verticalThumb === null) {
    throw new Error('Expected vertical slider thumb pixels.');
  }
  const verticalLeftGap = verticalThumb.minX;
  const verticalRightGap = (verticalRegion.width - 1) - verticalThumb.maxX;
  expect(Math.abs(verticalLeftGap - verticalRightGap)).toBeLessThanOrEqual(1);
});

test('dropdown popup is visibly painted when opened in the demo scene', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?common-controls=1`);
  await demo.waitForDemoReady(page);

  await demo.scrollSemanticLabelIntoView(page, 'Balanced');
  const comboboxBounds = await demo.findSemanticBounds(page, 'Balanced');
  expect(comboboxBounds).not.toBeNull();
  if (comboboxBounds === null) {
    throw new Error('Expected Balanced combobox bounds.');
  }

  const popupProbeRegion = {
    x: Math.floor(comboboxBounds.x),
    y: Math.floor(comboboxBounds.y + comboboxBounds.height + 4),
    width: Math.max(32, Math.ceil(comboboxBounds.width)),
    height: 110,
  };
  const outsideProbeX = popupProbeRegion.x + popupProbeRegion.width + 140;
  const outsideProbeY = popupProbeRegion.y + 36;
  const beforeOpen = await demo.readSceneRegion(
    page,
    popupProbeRegion.x,
    popupProbeRegion.y,
    popupProbeRegion.width,
    popupProbeRegion.height,
  );
  const beforeOutside = await demo.readScenePixel(page, outsideProbeX, outsideProbeY);

  await demo.clickSemanticLabel(page, 'Balanced');
  await expect.poll(async () => await demo.readSemanticNode(page, 'Quality first')).toMatchObject({
    roleName: 'listitem',
  });

  const afterOpen = await demo.readSceneRegion(
    page,
    popupProbeRegion.x,
    popupProbeRegion.y,
    popupProbeRegion.width,
    popupProbeRegion.height,
  );
  const changedPopupPixel = demo.findChangedPixel(beforeOpen, afterOpen);
  expect(changedPopupPixel).not.toBeNull();
  const afterOutside = await demo.readScenePixel(page, outsideProbeX, outsideProbeY);
  expect(afterOutside).toEqual(beforeOutside);
});

test('dropdown popup flips above the control when there is not enough room below', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?common-controls=1`);
  await demo.waitForDemoReady(page);

  await demo.scrollSemanticLabelIntoView(page, 'Balanced');
  await demo.moveSemanticLabelNearCanvasBottom(page, 'Balanced', 20);
  const comboboxBounds = await demo.findSemanticBounds(page, 'Balanced');
  expect(comboboxBounds).not.toBeNull();
  if (comboboxBounds === null) {
    throw new Error('Expected Balanced combobox bounds.');
  }

  await demo.clickSemanticLabel(page, 'Balanced');
  await expect.poll(async () => await demo.readSemanticNode(page, 'Quality first')).toMatchObject({
    roleName: 'listitem',
  });

  const optionBounds = await demo.findSemanticBounds(page, 'Quality first');
  expect(optionBounds).not.toBeNull();
  expect((optionBounds?.y ?? 0) + (optionBounds?.height ?? 0)).toBeLessThanOrEqual(comboboxBounds.y);
});

test('dropdown selection restores wheel scrolling under the former popup area', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?common-controls=1`);
  await demo.waitForDemoReady(page);

  await demo.scrollSemanticLabelIntoView(page, 'Balanced');
  const beforeBounds = await demo.findSemanticBounds(page, 'Balanced');
  expect(beforeBounds).not.toBeNull();
  if (beforeBounds === null) {
    throw new Error('Expected Balanced combobox bounds.');
  }

  await demo.clickSemanticLabel(page, 'Balanced');
  await expect.poll(async () => await demo.readSemanticNode(page, 'Quality first')).toMatchObject({
    roleName: 'listitem',
  });

  await demo.clickSemanticLabel(page, 'Quality first');
  await expect.poll(async () => await demo.readSemanticNode(page, 'Quality first')).toMatchObject({
    roleName: 'combobox',
    state: { expanded: false },
  });

  await page.mouse.wheel(0, 360);
  await page.waitForTimeout(120);

  const afterBounds = await demo.findSemanticBounds(page, 'Quality first');
  expect(afterBounds).not.toBeNull();
  expect(afterBounds?.y ?? beforeBounds.y).toBeLessThan(beforeBounds.y - 20);
});

test('combobox chevron preserves the default text caret at the end in the demo scene', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?common-controls=1`);
  await demo.waitForDemoReady(page);

  await demo.scrollSemanticLabelIntoView(page, 'Melbourne');
  await demo.clickSemanticLabelAtFraction(page, 'Melbourne', 0.93, 0.5);
  await demo.waitForHiddenTextInputFocus(page);

  await expect.poll(async () => await demo.readHiddenInputSelection(page)).toMatchObject({
    start: 9,
    end: 9,
    focused: true,
  });
});

test('dashboard city combobox pointer item selection survives clearing and editor blur', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?common-controls-pointer-combobox=1`);
  await demo.waitForDemoReady(page);

  await demo.scrollSemanticLabelIntoView(page, 'Melbourne');
  await demo.clickSemanticLabel(page, 'Melbourne');
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
  await page.keyboard.press('Backspace');

  await expect.poll(async () => {
    return await demo.readSemanticNode(page, 'Search city');
  }, { timeout: 10000 }).toMatchObject({
    roleName: 'textbox',
  });

  await demo.clickSemanticLabelAtFraction(page, 'Search city', 0.93, 0.5);
  await expect.poll(async () => await demo.readSemanticNode(page, 'Sydney'), { timeout: 10000 }).toMatchObject({
    roleName: 'listitem',
  });

  await demo.clickSemanticLabel(page, 'Sydney');
  await expect.poll(async () => await demo.readSemanticNode(page, 'Sydney'), { timeout: 10000 }).toMatchObject({
    roleName: 'combobox',
    state: { expanded: false },
  });
  await expect.poll(async () => {
    return await demo.readSemanticLabelByPrefix(page, 'ComboBox: ');
  }, { timeout: 10000 }).toBe('ComboBox: Sydney • Text: <empty>');
});
