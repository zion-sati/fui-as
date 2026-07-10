import { expect,test } from '@playwright/test';

import * as demo from './demo-test-support';

demo.registerDemoLifecycle(test);

test('advanced controls textarea Home targets the current non-wrapped line before typing on a long line', async ({ page }) => {
  const shortLine = 'short line';
  const longLine = 'W'.repeat(5000);
  const combinedText = `${shortLine}\n${longLine}`;
  const longLineStart = shortLine.length + 1;

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
    return editor === null ? null : {
      tagName: editor.tagName,
      windowed: editor.value.length < combinedText.length,
      bounded: editor.value.length <= 4096,
      absoluteStart: editor.absoluteStart,
      absoluteEnd: editor.absoluteEnd,
    };
  }).toEqual({
    tagName: 'textarea',
    windowed: true,
    bounded: true,
    absoluteStart: combinedText.length,
    absoluteEnd: combinedText.length,
  });

  await page.keyboard.press('Home');
  await expect.poll(async () => {
    const editor = await demo.readHiddenTextEditorState(page);
    return editor === null ? null : {
      absoluteStart: editor.absoluteStart,
      absoluteEnd: editor.absoluteEnd,
      focused: editor.focused,
    };
  }).toEqual({
    absoluteStart: longLineStart,
    absoluteEnd: longLineStart,
    focused: true,
  });

  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => {
    const editor = await demo.readHiddenTextEditorState(page);
    return editor === null ? null : {
      absoluteStart: editor.absoluteStart,
      absoluteEnd: editor.absoluteEnd,
    };
  }).toEqual({
    absoluteStart: longLineStart + 1,
    absoluteEnd: longLineStart + 1,
  });

  await page.keyboard.insertText('~');
  await expect.poll(async () => {
    const editor = await demo.readHiddenTextEditorState(page);
    const sliceStart = editor === null ? 0 : Math.max(0, longLineStart - editor.docStart);
    return editor === null ? null : {
      absoluteStart: editor.absoluteStart,
      absoluteEnd: editor.absoluteEnd,
      valueSlice: editor.value.slice(sliceStart, sliceStart + 3),
    };
  }).toEqual({
    absoluteStart: longLineStart + 2,
    absoluteEnd: longLineStart + 2,
    valueSlice: `${longLine[0]}~${longLine[1]}`,
  });
});

test('advanced controls textarea wrapped first-line edits keep lower lines visually stable', async ({ page }) => {
  const wrappedText = 'Line one\\nLine two\\nLine three\\nLonger content so scrollbar policy is easy to spot.';

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Advanced controls demo text area');

  await demo.clickSemanticLabelAtFraction(page, 'Advanced controls demo text area', 0.25, 0.14);
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(wrappedText);

  await demo.setHiddenTextInputSelection(page, 'Line one'.length);
  await expect.poll(async () => {
    const editor = await demo.readHiddenTextEditorState(page);
    return editor === null ? null : {
      start: editor.start,
      end: editor.end,
      focused: editor.focused,
    };
  }).toEqual({
    start: 'Line one'.length,
    end: 'Line one'.length,
    focused: true,
  });

  const bounds = await demo.findSemanticBounds(page, 'Advanced controls demo text area');
  expect(bounds).not.toBeNull();
  if (bounds === null) {
    return;
  }

  const lowerLinesRegion = {
    x: Math.floor(bounds.x + 8),
    y: Math.floor(bounds.y + 28),
    width: Math.max(32, Math.min(Math.floor(bounds.width - 16), 320)),
    height: Math.max(32, Math.min(Math.floor(bounds.height - 36), 110)),
  };
  const beforeLowerLines = await demo.readSceneRegion(
    page,
    lowerLinesRegion.x,
    lowerLinesRegion.y,
    lowerLinesRegion.width,
    lowerLinesRegion.height,
  );

  await page.keyboard.insertText('t');

  await expect.poll(async () => {
    return await demo.readBridgeTextForSemanticLabel(page, 'Advanced controls demo text area');
  }).toBe('Line onet\\nLine two\\nLine three\\nLonger content so scrollbar policy is easy to spot.');

  const afterLowerLines = await demo.readSceneRegion(
    page,
    lowerLinesRegion.x,
    lowerLinesRegion.y,
    lowerLinesRegion.width,
    lowerLinesRegion.height,
  );
  expect(demo.findChangedPixel(beforeLowerLines, afterLowerLines)).toBeNull();
});

test('advanced controls textarea wrapped keyboard block deletion removes the intended if-block', async ({ page }) => {
  const sourceText = demo.fs.readFileSync(
    demo.path.join(demo.__dirname, '..', '..', 'ui', 'src', 'UiRuntimeText.cpp'),
    'utf8',
  );
  const selectionStart =
    sourceText.lastIndexOf("    if (!node.nonwrap_fragment_cache_valid ||\n        line_index + 1U >= node.nonwrap_fragment_line_offsets.size()) {");
  expect(selectionStart).toBeGreaterThan(5000);
  const selectionEnd = sourceText.indexOf('    const float clamped_x = std::max(aligned_x, 0.0f);', selectionStart);
  expect(selectionEnd).toBeGreaterThan(selectionStart);
  const expectedText = `${sourceText.slice(0, selectionStart)}${sourceText.slice(selectionEnd)}`;

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Wrapping');
  await demo.scrollSemanticLabelIntoView(page, 'Advanced controls demo text area');

  await demo.clickSemanticLabelAtFraction(page, 'Advanced controls demo text area', 0.25, 0.14);
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(sourceText);

  await expect.poll(async () => {
    return await demo.readBridgeTextForSemanticLabel(page, 'Advanced controls demo text area');
  }).toBe(sourceText);

  await page.evaluate((caretIndex) => {
    const runtime = window.EffinDomBrowserBridge?.getRuntime();
    const node = (window.__bridgeSemanticTree ?? []).find((item) =>
      item.label === 'Advanced controls demo text area' ||
      item.label.startsWith('Advanced controls demo text area,'));
    if (runtime === null || runtime === undefined || node === undefined) {
      throw new Error('Expected advanced-controls textbox runtime handle.');
    }
    const ui = runtime.ui;
    const handleArg = ui.usesMemory64 === true ? BigInt(node.handle) : Number(node.handle);
    ui._ui_set_text_selection_range(handleArg, caretIndex, caretIndex);
    runtime.commitFrame();
    runtime.flushPendingCommit();
  }, selectionEnd);

  await expect.poll(async () => {
    const editor = await demo.readHiddenTextEditorState(page);
    return editor === null ? null : {
      absoluteStart: editor.absoluteStart,
      absoluteEnd: editor.absoluteEnd,
      focused: editor.focused,
    };
  }).toEqual({
    absoluteStart: selectionEnd,
    absoluteEnd: selectionEnd,
    focused: true,
  });

  await page.keyboard.press('Shift+ArrowUp');
  await page.keyboard.press('Shift+ArrowUp');
  await page.keyboard.press('Shift+ArrowUp');

  await expect.poll(async () => {
    const editor = await demo.readHiddenTextEditorState(page);
    return editor === null ? null : {
      absoluteStart: editor.absoluteStart,
      absoluteEnd: editor.absoluteEnd,
      focused: editor.focused,
    };
  }).toEqual({
    absoluteStart: selectionStart,
    absoluteEnd: selectionEnd,
    focused: true,
  });

  await page.keyboard.press('Backspace');

  await expect.poll(async () => {
    return await demo.readBridgeTextForSemanticLabel(page, 'Advanced controls demo text area');
  }).toBe(expectedText);

});

test('advanced controls textarea accepts tabs without focus chrome or wrapped-line corruption', async ({ page }) => {
  const lineTwoStart = 'Line one\n'.length;
  const initialText = 'Line one\nLine two\nLine three\nLonger content so scrollbar policy is easy to spot.';
  const expectedText = 'Line one\n\tLine two\nLine three\nLonger content so scrollbar policy is easy to spot.';

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Advanced controls demo text area');

  await demo.clickSemanticLabelAtFraction(page, 'Advanced controls demo text area', 0.25, 0.14);
  await demo.waitForHiddenTextInputFocus(page);

  await expect.poll(async () => {
    return await demo.readBridgeTextForSemanticLabel(page, 'Advanced controls demo text area');
  }).toBe(initialText);

  await demo.setHiddenTextInputSelection(page, lineTwoStart);

  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Backspace');

  await expect.poll(async () => {
    return await demo.readBridgeTextForSemanticLabel(page, 'Advanced controls demo text area');
  }).toBe(expectedText);

  await expect.poll(async () => {
    const editor = await demo.readHiddenTextEditorState(page);
    return editor === null ? null : {
      absoluteStart: editor.absoluteStart,
      absoluteEnd: editor.absoluteEnd,
    };
  }).toEqual({
    absoluteStart: lineTwoStart + 1,
    absoluteEnd: lineTwoStart + 1,
  });

  await demo.setHiddenTextInputSelection(page, 0);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');

  await expect.poll(async () => {
    return await demo.readBridgeTextForSemanticLabel(page, 'Advanced controls demo text area');
  }).toBe(expectedText);

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Advanced controls demo text area');
  await demo.clickSemanticLabelAtFraction(page, 'Advanced controls demo text area', 0.25, 0.14);
  await demo.waitForHiddenTextInputFocus(page);
  await expect.poll(async () => {
    return await demo.readBridgeTextForSemanticLabel(page, 'Advanced controls demo text area');
  }).toBe(initialText);

  await demo.setHiddenTextInputSelection(page, 0);
  await page.keyboard.press('Tab');
  await expect.poll(async () => {
    return await demo.readBridgeTextForSemanticLabel(page, 'Advanced controls demo text area');
  }).toBe(`\t${initialText}`);

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Z' : 'Control+Z');
  await expect.poll(async () => {
    return await demo.readBridgeTextForSemanticLabel(page, 'Advanced controls demo text area');
  }).toBe(initialText);
});

test('debug advanced controls wrapped mouse drag keeps hidden editor selection in sync', async ({ page }) => {
  const sourceText = demo.fs.readFileSync(
    demo.path.join(demo.__dirname, '..', '..', 'ui', 'src', 'UiRuntimeText.cpp'),
    'utf8',
  );

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Wrapping');
  await demo.scrollSemanticLabelIntoView(page, 'Advanced controls demo text area');

  await demo.clickSemanticLabelAtFraction(page, 'Advanced controls demo text area', 0.25, 0.14);
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(sourceText);

  await expect.poll(async () => {
    return await demo.readBridgeTextForSemanticLabel(page, 'Advanced controls demo text area');
  }).toBe(sourceText);

  await demo.dragSemanticLabelBetweenFractions(page, 'Advanced controls demo text area', 0.08, 0.12, 0.45, 0.28);

  await expect.poll(async () => {
    const editor = await demo.readHiddenTextEditorState(page);
    const bridge = await page.evaluate(() => {
      const handle = window.__bridgeActiveEditorWindow?.handle ?? null;
      const selection = handle === null ? null : (window.__bridgeSelectionsByHandle?.[handle] ?? null);
      return {
        handle,
        bridgeStart: selection?.start ?? null,
        bridgeEnd: selection?.end ?? null,
      };
    });
    return {
      ...bridge,
      hiddenStart: editor?.absoluteStart ?? null,
      hiddenEnd: editor?.absoluteEnd ?? null,
      focused: editor?.focused ?? false,
    };
  }).toEqual({
    handle: expect.any(String),
    bridgeStart: expect.any(Number),
    bridgeEnd: expect.any(Number),
    hiddenStart: expect.any(Number),
    hiddenEnd: expect.any(Number),
    focused: true,
  });
});

test('advanced controls textarea inserts a long multiline shard into the middle of a huge non-wrapped document', async ({ page }) => {
  const longLine = 'W'.repeat(5000);
  const insertedLine = 'Z'.repeat(5000);
  const baseLines = Array.from({ length: 10 }, () => longLine);
  const combinedText = baseLines.join('\n');
  const targetLineIndex = 4;
  const targetLineStart = (targetLineIndex * (longLine.length + 1));
  const insertAt = targetLineStart + 2500;
  const insertion = `\n${insertedLine}\n`;
  const expectedText = `${combinedText.slice(0, insertAt)}${insertion}${combinedText.slice(insertAt)}`;

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
    hiddenLength: 4096,
    fullLength: combinedText.length,
    bounded: true,
    absoluteStart: combinedText.length,
    absoluteEnd: combinedText.length,
  });

  await demo.setHiddenTextInputSelection(page, insertAt);
  await expect.poll(async () => {
    const editor = await demo.readHiddenTextEditorState(page);
    return editor === null ? null : {
      absoluteStart: editor.absoluteStart,
      absoluteEnd: editor.absoluteEnd,
      focused: editor.focused,
    };
  }).toEqual({
    absoluteStart: insertAt,
    absoluteEnd: insertAt,
    focused: true,
  });

  await page.keyboard.insertText(insertion);
  await expect.poll(async () => {
    const editor = await demo.readHiddenTextEditorState(page);
    const bridgeText = await demo.readBridgeTextForSemanticLabel(page, 'Advanced controls demo text area');
    return editor === null ? null : {
      windowed: editor.value.length < expectedText.length,
      bounded: editor.value.length <= 4096,
      absoluteStart: editor.absoluteStart,
      absoluteEnd: editor.absoluteEnd,
      insertedSlice: bridgeText?.slice(insertAt - 1, insertAt + insertion.length + 1) ?? null,
    };
  }).toEqual({
    windowed: true,
    bounded: true,
    absoluteStart: insertAt + insertion.length,
    absoluteEnd: insertAt + insertion.length,
    insertedSlice: expectedText.slice(insertAt - 1, insertAt + insertion.length + 1),
  });
});

test('advanced controls textarea Select All plus Backspace clears a windowed Unicode document', async ({ page }) => {
  const unicodeParagraph = [
    '# Variable-Height "jump" frame\u202f1',
    'RecyclerView-style thumb refinement with smart quotes \u201cjump\u201d and dashes \u2014 all UTF-8.',
    'This line keeps the hidden editor windowed while exercising non-ASCII offsets: Variable\u2011Height.',
  ].join('\n');
  const text = Array.from({ length: 80 }, () => unicodeParagraph).join('\n\n');

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Advanced controls demo text area');

  await demo.clickSemanticLabelAtFraction(page, 'Advanced controls demo text area', 0.25, 0.14);
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(text);

  await expect.poll(async () => {
    const editor = await demo.readHiddenTextEditorState(page);
    const bridgeText = await demo.readBridgeTextForSemanticLabel(page, 'Advanced controls demo text area');
    return editor === null ? null : {
      windowed: editor.value.length < text.length,
      bounded: editor.value.length <= 4096,
      bridgeLength: bridgeText?.length ?? -1,
    };
  }).toEqual({
    windowed: true,
    bounded: true,
    bridgeLength: text.length,
  });

  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('Backspace');

  await expect.poll(async () => {
    const editor = await demo.readHiddenTextEditorState(page);
    const bridgeText = await demo.readBridgeTextForSemanticLabel(page, 'Advanced controls demo text area');
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

test('advanced controls textarea keeps absurd non-wrap lines unmutated before later clicks', async ({ page }) => {
  const longLine = 'W'.repeat(3000);
  const threeCopies = longLine.repeat(3);

  const readLineSummary = async () => await page.evaluate(() => {
    const node = (window.__bridgeSemanticTree ?? []).find((item) =>
      item.label === 'Advanced controls demo text area' ||
      item.label.startsWith('Advanced controls demo text area,'));
    const text = node === undefined ? null : (window.__bridgeTextByHandle?.[node.handle] ?? null);
    const lines = text === null ? [] : text.split('\n');
    return {
      lineCount: lines.length,
      firstLineLength: lines[0]?.length ?? null,
      secondLineLength: lines[1]?.length ?? null,
      secondLineText: lines[1] ?? null,
      thirdLineLength: lines[2]?.length ?? null,
    };
  });

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Wrapping');
  await demo.clickSemanticLabel(page, 'Wrapping');
  await demo.scrollSemanticLabelIntoView(page, 'Advanced controls demo text area');

  await demo.clickSemanticLabelAtFraction(page, 'Advanced controls demo text area', 0.25, 0.14);
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('Backspace');
  await page.keyboard.insertText(`${threeCopies}${threeCopies}\ntest\n${threeCopies}`);

  await expect.poll(readLineSummary).toEqual({
    lineCount: 3,
    firstLineLength: 18000,
    secondLineLength: 4,
    secondLineText: 'test',
    thirdLineLength: 9000,
  });
  await demo.clickSemanticLabelAtFraction(page, 'Advanced controls demo text area', 0.5, 0.82);

  await expect.poll(readLineSummary).toEqual({
    lineCount: 3,
    firstLineLength: 18000,
    secondLineLength: 4,
    secondLineText: 'test',
    thirdLineLength: 9000,
  });
});

test('advanced controls textarea clicking the hint does not ghost the first non-wrapped line after a large prepend', async ({ page }) => {
  const longText = 'How Browsers Silently Handle "Unbounded" LinesIf you type or paste a 500,000-character line into a standard DOM <textarea> with line-wrapping disabled (white-space: pre or wrap="off"), the browser engine actively employs optimizations to prevent a freeze:Internal Layout Truncation: While the engine stores the full text string accurately in memory, the layout engine (e.g., Blink) calculates formatting bounds using an integer maximum coordinate space. If a single line\'s layout width in pixels exceeds this coordinate limit, the browser quietly stops shaping and rendering the layout layout-wise, rendering the rest invisible or clipped.Asynchronous Formatting: Text metrics calculation and caret hit-testing are decoupled from the main thread where possible.Aggressive Culling: When a non-wrapping text line overflows horizontally, browsers check the visible bounds of the element. They do not pass the entire 500,000-character line to HarfBuzz in one block; they calculate rough offsets and only shape the text currently inside or just outside the visible viewport.';
  const readLineSummary = async () => await page.evaluate(() => {
    const node = (window.__bridgeSemanticTree ?? []).find((item) =>
      item.label === 'Advanced controls demo text area' ||
      item.label.startsWith('Advanced controls demo text area,'));
    const text = node === undefined ? null : (window.__bridgeTextByHandle?.[node.handle] ?? null);
    const lines = text === null ? [] : text.split('\n');
    return {
      lineCount: lines.length,
      firstLineLength: lines[0]?.length ?? null,
      secondLineText: lines[1] ?? null,
      thirdLineLength: lines[2]?.length ?? null,
      fourthLineLength: lines[3]?.length ?? null,
    };
  });

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Wrapping');
  await demo.clickSemanticLabel(page, 'Wrapping');
  await demo.scrollSemanticLabelIntoView(page, 'Advanced controls demo text area');

  await demo.clickSemanticLabelAtFraction(page, 'Advanced controls demo text area', 0.25, 0.14);
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('Backspace');
  await page.keyboard.insertText(longText.repeat(3));
  await page.keyboard.press('Enter');
  await page.keyboard.insertText('Test');
  await page.keyboard.press('Enter');
  await page.keyboard.insertText(longText.repeat(3));

  await expect.poll(async () => {
    const summary = await readLineSummary();
    return {
      lineCount: summary.lineCount,
      secondLineText: summary.secondLineText,
      fourthLineLength: summary.fourthLineLength,
      sortedLineLengths: [
        summary.firstLineLength,
        summary.thirdLineLength,
      ].sort((left, right) => left - right),
    };
  }).toEqual({
    lineCount: 3,
    secondLineText: 'Test',
    fourthLineLength: null,
    sortedLineLengths: [longText.length * 3, longText.length * 3],
  });

  await demo.clickSemanticLabelAtFraction(page, 'Advanced controls demo text area', 0.75, 0.14);
  await page.keyboard.press('Home');
  await page.keyboard.insertText(longText.repeat(3));

  await expect.poll(async () => {
    const summary = await readLineSummary();
    return {
      lineCount: summary.lineCount,
      secondLineText: summary.secondLineText,
      fourthLineLength: summary.fourthLineLength,
      sortedLineLengths: [
        summary.firstLineLength,
        summary.thirdLineLength,
      ].sort((left, right) => left - right),
    };
  }).toEqual({
    lineCount: 3,
    secondLineText: 'Test',
    fourthLineLength: null,
    sortedLineLengths: [longText.length * 3, longText.length * 6],
  });

  const prependedSummary = await readLineSummary();

  await demo.scrollSemanticLabelIntoView(page, 'Advanced controls hint');
  const textAreaBounds = await demo.findSemanticBounds(page, 'Advanced controls demo text area');
  expect(textAreaBounds).not.toBeNull();
  if (textAreaBounds === null) {
    return;
  }
  const firstLineRegion = {
    x: Math.floor(textAreaBounds.x + 8),
    y: Math.floor(textAreaBounds.y + 8),
    width: Math.max(48, Math.min(Math.floor(textAreaBounds.width - 16), 560)),
    height: 28,
  };
  const beforeHintClick = await demo.readSceneRegion(
    page,
    firstLineRegion.x,
    firstLineRegion.y,
    firstLineRegion.width,
    firstLineRegion.height,
  );

  await demo.clickSemanticLabel(page, 'Advanced controls hint');

  await expect.poll(readLineSummary).toEqual(prependedSummary);

  const afterHintClick = await demo.readSceneRegion(
    page,
    firstLineRegion.x,
    firstLineRegion.y,
    firstLineRegion.width,
    firstLineRegion.height,
  );
  expect(demo.findChangedPixel(beforeHintClick, afterHintClick)).toBeNull();
});

test('advanced controls textarea blank-area clicks focus immediately', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Advanced controls demo text area');

  await demo.clickSemanticLabelAtFraction(page, 'Advanced controls demo text area', 0.5, 0.92);
  await demo.waitForHiddenTextInputFocus(page);

  await expect.poll(async () => await demo.readHiddenInputSelection(page)).toMatchObject({
    focused: true,
  });
});

test('demo touch textbox does not focus hidden editor until pointerup tap', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Type here');
  await expect.poll(async () => {
    return await demo.findSemanticBounds(page, 'Type here');
  }).not.toBeNull();
  const bounds = await demo.findSemanticBounds(page, 'Type here');
  if (bounds === null) {
    throw new Error('Expected textbox bounds for touch activation test.');
  }
  const x = Math.round(bounds.x + Math.min(bounds.width * 0.25, 40));
  const y = Math.round(bounds.y + Math.min(bounds.height * 0.5, 16));

  await demo.dispatchTouchCanvasEvents(page, [
    { type: 'pointerdown', x, y },
  ], 611);

  const duringDown = await demo.readHiddenTextEditorState(page);
  expect(duringDown).not.toBeNull();
  expect(duringDown?.focused).toBe(false);

  await demo.dispatchTouchCanvasEvents(page, [
    { type: 'pointerup', x, y },
  ], 611);
  await demo.waitForHiddenTextInputFocus(page);

  await expect.poll(async () => await demo.readHiddenTextEditorState(page)).toMatchObject({
    focused: true,
  });
});

test('demo touch textbox pointercancel discards pending focus activation', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Type here');
  await expect.poll(async () => {
    return await demo.findSemanticBounds(page, 'Type here');
  }).not.toBeNull();
  const bounds = await demo.findSemanticBounds(page, 'Type here');
  if (bounds === null) {
    throw new Error('Expected textbox bounds for touch cancel test.');
  }
  const x = Math.round(bounds.x + Math.min(bounds.width * 0.25, 40));
  const y = Math.round(bounds.y + Math.min(bounds.height * 0.5, 16));

  await demo.dispatchTouchCanvasEvents(page, [
    { type: 'pointerdown', x, y },
    { type: 'pointercancel', x, y },
  ], 612);

  await expect.poll(async () => await demo.readHiddenTextEditorState(page)).toMatchObject({
    focused: false,
  });
});

test('advanced controls textarea arrow keys stay on text editing instead of scrolling the route', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Advanced controls demo text area');

  await demo.clickSemanticLabelAtFraction(page, 'Advanced controls demo text area', 0.25, 0.14);
  await demo.waitForHiddenTextInputFocus(page);

  const beforeSelection = await demo.readHiddenInputSelection(page);
  expect(beforeSelection).not.toBeNull();
  const beforeScrollCount = await page.evaluate(() => window.__bridgeLogs?.scrollEvents.length ?? 0);

  await page.keyboard.press('ArrowDown');

  await expect.poll(async () => await demo.readHiddenInputSelection(page)).not.toMatchObject({
    start: beforeSelection?.start ?? -1,
    end: beforeSelection?.end ?? -1,
  });
  await expect.poll(async () => await page.evaluate(() => window.__bridgeLogs?.scrollEvents.length ?? 0)).toBe(beforeScrollCount);
});

test('advanced controls textarea arrow navigation scrolls the caret into view when it moves below the viewport', async ({ page }) => {
  const lines = Array.from({ length: 30 }, (_, index) => `Line ${String(index + 1)}`);
  const combinedText = lines.join('\n');
  const targetIndex = lines.slice(0, 20).reduce((offset, line) => offset + line.length + 1, 0);

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Advanced controls demo text area');

  await demo.clickSemanticLabelAtFraction(page, 'Advanced controls demo text area', 0.25, 0.14);
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(combinedText);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('ArrowLeft');

  await page.evaluate(() => {
    if (window.__bridgeLogs !== undefined) {
      window.__bridgeLogs.scrollEvents.length = 0;
    }
  });

  for (let index = 0; index < 20; index += 1) {
    await page.keyboard.press('ArrowDown');
  }

  await expect.poll(async () => {
    const editor = await demo.readHiddenTextEditorState(page);
    const scrolled = await page.evaluate(() => {
      const events = window.__bridgeLogs?.scrollEvents ?? [];
      return events.some((event) => event.offsetY > 0 && event.contentHeight > event.viewportHeight);
    });
    return editor === null ? null : {
      absoluteStart: editor.absoluteStart,
      absoluteEnd: editor.absoluteEnd,
      scrolled,
    };
  }).toEqual({
    absoluteStart: targetIndex,
    absoluteEnd: targetIndex,
    scrolled: true,
  });
});

test('advanced controls textarea blank clicks below the last line place the caret at the document end', async ({ page }) => {
  const text = 'Line one';

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Advanced controls demo text area');

  await demo.clickSemanticLabelAtFraction(page, 'Advanced controls demo text area', 0.25, 0.14);
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(text);

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

  await demo.hoverSemanticLabelAtFraction(page, 'Advanced controls demo text area', 0.5, 0.82);
  await expect.poll(async () => {
    return await page.locator('#fui-canvas').evaluate((element) => getComputedStyle(element).cursor);
  }).toBe('text');

  await demo.clickSemanticLabelAtFraction(page, 'Advanced controls demo text area', 0.5, 0.82);

  await expect.poll(async () => {
    const editor = await demo.readHiddenTextEditorState(page);
    return editor === null ? null : {
      absoluteStart: editor.absoluteStart,
      absoluteEnd: editor.absoluteEnd,
      focused: editor.focused,
    };
  }).toEqual({
    absoluteStart: text.length,
    absoluteEnd: text.length,
    focused: true,
  });
});

test('advanced controls textarea scrollbar gutter keeps the default cursor', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Advanced controls demo text area');
  const textBounds = await demo.findSemanticBounds(page, 'Advanced controls demo text area');
  expect(textBounds).not.toBeNull();
  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  const probeX = (canvasBox?.x ?? 0) + (textBounds?.x ?? 0) + ((textBounds?.width ?? 0) * 1.035);
  const probeY = (canvasBox?.y ?? 0) + (textBounds?.y ?? 0) + ((textBounds?.height ?? 0) * 0.5);

  await page.mouse.move(probeX, probeY);
  await expect.poll(async () => {
    return await page.locator('#fui-canvas').evaluate((element) => getComputedStyle(element).cursor);
  }).toBe('default');
});

test('advanced controls textarea padding clicks keep the real text active and collapse to the document end', async ({ page }) => {
  const placeholder = 'Type notes here. Use the toggles below to reconfigure the control live.';
  const text = 'Line one\nLine two';

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Advanced controls demo text area');

  await demo.clickSemanticLabelAtFraction(page, 'Advanced controls demo text area', 0.25, 0.14);
  await demo.waitForHiddenTextInputFocus(page);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(text);
  const textBounds = await demo.findSemanticBounds(page, 'Advanced controls demo text area');
  expect(textBounds).not.toBeNull();
  if (textBounds === null) {
    throw new Error('Expected text area bounds.');
  }
  const focusRingProbe = await demo.readSceneRegion(
    page,
    Math.max(0, Math.floor(textBounds.x) - 4),
    Math.max(0, Math.floor(textBounds.y) - 4),
    Math.ceil(textBounds.width) + 8,
    4,
  );

  await demo.clickSemanticLabelAtFraction(page, 'Advanced controls demo text area', 0.92, 0.86);
  const afterPaddingClickFocusRingProbe = await demo.readSceneRegion(
    page,
    Math.max(0, Math.floor(textBounds.x) - 4),
    Math.max(0, Math.floor(textBounds.y) - 4),
    Math.ceil(textBounds.width) + 8,
    4,
  );

  await expect.poll(async () => {
    const editor = await demo.readHiddenTextEditorState(page);
    const placeholderBounds = await demo.findSemanticBounds(page, placeholder);
    return editor === null ? null : {
      value: editor.value,
      absoluteStart: editor.absoluteStart,
      absoluteEnd: editor.absoluteEnd,
      placeholderVisible: placeholderBounds !== null,
    };
  }).toEqual({
    value: text,
    absoluteStart: text.length,
    absoluteEnd: text.length,
    placeholderVisible: false,
  });
  expect(demo.findChangedPixel(focusRingProbe, afterPaddingClickFocusRingProbe)).toBeNull();

  await page.keyboard.type('!');

  await expect.poll(async () => {
    const editor = await demo.readHiddenTextEditorState(page);
    return editor === null ? null : {
      value: editor.value,
      absoluteStart: editor.absoluteStart,
      absoluteEnd: editor.absoluteEnd,
    };
  }).toEqual({
    value: `${text}!`,
    absoluteStart: text.length + 1,
    absoluteEnd: text.length + 1,
  });
});
