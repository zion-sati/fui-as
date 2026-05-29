import { TextInput } from "../../src/controls";
import { Application } from "../../src/core/Application";
import { Node } from "../../src/core/Node";
import { EventRouter } from "../../src/core/EventRouter";
import { PointerEventType } from "../../src/core/ffi";
import { activeTheme, defaultDarkTheme } from "../../src/core/Theme";
import {
  CALL_SET_BOX_STYLE,
  CALL_SET_DROP_SHADOW,
  CALL_SET_EDITABLE,
  CALL_SET_FONT,
  CALL_SET_HEIGHT,
  CALL_SET_PADDING,
  CALL_SET_SELECTABLE,
  CALL_SET_SEMANTIC_DISABLED,
  CALL_SET_SEMANTIC_LABEL,
  CALL_SET_TEXT_LIMITS,
  CALL_SET_TEXT_OBSCURED,
  CALL_SET_TEXT_WRAPPING,
  CALL_SET_WIDTH,
  findCall,
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

describe("TextInput appearance", () => {
  afterEach(() => {
    Application.unmount();
    resetTheme();
  });

  it("keeps focus changes off the full theme/layout path", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const input = new TextInput("Existing value");
    input.width(180.0);
    input.build();
    const editorHandle = requireChildHandle(input, 0);
    resetCalls();

    EventRouter.dispatchFocusChanged(editorHandle, true);

    expect<i32>(findCall(CALL_SET_BOX_STYLE)).toBe(-1);
    expect<i32>(findCall(CALL_SET_WIDTH)).toBe(-1);
    expect<i32>(findCall(CALL_SET_HEIGHT)).toBe(-1);
    expect<i32>(findCall(CALL_SET_PADDING)).toBe(-1);
    expect<i32>(findCall(CALL_SET_FONT)).toBe(-1);
    expect<i32>(findCall(CALL_SET_TEXT_WRAPPING)).toBe(-1);

    input.dispose();
  });

  it("hides the focus ring after pointer interaction even when the editor stays focused", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const input = new TextInput();
    input.build();
    const editorHandle = requireChildHandle(input, 0);
    input._handlePointerEvent(PointerEventType.Down, 8.0, 8.0, 0);
    resetCalls();

    EventRouter.dispatchFocusChanged(editorHandle, true);

    expect<i32>(findCall(CALL_SET_DROP_SHADOW)).toBe(-1);

    input.dispose();
  });

  it("supports read-only and password behavior", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const input = new TextInput("secret")
      .readOnly()
      .password()
      .maxChars(12);
    input.build();
    const editorHandle = requireChildHandle(input, 0);

    const editableIndex = lastCallIndexForHandle(CALL_SET_EDITABLE, editorHandle);
    expect<i32>(editableIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(editableIndex, 1)).toBe(0.0);
    const selectableIndex = lastCallIndexForHandle(CALL_SET_SELECTABLE, editorHandle);
    expect<i32>(selectableIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(selectableIndex, 1)).toBe(1.0);
    const obscuredIndex = lastCallIndexForHandle(CALL_SET_TEXT_OBSCURED, editorHandle);
    expect<i32>(obscuredIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(obscuredIndex, 1)).toBe(1.0);
    const limitsIndex = lastCallIndexForHandle(CALL_SET_TEXT_LIMITS, editorHandle);
    expect<i32>(limitsIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(limitsIndex, 1)).toBe(12.0);
    expect<f64>(getCallArg(limitsIndex, 2)).toBe(1.0);

    input.dispose();
  });

  it("disabling the control makes the semantic textbox non-editable and non-selectable", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const input = new TextInput("secret");
    input.build();
    const editorHandle = requireChildHandle(input, 0);
    resetCalls();

    input.enabled(false);

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
    input.enabled(true);

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

    input.dispose();
  });

  it("emits default semantic labels from placeholder and password mode", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const input = new TextInput().placeholder("Search");
    input.build();
    const editorHandle = requireChildHandle(input, 0);
    let labelIndex = lastCallIndexForHandle(CALL_SET_SEMANTIC_LABEL, editorHandle);
    expect<i32>(labelIndex).toBeGreaterThan(-1);

    const passwordInput = new TextInput();
    passwordInput.build();
    const passwordEditorHandle = requireChildHandle(passwordInput, 0);
    resetCalls();
    passwordInput.password();
    labelIndex = lastCallIndexForHandle(CALL_SET_SEMANTIC_LABEL, passwordEditorHandle);
    expect<i32>(labelIndex).toBeGreaterThan(-1);

    input.dispose();
    passwordInput.dispose();
  });
});
