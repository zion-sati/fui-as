import { DragDataObject, DragDropEffects, DragEventArgs, DropProposal } from "../../src/Fui";
import { EventRouter } from "../../src/core/EventRouter";
import { CursorStyle, PointerEventType } from "../../src/core/ffi";
import { Node } from "../../src/core/Node";
import { FlexBox, ScrollBar, ScrollState, Text } from "../../src/nodes";
import {
  CALL_SET_CURSOR,
  CALL_SET_INTERACTIVE,
  findCall,
  getCallArg,
  getCallSequence,
  resetCalls,
  setCoarsePointer,
} from "./FfiTestImports";

function makeHandle(index: u32, generation: u32): u64 {
  return (<u64>generation << 32) | <u64>index;
}

function lastCursorStyle(): CursorStyle {
  const sequence = getCallSequence();
  let index = -1;
  for (let cursor = 0; cursor < sequence.length; ++cursor) {
    if (unchecked(sequence[cursor]) == CALL_SET_CURSOR) {
      index = cursor;
    }
  }
  if (index < 0) {
    unreachable();
  }
  return <CursorStyle>getCallArg(index, 0);
}

function requireChild(node: Node, index: i32): Node {
  return node.getChildAt(index)!;
}

describe("Cursor styles", () => {
  it("shows a pointer cursor for pointer-styled nodes and restores default when leaving the canvas", () => {
    setCoarsePointer(false);
    EventRouter.reset();
    resetCalls();

    const node = new FlexBox().cursor(CursorStyle.Pointer);
    EventRouter.register(makeHandle(31, 1), node);
    resetCalls();

    EventRouter.dispatchPointerEvent(makeHandle(31, 1), PointerEventType.Enter, 12.0, 24.0);
    expect<CursorStyle>(lastCursorStyle()).toBe(CursorStyle.Pointer);

    EventRouter.dispatchPointerEvent(<u64>0, PointerEventType.Leave, 0.0, 0.0);
    expect<CursorStyle>(lastCursorStyle()).toBe(CursorStyle.Default);
  });

  it("shows an I-beam cursor for plain text by default", () => {
    setCoarsePointer(false);
    EventRouter.reset();
    resetCalls();

    const text = new Text("Selectable");
    const handle = text.build();
    resetCalls();

    EventRouter.dispatchPointerEvent(handle, PointerEventType.Enter, 8.0, 8.0);
    expect<CursorStyle>(lastCursorStyle()).toBe(CursorStyle.Text);

    text.dispose();
  });

  it("restores the previous hovered cursor when a top node leaves", () => {
    setCoarsePointer(false);
    EventRouter.reset();
    resetCalls();

    const lowerNode = new FlexBox().cursor(CursorStyle.Pointer);
    const upperNode = new FlexBox().cursor(CursorStyle.Text);
    const lowerHandle = makeHandle(41, 1);
    const upperHandle = makeHandle(42, 1);

    EventRouter.register(lowerHandle, lowerNode);
    EventRouter.register(upperHandle, upperNode);
    resetCalls();

    EventRouter.dispatchPointerEvent(lowerHandle, PointerEventType.Enter, 1.0, 1.0);
    EventRouter.dispatchPointerEvent(upperHandle, PointerEventType.Enter, 2.0, 2.0);
    expect<CursorStyle>(lastCursorStyle()).toBe(CursorStyle.Text);

    EventRouter.dispatchPointerEvent(upperHandle, PointerEventType.Leave, 2.0, 2.0);
    expect<CursorStyle>(lastCursorStyle()).toBe(CursorStyle.Pointer);
  });

  it("removes destroyed hovered nodes from the hover stack", () => {
    setCoarsePointer(false);
    EventRouter.reset();
    resetCalls();

    const lowerNode = new FlexBox().cursor(CursorStyle.Pointer);
    const upperNode = new FlexBox().cursor(CursorStyle.Text);
    EventRouter.register(makeHandle(51, 1), lowerNode);
    EventRouter.register(makeHandle(52, 1), upperNode);

    EventRouter.dispatchPointerEvent(makeHandle(51, 1), PointerEventType.Enter, 1.0, 1.0);
    EventRouter.dispatchPointerEvent(makeHandle(52, 1), PointerEventType.Enter, 2.0, 2.0);
    resetCalls();

    upperNode.dispose();
    expect<CursorStyle>(lastCursorStyle()).toBe(CursorStyle.Pointer);
  });

  it("switches the scrollbar thumb cursor while dragging", () => {
    setCoarsePointer(false);
    EventRouter.reset();
    resetCalls();

    const scrollState = new ScrollState();
    scrollState.viewportHeight.value = 120.0;
    scrollState.contentHeight.value = 360.0;
    const scrollBar = new ScrollBar(scrollState);
    const track = scrollBar.render();
    track.build();

    const trackColumn = requireChild(track, 0);
    const thumbNode = requireChild(trackColumn, 1) as FlexBox;
    const thumbHandle = thumbNode.builtHandle;
    resetCalls();

    EventRouter.dispatchPointerEvent(thumbHandle, PointerEventType.Enter, 4.0, 8.0);
    expect<CursorStyle>(lastCursorStyle()).toBe(CursorStyle.Grab);

    EventRouter.dispatchPointerEvent(thumbHandle, PointerEventType.Down, 4.0, 8.0);
    expect<CursorStyle>(lastCursorStyle()).toBe(CursorStyle.Grabbing);

    EventRouter.dispatchPointerEvent(thumbHandle, PointerEventType.Up, 4.0, 24.0);
    expect<CursorStyle>(lastCursorStyle()).toBe(CursorStyle.Grab);

    scrollBar.dispose();
    track.dispose();
  });

  it("overrides the captured cursor during drag/drop negotiation", () => {
    setCoarsePointer(false);
    EventRouter.reset();
    resetCalls();

    const source = new FlexBox()
      .cursor(CursorStyle.Grab)
      .bindDragData<FlexBox>(new FlexBox(), (_owner: FlexBox): DragDataObject => new DragDataObject().setText("row"))
      .dragAllowedEffects(DragDropEffects.Move);
    const target = new FlexBox()
      .allowDrop(true)
      .onDragOverWith<FlexBox>(new FlexBox(), (_owner: FlexBox, _args: DragEventArgs): DropProposal =>
        new DropProposal(DragDropEffects.Move, false)
      );

    EventRouter.register(makeHandle(71, 1), source);
    EventRouter.register(makeHandle(72, 1), target);
    resetCalls();

    EventRouter.dispatchPointerEvent(source.builtHandle, PointerEventType.Down, 4.0, 4.0);
    EventRouter.dispatchPointerEvent(source.builtHandle, PointerEventType.Move, 10.0, 4.0);
    expect<CursorStyle>(lastCursorStyle()).toBe(CursorStyle.Grabbing);

    EventRouter.dispatchPointerEvent(target.builtHandle, PointerEventType.Move, 24.0, 12.0);
    expect<CursorStyle>(lastCursorStyle()).toBe(CursorStyle.Move);

    EventRouter.dispatchPointerEvent(<u64>0, PointerEventType.Leave, 30.0, 18.0);
    expect<CursorStyle>(lastCursorStyle()).toBe(CursorStyle.Grabbing);

    EventRouter.dispatchPointerEvent(<u64>0, PointerEventType.Up, 30.0, 18.0);
    expect<CursorStyle>(lastCursorStyle()).toBe(CursorStyle.Default);
  });

  it("keeps the grabbing cursor while the scrollbar thumb drag leaves the track", () => {
    setCoarsePointer(false);
    EventRouter.reset();
    resetCalls();

    const scrollState = new ScrollState();
    scrollState.viewportHeight.value = 120.0;
    scrollState.contentHeight.value = 360.0;
    const scrollBar = new ScrollBar(scrollState);
    const track = scrollBar.render();
    const trackHandle = track.build();

    const trackColumn = requireChild(track, 0);
    const thumbNode = requireChild(trackColumn, 1) as FlexBox;
    const thumbHandle = thumbNode.builtHandle;
    resetCalls();

    EventRouter.dispatchPointerEvent(thumbHandle, PointerEventType.Enter, 4.0, 8.0);
    EventRouter.dispatchPointerEvent(thumbHandle, PointerEventType.Down, 4.0, 8.0);
    expect<CursorStyle>(lastCursorStyle()).toBe(CursorStyle.Grabbing);

    EventRouter.dispatchPointerEvent(thumbHandle, PointerEventType.Leave, 4.0, 8.0);
    expect<CursorStyle>(lastCursorStyle()).toBe(CursorStyle.Grabbing);

    EventRouter.dispatchPointerEvent(trackHandle, PointerEventType.Enter, 4.0, 20.0);
    expect<CursorStyle>(lastCursorStyle()).toBe(CursorStyle.Grabbing);

    EventRouter.dispatchPointerEvent(trackHandle, PointerEventType.Up, 4.0, 20.0);
    expect<CursorStyle>(lastCursorStyle()).toBe(CursorStyle.Default);

    scrollBar.dispose();
    track.dispose();
  });

  it("suppresses cursor updates on coarse pointers", () => {
    setCoarsePointer(true);
    EventRouter.reset();
    resetCalls();

    const node = new FlexBox().cursor(CursorStyle.Pointer);
    EventRouter.register(makeHandle(61, 1), node);
    resetCalls();

    EventRouter.dispatchPointerEvent(makeHandle(61, 1), PointerEventType.Enter, 12.0, 24.0);
    expect<i32>(findCall(CALL_SET_CURSOR)).toBe(-1);
    setCoarsePointer(false);
  });

  it("keeps retained scrollbars hit-testable without coarse cursor affordances", () => {
    setCoarsePointer(true);
    EventRouter.reset();
    resetCalls();

    const scrollState = new ScrollState();
    scrollState.viewportHeight.value = 120.0;
    scrollState.contentHeight.value = 360.0;
    const scrollBar = new ScrollBar(scrollState);
    scrollBar.render().build();

    expect<i32>(findCall(CALL_SET_INTERACTIVE)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_SET_CURSOR)).toBe(-1);

    scrollBar.dispose();
    setCoarsePointer(false);
  });
});
