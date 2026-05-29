import { expect, test } from '@playwright/test';

import * as demo from './demo-test-support';

demo.registerDemoLifecycle(test);

test('dialog startup respects the light system theme before app construction', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?dialog-light-theme=1`);
  await demo.waitForDemoReady(page);

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
  const sampleX = canvasBox.x + dialogRegion.x + (dialogRegion.width * 0.82);
  const sampleY = canvasBox.y + dialogRegion.y + (dialogRegion.height * 0.18);

  await expect.poll(async () => {
    const pixel = await demo.readScenePixel(page, sampleX, sampleY);
    return Math.min(pixel.red, pixel.green, pixel.blue);
  }).toBeGreaterThan(220);
});

test('dialog Enter activation waits for key release before accepting', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?dialog-enter=1`);
  await demo.waitForDemoReady(page);

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

  await expect.poll(async () => {
    return await page.evaluate(() => (window.__bridgeSemanticTree ?? []).map((node) => node.label));
  }).toEqual(expect.arrayContaining([
    'Confirm action',
    'Press Enter to accept, Escape to cancel, or click the backdrop to dismiss this dialog.',
    'OK',
    'Cancel',
  ]));
  await expect.poll(async () => {
    return await page.evaluate(() => (window.__bridgeSemanticTree ?? []).some((node) => node.label === 'Open dialog'));
  }).toBe(false);
  await expect.poll(async () => {
    return await page.evaluate(() => (window.__bridgeSemanticTree ?? []).some((node) => node.label === 'Dialog status: open'));
  }).toBe(false);
  await expect.poll(async () => {
    return await page.evaluate(() => {
      const layer = document.getElementById('semantic-layer');
      const dialog = layer?.querySelector('[role="dialog"][aria-label="Confirm action"]');
      const body = Array.from(layer?.querySelectorAll('[data-role="text"]') ?? [])
        .map((node) => node.textContent ?? '')
        .find((text) => text.includes('Press Enter to accept'));
      return {
        hasDialog: dialog !== null,
        body,
      };
    });
  }).toEqual({
    hasDialog: true,
    body: 'Press Enter to accept, Escape to cancel, or click the backdrop to dismiss this dialog.',
  });

  await page.keyboard.down('Enter');
  await expect.poll(async () => {
    return await page.evaluate(() => (window.__bridgeSemanticTree ?? []).map((node) => node.label));
  }).toEqual(expect.arrayContaining([
    'Confirm action',
    'Press Enter to accept, Escape to cancel, or click the backdrop to dismiss this dialog.',
    'OK',
    'Cancel',
  ]));

  await page.keyboard.up('Enter');
  await expect.poll(async () => {
    return await page.evaluate(() => (window.__bridgeSemanticTree ?? []).some((node) => node.label === 'OK'));
  }).toBe(false);
  await expect.poll(async () => {
    return await page.evaluate(() => (window.__bridgeSemanticTree ?? []).map((node) => node.label));
  }).toEqual(expect.arrayContaining(['Dialog status: accepted']));
  await expect.poll(async () => {
    return await page.evaluate(() => (window.__bridgeSemanticTree ?? []).some((node) => node.label === 'Open dialog'));
  }).toBe(true);
  await expect.poll(async () => {
    return await page.evaluate(() => (window.__bridgeSemanticTree ?? []).some((node) => node.label === 'Confirm action'));
  }).toBe(false);
});

test('dialog Escape activation waits for key release before cancelling', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?dialog-escape=1`);
  await demo.waitForDemoReady(page);

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

  await expect.poll(async () => {
    return await page.evaluate(() => (window.__bridgeSemanticTree ?? []).map((node) => node.label));
  }).toEqual(expect.arrayContaining([
    'Confirm action',
    'Press Enter to accept, Escape to cancel, or click the backdrop to dismiss this dialog.',
    'OK',
    'Cancel',
  ]));
  await expect.poll(async () => {
    return await page.evaluate(() => (window.__bridgeSemanticTree ?? []).some((node) => node.label === 'Open dialog'));
  }).toBe(false);
  await expect.poll(async () => {
    return await page.evaluate(() => (window.__bridgeSemanticTree ?? []).some((node) => node.label === 'Dialog status: open'));
  }).toBe(false);

  await page.keyboard.down('Escape');
  await expect.poll(async () => {
    return await page.evaluate(() => (window.__bridgeSemanticTree ?? []).map((node) => node.label));
  }).toEqual(expect.arrayContaining(['Confirm action', 'OK', 'Cancel']));

  await page.keyboard.up('Escape');
  await expect.poll(async () => {
    return await page.evaluate(() => (window.__bridgeSemanticTree ?? []).some((node) => node.label === 'Cancel'));
  }).toBe(false);
  await expect.poll(async () => {
    return await page.evaluate(() => (window.__bridgeSemanticTree ?? []).map((node) => node.label));
  }).toEqual(expect.arrayContaining(['Dialog status: cancelled']));
  await expect.poll(async () => {
    return await page.evaluate(() => (window.__bridgeSemanticTree ?? []).some((node) => node.label === 'Open dialog'));
  }).toBe(true);
  await expect.poll(async () => {
    return await page.evaluate(() => (window.__bridgeSemanticTree ?? []).some((node) => node.label === 'Confirm action'));
  }).toBe(false);
});

test('dialog backdrop clicks cancel the active modal', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?dialog-backdrop=1`);
  await demo.waitForDemoReady(page);

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

  await expect.poll(async () => {
    return await page.evaluate(() => (window.__bridgeSemanticTree ?? []).map((node) => node.label));
  }).toEqual(expect.arrayContaining(['Confirm action', 'OK', 'Cancel']));
  await expect.poll(async () => {
    return await page.evaluate(() => (window.__bridgeSemanticTree ?? []).some((node) => node.label === 'Open dialog'));
  }).toBe(false);
  await expect.poll(async () => {
    return await page.evaluate(() => (window.__bridgeSemanticTree ?? []).some((node) => node.label === 'Dialog status: open'));
  }).toBe(false);

  await page.mouse.click(canvasBox.x + 24, canvasBox.y + 24);

  await expect.poll(async () => {
    return await page.evaluate(() => (window.__bridgeSemanticTree ?? []).some((node) => node.label === 'OK'));
  }).toBe(false);
  await expect.poll(async () => {
    return await page.evaluate(() => (window.__bridgeSemanticTree ?? []).map((node) => node.label));
  }).toEqual(expect.arrayContaining(['Dialog status: cancelled']));
  await expect.poll(async () => {
    return await page.evaluate(() => (window.__bridgeSemanticTree ?? []).some((node) => node.label === 'Open dialog'));
  }).toBe(true);
  await expect.poll(async () => {
    return await page.evaluate(() => (window.__bridgeSemanticTree ?? []).some((node) => node.label === 'Confirm action'));
  }).toBe(false);
});

test('right-clicking selected text shows Copy and clicking it writes the stitched selection', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?context-menu-copy=1`);
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

  const selectionStartX = canvasBox.x + selectionRegion.x + 8;
  const selectionY = canvasBox.y + selectionRegion.y + (selectionRegion.height * 0.5);
  const selectionEndX = selectionStartX + Math.min(56, Math.max(selectionRegion.width - 16, 24));
  const contextMenuX = selectionStartX + ((selectionEndX - selectionStartX) * 0.5);

  await page.mouse.move(selectionStartX, selectionY);
  await page.mouse.down();
  await page.mouse.move(selectionEndX, selectionY, { steps: 8 });
  await page.mouse.up();

  await expect.poll(async () => {
    return await page.evaluate(() => window.__fuiDemoSelectionText ?? '');
  }).not.toBe('');
  const expectedSelection = await page.evaluate(() => window.__fuiDemoSelectionText ?? '');

  await page.mouse.click(contextMenuX, selectionY, { button: 'right' });
  await expect.poll(async () => await demo.readContextMenuLabels(page)).toEqual(['Copy', 'Select All', 'Reload Page']);
  await expect.poll(async () => {
    return await page.evaluate(() => window.__fuiDemoSelectionText ?? '');
  }).toBe(expectedSelection);

  const copyBounds = await demo.findSemanticBounds(page, 'Copy');
  expect(copyBounds).not.toBeNull();
  if (copyBounds === null) {
    throw new Error('Expected Copy menu item bounds.');
  }

  await page.mouse.click(
    canvasBox.x + copyBounds.x + (copyBounds.width * 0.5),
    canvasBox.y + copyBounds.y + (copyBounds.height * 0.5),
  );

  await expect.poll(async () => {
    const writes = await page.evaluate(() => window.__bridgeLogs?.clipboardWrites ?? []);
    return writes.length == 0 ? '' : writes[writes.length - 1] ?? '';
  }).toBe(expectedSelection);
  await expect.poll(async () => await demo.readContextMenuLabels(page)).toEqual([]);
});

test('right-clicking outside the current selection clears it and hides Copy', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?context-menu-clear=1`);
  await demo.waitForDemoReady(page);

  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox === null) {
    throw new Error('Expected scene canvas bounds.');
  }

  const selectionRegion = await demo.findSemanticBounds(page, 'Scrollable list');
  expect(selectionRegion).not.toBeNull();
  if (selectionRegion === null) {
    throw new Error('Expected selection bounds.');
  }

  const selectionStartX = canvasBox.x + selectionRegion.x + 8;
  const selectionY = canvasBox.y + selectionRegion.y + (selectionRegion.height * 0.5);
  const selectionEndX = selectionStartX + Math.min(56, Math.max(selectionRegion.width - 16, 24));

  await page.mouse.move(selectionStartX, selectionY);
  await page.mouse.down();
  await page.mouse.move(selectionEndX, selectionY, { steps: 8 });
  await page.mouse.up();

  await expect.poll(async () => {
    return await page.evaluate(() => window.__fuiDemoSelectionText ?? '');
  }).not.toBe('');

  await page.mouse.click(
    canvasBox.x + (canvasBox.width * 0.5),
    canvasBox.y + canvasBox.height - 24,
    { button: 'right' },
  );

  await expect.poll(async () => await demo.readContextMenuLabels(page)).toEqual(['Reload Page']);
  await expect.poll(async () => {
    return await page.evaluate(() => window.__fuiDemoSelectionText ?? '');
  }).toBe('');
});

test('Escape closes the context menu and clears the active text selection', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?context-menu-escape=1`);
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

  const selectionStartX = canvasBox.x + selectionRegion.x + 8;
  const selectionY = canvasBox.y + selectionRegion.y + (selectionRegion.height * 0.5);
  const selectionEndX = selectionStartX + Math.min(56, Math.max(selectionRegion.width - 16, 24));
  const contextMenuX = selectionStartX + ((selectionEndX - selectionStartX) * 0.5);

  await page.mouse.move(selectionStartX, selectionY);
  await page.mouse.down();
  await page.mouse.move(selectionEndX, selectionY, { steps: 8 });
  await page.mouse.up();

  await expect.poll(async () => {
    return await page.evaluate(() => window.__fuiDemoSelectionText ?? '');
  }).not.toBe('');

  await page.mouse.click(contextMenuX, selectionY, { button: 'right' });
  await expect.poll(async () => await demo.readContextMenuLabels(page)).toEqual(['Copy', 'Select All', 'Reload Page']);

  await page.keyboard.press('Escape');

  await expect.poll(async () => await demo.readContextMenuLabels(page)).toEqual([]);
  await expect.poll(async () => {
    return await page.evaluate(() => window.__fuiDemoSelectionText ?? '');
  }).toBe('');
});

test('editable text exposes default text actions and Select All works from the context menu', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?context-menu-text-input=1`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Type here');

  await demo.clickSemanticLabel(page, 'Type here');
  await page.focus('input[data-effindom-hidden-editor="true"]');
  await page.keyboard.type('hello');
  await expect.poll(async () => await demo.readBridgeTextForSemanticLabel(page, 'Type here')).toBe('hello');
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
  await expect.poll(async () => await demo.readHiddenInputSelection(page)).toMatchObject({
    start: 0,
    end: 5,
    focused: true,
  });

  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox === null) {
    throw new Error('Expected scene canvas bounds.');
  }

  await demo.rightClickSemanticLabel(page, 'Type here');
  await expect.poll(async () => await demo.readContextMenuLabels(page)).toEqual([
    'Undo',
    'Redo',
    'Cut',
    'Copy',
    'Paste',
    'Select All',
    'Reload Page',
  ]);
  await demo.hoverSemanticLabel(page, 'Cut');
  await expect.poll(async () => await demo.readContextMenuLabels(page)).toEqual([
    'Undo',
    'Redo',
    'Cut',
    'Copy',
    'Paste',
    'Select All',
    'Reload Page',
  ]);
  const cutBounds = await demo.findSemanticBounds(page, 'Cut');
  expect(cutBounds).not.toBeNull();
  if (cutBounds === null) {
    throw new Error('Expected Cut menu item bounds.');
  }
  await page.mouse.click(
    canvasBox.x + cutBounds.x + (cutBounds.width * 0.5),
    canvasBox.y + cutBounds.y + (cutBounds.height * 0.5),
  );
  await expect.poll(async () => {
    return await page.evaluate(() => {
      const input = document.querySelector('input[data-effindom-hidden-editor="true"]') as HTMLInputElement | null;
      return input?.value ?? null;
    });
  }).toBe('');
  await expect.poll(async () => await demo.readHiddenInputSelection(page)).toMatchObject({
    focused: true,
  });
  await expect.poll(async () => await demo.readBridgeTextForSemanticLabel(page, 'Type here')).toBe('');

  await demo.clickSemanticLabel(page, 'Type here');
  await page.focus('input[data-effindom-hidden-editor="true"]');
  await page.keyboard.type('hello');
  await expect.poll(async () => await demo.readBridgeTextForSemanticLabel(page, 'Type here')).toBe('hello');
  await page.evaluate(() => {
    if (window.__bridgeLogs !== undefined) {
      window.__bridgeLogs.clipboardWrites.length = 0;
    }
  });
  await demo.rightClickSemanticLabel(page, 'Type here');
  await expect.poll(async () => await demo.readContextMenuLabels(page)).toEqual([
    'Undo',
    'Redo',
    'Cut',
    'Copy',
    'Paste',
    'Select All',
    'Reload Page',
  ]);
  const refillSelectAllBounds = await demo.findSemanticBounds(page, 'Select All');
  expect(refillSelectAllBounds).not.toBeNull();
  if (refillSelectAllBounds === null) {
    throw new Error('Expected Select All menu item bounds.');
  }
  await page.mouse.click(
    canvasBox.x + refillSelectAllBounds.x + (refillSelectAllBounds.width * 0.5),
    canvasBox.y + refillSelectAllBounds.y + (refillSelectAllBounds.height * 0.5),
  );

  await demo.rightClickSemanticLabel(page, 'Type here');
  await expect.poll(async () => await demo.readContextMenuLabels(page)).toEqual([
    'Undo',
    'Redo',
    'Cut',
    'Copy',
    'Paste',
    'Select All',
    'Reload Page',
  ]);
  const copyBounds = await demo.findSemanticBounds(page, 'Copy');
  expect(copyBounds).not.toBeNull();
  if (copyBounds === null) {
    throw new Error('Expected Copy menu item bounds.');
  }
  await page.mouse.click(
    canvasBox.x + copyBounds.x + (copyBounds.width * 0.5),
    canvasBox.y + copyBounds.y + (copyBounds.height * 0.5),
  );
  await expect.poll(async () => {
    const writes = await page.evaluate(() => window.__bridgeLogs?.clipboardWrites ?? []);
    return writes.length == 0 ? '' : writes[writes.length - 1] ?? '';
  }).toBe('hello');

  await demo.clickSemanticLabel(page, 'Type here');
  await page.focus('input[data-effindom-hidden-editor="true"]');
  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => await demo.readHiddenInputSelection(page)).toMatchObject({
    start: 5,
    end: 5,
    focused: true,
  });
  await page.evaluate(() => {
    if (window.__bridgeLogs !== undefined) {
      window.__bridgeLogs.selectionChanges.length = 0;
    }
  });

  await demo.rightClickSemanticLabel(page, 'Type here');
  await expect.poll(async () => await demo.readContextMenuLabels(page)).toEqual([
    'Undo',
    'Redo',
    'Cut',
    'Copy',
    'Paste',
    'Select All',
    'Reload Page',
  ]);

  const pasteBounds = await demo.findSemanticBounds(page, 'Paste');
  expect(pasteBounds).not.toBeNull();
  if (pasteBounds === null) {
    throw new Error('Expected Paste menu item bounds.');
  }
  await page.mouse.click(
    canvasBox.x + pasteBounds.x + (pasteBounds.width * 0.5),
    canvasBox.y + pasteBounds.y + (pasteBounds.height * 0.5),
  );
  await expect.poll(async () => {
    const reads = await page.evaluate(() => window.__bridgeLogs?.clipboardReadRequests ?? []);
    return reads.length;
  }).toBeGreaterThan(0);
  await expect.poll(async () => await demo.readHiddenInputSelection(page)).toMatchObject({
    focused: true,
  });

  await demo.rightClickSemanticLabel(page, 'Type here');
  await expect.poll(async () => await demo.readContextMenuLabels(page)).toEqual([
    'Undo',
    'Redo',
    'Cut',
    'Copy',
    'Paste',
    'Select All',
    'Reload Page',
  ]);
  const selectAllBounds = await demo.findSemanticBounds(page, 'Select All');
  expect(selectAllBounds).not.toBeNull();
  if (selectAllBounds === null) {
    throw new Error('Expected Select All menu item bounds.');
  }
  await page.mouse.click(
    canvasBox.x + selectAllBounds.x + (selectAllBounds.width * 0.5),
    canvasBox.y + selectAllBounds.y + (selectAllBounds.height * 0.5),
  );
  await expect.poll(async () => await demo.readHiddenInputSelection(page)).toMatchObject({
    focused: true,
  });
  await expect.poll(async () => {
    const changes = await page.evaluate(() => window.__bridgeLogs?.selectionChanges ?? []);
    return changes.length == 0 ? null : changes[changes.length - 1] ?? null;
  }).toMatchObject({
    start: 0,
    end: 5,
  });
});

test('images expose default image actions in the context menu', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Popup coverage is only exercised in Chromium here.');

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?context-menu-image=1`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Bridge loaded texture sample');

  await expect.poll(async () => {
    return await demo.findSemanticBounds(page, 'Bridge loaded SVG sample');
  }).not.toBeNull();
  await expect.poll(async () => {
    return await demo.findSemanticBounds(page, 'Bridge loaded texture sample');
  }).not.toBeNull();
  await expect.poll(async () => {
    return await demo.findSemanticBounds(page, 'Bridge loaded secondary texture sample');
  }).not.toBeNull();
  const svgBounds = await demo.findSemanticBounds(page, 'Bridge loaded SVG sample');
  const secondaryTextureBounds = await demo.findSemanticBounds(page, 'Bridge loaded secondary texture sample');
  const textureBounds = await demo.findSemanticBounds(page, 'Bridge loaded texture sample');
  expect(svgBounds).not.toBeNull();
  expect(secondaryTextureBounds).not.toBeNull();
  expect(textureBounds).not.toBeNull();
  if (svgBounds === null || secondaryTextureBounds === null || textureBounds === null) {
    throw new Error('Expected image sample bounds.');
  }
  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox === null) {
    throw new Error('Expected scene canvas bounds.');
  }

  await page.mouse.click(
    canvasBox.x + svgBounds.x + (svgBounds.width * 0.5),
    canvasBox.y + svgBounds.y + (svgBounds.height * 0.5),
    { button: 'right' },
  );
  await expect.poll(async () => await demo.readContextMenuLabels(page)).toEqual([
    'Reload Page',
  ]);

  await page.mouse.click(
    canvasBox.x + secondaryTextureBounds.x + (secondaryTextureBounds.width * 0.5),
    canvasBox.y + secondaryTextureBounds.y + (secondaryTextureBounds.height * 0.5),
    { button: 'right' },
  );
  await expect.poll(async () => await demo.readContextMenuLabels(page)).toEqual([
    'Open Image in New Tab',
    'Open Image',
    'Reload Page',
  ]);

  const popupPromise = context.waitForEvent('page');
  const popupItemBounds = await demo.findSemanticBounds(page, 'Open Image in New Tab');
  expect(popupItemBounds).not.toBeNull();
  if (popupItemBounds === null) {
    throw new Error('Expected Open Image in New Tab menu item bounds.');
  }
  await page.mouse.click(
    canvasBox.x + popupItemBounds.x + (popupItemBounds.width * 0.5),
    canvasBox.y + popupItemBounds.y + (popupItemBounds.height * 0.5),
  );
  const popup = await popupPromise;
  await expect(popup).toHaveURL(/\/v2\/fui-as\/demo\/demo-secondary-texture\.png$/);
  await popup.close();

  await page.mouse.click(
    canvasBox.x + textureBounds.x + (textureBounds.width * 0.5),
    canvasBox.y + textureBounds.y + (textureBounds.height * 0.5),
    { button: 'right' },
  );
  await expect.poll(async () => await demo.readContextMenuLabels(page)).toEqual([
    'Open Image in New Tab',
    'Open Image',
    'Reload Page',
  ]);
});

test('context menu background blur stays inside the popup panel', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Popup coverage is only exercised in Chromium here.');

  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?context-menu-image=1`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Bridge loaded texture sample');

  await expect.poll(async () => {
    return await demo.findSemanticBounds(page, 'Bridge loaded texture sample');
  }).not.toBeNull();
  const textureBounds = await demo.findSemanticBounds(page, 'Bridge loaded texture sample');
  expect(textureBounds).not.toBeNull();
  if (textureBounds === null) {
    throw new Error('Expected image sample bounds.');
  }
  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox === null) {
    throw new Error('Expected scene canvas bounds.');
  }

  const clickX = canvasBox.x + textureBounds.x + (textureBounds.width * 0.5);
  const clickY = canvasBox.y + textureBounds.y + (textureBounds.height * 0.5);
  await page.mouse.click(clickX, clickY, { button: 'right' });
  await expect.poll(async () => await demo.readContextMenuLabels(page)).toEqual([
    'Open Image in New Tab',
    'Open Image',
    'Reload Page',
  ]);

  const itemBounds = await demo.findSemanticBounds(page, 'Open Image');
  expect(itemBounds).not.toBeNull();
  if (itemBounds === null) {
    throw new Error('Expected Open Image bounds.');
  }

  const outsideLeftX = Math.max(0, Math.floor(itemBounds.x - 180));
  const outsideRightX = Math.floor(itemBounds.x + itemBounds.width + 80);
  const outsideProbeY = Math.floor(itemBounds.y + (itemBounds.height * 0.5));

  await page.mouse.click(clickX, clickY, { button: 'left' });
  await expect.poll(async () => await demo.readContextMenuLabels(page)).toEqual([]);

  const beforeLeft = await demo.readScenePixel(page, outsideLeftX, outsideProbeY);
  const beforeRight = await demo.readScenePixel(page, outsideRightX, outsideProbeY);

  await page.mouse.click(clickX, clickY, { button: 'right' });
  await expect.poll(async () => await demo.readContextMenuLabels(page)).toEqual([
    'Open Image in New Tab',
    'Open Image',
    'Reload Page',
  ]);

  const afterLeft = await demo.readScenePixel(page, outsideLeftX, outsideProbeY);
  const afterRight = await demo.readScenePixel(page, outsideRightX, outsideProbeY);
  expect(afterLeft).toEqual(beforeLeft);
  expect(afterRight).toEqual(beforeRight);
});

test('repeated right clicks retarget image context menu while it is open', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Popup coverage is only exercised in Chromium here.');

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?context-menu-image=1`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Bridge loaded texture sample');

  await expect.poll(async () => {
    return await demo.findSemanticBounds(page, 'Bridge loaded SVG sample');
  }).not.toBeNull();
  await expect.poll(async () => {
    return await demo.findSemanticBounds(page, 'Bridge loaded texture sample');
  }).not.toBeNull();
  const svgBounds = await demo.findSemanticBounds(page, 'Bridge loaded SVG sample');
  const textureBounds = await demo.findSemanticBounds(page, 'Bridge loaded texture sample');
  expect(svgBounds).not.toBeNull();
  expect(textureBounds).not.toBeNull();
  if (svgBounds === null || textureBounds === null) {
    throw new Error('Expected image sample bounds.');
  }
  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox === null) {
    throw new Error('Expected scene canvas bounds.');
  }

  await page.mouse.click(
    canvasBox.x + svgBounds.x + (svgBounds.width * 0.5),
    canvasBox.y + svgBounds.y + (svgBounds.height * 0.5),
    { button: 'right' },
  );
  await expect.poll(async () => await demo.readContextMenuLabels(page)).toEqual([
    'Reload Page',
  ]);

  await page.mouse.click(
    canvasBox.x + textureBounds.x + (textureBounds.width * 0.5),
    canvasBox.y + textureBounds.y + (textureBounds.height * 0.5),
    { button: 'right' },
  );
  await expect.poll(async () => await demo.readContextMenuLabels(page)).toEqual([
    'Open Image in New Tab',
    'Open Image',
    'Reload Page',
  ]);

  const popupPromise = context.waitForEvent('page');
  const popupItemBounds = await demo.findSemanticBounds(page, 'Open Image in New Tab');
  expect(popupItemBounds).not.toBeNull();
  if (popupItemBounds === null) {
    throw new Error('Expected Open Image in New Tab menu item bounds.');
  }
  await page.mouse.click(
    canvasBox.x + popupItemBounds.x + (popupItemBounds.width * 0.5),
    canvasBox.y + popupItemBounds.y + (popupItemBounds.height * 0.5),
  );
  const popup = await popupPromise;
  await popup.waitForLoadState('domcontentloaded');
  await expect(popup).toHaveURL(/\/v2\/fui-as\/demo\/demo-texture\.png$/);
  await popup.close();
});
