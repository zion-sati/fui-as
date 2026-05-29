import {
  __fui_on_frame,
  __fui_on_viewport_changed,
  frameTimeSignal,
  viewportHeightSignal,
  viewportWidthSignal,
} from "../../src/core/event_exports";

let viewportNotificationCount: i32 = 0;
let frameNotificationCount: i32 = 0;

function countViewportNotification(): void {
  viewportNotificationCount += 1;
}

function countFrameNotification(): void {
  frameNotificationCount += 1;
}

describe("Continuous signals", () => {
  it("updates viewport signals via framework export", () => {
    __fui_on_viewport_changed(320.0, 180.0);

    expect<f32>(viewportWidthSignal.value).toBe(320.0);
    expect<f32>(viewportHeightSignal.value).toBe(180.0);
  });

  it("updates frame time signal via framework export", () => {
    __fui_on_frame(1234.5);

    expect<f64>(frameTimeSignal.value).toBe(1234.5);
  });

  it("notifies viewport listeners when viewport signals change", () => {
    viewportNotificationCount = 0;
    const widthListener = viewportWidthSignal.subscribe(countViewportNotification);
    const heightListener = viewportHeightSignal.subscribe(countViewportNotification);

    __fui_on_viewport_changed(101.0, 50.0);

    expect<i32>(viewportNotificationCount).toBe(2);
    widthListener.detach();
    heightListener.detach();
  });

  it("notifies frame listeners when the frame signal changes", () => {
    frameNotificationCount = 0;
    const listener = frameTimeSignal.subscribe(countFrameNotification);

    __fui_on_frame(1000.25);

    expect<i32>(frameNotificationCount).toBe(1);
    listener.detach();
  });

  it("does not notify unrelated listeners", () => {
    viewportNotificationCount = 0;
    const listener = viewportWidthSignal.subscribe(countViewportNotification);

    __fui_on_frame(2000.0);

    expect<i32>(viewportNotificationCount).toBe(0);
    listener.detach();
  });
});
