import * as ui from "../../src/bindings/ui";
import { TextArea } from "../../src/controls";
import { Application } from "../../src/core/Application";
import { Node } from "../../src/core/Node";
import { EventRouter } from "../../src/core/EventRouter";
import { activeTheme, defaultDarkTheme } from "../../src/core/Theme";
import { FlexBox, ScrollBarVisibility, ScrollBox } from "../../src/nodes";
import {
  CALL_SET_EDITABLE,
  CALL_SET_LINE_HEIGHT,
  CALL_SET_SELECTABLE,
  CALL_SET_SEMANTIC_DISABLED,
  CALL_SET_TEXT_WRAPPING,
  getCallArg,
  getCallSequence,
  resetCalls,
} from "./FfiTestImports";

function requireChild<T>(node: Node, index: i32): T {
  return node.getChildAt(index)! as T;
}

function requireChildHandle(node: Node, index: i32): u64 {
  return requireChild<Node>(node, index).builtHandle;
}

function resetTheme(): void {
  activeTheme.value = defaultDarkTheme;
}

function lastCallIndexForHandle(op: i32, handle: u64): i32 {
  const sequence = getCallSequence();
  let index = -1;
  for (let i = 0; i < sequence.length; ++i) {
    if (unchecked(sequence[i]) != op) {
      continue;
    }
    if (getCallArg(i, 0) == <f64>handle) {
      index = i;
    }
  }
  return index;
}

describe("TextArea layout", () => {
  afterEach(() => {
    Application.unmount();
    resetTheme();
  });

  it("can disable wrapping and surface always-on scroll chrome", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();
    ui.resizeWindow(320.0, 240.0);

    const input = new TextArea("Wide multiline content");
    input.width(220.0);
    input.height(120.0);
    input.wrapping(false);
    input.verticalScrollbarVisibility(ScrollBarVisibility.Always);
    input.horizontalScrollbarVisibility(ScrollBarVisibility.Always);
    const root = new FlexBox()
      .width(320.0)
      .height(240.0)
      .child(input);

    Application.mount(root);
    ui.commitFrame();

    const scrollBox = requireChild<ScrollBox>(input, 0);
    const editorHandle = requireChildHandle(scrollBox.viewport, 0);
    const wrappingIndex = lastCallIndexForHandle(CALL_SET_TEXT_WRAPPING, editorHandle);
    expect<i32>(wrappingIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(wrappingIndex, 1)).toBe(0.0);

    const verticalBounds = ui.tryGetBounds(scrollBox.verticalScrollBar.render().builtHandle);
    const horizontalBounds = ui.tryGetBounds(scrollBox.horizontalScrollBar.render().builtHandle);
    if (verticalBounds !== null) {
      expect<f32>(verticalBounds[2]).toBeGreaterThan(0.0);
    }
    if (horizontalBounds !== null) {
      expect<f32>(horizontalBounds[3]).toBeGreaterThan(0.0);
    }

    input.dispose();
  });

  it("read-only mode keeps the internal editor non-editable", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const input = new TextArea("Read only notes")
      .readOnly()
      .placeholder("Notes");
    input.build();
    const scrollBox = requireChild<ScrollBox>(input, 0);
    const editorHandle = requireChildHandle(scrollBox.viewport, 0);

    const editableIndex = lastCallIndexForHandle(CALL_SET_EDITABLE, editorHandle);
    expect<i32>(editableIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(editableIndex, 1)).toBe(0.0);
    const selectableIndex = lastCallIndexForHandle(CALL_SET_SELECTABLE, editorHandle);
    expect<i32>(selectableIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(selectableIndex, 1)).toBe(1.0);

    input.dispose();
  });

  it("inherits disabled state onto the semantic textbox editor", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const parent = new FlexBox();
    const input = new TextArea("Disabled notes");
    parent.child(input);
    parent.build();
    const scrollBox = requireChild<ScrollBox>(input, 0);
    const editorHandle = requireChildHandle(scrollBox.viewport, 0);
    resetCalls();

    parent.enabled(false);

    let index = lastCallIndexForHandle(CALL_SET_EDITABLE, editorHandle);
    expect<i32>(index).toBeGreaterThan(-1);
    expect<f64>(getCallArg(index, 1)).toBe(0.0);

    index = lastCallIndexForHandle(CALL_SET_SELECTABLE, editorHandle);
    expect<i32>(index).toBeGreaterThan(-1);
    expect<f64>(getCallArg(index, 1)).toBe(0.0);

    index = lastCallIndexForHandle(CALL_SET_SEMANTIC_DISABLED, editorHandle);
    expect<i32>(index).toBeGreaterThan(-1);
    expect<f64>(getCallArg(index, 1)).toBe(1.0);
    expect<f64>(getCallArg(index, 2)).toBe(1.0);

    resetCalls();
    parent.enabled(true);

    index = lastCallIndexForHandle(CALL_SET_EDITABLE, editorHandle);
    expect<i32>(index).toBeGreaterThan(-1);
    expect<f64>(getCallArg(index, 1)).toBe(1.0);

    index = lastCallIndexForHandle(CALL_SET_SELECTABLE, editorHandle);
    expect<i32>(index).toBeGreaterThan(-1);
    expect<f64>(getCallArg(index, 1)).toBe(1.0);

    index = lastCallIndexForHandle(CALL_SET_SEMANTIC_DISABLED, editorHandle);
    expect<i32>(index).toBeGreaterThan(-1);
    expect<f64>(getCallArg(index, 1)).toBe(1.0);
    expect<f64>(getCallArg(index, 2)).toBe(0.0);

    parent.dispose();
  });

  it("forwards explicit line height to editor and placeholder text", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const input = new TextArea().placeholder("Placeholder");
    input.lineHeight(26.0);
    input.build();
    const scrollBox = requireChild<ScrollBox>(input, 0);
    const editorHandle = requireChildHandle(scrollBox.viewport, 0);
    const placeholderHost = requireChild<Node>(input, 1);
    const placeholderHandle = requireChildHandle(placeholderHost, 0);

    const editorLineHeightIndex = lastCallIndexForHandle(CALL_SET_LINE_HEIGHT, editorHandle);
    expect<i32>(editorLineHeightIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(editorLineHeightIndex, 1)).toBe(26.0);

    const placeholderLineHeightIndex = lastCallIndexForHandle(CALL_SET_LINE_HEIGHT, placeholderHandle);
    expect<i32>(placeholderLineHeightIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(placeholderLineHeightIndex, 1)).toBe(26.0);

    input.dispose();
  });
});
