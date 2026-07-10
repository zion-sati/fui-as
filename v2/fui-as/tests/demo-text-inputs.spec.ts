import { expect, test } from '@playwright/test';

import { parseGlyphRuns } from './command-buffer';
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
    return await page.evaluate(() => window.__fuiError ?? null);
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

test('demo password input double-click selects the obscured field and blocks copy', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Password input');

  await demo.clickSemanticLabel(page, 'Password input');
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type('secret-word');

  const bounds = await demo.findSemanticBounds(page, 'Password input');
  expect(bounds).not.toBeNull();
  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  if (bounds === null || canvasBox === null) {
    throw new Error('Expected password input bounds.');
  }

  await page.mouse.dblclick(
    Math.floor(canvasBox.x + bounds.x + (bounds.width * 0.78)),
    Math.floor(canvasBox.y + bounds.y + (bounds.height * 0.5)),
  );

  await expect.poll(async () => {
    const selection = await demo.readHiddenInputSelection(page);
    return selection === null ? null : {
      start: selection.start,
      end: selection.end,
      focused: selection.focused,
    };
  }).toEqual({ start: 0, end: 'secret-word'.length, focused: true });

  await page.evaluate(() => {
    if (window.__bridgeLogs !== undefined) {
      window.__bridgeLogs.clipboardWrites.length = 0;
    }
  });
  await page.keyboard.press('ControlOrMeta+C');
  await expect.poll(async () => {
    return await page.evaluate(() => window.__bridgeLogs?.clipboardWrites ?? []);
  }).toEqual([]);
});

test('demo text input tofu-swaps CJK text through managed harness missing coverage', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?debug-logs=1`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Type here');

  await page.evaluate(() => {
    const runtime = window.EffinDomBrowserBridge?.getRuntime();
    if (runtime === null || runtime === undefined) {
      return;
    }
    const target = window as typeof window & {
      __tofuSwapCommandBuffers?: number[][];
      __tofuSwapCommandBufferCaptureInstalled?: boolean;
    };
    if (target.__tofuSwapCommandBufferCaptureInstalled === true) {
      return;
    }
    target.__tofuSwapCommandBufferCaptureInstalled = true;
    target.__tofuSwapCommandBuffers = [];
    const capture = (): void => {
      const buffers = target.__tofuSwapCommandBuffers;
      if (buffers !== undefined) {
        buffers.push(Array.from(runtime.extractCommandBuffer()));
      }
    };
    const originalCommitFrame = runtime.commitFrame.bind(runtime);
    runtime.commitFrame = (...args: Parameters<typeof runtime.commitFrame>) => {
      originalCommitFrame(...args);
      capture();
    };
    const originalFlushPendingCommit = runtime.flushPendingCommit.bind(runtime);
    runtime.flushPendingCommit = (...args: Parameters<typeof runtime.flushPendingCommit>) => {
      const result = originalFlushPendingCommit(...args);
      capture();
      return result;
    };
  });

  await demo.clickSemanticLabel(page, 'Type here');
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('我想睡觉');
  const activeEditorHandle = await page.evaluate(() => window.__bridgeActiveEditorWindow?.handle ?? null);
  expect(activeEditorHandle).not.toBeNull();

  await expect.poll(async () => {
    return await demo.readBridgeTextForSemanticLabel(page, 'Type here');
  }).toBe('我想睡觉');
  await expect.poll(async () => {
    return await page.evaluate(() => {
      const bridge = window.EffinDomBrowserBridge;
      if (bridge === undefined) {
        return [];
      }
      const runtime = bridge.getRuntime();
      if (runtime === null) {
        return [];
      }
      const state = runtime.getIncrementalFontState(1);
      return state === null ? [] : state.appliedSegmentIds;
    });
  }, { timeout: 15000 }).toEqual(expect.arrayContaining([expect.stringMatching(/^cjk-sc:/)]));
  await expect.poll(async () => {
    return await page.evaluate(() => {
      const logs = window.__bridgeLogs;
      return logs === undefined
        ? false
        : logs.missingFontCoverageRequests.some((entry) => entry.sampleText.includes('我想睡觉'));
    });
  }).toBe(true);
  await expect.poll(async () => {
    const buffers = await page.evaluate(() =>
      ((window as typeof window & { __tofuSwapCommandBuffers?: number[][] }).__tofuSwapCommandBuffers ?? [])
    );
    return buffers.some((commandWords) => {
      const glyphFontIds = parseGlyphRuns(commandWords)
        .filter((run) => run.handle.toString() === activeEditorHandle)
        .flatMap((run) => run.glyphFontIds);
      return glyphFontIds.some((fontId) => fontId !== 1);
    });
  }, { timeout: 15000 }).toBe(true);
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

test('demo CJK text input remains byte-aligned across overflow refocus and deletion', async ({ page }) => {
  const text = '我想睡觉'.repeat(32);

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Type here');

  await demo.clickSemanticLabel(page, 'Type here');
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(text);

  await demo.clickSemanticLabel(page, 'Password input');
  await demo.waitForHiddenTextInputFocus(page);
  await demo.clickSemanticLabel(page, 'Type here');
  await demo.waitForHiddenTextInputFocus(page);

  await expect.poll(async () => {
    return await demo.readBridgeTextForSemanticLabel(page, 'Type here');
  }).toBe(text);

  for (let index = 0; index < 4; index += 1) {
    await page.keyboard.press('Backspace');
  }

  await expect.poll(async () => {
    return await demo.readBridgeTextForSemanticLabel(page, 'Type here');
  }).toBe(text.slice(0, -4));

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

test('demo CJK text input keeps fallback glyphs after long-line middle insertion', async ({ page }) => {
  const prefix = '我想睡觉'.repeat(24);
  const insertion = '你好朋友';
  const expected = `${prefix.slice(0, 48)}${insertion}${prefix.slice(48)}`;

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?debug-logs=1`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Type here');

  await page.evaluate(() => {
    const runtime = window.EffinDomBrowserBridge?.getRuntime();
    if (runtime === null || runtime === undefined) {
      return;
    }
    const target = window as typeof window & {
      __longCjkCommandBuffers?: number[][];
      __longCjkCommandBufferCaptureInstalled?: boolean;
    };
    if (target.__longCjkCommandBufferCaptureInstalled === true) {
      return;
    }
    target.__longCjkCommandBufferCaptureInstalled = true;
    target.__longCjkCommandBuffers = [];
    const capture = (): void => {
      const buffers = target.__longCjkCommandBuffers;
      if (buffers !== undefined) {
        buffers.push(Array.from(runtime.extractCommandBuffer()));
      }
    };
    const originalCommitFrame = runtime.commitFrame.bind(runtime);
    runtime.commitFrame = (...args: Parameters<typeof runtime.commitFrame>) => {
      originalCommitFrame(...args);
      capture();
    };
    const originalFlushPendingCommit = runtime.flushPendingCommit.bind(runtime);
    runtime.flushPendingCommit = (...args: Parameters<typeof runtime.flushPendingCommit>) => {
      const result = originalFlushPendingCommit(...args);
      capture();
      return result;
    };
  });

  await demo.clickSemanticLabel(page, 'Type here');
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(prefix);

  await expect.poll(async () => await demo.readBridgeTextForSemanticLabel(page, 'Type here')).toBe(prefix);
  await expect.poll(async () => {
    return await page.evaluate(() => {
      const state = window.EffinDomBrowserBridge?.getRuntime()?.getIncrementalFontState(1) ?? null;
      return state === null ? [] : state.appliedSegmentIds;
    });
  }, { timeout: 15000 }).toEqual(expect.arrayContaining([expect.stringMatching(/^cjk-sc:/)]));

  await demo.setHiddenTextInputSelection(page, 48, 48);
  await page.keyboard.insertText(insertion);

  const activeEditorHandle = await page.evaluate(() => window.__bridgeActiveEditorWindow?.handle ?? null);
  expect(activeEditorHandle).not.toBeNull();
  await expect.poll(async () => await demo.readBridgeTextForSemanticLabel(page, 'Type here')).toBe(expected);

  await expect.poll(async () => {
    const buffers = await page.evaluate(() =>
      ((window as typeof window & { __longCjkCommandBuffers?: number[][] }).__longCjkCommandBuffers ?? [])
    );
    for (let bufferIndex = buffers.length - 1; bufferIndex >= 0; bufferIndex -= 1) {
      const glyphFontIds = parseGlyphRuns(buffers[bufferIndex])
        .filter((run) => run.handle.toString() === activeEditorHandle)
        .flatMap((run) => run.glyphFontIds);
      if (glyphFontIds.length > 0) {
        return glyphFontIds.every((fontId) => fontId !== 1);
      }
    }
    return false;
  }, { timeout: 15000 }).toBe(true);
});

test('demo CJK text input keeps fallback glyphs after refocus and continued middle typing', async ({ page }) => {
  const baseText = '我想睡觉'.repeat(24);
  const insertion = '你好朋友再见世界';
  const insertionIndex = 52;
  const expected = `${baseText.slice(0, insertionIndex)}${insertion}${baseText.slice(insertionIndex)}`;

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html?debug-logs=1`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Type here');

  await page.evaluate(() => {
    const runtime = window.EffinDomBrowserBridge?.getRuntime();
    if (runtime === null || runtime === undefined) {
      return;
    }
    runtime.setIncrementalFontPolicy({ maxCachedShardFonts: 1 });
    const target = window as typeof window & {
      __refocusCjkCommandBuffers?: number[][];
      __refocusCjkCommandBufferCaptureInstalled?: boolean;
    };
    if (target.__refocusCjkCommandBufferCaptureInstalled === true) {
      return;
    }
    target.__refocusCjkCommandBufferCaptureInstalled = true;
    target.__refocusCjkCommandBuffers = [];
    const capture = (): void => {
      const buffers = target.__refocusCjkCommandBuffers;
      if (buffers !== undefined) {
        buffers.push(Array.from(runtime.extractCommandBuffer()));
      }
    };
    const originalCommitFrame = runtime.commitFrame.bind(runtime);
    runtime.commitFrame = (...args: Parameters<typeof runtime.commitFrame>) => {
      originalCommitFrame(...args);
      capture();
    };
    const originalFlushPendingCommit = runtime.flushPendingCommit.bind(runtime);
    runtime.flushPendingCommit = (...args: Parameters<typeof runtime.flushPendingCommit>) => {
      const result = originalFlushPendingCommit(...args);
      capture();
      return result;
    };
  });

  await demo.clickSemanticLabel(page, 'Type here');
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(baseText);

  await expect.poll(async () => await demo.readBridgeTextForSemanticLabel(page, 'Type here')).toBe(baseText);
  await expect.poll(async () => {
    return await page.evaluate(() => {
      const state = window.EffinDomBrowserBridge?.getRuntime()?.getIncrementalFontState(1) ?? null;
      return state === null ? [] : state.appliedSegmentIds;
    });
  }, { timeout: 15000 }).toEqual(expect.arrayContaining([expect.stringMatching(/^cjk-sc:/)]));

  await demo.clickSemanticLabel(page, 'Password input');
  await demo.waitForHiddenTextInputFocus(page);
  await demo.clickSemanticLabel(page, 'Type here');
  await demo.waitForHiddenTextInputFocus(page);
  const insertionByteOffset = new TextEncoder().encode(baseText.slice(0, insertionIndex)).length;
  await page.evaluate(({ byteOffset, codeUnitOffset }) => {
    const runtime = window.EffinDomBrowserBridge?.getRuntime();
    const activeEditorWindow = window.__bridgeActiveEditorWindow;
    const handle = activeEditorWindow?.handle ?? null;
    const editor = document.querySelector<HTMLInputElement>('input[data-effindom-hidden-editor="true"]');
    if (runtime === null || runtime === undefined || handle === null || editor === null) {
      throw new Error('Expected focused hidden text editor.');
    }
    const handleArg = runtime.ui.usesMemory64 === true ? BigInt(handle) : Number(handle);
    runtime.ui._ui_set_text_selection_range(handleArg, byteOffset, byteOffset);
    runtime.commitFrame();
    runtime.flushPendingCommit();
    editor.focus();
    editor.setSelectionRange(codeUnitOffset, codeUnitOffset, 'none');
  }, { byteOffset: insertionByteOffset, codeUnitOffset: insertionIndex });
  for (const character of insertion) {
    await page.keyboard.insertText(character);
  }

  const activeEditorHandle = await page.evaluate(() => window.__bridgeActiveEditorWindow?.handle ?? null);
  expect(activeEditorHandle).not.toBeNull();
  await expect.poll(async () => await demo.readBridgeTextForSemanticLabel(page, 'Type here')).toBe(expected);

  await expect.poll(async () => {
    const buffers = await page.evaluate(() =>
      ((window as typeof window & { __refocusCjkCommandBuffers?: number[][] }).__refocusCjkCommandBuffers ?? [])
    );
    for (let bufferIndex = buffers.length - 1; bufferIndex >= 0; bufferIndex -= 1) {
      const glyphFontIds = parseGlyphRuns(buffers[bufferIndex])
        .filter((run) => run.handle.toString() === activeEditorHandle)
        .flatMap((run) => run.glyphFontIds);
      if (glyphFontIds.length > 0) {
        return glyphFontIds.every((fontId) => fontId !== 1);
      }
    }
    return false;
  }, { timeout: 15000 }).toBe(true);
  await expect.poll(async () => {
    return await page.evaluate((value) => {
      const runtime = window.EffinDomBrowserBridge?.getRuntime();
      if (runtime === null || runtime === undefined) {
        return false;
      }
      const cache = runtime.getIncrementalFontCacheState();
      const requiredChars = Array.from(new Set(Array.from(value)));
      return cache.cachedShardCount <= 1
        && cache.evictedShardKeys.length > 0
        && cache.cachedShardKeys.some((segmentId) =>
          segmentId.startsWith('cjk-sc:') && requiredChars.every((char) => segmentId.includes(char)));
    }, expected);
  }, { timeout: 15000 }).toBe(true);
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
