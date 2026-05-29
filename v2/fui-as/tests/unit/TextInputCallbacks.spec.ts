import { TextInput } from "../../src/controls";
import { Application } from "../../src/core/Application";
import { Node } from "../../src/core/Node";
import { EventRouter } from "../../src/core/EventRouter";
import { activeTheme, defaultDarkTheme } from "../../src/core/Theme";
import { __fui_on_selection_changed, __fui_on_text_changed, __fui_on_text_replaced, __fui_text_buffer } from "../../src/core/event_exports";
import { resetCalls } from "./FfiTestImports";

function requireChild<T>(node: Node, index: i32): T {
  return node.getChildAt(index)! as T;
}

function requireChildHandle(node: Node, index: i32): u64 {
  return requireChild<Node>(node, index).builtHandle;
}

function resetTheme(): void {
  activeTheme.value = defaultDarkTheme;
}

let textInputChangedValue = "";
let textInputFocusChangedCount = 0;
let textInputSelectionStart = 0;
let textInputSelectionEnd = 0;

function handleTextInputChanged(text: string): void {
  textInputChangedValue = text;
}

function handleTextInputSelectionChanged(start: u32, end: u32): void {
  textInputSelectionStart = start;
  textInputSelectionEnd = end;
}

function handleTextInputFocusChanged(_focused: bool): void {
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
});
