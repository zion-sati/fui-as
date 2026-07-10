import { EventRouter } from "../../src/core/EventRouter";
import { MobileTextSelectionToolbarManager } from "../../src/core/MobileTextSelectionToolbarManager";
import { Node, PointerType } from "../../src/core/Node";
import { SelectionHandleAdornerManager, SelectionHandleMode } from "../../src/core/SelectionHandleAdornerManager";
import { PointerEventType } from "../../src/core/ffi";
import { TextInput } from "../../src/controls";
import { FlexBox, Text } from "../../src/nodes";
import {
  CALL_SET_POSITION,
  CALL_SET_PRESERVE_SELECTION_ON_POINTER_DOWN,
  CALL_SET_VISIBILITY,
  CALL_CLEAR_SELECTION,
  CALL_REQUEST_FOCUS,
  CALL_SELECT_ALL_TEXT,
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

function seedCrossSelectionEndpointRects(handle: u64): void {
  const rects = new StaticArray<f32>(8);
  unchecked(rects[0] = 100.0);
  unchecked(rects[1] = 40.0);
  unchecked(rects[2] = 30.0);
  unchecked(rects[3] = 20.0);
  unchecked(rects[4] = 180.0);
  unchecked(rects[5] = 40.0);
  unchecked(rects[6] = 40.0);
  unchecked(rects[7] = 20.0);
  setCrossSelectionEndpointRects(handle, rects);
}

describe("MobileTextSelectionToolbarManager", () => {
  beforeEach(() => {
    EventRouter.reset();
    SelectionHandleAdornerManager.reset();
    MobileTextSelectionToolbarManager.reset();
    SelectionHandleAdornerManager.setMode(SelectionHandleMode.Always);
    setCoarsePointer(false);
    resetCalls();
  });

  it("shows a horizontal read-only text menu above the start handle with a teardrop-safe fallback below", () => {
    SelectionHandleAdornerManager.createDefaultHost().build();
    MobileTextSelectionToolbarManager.createDefaultHost().build();
    const text = new Text("Portal selection");
    const textHandle = text.build();

    seedTwoLineSelectionRects(textHandle);
    EventRouter.dispatchSelectionChanged(textHandle, 0, 6);

    const panel = changetype<Node>(MobileTextSelectionToolbarManager.panelNode());
    expect<bool>(MobileTextSelectionToolbarManager.isVisible()).toBe(true);
    expect<i32>(MobileTextSelectionToolbarManager.itemCount()).toBe(2);
    expect<string>(MobileTextSelectionToolbarManager.itemLabel(0)).toBe("Copy");
    expect<string>(MobileTextSelectionToolbarManager.itemLabel(1)).toBe("Select all");
    expect<bool>(hasCallWithHandle(CALL_SET_VISIBILITY, panel.builtHandle, 1, 0.0)).toBe(true);
    expect<bool>(hasPositionCall(panel.builtHandle, 8.0, 120.0)).toBe(true);
  });

  it("keeps the toolbar hidden for mouse-created auto mode selections", () => {
    SelectionHandleAdornerManager.createDefaultHost().build();
    MobileTextSelectionToolbarManager.createDefaultHost().build();
    const text = new Text("Portal selection");
    const textHandle = text.build();
    seedTwoLineSelectionRects(textHandle);

    SelectionHandleAdornerManager.setMode(SelectionHandleMode.Auto);
    EventRouter.dispatchPointerEvent(textHandle, PointerEventType.Down, 1.0, 1.0, 0, 1, PointerType.Mouse);
    EventRouter.dispatchSelectionChanged(textHandle, 0, 6);

    expect<bool>(MobileTextSelectionToolbarManager.isVisible()).toBe(false);
    expect<i32>(MobileTextSelectionToolbarManager.itemCount()).toBe(0);
  });

  it("uses editable text actions for editable selections", () => {
    SelectionHandleAdornerManager.createDefaultHost().build();
    MobileTextSelectionToolbarManager.createDefaultHost().build();
    const text = new Text("abcdef").editable();
    const textHandle = text.build();

    seedTwoLineSelectionRects(textHandle);
    EventRouter.dispatchSelectionChanged(textHandle, 1, 4);

    expect<bool>(MobileTextSelectionToolbarManager.isVisible()).toBe(true);
    expect<i32>(MobileTextSelectionToolbarManager.itemCount()).toBe(4);
    expect<string>(MobileTextSelectionToolbarManager.itemLabel(0)).toBe("Cut");
    expect<string>(MobileTextSelectionToolbarManager.itemLabel(1)).toBe("Copy");
    expect<string>(MobileTextSelectionToolbarManager.itemLabel(2)).toBe("Paste");
    expect<string>(MobileTextSelectionToolbarManager.itemLabel(3)).toBe("Select all");
    expect<i32>(MobileTextSelectionToolbarManager.visibleToolbarItemCount()).toBe(4);
  });

  it("refocuses editable text after mobile Select all", () => {
    SelectionHandleAdornerManager.createDefaultHost().build();
    MobileTextSelectionToolbarManager.createDefaultHost().build();
    const text = new Text("abcdef").editable();
    const textHandle = text.build();

    seedTwoLineSelectionRects(textHandle);
    EventRouter.dispatchSelectionChanged(textHandle, 1, 4);
    resetCalls();

    MobileTextSelectionToolbarManager.activateToolbarSlot(3);

    expect<i32>(findCall(CALL_SELECT_ALL_TEXT)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_REQUEST_FOCUS)).toBeGreaterThan(-1);
  });

  it("collapses editable overflow actions behind a vertical overflow menu with back navigation", () => {
    SelectionHandleAdornerManager.createDefaultHost().build();
    MobileTextSelectionToolbarManager.createDefaultHost().build();
    const text = new Text("abcdef").editable();
    const textHandle = text.build();

    seedTwoLineSelectionRects(textHandle);
    EventRouter.dispatchSelectionChanged(textHandle, 1, 4);

    expect<bool>(MobileTextSelectionToolbarManager.isVisible()).toBe(true);
    expect<bool>(MobileTextSelectionToolbarManager.isOverflowVisible()).toBe(false);
    expect<i32>(MobileTextSelectionToolbarManager.itemCount()).toBe(4);
    expect<i32>(MobileTextSelectionToolbarManager.visibleToolbarItemCount()).toBe(4);

    const panel = changetype<Node>(MobileTextSelectionToolbarManager.panelNode());
    const overflowButton = changetype<Node>(panel.getChildAt(6));
    resetCalls();

    EventRouter.dispatchPointerEvent(
      overflowButton.builtHandle,
      PointerEventType.Up,
      220.0,
      120.0,
      0,
      208,
      PointerType.Touch,
    );

    expect<bool>(MobileTextSelectionToolbarManager.isVisible()).toBe(false);
    expect<bool>(MobileTextSelectionToolbarManager.isOverflowVisible()).toBe(true);

    const overflowPanel = changetype<Node>(MobileTextSelectionToolbarManager.overflowPanelNode());
    expect<bool>(hasCallWithHandle(CALL_SET_VISIBILITY, overflowPanel.builtHandle, 1, 0.0)).toBe(true);

    MobileTextSelectionToolbarManager.activateToolbarSlot(-2);

    expect<bool>(MobileTextSelectionToolbarManager.isVisible()).toBe(true);
    expect<bool>(MobileTextSelectionToolbarManager.isOverflowVisible()).toBe(false);
  });

  it("uses editable text actions when selection is reported against a TextInput shell", () => {
    SelectionHandleAdornerManager.createDefaultHost().build();
    MobileTextSelectionToolbarManager.createDefaultHost().build();
    const input = new TextInput("touch editable shell");
    const shellHandle = input.build();
    const editorHandle = input.editorNode.builtHandle;

    seedTwoLineSelectionRects(editorHandle);
    EventRouter.dispatchSelectionChanged(shellHandle, 1, 6);

    expect<bool>(MobileTextSelectionToolbarManager.isVisible()).toBe(true);
    expect<i32>(MobileTextSelectionToolbarManager.itemCount()).toBe(4);
    expect<string>(MobileTextSelectionToolbarManager.itemLabel(0)).toBe("Cut");
    expect<string>(MobileTextSelectionToolbarManager.itemLabel(1)).toBe("Copy");
    expect<string>(MobileTextSelectionToolbarManager.itemLabel(2)).toBe("Paste");
    expect<string>(MobileTextSelectionToolbarManager.itemLabel(3)).toBe("Select all");
  });

  it("marks the toolbar surface and buttons as selection-preserving", () => {
    SelectionHandleAdornerManager.createDefaultHost().build();
    MobileTextSelectionToolbarManager.createDefaultHost().build();
    const text = new Text("Portal selection");
    const textHandle = text.build();

    seedTwoLineSelectionRects(textHandle);
    EventRouter.dispatchSelectionChanged(textHandle, 0, 6);

    const panel = changetype<Node>(MobileTextSelectionToolbarManager.panelNode());
    const firstButton = changetype<Node>(panel.getChildAt(0));
    expect<bool>(hasCallWithHandle(CALL_SET_PRESERVE_SELECTION_ON_POINTER_DOWN, panel.builtHandle, 1, 1.0)).toBe(true);
    expect<bool>(hasCallWithHandle(CALL_SET_PRESERVE_SELECTION_ON_POINTER_DOWN, firstButton.builtHandle, 1, 1.0)).toBe(true);
  });

  it("hides immediately while a teardrop handle is being dragged", () => {
    SelectionHandleAdornerManager.createDefaultHost().build();
    MobileTextSelectionToolbarManager.createDefaultHost().build();
    const text = new Text("Portal selection");
    const textHandle = text.build();
    seedTwoLineSelectionRects(textHandle);
    EventRouter.dispatchPointerEvent(textHandle, PointerEventType.Down, 1.0, 1.0, 0, 1, PointerType.Touch);
    EventRouter.dispatchSelectionChanged(textHandle, 0, 6);

    const panel = changetype<Node>(MobileTextSelectionToolbarManager.panelNode());
    const startHandle = changetype<Node>(SelectionHandleAdornerManager.startHandleNode());
    expect<bool>(MobileTextSelectionToolbarManager.isVisible()).toBe(true);
    resetCalls();

    EventRouter.dispatchPointerEvent(startHandle.builtHandle, PointerEventType.Down, 72.0, 70.0, 0, 101, PointerType.Touch);

    expect<bool>(MobileTextSelectionToolbarManager.isVisible()).toBe(false);
    expect<bool>(hasCallWithHandle(CALL_SET_VISIBILITY, panel.builtHandle, 1, 2.0)).toBe(true);
  });

  it("runs Copy, clears selection, and hides without framework feedback chrome", () => {
    SelectionHandleAdornerManager.createDefaultHost().build();
    MobileTextSelectionToolbarManager.createDefaultHost().build();
    const text = new Text("Portal selection");
    const textHandle = text.build();
    setCoarsePointer(true);
    seedTwoLineSelectionRects(textHandle);
    EventRouter.dispatchSelectionChanged(textHandle, 0, 6);

    resetCalls();

    expect<i32>(findCall(CALL_CLEAR_SELECTION)).toBe(-1);

    MobileTextSelectionToolbarManager.activateToolbarSlot(0);

    expect<i32>(findCall(CALL_CLEAR_SELECTION)).toBeGreaterThan(-1);
    expect<bool>(MobileTextSelectionToolbarManager.isVisible()).toBe(false);
  });

  it("runs Copy when touch release lands on the toolbar label child", () => {
    SelectionHandleAdornerManager.createDefaultHost().build();
    MobileTextSelectionToolbarManager.createDefaultHost().build();
    const text = new Text("Portal selection");
    const textHandle = text.build();
    setCoarsePointer(true);
    seedTwoLineSelectionRects(textHandle);
    EventRouter.dispatchSelectionChanged(textHandle, 0, 6);

    const panel = changetype<Node>(MobileTextSelectionToolbarManager.panelNode());
    const copyButton = changetype<Node>(panel.getChildAt(0));
    const copyLabel = changetype<Node>(copyButton.getChildAt(0));
    resetCalls();

    EventRouter.dispatchPointerEvent(
      copyLabel.builtHandle,
      PointerEventType.Up,
      16.0,
      112.0,
      0,
      203,
      PointerType.Touch,
    );

    expect<i32>(findCall(CALL_CLEAR_SELECTION)).toBeGreaterThan(-1);
    expect<bool>(MobileTextSelectionToolbarManager.isVisible()).toBe(false);
  });

  it("runs Select all through the shared desktop context-menu action path", () => {
    SelectionHandleAdornerManager.createDefaultHost().build();
    MobileTextSelectionToolbarManager.createDefaultHost().build();
    const text = new Text("Portal selection");
    const textHandle = text.build();
    seedTwoLineSelectionRects(textHandle);
    EventRouter.dispatchSelectionChanged(textHandle, 0, 6);

    resetCalls();

    expect<i32>(findCall(CALL_SELECT_ALL_TEXT)).toBe(-1);

    MobileTextSelectionToolbarManager.activateToolbarSlot(1);

    expect<i32>(findCall(CALL_SELECT_ALL_TEXT)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_REQUEST_FOCUS)).toBe(-1);
    expect<bool>(MobileTextSelectionToolbarManager.isVisible()).toBe(true);
  });

  it("runs Select all when touch release lands on the toolbar label child", () => {
    SelectionHandleAdornerManager.createDefaultHost().build();
    MobileTextSelectionToolbarManager.createDefaultHost().build();
    const text = new Text("Portal selection");
    const textHandle = text.build();
    setCoarsePointer(true);
    seedTwoLineSelectionRects(textHandle);
    EventRouter.dispatchSelectionChanged(textHandle, 0, 6);

    const panel = changetype<Node>(MobileTextSelectionToolbarManager.panelNode());
    const selectAllButton = changetype<Node>(panel.getChildAt(2));
    const selectAllLabel = changetype<Node>(selectAllButton.getChildAt(0));
    resetCalls();

    EventRouter.dispatchPointerEvent(
      selectAllLabel.builtHandle,
      PointerEventType.Up,
      120.0,
      112.0,
      0,
      204,
      PointerType.Touch,
    );

    expect<i32>(findCall(CALL_SELECT_ALL_TEXT)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_REQUEST_FOCUS)).toBe(-1);
    expect<bool>(MobileTextSelectionToolbarManager.isVisible()).toBe(true);
  });

  it("shows cross-selection Select all when the touched text handle is pending", () => {
    SelectionHandleAdornerManager.createDefaultHost().build();
    MobileTextSelectionToolbarManager.createDefaultHost().build();
    const text = new Text("Portal selection");
    const textHandle = text.build();
    const area = new Text("Area shell");
    const areaHandle = area.build();
    setCoarsePointer(true);
    seedCrossSelectionEndpointRects(areaHandle);

    MobileTextSelectionToolbarManager.setPendingCrossSelectionTextHandle(textHandle);
    EventRouter.dispatchCrossSelectionChanged(areaHandle, "Portal");

    expect<i32>(MobileTextSelectionToolbarManager.itemCount()).toBe(2);
    expect<string>(MobileTextSelectionToolbarManager.itemLabel(0)).toBe("Copy");
    expect<string>(MobileTextSelectionToolbarManager.itemLabel(1)).toBe("Select all");

    const panel = changetype<Node>(MobileTextSelectionToolbarManager.panelNode());
    const selectAllButton = changetype<Node>(panel.getChildAt(2));
    resetCalls();

    EventRouter.dispatchPointerEvent(
      selectAllButton.builtHandle,
      PointerEventType.Up,
      120.0,
      112.0,
      0,
      205,
      PointerType.Touch,
    );

    const callIndex = findCall(CALL_SELECT_ALL_TEXT);
    expect<bool>(callIndex >= 0).toBe(true);
    expect<f64>(getCallArg(callIndex, 0)).toBe(<f64>textHandle);
    expect<i32>(findCall(CALL_REQUEST_FOCUS)).toBe(-1);
  });

  it("keeps pending cross-selection Select all target across same-selection refreshes", () => {
    SelectionHandleAdornerManager.createDefaultHost().build();
    MobileTextSelectionToolbarManager.createDefaultHost().build();
    const text = new Text("Portal selection");
    const textHandle = text.build();
    const area = new Text("Area shell");
    const areaHandle = area.build();
    setCoarsePointer(true);
    seedCrossSelectionEndpointRects(areaHandle);

    MobileTextSelectionToolbarManager.setPendingCrossSelectionTextHandle(textHandle);
    EventRouter.dispatchCrossSelectionChanged(areaHandle, "Portal");
    EventRouter.dispatchCrossSelectionChanged(areaHandle, "Portal");

    expect<i32>(MobileTextSelectionToolbarManager.itemCount()).toBe(2);
    expect<string>(MobileTextSelectionToolbarManager.itemLabel(1)).toBe("Select all");

    const panel = changetype<Node>(MobileTextSelectionToolbarManager.panelNode());
    const selectAllButton = changetype<Node>(panel.getChildAt(2));
    resetCalls();

    EventRouter.dispatchPointerEvent(
      selectAllButton.builtHandle,
      PointerEventType.Up,
      120.0,
      112.0,
      0,
      207,
      PointerType.Touch,
    );

    const callIndex = findCall(CALL_SELECT_ALL_TEXT);
    expect<bool>(callIndex >= 0).toBe(true);
    expect<f64>(getCallArg(callIndex, 0)).toBe(<f64>textHandle);
  });

  it("shows cross-selection Select all without a pending text target", () => {
    SelectionHandleAdornerManager.createDefaultHost().build();
    MobileTextSelectionToolbarManager.createDefaultHost().build();
    const text = new Text("Portal selection");
    const area = new FlexBox().child(text);
    const areaHandle = area.build();
    setCoarsePointer(true);
    seedCrossSelectionEndpointRects(areaHandle);

    EventRouter.dispatchCrossSelectionChanged(areaHandle, "Portal");

    expect<i32>(MobileTextSelectionToolbarManager.itemCount()).toBe(2);
    expect<string>(MobileTextSelectionToolbarManager.itemLabel(0)).toBe("Copy");
    expect<string>(MobileTextSelectionToolbarManager.itemLabel(1)).toBe("Select all");
    resetCalls();

    MobileTextSelectionToolbarManager.invokeSlot(1);

    const callIndex = findCall(CALL_SELECT_ALL_TEXT);
    expect<bool>(callIndex >= 0).toBe(true);
    expect<f64>(getCallArg(callIndex, 0)).toBe(<f64>areaHandle);
  });
});
