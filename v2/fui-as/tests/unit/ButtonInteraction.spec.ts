import {
  Button,
  EventRouter,
  FontWeight,
  KeyEventType,
  PointerEventType,
  PointerType,
  CALL_CREATE_NODE,
  CALL_SET_BACKGROUND_COLOR,
  CALL_SET_FONT,
  CALL_SET_TEXT,
  activeTheme,
  defaultDarkTheme,
  generateTheme,
  findCall,
  getCallArg,
  incrementActionCount,
  lastBackgroundColor,
  lastCallIndex,
  lastTextEquals,
  readActionCount,
  readLastActionClickCount,
  resetActionCount,
  resetCalls,
  resetTheme,
} from "./ButtonTestUtils";
import { ClickEventArgs } from "../../src/core/Node";
import { FontFamily, FontStack } from "../../src/core/Typography";

let baseClickHits: i32 = 0;
let doubleClickHits: i32 = 0;
let tripleClickHits: i32 = 0;

function resetMultiClickHits(): void {
  baseClickHits = 0;
  doubleClickHits = 0;
  tripleClickHits = 0;
}

function recordBaseClick(_event: ClickEventArgs): void {
  baseClickHits += 1;
}

function recordDoubleClick(_event: ClickEventArgs): void {
  doubleClickHits += 1;
}

function recordTripleClick(_event: ClickEventArgs): void {
  tripleClickHits += 1;
}

describe("Button", () => {
  it("shows the hovered accent color on pointer enter", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const button = new Button("Action");
    button.build();
    resetCalls();

    button._handlePointerEvent(PointerEventType.Enter, 12.0, 24.0, 0);

    expect<u32>(lastBackgroundColor()).toBe(defaultDarkTheme.colors.accentHovered);

    button.dispose();
    button.dispose();
    resetTheme();
  });

  it("shows the pressed accent color on pointer down", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const button = new Button("Action");
    button.build();
    resetCalls();

    button._handlePointerEvent(PointerEventType.Down, 12.0, 24.0, 0);

    expect<u32>(lastBackgroundColor()).toBe(defaultDarkTheme.colors.accentPressed);

    button.dispose();
    button.dispose();
    resetTheme();
  });

  it("fires the action callback on pointer release after a press", () => {
    EventRouter.reset();
    resetTheme();
    resetActionCount();

    const button = new Button("Action").onClick(incrementActionCount);
    button.build();

    button._handlePointerEvent(PointerEventType.Down, 12.0, 24.0, 0);
    button._handlePointerEvent(PointerEventType.Up, 12.0, 24.0, 0);

    expect<i32>(readActionCount()).toBe(1);
    expect<i32>(readLastActionClickCount()).toBe(1);

    button.dispose();
    button.dispose();
    resetTheme();
  });

  it("fires onClick for multi-click pointer release", () => {
    EventRouter.reset();
    resetTheme();
    resetActionCount();

    const button = new Button("Action").onClick(incrementActionCount);
    const handle = button.build();

    EventRouter.register(handle, button);
    EventRouter.dispatchPointerEvent(handle, PointerEventType.Down, 12.0, 24.0, 0, -1, PointerType.Mouse, 0, 1, 0.0, 0.0, 0.0, 2);
    EventRouter.dispatchPointerEvent(handle, PointerEventType.Up, 12.0, 24.0, 0, -1, PointerType.Mouse, 0, 0);

    expect<i32>(readActionCount()).toBe(1);
    expect<i32>(readLastActionClickCount()).toBe(1);

    button.dispose();
    button.dispose();
    resetTheme();
  });

  it("fires onClick for double and triple click activations as well as specialized callbacks", () => {
    EventRouter.reset();
    resetTheme();
    resetMultiClickHits();

    const button = new Button("Action")
      .onClick(recordBaseClick)
      .onDoubleClick(recordDoubleClick)
      .onTripleClick(recordTripleClick);
    button.build();

    button.beginPress();
    button.endPress(1, true);
    button.beginPress();
    button.endPress(2, true);
    button.beginPress();
    button.endPress(3, true);
    button.beginPress();
    button.endPress(4, true);

    expect<i32>(baseClickHits).toBe(4);
    expect<i32>(doubleClickHits).toBe(1);
    expect<i32>(tripleClickHits).toBe(1);

    button.dispose();
    button.dispose();
    resetTheme();
  });

  it("supports explicit press and release for keyboard-driven activation", () => {
    EventRouter.reset();
    resetTheme();
    resetActionCount();
    resetCalls();

    const button = new Button("Action").onClick(incrementActionCount);
    button.build();
    resetCalls();

    button.beginPress();
    expect<u32>(lastBackgroundColor()).toBe(defaultDarkTheme.colors.accentPressed);

    resetCalls();
    button.endPress(true);

    expect<i32>(readActionCount()).toBe(1);
    expect<u32>(lastBackgroundColor()).toBe(defaultDarkTheme.colors.accent);

    button.dispose();
    button.dispose();
    resetTheme();
  });

  it("activates on Enter key release", () => {
    EventRouter.reset();
    resetTheme();
    resetActionCount();
    resetCalls();

    const button = new Button("Action").onClick(incrementActionCount);
    const handle = button.build();
    resetCalls();

    EventRouter.dispatchFocusChanged(handle, true);
    EventRouter.dispatchKeyEvent(handle, KeyEventType.Down, "Enter", 0);
    expect<u32>(lastBackgroundColor()).toBe(defaultDarkTheme.colors.accentPressed);

    resetCalls();
    EventRouter.dispatchKeyEvent(handle, KeyEventType.Up, "Enter", 0);

    expect<i32>(readActionCount()).toBe(1);
    expect<u32>(lastBackgroundColor()).toBe(defaultDarkTheme.colors.accent);

    button.dispose();
    button.dispose();
    resetTheme();
  });

  it("activates on Space key release", () => {
    EventRouter.reset();
    resetTheme();
    resetActionCount();
    resetCalls();

    const button = new Button("Action").onClick(incrementActionCount);
    const handle = button.build();
    resetCalls();

    EventRouter.dispatchFocusChanged(handle, true);
    EventRouter.dispatchKeyEvent(handle, KeyEventType.Down, " ", 0);
    expect<u32>(lastBackgroundColor()).toBe(defaultDarkTheme.colors.accentPressed);

    resetCalls();
    EventRouter.dispatchKeyEvent(handle, KeyEventType.Up, " ", 0);

    expect<i32>(readActionCount()).toBe(1);
    expect<u32>(lastBackgroundColor()).toBe(defaultDarkTheme.colors.accent);

    button.dispose();
    button.dispose();
    resetTheme();
  });

  it("can cancel an explicit press without firing the action", () => {
    EventRouter.reset();
    resetTheme();
    resetActionCount();

    const button = new Button("Action").onClick(incrementActionCount);
    button.build();

    button.beginPress();
    button.cancelPress();
    button.endPress(true);

    expect<i32>(readActionCount()).toBe(0);

    button.dispose();
    button.dispose();
    resetTheme();
  });

  it("supports themed font weight overrides on the label", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const button = new Button("Action").fontWeight(FontWeight.Bold);
    button.build();

    const fontIndex = lastCallIndex(CALL_SET_FONT);
    expect<i32>(fontIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(fontIndex, 1)).toBe(2.0);
    expect<f64>(getCallArg(fontIndex, 2)).toBe(defaultDarkTheme.fonts.sizeBody);

    button.dispose();
    button.dispose();
    resetTheme();
  });

  it("cancels the action when the pointer leaves while pressed", () => {
    EventRouter.reset();
    resetTheme();
    resetActionCount();

    const button = new Button("Action").onClick(incrementActionCount);
    button.build();

    button._handlePointerEvent(PointerEventType.Down, 12.0, 24.0, 0);
    button._handlePointerEvent(PointerEventType.Leave, 14.0, 26.0, 0);
    button._handlePointerEvent(PointerEventType.Up, 14.0, 26.0, 0);

    expect<i32>(readActionCount()).toBe(0);

    button.dispose();
    button.dispose();
    resetTheme();
  });

  it("recolours when the active theme changes after build", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const button = new Button("Action");
    button.build();
    const nextTheme = generateTheme(true, 0xff8844ff);
    resetCalls();

    activeTheme.value = nextTheme;

    expect<u32>(lastBackgroundColor()).toBe(nextTheme.colors.accent);

    button.dispose();
    button.dispose();
    resetTheme();
  });

  it("supports explicit visual overrides without theme clobbering them", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const button = new Button("Action")
      .bgColor(0x11223344)
      .hoverBgColor(0x22334455)
      .pressedBgColor(0x33445566)
      .cornerRadius(14.0)
      .padding(15.0, 9.0, 11.0, 13.0)
      .border(2.0, 0x55667788)
      .fontFamily(FontFamily.withRegularStack(FontStack._fromId(3)))
      .fontSize(17.0)
      .textColor(0x778899aa);
    button.build();
    resetCalls();

    activeTheme.value = generateTheme(false, 0xdb2777ff);
    resetCalls();
    button._handlePointerEvent(PointerEventType.Enter, 12.0, 24.0, 0);
    expect<u32>(lastBackgroundColor()).toBe(0x22334455);

    resetCalls();
    button._handlePointerEvent(PointerEventType.Down, 12.0, 24.0, 0);
    expect<u32>(lastBackgroundColor()).toBe(0x33445566);

    button.dispose();
    button.dispose();
    resetTheme();
  });

  it("does not emit direct FFI updates before the handle exists", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const button = new Button("Action");
    resetCalls();
    const nextTheme = generateTheme(true, 0xff7744ff);

    activeTheme.value = nextTheme;

    expect<i32>(findCall(CALL_SET_BACKGROUND_COLOR)).toBe(-1);
    expect<i32>(findCall(CALL_CREATE_NODE)).toBe(-1);

    button.dispose();
    resetTheme();
  });

  it("rebuilds with its label after dispose", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const button = new Button("Action");
    button.build();
    button.dispose();
    resetCalls();

    button.build();

    expect<bool>(lastTextEquals("Action")).toBe(true);

    button.dispose();
    button.dispose();
    resetTheme();
  });

  it("updates the built label text without rebuilding", () => {
    EventRouter.reset();
    resetTheme();
    resetCalls();

    const button = new Button("Action");
    button.build();
    resetCalls();

    button.label("Copy");

    expect<i32>(findCall(CALL_SET_TEXT)).toBeGreaterThan(-1);
    expect<bool>(lastTextEquals("Copy")).toBe(true);

    button.dispose();
    button.dispose();
    resetTheme();
  });
});
