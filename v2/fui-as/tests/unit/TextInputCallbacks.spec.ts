import { TextInput } from "../../src/controls";
import { Application } from "../../src/core/Application";
import { FocusChangedEventArgs, Node, SelectionChangedEventArgs, TextChangedEventArgs } from "../../src/core/Node";
import { EventRouter } from "../../src/core/EventRouter";
import { KeyEventType, KeyModifier, PointerEventType } from "../../src/core/ffi";
import { keyboardFocusVisible, showKeyboardFocusForPointerEvent } from "../../src/core/FocusVisibility";
import { activeTheme, defaultDarkTheme } from "../../src/core/Theme";
import { __fui_on_selection_changed, __fui_on_text_changed, __fui_on_text_replaced, __fui_text_buffer } from "../../src/core/event_exports";
import { CALL_SET_TEXT_SELECTION_RANGE, getCallArg, getCallSequence, resetCalls } from "./FfiTestImports";

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

let textInputChangedValue = "";
let textInputFocusChangedCount = 0;
let textInputSelectionStart = 0;
let textInputSelectionEnd = 0;

function handleTextInputChanged(event: TextChangedEventArgs): void {
  textInputChangedValue = event.text;
}

function handleTextInputSelectionChanged(event: SelectionChangedEventArgs): void {
  textInputSelectionStart = event.start;
  textInputSelectionEnd = event.end;
}

function handleTextInputFocusChanged(_event: FocusChangedEventArgs): void {
  textInputFocusChangedCount += 1;
}

describe("TextInput callbacks", () => {
  afterEach(() => {
    Application.unmount();
    resetTheme();
  });

  it("forwards text, selection, and focus callbacks from the internal editor", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    textInputChangedValue = "";
    textInputFocusChangedCount = 0;
    textInputSelectionStart = 0;
    textInputSelectionEnd = 0;
    const input = new TextInput()
      .onChanged(handleTextInputChanged)
      .onSelectionChanged(handleTextInputSelectionChanged)
      .onFocusChanged(handleTextInputFocusChanged);
    input.build();
    const editorHandle = requireChildHandle(input, 0);

    EventRouter.dispatchFocusChanged(editorHandle, true);
    const encoded = Uint8Array.wrap(String.UTF8.encode("hello", false));
    const textBufferPtr = __fui_text_buffer();
    memory.copy(textBufferPtr, encoded.dataStart, encoded.length);
    __fui_on_text_changed(editorHandle, textBufferPtr, <u32>encoded.length);
    __fui_on_selection_changed(editorHandle, 1, 4);

    expect<i32>(textInputFocusChangedCount).toBe(1);
    expect<string>(input.value).toBe("hello");
    expect<string>(textInputChangedValue).toBe("hello");
    expect<u32>(input.selectionStart).toBe(1);
    expect<u32>(input.selectionEnd).toBe(4);
    expect<i32>(textInputSelectionStart).toBe(1);
    expect<i32>(textInputSelectionEnd).toBe(4);

    input.dispose();
  });

  it("reports selection callbacks as character indices instead of UTF-8 byte offsets", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    textInputSelectionStart = 0;
    textInputSelectionEnd = 0;
    const input = new TextInput("Aé😊Z")
      .onSelectionChanged(handleTextInputSelectionChanged);
    input.build();
    const editorHandle = requireChildHandle(input, 0);

    __fui_on_selection_changed(editorHandle, 1, 7);

    expect<u32>(input.selectionStart).toBe(1);
    expect<u32>(input.selectionEnd).toBe(3);
    expect<i32>(textInputSelectionStart).toBe(1);
    expect<i32>(textInputSelectionEnd).toBe(3);

    input.dispose();
  });

  it("applies incremental text replacements from the internal editor", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    textInputChangedValue = "";
    textInputSelectionStart = 0;
    textInputSelectionEnd = 0;
    const input = new TextInput("Line one")
      .onChanged(handleTextInputChanged)
      .onSelectionChanged(handleTextInputSelectionChanged);
    input.build();
    const editorHandle = requireChildHandle(input, 0);

    const encoded = Uint8Array.wrap(String.UTF8.encode("one", false));
    const textBufferPtr = __fui_text_buffer();
    memory.copy(textBufferPtr, encoded.dataStart, encoded.length);
    __fui_on_text_replaced(editorHandle, 8, 8, textBufferPtr, <u32>encoded.length);
    __fui_on_selection_changed(editorHandle, 11, 11);

    expect<string>(input.value).toBe("Line oneone");
    expect<string>(textInputChangedValue).toBe("Line oneone");
    expect<u32>(input.selectionStart).toBe(11);
    expect<u32>(input.selectionEnd).toBe(11);
    expect<i32>(textInputSelectionStart).toBe(11);
    expect<i32>(textInputSelectionEnd).toBe(11);

    input.dispose();
  });

  it("optionally accepts plain Tab as text while preserving Shift+Tab traversal", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    textInputChangedValue = "";
    textInputSelectionStart = 0;
    textInputSelectionEnd = 0;
    const input = new TextInput("ab")
      .selectionRange(1, 1)
      .onChanged(handleTextInputChanged)
      .onSelectionChanged(handleTextInputSelectionChanged);
    input.build();
    const editorHandle = requireChildHandle(input, 0);

    EventRouter.dispatchFocusChanged(editorHandle, true);
    expect<bool>(EventRouter.dispatchKeyEvent(editorHandle, KeyEventType.Down, "Tab", 0)).toBe(false);
    expect<string>(input.value).toBe("ab");
    expect<bool>(EventRouter.dispatchKeyEvent(editorHandle, KeyEventType.Down, "ArrowDown", 0)).toBe(true);
    expect<bool>(EventRouter.dispatchKeyEvent(editorHandle, KeyEventType.Down, "ArrowLeft", <u32>KeyModifier.Shift)).toBe(true);
    expect<bool>(EventRouter.dispatchKeyEvent(editorHandle, KeyEventType.Down, "Home", 0)).toBe(true);
    expect<bool>(EventRouter.dispatchKeyEvent(editorHandle, KeyEventType.Down, "PageDown", 0)).toBe(true);
    expect<string>(input.value).toBe("ab");

    input.acceptsTab(true);
    showKeyboardFocusForPointerEvent(PointerEventType.Down);
    expect<bool>(EventRouter.dispatchKeyEvent(editorHandle, KeyEventType.Down, "Tab", 0)).toBe(true);
    expect<bool>(keyboardFocusVisible.value).toBe(false);
    expect<string>(input.value).toBe("a\tb");
    expect<string>(textInputChangedValue).toBe("a\tb");
    expect<u32>(input.selectionStart).toBe(2);
    expect<u32>(input.selectionEnd).toBe(2);
    expect<i32>(textInputSelectionStart).toBe(2);
    expect<i32>(textInputSelectionEnd).toBe(2);

    expect<bool>(EventRouter.dispatchKeyEvent(editorHandle, KeyEventType.Down, "Tab", <u32>KeyModifier.Shift)).toBe(false);
    expect<string>(input.value).toBe("a\tb");

    input.dispose();
  });

  it("can programmatically move the caret and selection range", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const input = new TextInput("Melbourne");
    input.build();
    const editorHandle = requireChildHandle(input, 0);
    resetCalls();

    input.selectionRange(1, 4);
    let selectionRangeIndex = lastCallIndexForHandle(CALL_SET_TEXT_SELECTION_RANGE, editorHandle);
    expect<i32>(selectionRangeIndex).toBeGreaterThan(-1);
    expect<u32>(input.selectionStart).toBe(1);
    expect<u32>(input.selectionEnd).toBe(4);
    expect<f64>(getCallArg(selectionRangeIndex, 1)).toBe(1.0);
    expect<f64>(getCallArg(selectionRangeIndex, 2)).toBe(4.0);

    input.caretToEnd();
    selectionRangeIndex = lastCallIndexForHandle(CALL_SET_TEXT_SELECTION_RANGE, editorHandle);
    expect<i32>(selectionRangeIndex).toBeGreaterThan(-1);
    expect<u32>(input.selectionStart).toBe(9);
    expect<u32>(input.selectionEnd).toBe(9);
    expect<f64>(getCallArg(selectionRangeIndex, 1)).toBe(9.0);
    expect<f64>(getCallArg(selectionRangeIndex, 2)).toBe(9.0);

    input.dispose();
  });

  it("accepts character indices for programmatic caret and selection ranges", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const input = new TextInput("Aé😊Z");
    input.build();
    const editorHandle = requireChildHandle(input, 0);
    resetCalls();

    input.selectionRange(1, 3);
    let selectionRangeIndex = lastCallIndexForHandle(CALL_SET_TEXT_SELECTION_RANGE, editorHandle);
    expect<i32>(selectionRangeIndex).toBeGreaterThan(-1);
    expect<u32>(input.selectionStart).toBe(1);
    expect<u32>(input.selectionEnd).toBe(3);
    expect<f64>(getCallArg(selectionRangeIndex, 1)).toBe(1.0);
    expect<f64>(getCallArg(selectionRangeIndex, 2)).toBe(7.0);

    input.caretToEnd();
    selectionRangeIndex = lastCallIndexForHandle(CALL_SET_TEXT_SELECTION_RANGE, editorHandle);
    expect<i32>(selectionRangeIndex).toBeGreaterThan(-1);
    expect<u32>(input.selectionStart).toBe(4);
    expect<u32>(input.selectionEnd).toBe(4);
    expect<f64>(getCallArg(selectionRangeIndex, 1)).toBe(8.0);
    expect<f64>(getCallArg(selectionRangeIndex, 2)).toBe(8.0);

    input.dispose();
  });

  it("moves the caret to the end when text is set programmatically", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const input = new TextInput("Melbourne");
    input.build();
    const editorHandle = requireChildHandle(input, 0);
    input.selectionRange(1, 4);
    resetCalls();

    input.text("A😊Z");
    const selectionRangeIndex = lastCallIndexForHandle(CALL_SET_TEXT_SELECTION_RANGE, editorHandle);
    expect<i32>(selectionRangeIndex).toBeGreaterThan(-1);
    expect<string>(input.value).toBe("A😊Z");
    expect<u32>(input.selectionStart).toBe(3);
    expect<u32>(input.selectionEnd).toBe(3);
    expect<f64>(getCallArg(selectionRangeIndex, 1)).toBe(6.0);
    expect<f64>(getCallArg(selectionRangeIndex, 2)).toBe(6.0);

    input.dispose();
  });
});
