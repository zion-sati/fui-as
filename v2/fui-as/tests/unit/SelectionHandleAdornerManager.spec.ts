import { SelectionHandleAdornerManager, SelectionHandleMode } from "../../src/core/SelectionHandleAdornerManager";
import { MobileTextSelectionToolbarManager } from "../../src/core/MobileTextSelectionToolbarManager";
import { EventRouter } from "../../src/core/EventRouter";
import { HandleValue, PointerEventType } from "../../src/core/ffi";
import { Node, PointerEventArgs, PointerType } from "../../src/core/Node";
import { Text } from "../../src/nodes";
import {
  CALL_BEGIN_SELECTION_ENDPOINT_DRAG,
  CALL_SET_POSITION,
  CALL_SET_PORTAL,
  CALL_SET_PRESERVE_SELECTION_ON_POINTER_DOWN,
  CALL_SET_VISIBILITY,
  findCall,
  getCallArg,
  getCallCount,
  getCallSequence,
  resetCalls,
  setCoarsePointer,
  setCrossSelectionEndpointRects,
  setTextRangeRects,
} from "./FfiTestImports";

function hasCallWithHandle(op: i32, handle: u64, argIndex: i32, value: f64): bool {
  const sequence = getCallSequence();
  const count = getCallCount();
  for (let index = 0; index < count; ++index) {
    if (unchecked(sequence[index]) != op) {
      continue;
    }
    if (getCallArg(index, 0) == <f64>handle && getCallArg(index, argIndex) == value) {
      return true;
    }
  }
  return false;
}

function countCalls(op: i32): i32 {
  const sequence = getCallSequence();
  const count = getCallCount();
  let total = 0;
  for (let index = 0; index < count; ++index) {
    if (unchecked(sequence[index]) == op) {
      total += 1;
    }
  }
  return total;
}

function hasPositionCall(handle: u64, x: f64, y: f64): bool {
  const sequence = getCallSequence();
  const count = getCallCount();
  for (let index = 0; index < count; ++index) {
    if (unchecked(sequence[index]) != CALL_SET_POSITION) {
      continue;
    }
    if (getCallArg(index, 0) == <f64>handle && getCallArg(index, 1) == x && getCallArg(index, 2) == y) {
      return true;
    }
  }
  return false;
}

function firstChildHandle(node: Node | null): u64 {
  const value = changetype<Node>(node);
  return changetype<Node>(value.getChildAt(0)).builtHandle;
}

function seedTwoLineSelectionRects(handle: u64): void {
  const rects = new StaticArray<f32>(8);
  unchecked(rects[0] = 100.0);
  unchecked(rects[1] = 50.0);
  unchecked(rects[2] = 40.0);
  unchecked(rects[3] = 20.0);
  unchecked(rects[4] = 20.0);
  unchecked(rects[5] = 80.0);
  unchecked(rects[6] = 70.0);
  unchecked(rects[7] = 20.0);
  setTextRangeRects(handle, rects, 2);
}

function seedNarrowSelectionRects(handle: u64): void {
  seedNarrowSelectionRectsAt(handle, 100.0);
}

function seedNarrowSelectionRectsAt(handle: u64, x: f32): void {
  const rects = new StaticArray<f32>(4);
  unchecked(rects[0] = x);
  unchecked(rects[1] = 50.0);
  unchecked(rects[2] = 12.0);
  unchecked(rects[3] = 20.0);
  setTextRangeRects(handle, rects, 1);
}

function seedCrossSelectionEndpointRects(handle: u64): void {
  const rects = new StaticArray<f32>(8);
  unchecked(rects[0] = 140.0);
  unchecked(rects[1] = 30.0);
  unchecked(rects[2] = 25.0);
  unchecked(rects[3] = 18.0);
  unchecked(rects[4] = 260.0);
  unchecked(rects[5] = 92.0);
  unchecked(rects[6] = 55.0);
  unchecked(rects[7] = 18.0);
  setCrossSelectionEndpointRects(handle, rects);
}

describe("SelectionHandleAdornerManager", () => {
  beforeEach(() => {
    EventRouter.reset();
    SelectionHandleAdornerManager.reset();
    MobileTextSelectionToolbarManager.reset();
    SelectionHandleAdornerManager.setMode(SelectionHandleMode.Always);
    setCoarsePointer(false);
    resetCalls();
  });

  it("defaults to auto mode", () => {
    SelectionHandleAdornerManager.reset();

    expect<SelectionHandleMode>(SelectionHandleAdornerManager.mode()).toBe(SelectionHandleMode.Auto);
  });

  it("creates a portal host with two hidden handle nodes", () => {
    const host = SelectionHandleAdornerManager.createDefaultHost();
    host.build();

    const startHandle = SelectionHandleAdornerManager.startHandleNode();
    const endHandle = SelectionHandleAdornerManager.endHandleNode();

    expect<i32>(countCalls(CALL_SET_PORTAL)).toBe(1);
    expect<bool>(startHandle !== null).toBe(true);
    expect<bool>(endHandle !== null).toBe(true);
    expect<bool>(hasCallWithHandle(CALL_SET_VISIBILITY, changetype<Node>(startHandle).builtHandle, 1, 1.0)).toBe(true);
    expect<bool>(hasCallWithHandle(CALL_SET_VISIBILITY, changetype<Node>(endHandle).builtHandle, 1, 1.0)).toBe(true);
    expect<bool>(
      hasCallWithHandle(CALL_SET_PRESERVE_SELECTION_ON_POINTER_DOWN, changetype<Node>(startHandle).builtHandle, 1, 1.0),
    ).toBe(true);
    expect<bool>(
      hasCallWithHandle(CALL_SET_PRESERVE_SELECTION_ON_POINTER_DOWN, changetype<Node>(endHandle).builtHandle, 1, 1.0),
    ).toBe(true);
  });

  it("shows retained portal handles for a non-collapsed text selection", () => {
    const host = SelectionHandleAdornerManager.createDefaultHost();
    host.build();
    const text = new Text("Portal selection");
    const textHandle = text.build();

    resetCalls();
    seedTwoLineSelectionRects(textHandle);
    EventRouter.dispatchSelectionChanged(textHandle, 0, 6);

    const startHandle = SelectionHandleAdornerManager.startHandleNode();
    const endHandle = SelectionHandleAdornerManager.endHandleNode();

    expect<bool>(SelectionHandleAdornerManager.isVisible()).toBe(true);
    expect<u64>(SelectionHandleAdornerManager.activeTextHandle()).toBe(textHandle);
    expect<u32>(SelectionHandleAdornerManager.activeSelectionStart()).toBe(0);
    expect<u32>(SelectionHandleAdornerManager.activeSelectionEnd()).toBe(6);
    expect<bool>(hasCallWithHandle(CALL_SET_VISIBILITY, changetype<Node>(startHandle).builtHandle, 1, 0.0)).toBe(true);
    expect<bool>(hasCallWithHandle(CALL_SET_VISIBILITY, changetype<Node>(endHandle).builtHandle, 1, 0.0)).toBe(true);
    expect<bool>(hasPositionCall(changetype<Node>(startHandle).builtHandle, 28.0, 45.0)).toBe(true);
    expect<bool>(hasPositionCall(changetype<Node>(endHandle).builtHandle, 72.0, 75.0)).toBe(true);
  });

  it("keeps visual handle sides when a single text selection crosses over", () => {
    const host = SelectionHandleAdornerManager.createDefaultHost();
    host.build();
    const text = new Text("Portal selection");
    const textHandle = text.build();

    resetCalls();
    seedTwoLineSelectionRects(textHandle);
    EventRouter.dispatchSelectionChanged(textHandle, 6, 0);

    const startHandle = SelectionHandleAdornerManager.startHandleNode();
    const endHandle = SelectionHandleAdornerManager.endHandleNode();

    expect<bool>(SelectionHandleAdornerManager.isVisible()).toBe(true);
    expect<u32>(SelectionHandleAdornerManager.activeSelectionStart()).toBe(6);
    expect<u32>(SelectionHandleAdornerManager.activeSelectionEnd()).toBe(0);
    expect<bool>(hasPositionCall(changetype<Node>(startHandle).builtHandle, 28.0, 45.0)).toBe(true);
    expect<bool>(hasPositionCall(changetype<Node>(endHandle).builtHandle, 72.0, 75.0)).toBe(true);
  });

  it("hides retained portal handles for collapsed selections", () => {
    const host = SelectionHandleAdornerManager.createDefaultHost();
    host.build();
    const text = new Text("Portal selection");
    const textHandle = text.build();
    seedTwoLineSelectionRects(textHandle);

    EventRouter.dispatchSelectionChanged(textHandle, 0, 6);
    resetCalls();
    EventRouter.dispatchSelectionChanged(textHandle, 6, 6);

    const startHandle = SelectionHandleAdornerManager.startHandleNode();
    const endHandle = SelectionHandleAdornerManager.endHandleNode();

    expect<bool>(SelectionHandleAdornerManager.isVisible()).toBe(false);
    expect<bool>(hasCallWithHandle(CALL_SET_VISIBILITY, changetype<Node>(startHandle).builtHandle, 1, 1.0)).toBe(true);
    expect<bool>(hasCallWithHandle(CALL_SET_VISIBILITY, changetype<Node>(endHandle).builtHandle, 1, 1.0)).toBe(true);
  });

  it("shows retained portal handles for cross-node selection payloads", () => {
    const host = SelectionHandleAdornerManager.createDefaultHost();
    host.build();
    const area = new Text("Selection area owner");
    const areaHandle = area.build();

    resetCalls();
    seedCrossSelectionEndpointRects(areaHandle);
    EventRouter.dispatchCrossSelectionChanged(areaHandle, "selected text");

    const startHandle = SelectionHandleAdornerManager.startHandleNode();
    const endHandle = SelectionHandleAdornerManager.endHandleNode();

    expect<bool>(SelectionHandleAdornerManager.isVisible()).toBe(true);
    expect<u64>(SelectionHandleAdornerManager.activeTextHandle()).toBe(areaHandle);
    expect<bool>(hasCallWithHandle(CALL_SET_VISIBILITY, changetype<Node>(startHandle).builtHandle, 1, 0.0)).toBe(true);
    expect<bool>(hasCallWithHandle(CALL_SET_VISIBILITY, changetype<Node>(endHandle).builtHandle, 1, 0.0)).toBe(true);
    expect<bool>(hasPositionCall(changetype<Node>(startHandle).builtHandle, 68.0, 23.0)).toBe(true);
    expect<bool>(hasPositionCall(changetype<Node>(endHandle).builtHandle, 297.0, 85.0)).toBe(true);
  });

  it("keeps auto mode hidden for mouse-created selections", () => {
    const host = SelectionHandleAdornerManager.createDefaultHost();
    host.build();
    const text = new Text("Portal selection");
    const textHandle = text.build();
    seedTwoLineSelectionRects(textHandle);

    SelectionHandleAdornerManager.setMode(SelectionHandleMode.Auto);
    EventRouter.dispatchPointerEvent(textHandle, PointerEventType.Down, 1.0, 1.0, 0, 1, PointerType.Mouse);
    EventRouter.dispatchSelectionChanged(textHandle, 0, 6);

    expect<bool>(SelectionHandleAdornerManager.isVisible()).toBe(false);
  });

  it("shows auto mode handles for touch-created selections", () => {
    const host = SelectionHandleAdornerManager.createDefaultHost();
    host.build();
    const text = new Text("Portal selection");
    const textHandle = text.build();
    seedTwoLineSelectionRects(textHandle);

    SelectionHandleAdornerManager.setMode(SelectionHandleMode.Auto);
    EventRouter.dispatchPointerEvent(textHandle, PointerEventType.Down, 1.0, 1.0, 0, 1, PointerType.Touch);
    EventRouter.dispatchSelectionChanged(textHandle, 0, 6);

    expect<bool>(SelectionHandleAdornerManager.isVisible()).toBe(true);
  });

  it("shows auto mode handles on coarse-pointer hosts before pointer type is known", () => {
    const host = SelectionHandleAdornerManager.createDefaultHost();
    host.build();
    const text = new Text("Portal selection");
    const textHandle = text.build();
    seedTwoLineSelectionRects(textHandle);

    SelectionHandleAdornerManager.setMode(SelectionHandleMode.Auto);
    setCoarsePointer(true);
    EventRouter.dispatchSelectionChanged(textHandle, 0, 6);

    expect<bool>(SelectionHandleAdornerManager.isVisible()).toBe(true);
  });

  it("hides auto mode handles for mouse selections after touch selections on hybrid hosts", () => {
    const host = SelectionHandleAdornerManager.createDefaultHost();
    host.build();
    const text = new Text("Portal selection");
    const textHandle = text.build();
    seedTwoLineSelectionRects(textHandle);

    SelectionHandleAdornerManager.setMode(SelectionHandleMode.Auto);
    EventRouter.dispatchPointerEvent(textHandle, PointerEventType.Down, 1.0, 1.0, 0, 1, PointerType.Touch);
    EventRouter.dispatchSelectionChanged(textHandle, 0, 6);
    expect<bool>(SelectionHandleAdornerManager.isVisible()).toBe(true);

    EventRouter.dispatchPointerEvent(textHandle, PointerEventType.Down, 1.0, 1.0, 0, 2, PointerType.Mouse);
    EventRouter.dispatchSelectionChanged(textHandle, 0, 6);

    expect<bool>(SelectionHandleAdornerManager.isVisible()).toBe(false);
  });

  it("starts a touch handle drag through the engine hook and hides the dragged handle", () => {
    const host = SelectionHandleAdornerManager.createDefaultHost();
    host.build();
    const text = new Text("Portal selection");
    const textHandle = text.build();
    seedTwoLineSelectionRects(textHandle);
    EventRouter.dispatchPointerEvent(textHandle, PointerEventType.Down, 1.0, 1.0, 0, 1, PointerType.Touch);
    EventRouter.dispatchSelectionChanged(textHandle, 0, 6);

    const startHandle = SelectionHandleAdornerManager.startHandleNode();
    const endHandle = SelectionHandleAdornerManager.endHandleNode();
    const startHandleValue = changetype<Node>(startHandle).builtHandle;
    const startKnobValue = firstChildHandle(startHandle);
    expect<bool>(EventRouter.getRegisteredNode(startHandleValue) !== null).toBe(true);
    expect<bool>(changetype<Node>(startHandle).isVisible).toBe(true);
    resetCalls();

    const downEvent = new PointerEventArgs(PointerEventType.Down, 0.0, 0.0, 0, 101, PointerType.Touch);
    SelectionHandleAdornerManager.handleStartPointerDown(downEvent);

    const beginCall = findCall(CALL_BEGIN_SELECTION_ENDPOINT_DRAG);
    expect<i32>(beginCall).not.toBe(-1);
    expect<bool>(downEvent.handled).toBe(true);
    expect<f64>(getCallArg(beginCall, 0)).toBe(<f64>textHandle);
    expect<f64>(getCallArg(beginCall, 1)).toBe(0.0);
    expect<bool>(changetype<Node>(startHandle).isVisible).toBe(true);
    expect<bool>(hasCallWithHandle(CALL_SET_VISIBILITY, startKnobValue, 1, 1.0)).toBe(true);
    expect<bool>(changetype<Node>(changetype<Node>(endHandle).getChildAt(0)).isVisible).toBe(true);

    resetCalls();
    const upHandled = EventRouter.dispatchPointerEvent(
      <u64>HandleValue.Invalid,
      PointerEventType.Up,
      88.0,
      70.0,
      0,
      101,
      PointerType.Touch,
    );
    expect<bool>(upHandled).toBe(true);
    expect<bool>(hasCallWithHandle(CALL_SET_VISIBILITY, startKnobValue, 1, 0.0)).toBe(true);
    expect<bool>(changetype<Node>(changetype<Node>(endHandle).getChildAt(0)).isVisible).toBe(true);
  });

  it("keeps handle dragging alive when endpoints meet and clears on touch release", () => {
    const host = SelectionHandleAdornerManager.createDefaultHost();
    host.build();
    const text = new Text("Portal selection");
    const textHandle = text.build();
    seedTwoLineSelectionRects(textHandle);
    EventRouter.dispatchPointerEvent(textHandle, PointerEventType.Down, 1.0, 1.0, 0, 1, PointerType.Touch);
    EventRouter.dispatchSelectionChanged(textHandle, 0, 6);

    const startHandle = SelectionHandleAdornerManager.startHandleNode();
    const endHandle = SelectionHandleAdornerManager.endHandleNode();
    const startHandleValue = changetype<Node>(startHandle).builtHandle;
    const startKnobValue = firstChildHandle(startHandle);
    resetCalls();

    SelectionHandleAdornerManager.handleStartPointerDown(
      new PointerEventArgs(PointerEventType.Down, 0.0, 0.0, 0, 101, PointerType.Touch),
    );
    EventRouter.dispatchSelectionChanged(textHandle, 6, 6);

    expect<bool>(SelectionHandleAdornerManager.isVisible()).toBe(true);
    expect<u32>(SelectionHandleAdornerManager.activeSelectionStart()).toBe(6);
    expect<u32>(SelectionHandleAdornerManager.activeSelectionEnd()).toBe(6);
    expect<bool>(changetype<Node>(startHandle).isVisible).toBe(true);
    expect<bool>(hasCallWithHandle(CALL_SET_VISIBILITY, startKnobValue, 1, 1.0)).toBe(true);

    resetCalls();
    EventRouter.dispatchPointerEvent(
      <u64>HandleValue.Invalid,
      PointerEventType.Up,
      88.0,
      70.0,
      0,
      101,
      PointerType.Touch,
    );

    expect<bool>(SelectionHandleAdornerManager.isVisible()).toBe(false);
    expect<u32>(SelectionHandleAdornerManager.activeSelectionStart()).toBe(0);
    expect<u32>(SelectionHandleAdornerManager.activeSelectionEnd()).toBe(0);
    expect<bool>(changetype<Node>(startHandle).isVisible).toBe(false);
    expect<bool>(hasCallWithHandle(CALL_SET_VISIBILITY, startKnobValue, 1, 0.0)).toBe(true);
  });

  it("keeps start and end handle positions stable while dragging start before crossover", () => {
    const host = SelectionHandleAdornerManager.createDefaultHost();
    host.build();
    const text = new Text("Portal selection");
    const textHandle = text.build();
    seedNarrowSelectionRects(textHandle);
    EventRouter.dispatchPointerEvent(textHandle, PointerEventType.Down, 1.0, 1.0, 0, 1, PointerType.Touch);
    EventRouter.dispatchSelectionChanged(textHandle, 2, 6);

    const startHandle = SelectionHandleAdornerManager.startHandleNode();
    const endHandle = SelectionHandleAdornerManager.endHandleNode();
    resetCalls();
    seedNarrowSelectionRects(textHandle);

    SelectionHandleAdornerManager.handleStartPointerDown(
      new PointerEventArgs(PointerEventType.Down, 0.0, 0.0, 0, 101, PointerType.Touch),
    );
    EventRouter.dispatchSelectionChanged(textHandle, 2, 6);

    expect<bool>(hasPositionCall(changetype<Node>(startHandle).builtHandle, 28.0, 45.0)).toBe(true);
    expect<bool>(hasPositionCall(changetype<Node>(endHandle).builtHandle, 94.0, 45.0)).toBe(true);
    expect<bool>(changetype<Node>(changetype<Node>(startHandle).getChildAt(0)).isVisible).toBe(false);
    expect<bool>(changetype<Node>(changetype<Node>(endHandle).getChildAt(0)).isVisible).toBe(true);
  });

  it("keeps the non-dragged end handle visible after a dragged start crosses past the end", () => {
    const host = SelectionHandleAdornerManager.createDefaultHost();
    host.build();
    const text = new Text("Portal selection");
    const textHandle = text.build();
    seedNarrowSelectionRects(textHandle);
    EventRouter.dispatchPointerEvent(textHandle, PointerEventType.Down, 1.0, 1.0, 0, 1, PointerType.Touch);
    EventRouter.dispatchSelectionChanged(textHandle, 6, 11);

    const startHandle = SelectionHandleAdornerManager.startHandleNode();
    const endHandle = SelectionHandleAdornerManager.endHandleNode();
    const startHandleValue = changetype<Node>(startHandle).builtHandle;
    const startKnobValue = firstChildHandle(startHandle);
    resetCalls();
    seedNarrowSelectionRectsAt(textHandle, 140.0);

    SelectionHandleAdornerManager.handleStartPointerDown(
      new PointerEventArgs(PointerEventType.Down, 0.0, 0.0, 0, 101, PointerType.Touch),
    );
    EventRouter.dispatchSelectionChanged(textHandle, 11, 13);

    expect<u32>(SelectionHandleAdornerManager.activeSelectionStart()).toBe(11);
    expect<u32>(SelectionHandleAdornerManager.activeSelectionEnd()).toBe(13);
    expect<bool>(hasPositionCall(changetype<Node>(startHandle).builtHandle, 80.0, 45.0)).toBe(true);
    expect<bool>(hasPositionCall(changetype<Node>(endHandle).builtHandle, 94.0, 45.0)).toBe(true);
    expect<bool>(hasPositionCall(changetype<Node>(endHandle).builtHandle, 134.0, 45.0)).toBe(false);
    expect<bool>(changetype<Node>(changetype<Node>(startHandle).getChildAt(0)).isVisible).toBe(false);
    expect<bool>(changetype<Node>(changetype<Node>(endHandle).getChildAt(0)).isVisible).toBe(true);
  });

  it("hides the visual start handle when dragging the new start after crossover", () => {
    const host = SelectionHandleAdornerManager.createDefaultHost();
    host.build();
    const text = new Text("Portal selection");
    const textHandle = text.build();
    seedNarrowSelectionRects(textHandle);
    EventRouter.dispatchPointerEvent(textHandle, PointerEventType.Down, 1.0, 1.0, 0, 1, PointerType.Touch);
    EventRouter.dispatchSelectionChanged(textHandle, 6, 11);

    const startHandle = SelectionHandleAdornerManager.startHandleNode();
    const endHandle = SelectionHandleAdornerManager.endHandleNode();
    const startHandleValue = changetype<Node>(startHandle).builtHandle;
    const startKnobValue = firstChildHandle(startHandle);
    seedNarrowSelectionRects(textHandle);

    SelectionHandleAdornerManager.handleStartPointerDown(
      new PointerEventArgs(PointerEventType.Down, 0.0, 0.0, 0, 101, PointerType.Touch),
    );
    EventRouter.dispatchSelectionChanged(textHandle, 11, 13);
    EventRouter.dispatchPointerEvent(
      <u64>HandleValue.Invalid,
      PointerEventType.Up,
      112.0,
      70.0,
      0,
      101,
      PointerType.Touch,
    );

    resetCalls();
    seedNarrowSelectionRects(textHandle);
    SelectionHandleAdornerManager.handleStartPointerDown(
      new PointerEventArgs(PointerEventType.Down, 0.0, 0.0, 0, 102, PointerType.Touch),
    );
    EventRouter.dispatchSelectionChanged(textHandle, 13, 9);

    const beginCall = findCall(CALL_BEGIN_SELECTION_ENDPOINT_DRAG);
    expect<i32>(beginCall).not.toBe(-1);
    expect<f64>(getCallArg(beginCall, 1)).toBe(0.0);
    expect<u32>(SelectionHandleAdornerManager.activeSelectionStart()).toBe(13);
    expect<u32>(SelectionHandleAdornerManager.activeSelectionEnd()).toBe(9);
    expect<bool>(changetype<Node>(changetype<Node>(startHandle).getChildAt(0)).isVisible).toBe(false);
    expect<bool>(changetype<Node>(changetype<Node>(endHandle).getChildAt(0)).isVisible).toBe(true);
  });

  it("uses the handle callback side when handle hit targets overlap", () => {
    const host = SelectionHandleAdornerManager.createDefaultHost();
    host.build();
    const text = new Text("Portal selection");
    const textHandle = text.build();
    seedNarrowSelectionRects(textHandle);
    EventRouter.dispatchPointerEvent(textHandle, PointerEventType.Down, 1.0, 1.0, 0, 1, PointerType.Touch);
    EventRouter.dispatchSelectionChanged(textHandle, 11, 13);

    const endHandle = SelectionHandleAdornerManager.endHandleNode();
    const endHandleValue = changetype<Node>(endHandle).builtHandle;
    const endKnobValue = firstChildHandle(endHandle);
    resetCalls();

    const downEvent = new PointerEventArgs(PointerEventType.Down, 0.0, 0.0, 0, 101, PointerType.Touch);
    SelectionHandleAdornerManager.handleEndPointerDown(downEvent);

    const beginCall = findCall(CALL_BEGIN_SELECTION_ENDPOINT_DRAG);
    expect<i32>(beginCall).not.toBe(-1);
    expect<bool>(downEvent.handled).toBe(true);
    expect<f64>(getCallArg(beginCall, 0)).toBe(<f64>textHandle);
    expect<f64>(getCallArg(beginCall, 1)).toBe(1.0);
  });

  it("does not start handle dragging from mouse input", () => {
    const host = SelectionHandleAdornerManager.createDefaultHost();
    host.build();
    const text = new Text("Portal selection");
    const textHandle = text.build();
    seedTwoLineSelectionRects(textHandle);
    EventRouter.dispatchPointerEvent(textHandle, PointerEventType.Down, 1.0, 1.0, 0, 1, PointerType.Touch);
    EventRouter.dispatchSelectionChanged(textHandle, 0, 6);

    const startHandle = SelectionHandleAdornerManager.startHandleNode();
    const startHandleValue = changetype<Node>(startHandle).builtHandle;
    const startKnobValue = firstChildHandle(startHandle);
    resetCalls();

    const downEvent = new PointerEventArgs(PointerEventType.Down, 0.0, 0.0, 0, 102, PointerType.Mouse);
    SelectionHandleAdornerManager.handleStartPointerDown(downEvent);

    expect<bool>(downEvent.handled).toBe(false);
    expect<i32>(findCall(CALL_BEGIN_SELECTION_ENDPOINT_DRAG)).toBe(-1);
  });
});
