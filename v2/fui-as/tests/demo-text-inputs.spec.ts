import { expect, test } from '@playwright/test';

import * as demo from './demo-test-support';

demo.registerDemoLifecycle(test);

test('demo loading overlay surfaces missing runtime config', async ({ page }) => {
  await page.route('**/effindom-runtime-config.js', async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/javascript',
      body: '',
    });
  });
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);

  await expect.poll(async () => {
    return await page.evaluate(() => window.__fuiAsError ?? null);
  }).toContain('Missing effindom-runtime-config.js');

  await expect(page.locator('#effindom-loading-overlay')).toBeVisible();
  await expect(page.locator('#effindom-loading-overlay')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#effindom-loading-title')).toContainText('render raccoons');
  await expect(page.locator('#effindom-loading-detail')).toContainText('Missing effindom-runtime-config.js');
});

test('demo text inputs keep multi-character text in both plain and password fields', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Type here');

  await demo.clickSemanticLabel(page, 'Type here');
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.type('hello');

  await expect.poll(async () => {
    return await demo.readBridgeTextForSemanticLabel(page, 'Type here');
  }).toBe('hello');
  await expect.poll(async () => {
    return await page.evaluate(() =>
      (window.__bridgeSemanticTree ?? []).find((node) => node.label.startsWith('TextInput: '))?.label ?? null,
    );
  }).toContain('"hello"');

  await demo.clickSemanticLabel(page, 'Password input');
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type('secret');

  await expect.poll(async () => {
    return await demo.readBridgeTextForSemanticLabel(page, 'Password input');
  }).toBe('secret');
});

test('demo text input Select All plus Backspace clears a windowed Unicode value', async ({ page }) => {
  const text = 'Variable\u2011Height \u201cjump\u201d frame\u202f1 \u2014 UTF-8 bridge '.repeat(140);

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Type here');

  await demo.clickSemanticLabel(page, 'Type here');
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(text);

  await expect.poll(async () => {
    const editor = await demo.readHiddenTextEditorState(page);
    const bridgeText = await demo.readBridgeTextForSemanticLabel(page, 'Type here');
    return editor === null ? null : {
      tagName: editor.tagName,
      windowed: editor.value.length < text.length,
      bounded: editor.value.length <= 4096,
      bridgeLength: bridgeText?.length ?? -1,
    };
  }).toEqual({
    tagName: 'input',
    windowed: true,
    bounded: true,
    bridgeLength: text.length,
  });

  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('Backspace');

  await expect.poll(async () => {
    const editor = await demo.readHiddenTextEditorState(page);
    const bridgeText = await demo.readBridgeTextForSemanticLabel(page, 'Type here');
    return editor === null ? null : {
      editorLength: editor.value.length,
      bridgeLength: bridgeText?.length ?? -1,
      focused: editor.focused,
    };
  }).toEqual({
    editorLength: 0,
    bridgeLength: 0,
    focused: true,
  });
});

test('demo text input clicks reposition caret without leaking into cross-selection', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Type here');

  await demo.clickSemanticLabel(page, 'Type here');
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.type('hello there friend');

  await demo.clickSemanticLabelAtFraction(page, 'Type here', 0.2, 0.5);
  await page.keyboard.type('X');

  await page.keyboard.down('Shift');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.up('Shift');

  await expect.poll(async () => {
    return await page.evaluate(() => window.__bridgeLogs?.crossSelectionChanges.length ?? 0);
  }).toBe(0);

  await expect.poll(async () => {
    return await demo.readBridgeTextForSemanticLabel(page, 'Type here');
  }).toBe('helloX there friend');
});

test('demo long text input clicks do not keep re-scrolling when the caret is already visible', async ({ page }) => {
  const initialText = 'abcdefghijklmnopqrstuvwxyz0123456789';

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Type here');

  await demo.clickSemanticLabel(page, 'Type here');
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.type(initialText);

  await demo.clickSemanticLabelAtFraction(page, 'Type here', 0.75, 0.5);
  await expect.poll(async () => {
    const selection = await demo.readHiddenInputSelection(page);
    return selection !== null &&
      selection.focused &&
      selection.start === selection.end &&
      selection.start > 0 &&
      selection.start < initialText.length;
  }).toBe(true);
  const firstSelection = await demo.readHiddenInputSelection(page);
  expect(firstSelection).not.toBeNull();
  const firstCaret = firstSelection?.start ?? initialText.length;

  await page.waitForTimeout(600);
  await demo.clickSemanticLabelAtFraction(page, 'Type here', 0.75, 0.5);
  await expect.poll(async () => {
    const selection = await demo.readHiddenInputSelection(page);
    return selection === null ? null : {
      start: selection.start,
      end: selection.end,
      focused: selection.focused,
    };
  }).toEqual({ start: firstCaret, end: firstCaret, focused: true });

  await page.keyboard.type('X');

  await expect.poll(async () => {
    return await demo.readBridgeTextForSemanticLabel(page, 'Type here');
  }).toBe(`${initialText.slice(0, firstCaret)}X${initialText.slice(firstCaret)}`);
});

test('demo mouse text selection behaves like keyboard text selection for replace and backspace', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Type here');

  await demo.clickSemanticLabel(page, 'Type here');
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.type('hello there friend');

  await demo.dragSemanticLabelBetweenFractions(page, 'Type here', 0.2, 0.5, 0.55, 0.5);

  await expect.poll(async () => {
    const selection = await demo.readHiddenInputSelection(page);
    return selection === null ? null : {
      start: selection.start,
      end: selection.end,
      focused: selection.focused,
    };
  }).toEqual({ start: 5, end: 15, focused: true });

  await page.keyboard.press('Backspace');

  await expect.poll(async () => {
    return await demo.readBridgeTextForSemanticLabel(page, 'Type here');
  }).toBe('helloend');

  await expect.poll(async () => {
    const selection = await demo.readHiddenInputSelection(page);
    return selection === null ? null : {
      start: selection.start,
      end: selection.end,
      focused: selection.focused,
    };
  }).toEqual({ start: 5, end: 5, focused: true });
});

test('demo keyboard-selected text input backspace deletes exactly the selected range once', async ({ page }) => {
  const initialText = 'hello there friend';

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Type here');

  await demo.clickSemanticLabel(page, 'Type here');
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.type(initialText);

  for (let index = 0; index < 10; index += 1) {
    await page.keyboard.down('Shift');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.up('Shift');
  }

  await expect.poll(async () => {
    const selection = await demo.readHiddenInputSelection(page);
    return selection === null ? null : {
      start: selection.start,
      end: selection.end,
      focused: selection.focused,
      direction: selection.direction,
    };
  }).toEqual({
    start: initialText.length - 10,
    end: initialText.length,
    focused: true,
    direction: 'backward',
  });

  await page.keyboard.press('Backspace');

  await expect.poll(async () => {
    return await demo.readBridgeTextForSemanticLabel(page, 'Type here');
  }).toBe(initialText.slice(0, initialText.length - 10));

  await expect.poll(async () => {
    const selection = await demo.readHiddenInputSelection(page);
    return selection === null ? null : {
      start: selection.start,
      end: selection.end,
      focused: selection.focused,
    };
  }).toEqual({ start: initialText.length - 10, end: initialText.length - 10, focused: true });
});

test('focusing demo password input clears the previous demo text input selection', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Type here');

  await demo.clickSemanticLabel(page, 'Type here');
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.type('hello there friend');

  await demo.dragSemanticLabelBetweenFractions(page, 'Type here', 0.2, 0.5, 0.55, 0.5);
  await expect.poll(async () => {
    const selection = await demo.readHiddenInputSelection(page);
    return selection === null ? null : {
      start: selection.start,
      end: selection.end,
      focused: selection.focused,
    };
  }).toEqual({ start: 5, end: 15, focused: true });

  await demo.clickSemanticLabel(page, 'Password input');
  await demo.waitForHiddenTextInputFocus(page);

  await expect.poll(async () => {
    return await page.evaluate(() =>
      (window.__bridgeSemanticTree ?? []).find((node) => node.label.startsWith('TextInput: '))?.label ?? null,
    );
  }).toContain('Selection: 15-15 • Focus: blurred');
});

test('demo backward mouse selection is replaced from the selected range instead of the old caret', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Type here');

  await demo.clickSemanticLabel(page, 'Type here');
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.type('hello there friend');

  await demo.dragSemanticLabelBetweenFractions(page, 'Type here', 0.55, 0.5, 0.2, 0.5);

  await expect.poll(async () => {
    const selection = await demo.readHiddenInputSelection(page);
    return selection === null ? null : {
      start: selection.start,
      end: selection.end,
      focused: selection.focused,
      direction: selection.direction,
    };
  }).toEqual({ start: 5, end: 15, focused: true, direction: 'backward' });

  await page.keyboard.type('Q');

  await expect.poll(async () => {
    return await demo.readBridgeTextForSemanticLabel(page, 'Type here');
  }).toBe('helloQend');
});

test('demo backward mouse selection still replaces after blurring to another input and back', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Type here');

  await demo.clickSemanticLabel(page, 'Type here');
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.type('test test test');

  await demo.clickSemanticLabel(page, 'Password input');
  await demo.waitForHiddenTextInputFocus(page);

  await demo.dragSemanticLabelBetweenFractions(page, 'Type here', 0.99, 0.5, 0.01, 0.5);

  await expect.poll(async () => {
    const selection = await demo.readHiddenInputSelection(page);
    return selection === null ? null : {
      start: selection.start,
      end: selection.end,
      focused: selection.focused,
      direction: selection.direction,
    };
  }).toEqual({ start: 0, end: 14, focused: true, direction: 'backward' });

  await page.keyboard.type('t');

  await expect.poll(async () => {
    return await demo.readBridgeTextForSemanticLabel(page, 'Type here');
  }).toBe('t');
});
