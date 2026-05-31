import {
  Application,
  Button,
  FlexBox,
  ScrollBox,
  Unit,
} from "../../src/Fui";
import { EventRouter } from "../../src/core/EventRouter";
import { FocusAdornerManager } from "../../src/core/FocusAdornerManager";
import * as ui from "../../src/bindings/ui";
import {
  CALL_SET_CLIP_TO_BOUNDS,
  getCallArg,
  getCallSequence,
  resetCalls,
} from "./FfiTestImports";

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

describe("FocusAdornerManager", () => {
  afterEach(() => {
    Application.unmount();
    EventRouter.reset();
  });

  it("uses an unclipped portal host and does not clamp rings to scroll-view bounds", () => {
    resetCalls();
    const button = new Button("Focus target")
      .width(100.0, Unit.Pixel)
      .height(28.0, Unit.Pixel) as Button;
    const content = new FlexBox()
      .width(120.0, Unit.Pixel)
      .height(120.0, Unit.Pixel)
      .child(button);
    const scrollBox = new ScrollBox()
      .scrollEnabledX(true)
      .scrollEnabledY(true)
      .width(50.0, Unit.Pixel)
      .height(60.0, Unit.Pixel)
      .child(content);
    const root = new FlexBox()
      .width(200.0, Unit.Pixel)
      .height(120.0, Unit.Pixel)
      .child(scrollBox);

    Application.mount(root);
    Application.flushRenders();

    const host = FocusAdornerManager.createDefaultHost();
    const clipCallIndex = lastCallIndexForHandle(CALL_SET_CLIP_TO_BOUNDS, host.builtHandle);
    expect<i32>(clipCallIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(clipCallIndex, 1)).toBe(0.0);

    EventRouter.dispatchFocusChanged(button.builtHandle, true);
    Application.flushRenders();

    const hostBounds = ui.tryGetBounds(host.builtHandle);
    if (hostBounds !== null) {
      expect<f32>(hostBounds[2]).toBeGreaterThan(50.0);
    }
  });
});
