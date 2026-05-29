import { TextArea } from "../../src/controls";
import { Application } from "../../src/core/Application";
import { Node } from "../../src/core/Node";
import { EventRouter } from "../../src/core/EventRouter";
import { CursorStyle, PointerEventType, SemanticRole } from "../../src/core/ffi";
import { activeTheme, defaultDarkTheme } from "../../src/core/Theme";
import { ScrollBox } from "../../src/nodes";
import {
  CALL_SET_SEMANTIC_ROLE,
  CALL_SET_TEXT_LIMITS,
  CALL_SET_TEXT_SELECTION_RANGE,
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

describe("TextArea selection", () => {
  afterEach(() => {
    Application.unmount();
    resetTheme();
  });

  it("uses the document-end selection path for shell and placeholder clicks", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const input = new TextArea();
    input.width(220.0);
    input.height(120.0);
    input.placeholder("Notes");
    input.build();
    const scrollBox = requireChild<ScrollBox>(input, 0);
    const editorHandle = requireChildHandle(scrollBox.viewport, 0);
    expect<bool>(input.getChildAt(1) !== null).toBe(true);

    const roleIndex = lastCallIndexForHandle(CALL_SET_SEMANTIC_ROLE, editorHandle);
    expect<i32>(roleIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(roleIndex, 1)).toBe(<f64>SemanticRole.Textbox);
    const limitsIndex = lastCallIndexForHandle(CALL_SET_TEXT_LIMITS, editorHandle);
    expect<i32>(limitsIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(limitsIndex, 2)).toBe(0.0);
    const wrappingIndex = lastCallIndexForHandle(CALL_SET_TEXT_WRAPPING, editorHandle);
    expect<i32>(wrappingIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(wrappingIndex, 1)).toBe(1.0);

    resetCalls();
    input._handlePointerEvent(PointerEventType.Down, 8.0, 8.0, 0);

    let selectionRangeIndex = lastCallIndex(CALL_SET_TEXT_SELECTION_RANGE);
    expect<i32>(selectionRangeIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(selectionRangeIndex, 0)).toBe(<f64>editorHandle);
    expect<f64>(getCallArg(selectionRangeIndex, 1)).toBe(0.0);
    expect<f64>(getCallArg(selectionRangeIndex, 2)).toBe(0.0);

    input.dispose();
  });

});
