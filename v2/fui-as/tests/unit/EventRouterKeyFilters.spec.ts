import { EventRouter, GlobalKeyHandler } from "../../src/core/EventRouter";
import { KeyEventType } from "../../src/core/ffi";

class RecordingKeyFilter implements GlobalKeyHandler {
  count: i32 = 0;

  handleGlobalKeyEvent(_eventType: KeyEventType, _key: string, _modifiers: u32): bool {
    this.count += 1;
    return true;
  }
}

describe("EventRouterKeyFilters", () => {
  it("dispatches global key filters from top to bottom", () => {
    EventRouter.reset();

    const filter = new RecordingKeyFilter();

    expect<bool>(EventRouter.dispatchGlobalKeyEvent(KeyEventType.Down, "Escape", 0)).toBe(false);

    EventRouter.pushKeyFilter(filter);

    expect<bool>(EventRouter.dispatchGlobalKeyEvent(KeyEventType.Down, "Escape", 0)).toBe(true);
    expect<i32>(filter.count).toBe(1);
  });
});
