import { FlexBox, HandleValue, Orientation, PointerEventType, ScrollBar, ScrollState } from "../../src/Fui";
import { EventRouter } from "../../src/core/EventRouter";

function requireChild<T>(node: FlexBox, index: i32): T {
  return node.getChildAt(index)! as T;
}

describe("ScrollBar drag", () => {
  it("keeps thumb dragging working through the shared drag gesture helper", () => {
    EventRouter.reset();

    const scrollState = new ScrollState();
    scrollState.viewportHeight.value = 100.0;
    scrollState.contentHeight.value = 300.0;
    scrollState.offsetY.value = 20.0;

    const scrollBar = new ScrollBar(scrollState, Orientation.Vertical);
    const track = scrollBar.render();
    track.build();

    const thumb = requireChild<FlexBox>(requireChild<FlexBox>(track, 0), 1);

    EventRouter.dispatchPointerEvent(thumb.builtHandle, PointerEventType.Down, 0.0, 10.0, 0);
    EventRouter.dispatchPointerEvent(<u64>HandleValue.Invalid, PointerEventType.Move, 0.0, 30.0, 0);
    EventRouter.dispatchPointerEvent(<u64>HandleValue.Invalid, PointerEventType.Up, 0.0, 30.0, 0);

    expect<f32>(scrollState.offsetY.value).toBeGreaterThan(79.9);
    expect<f32>(scrollState.offsetY.value).toBeLessThan(80.1);

    scrollBar.dispose();
    track.dispose();
  });

  it("cancels an active thumb drag when the chrome is hidden", () => {
    EventRouter.reset();

    const scrollState = new ScrollState();
    scrollState.viewportHeight.value = 120.0;
    scrollState.contentHeight.value = 360.0;
    scrollState.offsetY.value = 30.0;

    const scrollBar = new ScrollBar(scrollState, Orientation.Vertical);
    const track = scrollBar.render();
    track.build();

    const thumb = requireChild<FlexBox>(requireChild<FlexBox>(track, 0), 1);

    EventRouter.dispatchPointerEvent(thumb.builtHandle, PointerEventType.Down, 0.0, 12.0, 0);
    EventRouter.dispatchPointerEvent(<u64>HandleValue.Invalid, PointerEventType.Move, 0.0, 24.0, 0);
    const draggedOffset = scrollState.offsetY.value;

    scrollBar.chromeVisible(false);
    EventRouter.dispatchPointerEvent(<u64>HandleValue.Invalid, PointerEventType.Move, 0.0, 80.0, 0);

    expect<f32>(scrollState.offsetY.value).toBe(draggedOffset);

    scrollBar.dispose();
    track.dispose();
  });
});
