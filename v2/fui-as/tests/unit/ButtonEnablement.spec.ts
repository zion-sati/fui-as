import {
  Button,
  CursorStyle,
  EventRouter,
  FlexBox,
  PointerEventType,
  CALL_SET_FOCUSABLE,
  CALL_SET_INTERACTIVE,
  incrementActionCount,
  hasHandleArg,
  lastCursorStyle,
  lastLayerOpacity,
  readActionCount,
  resetActionCount,
  resetCalls,
  resetTheme,
} from "./ButtonTestUtils";

describe("Button", () => {
  it("does not fire the action callback while disabled", () => {
    EventRouter.reset();
    resetTheme();
    resetActionCount();

    const button = new Button("Action").onClick(incrementActionCount);
    button.build();
    button.enabled(false);

    button._handlePointerEvent(PointerEventType.Down, 12.0, 24.0, 0);
    button._handlePointerEvent(PointerEventType.Up, 12.0, 24.0, 0);

    expect<i32>(readActionCount()).toBe(0);

    button.dispose();
    button.dispose();
    resetTheme();
  });

  it("dims and drops the pointer cursor when disabled", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const button = new Button("Action");
    button.build();

    button._handlePointerEvent(PointerEventType.Enter, 12.0, 24.0, 0);
    resetCalls();
    button.enabled(false);

    expect<bool>(lastLayerOpacity() > 0.37 && lastLayerOpacity() < 0.39).toBe(true);
    expect<CursorStyle>(button.cursorStyle).toBe(CursorStyle.Default);

    button.dispose();
    button.dispose();
    resetTheme();
  });

  it("restores the saved opacity and pointer cursor when re-enabled", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const button = new Button("Action");
    button.build();
    button.opacity(0.5);

    button._handlePointerEvent(PointerEventType.Enter, 12.0, 24.0, 0);
    button.enabled(false);
    resetCalls();
    button.enabled(true);

    expect<f64>(lastLayerOpacity()).toBe(0.5);
    expect<CursorStyle>(button.cursorStyle).toBe(CursorStyle.Pointer);

    button.dispose();
    button.dispose();
    resetTheme();
  });

  it("propagates disabled state from a parent container", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const parent = new FlexBox();
    const child = new Button("Action");
    parent.child(child);
    parent.build();
    const childHandle = child.builtHandle;
    resetCalls();

    parent.enabled(false);

    expect<bool>(hasHandleArg(CALL_SET_INTERACTIVE, childHandle, 1, 0)).toBe(true);
    expect<bool>(hasHandleArg(CALL_SET_FOCUSABLE, childHandle, 1, 0)).toBe(true);

    child.dispose();
    parent.dispose();
    resetTheme();
  });

  it("restores child button interactivity when a parent re-enables", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const parent = new FlexBox();
    const child = new Button("Action");
    parent.child(child);
    parent.build();
    const childHandle = child.builtHandle;

    parent.enabled(false);
    resetCalls();
    parent.enabled(true);

    expect<bool>(hasHandleArg(CALL_SET_INTERACTIVE, childHandle, 1, 1)).toBe(true);
    expect<bool>(hasHandleArg(CALL_SET_FOCUSABLE, childHandle, 1, 1)).toBe(true);

    child.dispose();
    parent.dispose();
    resetTheme();
  });
});
