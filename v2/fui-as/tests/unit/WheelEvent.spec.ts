import { EventRouter } from "../../src/core/EventRouter";
import { WheelDeltaMode, WheelEventArgs } from "../../src/core/Node";
import { FlexBox } from "../../src/nodes";
import { setNodeBounds } from "./FfiTestImports";

let childCount: i32 = 0;
let parentCount: i32 = 0;
let childHandled: bool = false;
let parentHandled: bool = false;
let lastChildLocalX: f32 = 0.0;
let lastChildLocalY: f32 = 0.0;
let lastChildSceneX: f32 = 0.0;
let lastChildSceneY: f32 = 0.0;
let lastChildDeltaX: f32 = 0.0;
let lastChildDeltaY: f32 = 0.0;
let lastChildDeltaMode: WheelDeltaMode = WheelDeltaMode.Pixel;
let lastChildModifiers: u32 = 0;
let lastParentLocalX: f32 = 0.0;

class WheelOwner {
  count: i32 = 0;
  lastDeltaY: f32 = 0.0;
}

function makeHandle(index: u32, generation: u32): u64 {
  return (<u64>generation << 32) | <u64>index;
}

function resetWheelState(): void {
  childCount = 0;
  parentCount = 0;
  childHandled = false;
  parentHandled = false;
  lastChildLocalX = 0.0;
  lastChildLocalY = 0.0;
  lastChildSceneX = 0.0;
  lastChildSceneY = 0.0;
  lastChildDeltaX = 0.0;
  lastChildDeltaY = 0.0;
  lastChildDeltaMode = WheelDeltaMode.Pixel;
  lastChildModifiers = 0;
  lastParentLocalX = 0.0;
}

function handleChildWheel(event: WheelEventArgs): void {
  childCount += 1;
  lastChildLocalX = event.x;
  lastChildLocalY = event.y;
  lastChildSceneX = event.sceneX;
  lastChildSceneY = event.sceneY;
  lastChildDeltaX = event.deltaX;
  lastChildDeltaY = event.deltaY;
  lastChildDeltaMode = event.deltaMode;
  lastChildModifiers = event.modifiers;
  event.handled = childHandled;
}

function handleParentWheel(event: WheelEventArgs): void {
  parentCount += 1;
  lastParentLocalX = event.x;
  event.handled = parentHandled;
}

describe("WheelEvent", () => {
  it("bubbles from child to parent until handled", () => {
    EventRouter.reset();
    resetWheelState();

    const parent = new FlexBox();
    const child = new FlexBox();
    parent.onWheel(handleParentWheel);
    child.onWheel(handleChildWheel);
    parent.child(child);
    parent.build();
    setNodeBounds(parent.builtHandle, 10.0, 0.0, 100.0, 100.0);
    setNodeBounds(child.builtHandle, 30.0, 0.0, 50.0, 50.0);

    let handled = EventRouter.dispatchWheelEvent(child.builtHandle, 42.0, 8.0, 3.0, 24.0, WheelDeltaMode.Line, 5);

    expect<bool>(handled).toBe(false);
    expect<i32>(childCount).toBe(1);
    expect<i32>(parentCount).toBe(1);
    expect<f32>(lastChildLocalX).toBe(12.0);
    expect<f32>(lastChildLocalY).toBe(8.0);
    expect<f32>(lastChildSceneX).toBe(42.0);
    expect<f32>(lastChildSceneY).toBe(8.0);
    expect<f32>(lastChildDeltaX).toBe(3.0);
    expect<f32>(lastChildDeltaY).toBe(24.0);
    expect<WheelDeltaMode>(lastChildDeltaMode).toBe(WheelDeltaMode.Line);
    expect<u32>(lastChildModifiers).toBe(5);
    expect<f32>(lastParentLocalX).toBe(32.0);

    resetWheelState();
    childHandled = true;
    handled = EventRouter.dispatchWheelEvent(child.builtHandle, 42.0, 8.0, 0.0, 24.0, WheelDeltaMode.Pixel, 0);

    expect<bool>(handled).toBe(true);
    expect<i32>(childCount).toBe(1);
    expect<i32>(parentCount).toBe(0);

    child.dispose();
    parent.dispose();
  });

  it("skips disabled child and routes to enabled parent", () => {
    EventRouter.reset();
    resetWheelState();

    const parent = new FlexBox();
    const child = new FlexBox();
    parent.onWheel(handleParentWheel);
    child.onWheel(handleChildWheel);
    parent.child(child);
    parent.build();
    child.enabled(false);
    parentHandled = true;

    const handled = EventRouter.dispatchWheelEvent(child.builtHandle, 42.0, 8.0, 0.0, 24.0, WheelDeltaMode.Pixel, 0);

    expect<bool>(handled).toBe(true);
    expect<i32>(childCount).toBe(0);
    expect<i32>(parentCount).toBe(1);

    child.dispose();
    parent.dispose();
  });

  it("supports owner-bound wheel callbacks", () => {
    EventRouter.reset();

    const owner = new WheelOwner();
    const node = new FlexBox();
    node.onWheelWith<WheelOwner>(owner, (target: WheelOwner, event: WheelEventArgs): void => {
      target.count += 1;
      target.lastDeltaY = event.deltaY;
      event.handled = true;
    });
    node.build();

    const handled = EventRouter.dispatchWheelEvent(node.builtHandle, 18.0, 9.0, 0.0, 14.0, WheelDeltaMode.Pixel, 0);

    expect<bool>(handled).toBe(true);
    expect<i32>(owner.count).toBe(1);
    expect<f32>(owner.lastDeltaY).toBe(14.0);

    node.dispose();
  });
});
