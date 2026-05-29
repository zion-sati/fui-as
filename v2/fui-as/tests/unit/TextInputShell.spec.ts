import { TextInput } from "../../src/controls";
import { Application } from "../../src/core/Application";
import { Node } from "../../src/core/Node";
import { EventRouter } from "../../src/core/EventRouter";
import { PointerEventType, SemanticRole } from "../../src/core/ffi";
import { activeTheme, defaultDarkTheme } from "../../src/core/Theme";
import {
  CALL_ADD_CHILD,
  CALL_REMOVE_CHILD,
  CALL_REQUEST_FOCUS,
  CALL_SET_SELECTION_AREA_BARRIER,
  CALL_SET_SEMANTIC_ROLE,
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

describe("TextInput shell", () => {
  afterEach(() => {
    Application.unmount();
    resetTheme();
  });

  it("uses an internal textbox node and both shell and placeholder clicks focus it", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const input = new TextInput().placeholder("Search");
    input.build();
    const editorHandle = requireChildHandle(input, 0);
    expect<bool>(input.getChildAt(1) !== null).toBe(true);

    const roleIndex = lastCallIndexForHandle(CALL_SET_SEMANTIC_ROLE, editorHandle);
    expect<i32>(roleIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(roleIndex, 1)).toBe(<f64>SemanticRole.Textbox);
    const barrierIndex = lastCallIndexForHandle(CALL_SET_SELECTION_AREA_BARRIER, input.builtHandle);
    expect<i32>(barrierIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(barrierIndex, 1)).toBe(1.0);

    resetCalls();
    input._handlePointerEvent(PointerEventType.Down, 8.0, 8.0, 0);

    let focusIndex = lastCallIndex(CALL_REQUEST_FOCUS);
    expect<i32>(focusIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(focusIndex, 0)).toBe(<f64>editorHandle);

    input.dispose();
  });

  it("keeps the placeholder visible while empty across focus changes", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const input = new TextInput().placeholder("Type here");
    input.build();
    const editorHandle = requireChildHandle(input, 0);

    resetCalls();
    EventRouter.dispatchFocusChanged(editorHandle, true);

    expect<i32>(lastCallIndex(CALL_REMOVE_CHILD)).toBe(-1);
    expect<i32>(input.childCount).toBe(2);

    resetCalls();
    EventRouter.dispatchFocusChanged(editorHandle, false);

    expect<i32>(lastCallIndex(CALL_ADD_CHILD)).toBe(-1);
    expect<i32>(input.childCount).toBe(2);

    input.dispose();
  });
});
