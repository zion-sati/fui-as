import {
  Button,
  CALL_SET_BACKGROUND_COLOR,
  EventRouter,
  PointerEventType,
  defaultDarkTheme,
  findCall,
  lastBorderColor,
  lastBorderWidth,
  lastDropShadowColor,
  resetCalls,
  resetTheme,
} from "./ButtonTestUtils";
import { keyboardFocusVisible } from "../../src/core/FocusVisibility";

describe("Button", () => {
  it("keeps its in-bounds chrome stable while focus is delegated to the shared overlay", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const button = new Button("Action");
    const handle = button.build();
    resetCalls();

    EventRouter.dispatchFocusChanged(handle, true);

    expect<f64>(lastBorderWidth()).toBe(1.0);
    expect<u32>(lastBorderColor()).toBe(defaultDarkTheme.colors.border);
    expect<u32>(lastDropShadowColor()).toBe(0x00000000);

    button.dispose();
    resetTheme();
  });

  it("hides the focus ring after pointer interaction even when the button stays focused", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const button = new Button("Action");
    const handle = button.build();
    button._handlePointerEvent(PointerEventType.Down, 12.0, 24.0, 0);
    resetCalls();

    EventRouter.dispatchFocusChanged(handle, true);

    expect<u32>(lastDropShadowColor()).toBe(0x00000000);

    button.dispose();
    resetTheme();
  });

  it("reverts to the default border when focus leaves without restoring a shadow ring", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const button = new Button("Action");
    const handle = button.build();

    EventRouter.dispatchFocusChanged(handle, true);
    resetCalls();
    EventRouter.dispatchFocusChanged(handle, false);

    expect<f64>(lastBorderWidth()).toBe(1.0);
    expect<u32>(lastBorderColor()).toBe(defaultDarkTheme.colors.border);
    expect<u32>(lastDropShadowColor()).toBe(0x00000000);

    button.dispose();
    resetTheme();
  });

  it("keeps the border stable when disabled while focused", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const button = new Button("Action");
    const handle = button.build();

    EventRouter.dispatchFocusChanged(handle, true);
    resetCalls();
    button.enabled(false);

    expect<f64>(lastBorderWidth()).toBe(1.0);
    expect<u32>(lastBorderColor()).toBe(defaultDarkTheme.colors.border);
    expect<u32>(lastDropShadowColor()).toBe(0x00000000);

    button.dispose();
    resetTheme();
  });

  it("does not restyle button backgrounds when pointer focus visibility toggles", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const button = new Button("Action");
    button.build();
    resetCalls();

    keyboardFocusVisible.value = false;

    expect<i32>(findCall(CALL_SET_BACKGROUND_COLOR)).toBe(-1);

    button.dispose();
    EventRouter.reset();
    resetTheme();
  });
});
