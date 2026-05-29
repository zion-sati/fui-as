import {
  Button,
  EventRouter,
  KeyEventType,
  KeyModifier,
  PointerEventType,
  CALL_SET_DROP_SHADOW,
  findCall,
  resetCalls,
  resetTheme,
} from "./ButtonTestUtils";

describe("Button", () => {
  it("does not restore the focus ring for shortcut-modified key presses", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const button = new Button("Action");
    const handle = button.build();
    button._handlePointerEvent(PointerEventType.Down, 12.0, 24.0, 0);
    EventRouter.dispatchFocusChanged(handle, true);
    resetCalls();

    EventRouter.dispatchKeyEvent(handle, KeyEventType.Down, "a", <u32>KeyModifier.Meta);

    expect<i32>(findCall(CALL_SET_DROP_SHADOW)).toBe(-1);

    button.dispose();
    resetTheme();
  });
});
