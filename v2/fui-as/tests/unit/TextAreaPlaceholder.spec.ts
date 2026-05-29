import { TextArea } from "../../src/controls";
import { Application } from "../../src/core/Application";
import { Node } from "../../src/core/Node";
import { EventRouter } from "../../src/core/EventRouter";
import { activeTheme, defaultDarkTheme } from "../../src/core/Theme";
import { __fui_on_text_replaced, __fui_text_buffer } from "../../src/core/event_exports";
import { ScrollBox } from "../../src/nodes";
import {
  CALL_ADD_CHILD,
  CALL_REMOVE_CHILD,
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

function lastCallIndex(op: i32): i32 {
  const sequence = getCallSequence();
  let index = -1;
  for (let i = 0; i < sequence.length; ++i) {
    if (unchecked(sequence[i]) == op) {
      index = i;
    }
  }
  return index;
}

describe("TextArea placeholder", () => {
  afterEach(() => {
    Application.unmount();
    resetTheme();
  });

  it("does not restore the placeholder after replace-range text arrives and the editor blurs", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const input = new TextArea().placeholder("Notes");
    const rootHandle = input.build();
    const scrollBox = requireChild<ScrollBox>(input, 0);
    const editorHandle = requireChildHandle(scrollBox.viewport, 0);
    const placeholderHandle = requireChildHandle(input, 1);

    EventRouter.dispatchFocusChanged(editorHandle, true);
    const encoded = Uint8Array.wrap(String.UTF8.encode("Hello world", false));
    const textBufferPtr = __fui_text_buffer();
    memory.copy(textBufferPtr, encoded.dataStart, encoded.length);
    __fui_on_text_replaced(editorHandle, 0, 0, textBufferPtr, <u32>encoded.length);

    const removeIndex = lastCallIndex(CALL_REMOVE_CHILD);
    expect<i32>(removeIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(removeIndex, 0)).toBe(<f64>rootHandle);
    expect<f64>(getCallArg(removeIndex, 1)).toBe(<f64>placeholderHandle);

    resetCalls();
    EventRouter.dispatchFocusChanged(editorHandle, false);

    expect<i32>(lastCallIndex(CALL_ADD_CHILD)).toBe(-1);
    expect<i32>(input.childCount).toBe(1);

    input.dispose();
  });

  it("restores the placeholder when replace-range editing clears the text", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const input = new TextArea().placeholder("Notes");
    const rootHandle = input.build();
    const scrollBox = requireChild<ScrollBox>(input, 0);
    const editorHandle = requireChildHandle(scrollBox.viewport, 0);
    const placeholderHandle = requireChildHandle(input, 1);

    EventRouter.dispatchFocusChanged(editorHandle, true);
    const encoded = Uint8Array.wrap(String.UTF8.encode("Hello world", false));
    const textBufferPtr = __fui_text_buffer();
    memory.copy(textBufferPtr, encoded.dataStart, encoded.length);
    __fui_on_text_replaced(editorHandle, 0, 0, textBufferPtr, <u32>encoded.length);

    resetCalls();
    __fui_on_text_replaced(editorHandle, 0, 11, 0, 0);

    const addIndex = lastCallIndex(CALL_ADD_CHILD);
    expect<i32>(addIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(addIndex, 0)).toBe(<f64>rootHandle);
    expect<f64>(getCallArg(addIndex, 1)).toBe(<f64>placeholderHandle);
    expect<i32>(input.childCount).toBe(2);
    expect<string>(input.value).toBe("");

    input.dispose();
  });
});
