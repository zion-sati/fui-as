import { EventRouter } from "../../src/core/EventRouter";
import { PointerEventType } from "../../src/core/ffi";
import { FlexBox } from "../../src/nodes";

let clickCount: i32 = 0;

function makeHandle(index: u32, generation: u32): u64 {
  return (<u64>generation << 32) | <u64>index;
}

function handleClick(): void {
  clickCount += 1;
}

describe("EventRouterPointer", () => {
  it("dispatches pointer events to the registered node", () => {
    EventRouter.reset();
    clickCount = 0;

    const node = new FlexBox().onClick(handleClick);
    const handle = makeHandle(7, 1);

    EventRouter.register(handle, node);
    EventRouter.dispatchPointerEvent(handle, PointerEventType.Down, 12.0, 24.0);

    expect<i32>(clickCount).toBe(1);
  });
});
