import { Button, Dialog, Form } from "../../src/controls";
import { EventRouter } from "../../src/core/EventRouter";
import { __fui_key_buffer, __fui_on_focus_changed, __fui_on_key_event } from "../../src/core/event_exports";
import { KeyEventType, Unit } from "../../src/core/ffi";
import { activeTheme, defaultDarkTheme, generateTheme, useCustomTheme } from "../../src/core/Theme";
import {
  CALL_ADD_CHILD,
  CALL_PUSH_SEMANTIC_SCOPE,
  CALL_REMOVE_CHILD,
  CALL_REMOVE_SEMANTIC_SCOPE,
  CALL_SET_BACKGROUND_COLOR,
  CALL_SET_BACKGROUND_BLUR,
  CALL_SET_BOX_STYLE,
  CALL_SET_DROP_SHADOW,
  CALL_REQUEST_FOCUS,
  findCall,
  getCallArg,
  getCallSequence,
  resetCalls,
} from "./FfiTestImports";

let acceptCount: i32 = 0;
let cancelCount: i32 = 0;

function resetCounts(): void {
  acceptCount = 0;
  cancelCount = 0;
}

function handleAccept(): void {
  acceptCount += 1;
}

function handleCancel(): void {
  cancelCount += 1;
}

function lastBackgroundColor(): u32 {
  const sequence = getCallSequence();
  let index = -1;
  for (let i = 0; i < sequence.length; ++i) {
    if (unchecked(sequence[i]) == CALL_SET_BACKGROUND_COLOR) {
      index = i;
    }
  }
  if (index < 0) {
    unreachable();
  }
  return <u32>getCallArg(index, 1);
}

function findBoxStyleByColor(color: u32): i32 {
  const sequence = getCallSequence();
  for (let i = 0; i < sequence.length; ++i) {
    if (unchecked(sequence[i]) == CALL_SET_BOX_STYLE && <u32>getCallArg(i, 1) == color) {
      return i;
    }
  }
  return -1;
}

function findDropShadowByColor(color: u32): i32 {
  const sequence = getCallSequence();
  for (let i = 0; i < sequence.length; ++i) {
    if (unchecked(sequence[i]) == CALL_SET_DROP_SHADOW && <u32>getCallArg(i, 1) == color) {
      return i;
    }
  }
  return -1;
}

describe("Dialog and Form", () => {
  afterEach(() => {
    activeTheme.value = defaultDarkTheme;
  });

  it("presses the default and cancel buttons on Enter/Escape down and fires on key up", () => {
    EventRouter.reset();
    resetCounts();
    resetCalls();

    const form = new Form();
    const accept = new Button("OK").onClick(handleAccept);
    const cancel = new Button("Cancel").onClick(handleCancel);
    form.width(100.0, Unit.Percent);
    form.defaultBtn(accept);
    form.cancelBtn(cancel);
    form.child(accept);
    form.child(cancel);
    form.build();
    form.activate();

    resetCalls();
    expect<bool>(EventRouter.dispatchGlobalKeyEvent(KeyEventType.Down, "Enter", 0)).toBe(true);
    expect<u32>(lastBackgroundColor()).toBe(defaultDarkTheme.colors.accentPressed);
    expect<i32>(acceptCount).toBe(0);

    expect<bool>(EventRouter.dispatchGlobalKeyEvent(KeyEventType.Up, "Enter", 0)).toBe(true);
    expect<i32>(acceptCount).toBe(1);

    resetCalls();
    expect<bool>(EventRouter.dispatchGlobalKeyEvent(KeyEventType.Down, "Escape", 0)).toBe(true);
    expect<u32>(lastBackgroundColor()).toBe(defaultDarkTheme.colors.accentPressed);
    expect<i32>(cancelCount).toBe(0);

    expect<bool>(EventRouter.dispatchGlobalKeyEvent(KeyEventType.Up, "Escape", 0)).toBe(true);
    expect<i32>(cancelCount).toBe(1);

    form.deactivate();
    accept.dispose();
    cancel.dispose();
    form.dispose();
  });

  it("cancels an armed form button when the form deactivates", () => {
    EventRouter.reset();
    resetCounts();

    const form = new Form();
    const accept = new Button("OK").onClick(handleAccept);
    form.defaultBtn(accept).child(accept);
    form.build();
    form.activate();

    expect<bool>(EventRouter.dispatchGlobalKeyEvent(KeyEventType.Down, "Enter", 0)).toBe(true);
    form.deactivate();
    expect<bool>(EventRouter.dispatchGlobalKeyEvent(KeyEventType.Up, "Enter", 0)).toBe(false);
    expect<i32>(acceptCount).toBe(0);

    accept.dispose();
    form.dispose();
  });

  it("lets a focused button handle Enter instead of the form default accept", () => {
    EventRouter.reset();
    resetCounts();
    resetCalls();

    const form = new Form();
    const accept = new Button("OK").onClick(handleAccept);
    const cancel = new Button("Cancel").onClick(handleCancel);
    form.defaultBtn(accept);
    form.cancelBtn(cancel);
    form.child(accept);
    form.child(cancel);
    form.build();
    form.activate();

    const cancelHandle = cancel.builtHandle;
    __fui_on_focus_changed(cancelHandle, true);

    const enter = Uint8Array.wrap(String.UTF8.encode("Enter", false));
    const keyBufferPtr = __fui_key_buffer();
    memory.copy(keyBufferPtr, enter.dataStart, enter.length);

    __fui_on_key_event(KeyEventType.Down, keyBufferPtr, <u32>enter.length, 0);
    expect<i32>(acceptCount).toBe(0);
    expect<i32>(cancelCount).toBe(0);
    expect<u32>(lastBackgroundColor()).toBe(defaultDarkTheme.colors.accentPressed);

    __fui_on_key_event(KeyEventType.Up, keyBufferPtr, <u32>enter.length, 0);
    expect<i32>(acceptCount).toBe(0);
    expect<i32>(cancelCount).toBe(1);

    form.deactivate();
    accept.dispose();
    cancel.dispose();
    form.dispose();
  });

  it("shows a dialog, accepts on Enter key up, and removes the overlay", () => {
    EventRouter.reset();
    resetCounts();
    resetCalls();

    const dialog = new Dialog("Confirm action", "Body copy").onAccept(handleAccept);
    dialog.build();
    resetCalls();

    dialog.show();
    expect<i32>(findCall(CALL_ADD_CHILD)).toBeGreaterThan(-1);

    resetCalls();
    expect<bool>(EventRouter.dispatchGlobalKeyEvent(KeyEventType.Down, "Enter", 0)).toBe(true);
    expect<i32>(acceptCount).toBe(0);
    expect<i32>(findCall(CALL_REMOVE_CHILD)).toBe(-1);

    expect<bool>(EventRouter.dispatchGlobalKeyEvent(KeyEventType.Up, "Enter", 0)).toBe(true);
    expect<i32>(acceptCount).toBe(1);
    expect<i32>(findCall(CALL_REMOVE_CHILD)).toBeGreaterThan(-1);

    dialog.dispose();
  });

  it("requests focus for the accept button when a dialog is shown", () => {
    EventRouter.reset();
    resetCalls();

    const opener = new Button("Open dialog");
    const dialog = new Dialog("Confirm action", "Body copy");
    opener.build();
    dialog.build();
    resetCalls();

    dialog.show();

    const focusIndex = findCall(CALL_REQUEST_FOCUS);
    expect<i32>(focusIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(focusIndex, 0)).toBe(<f64>dialog.acceptActionButton.builtHandle);

    opener.dispose();
    opener.dispose();
    dialog.dispose();
  });

  it("cancels a dialog on Escape key up", () => {
    EventRouter.reset();
    resetCounts();
    resetCalls();

    const dialog = new Dialog("Confirm action", "Body copy").onCancel(handleCancel);
    dialog.build();
    dialog.show();
    resetCalls();

    expect<bool>(EventRouter.dispatchGlobalKeyEvent(KeyEventType.Down, "Escape", 0)).toBe(true);
    expect<i32>(cancelCount).toBe(0);
    expect<bool>(EventRouter.dispatchGlobalKeyEvent(KeyEventType.Up, "Escape", 0)).toBe(true);
    expect<i32>(cancelCount).toBe(1);
    expect<i32>(findCall(CALL_REMOVE_CHILD)).toBeGreaterThan(-1);

    dialog.dispose();
  });

  it("applies dialog backdrop styling overrides and scopes semantics while visible", () => {
    EventRouter.reset();
    resetCalls();

    const dialog = new Dialog("Confirm action", "Body copy")
      .backdropColor(0x11223344)
      .backgroundBlur(9.0)
      .cardShadow(0x55667788, 1.0, 5.0, 12.0, 3.0);
    dialog.build();
    resetCalls();

    dialog.show();
    expect<i32>(findCall(CALL_PUSH_SEMANTIC_SCOPE)).toBeGreaterThan(-1);
    expect<i32>(findBoxStyleByColor(0x11223344)).toBeGreaterThan(-1);

    const blurIndex = findCall(CALL_SET_BACKGROUND_BLUR);
    expect<i32>(blurIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(blurIndex, 1)).toBe(9.0);

    const shadowIndex = findCall(CALL_SET_DROP_SHADOW);
    expect<i32>(shadowIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(shadowIndex, 1)).toBe(0x55667788);
    expect<f64>(getCallArg(shadowIndex, 2)).toBe(1.0);
    expect<f64>(getCallArg(shadowIndex, 3)).toBe(5.0);
    expect<f64>(getCallArg(shadowIndex, 4)).toBe(12.0);
    expect<f64>(getCallArg(shadowIndex, 5)).toBe(3.0);

    resetCalls();
    dialog.hide();
    expect<i32>(findCall(CALL_REMOVE_SEMANTIC_SCOPE)).toBeGreaterThan(-1);

    dialog.dispose();
  });

  it("updates dialog defaults when the active theme changes", () => {
    EventRouter.reset();
    resetCalls();

    const dialog = new Dialog("Confirm action", "Body copy");
    dialog.build();
    dialog.show();
    resetCalls();

    const nextTheme = generateTheme(false, 0xdb2777ff);
    useCustomTheme(nextTheme);

    expect<i32>(findBoxStyleByColor(nextTheme.colors.dialogBackdrop)).toBeGreaterThan(-1);
    expect<i32>(findBoxStyleByColor(nextTheme.colors.surface)).toBeGreaterThan(-1);

    const shadowIndex = findDropShadowByColor(nextTheme.colors.dialogShadow);
    expect<i32>(shadowIndex).toBeGreaterThan(-1);

    dialog.dispose();
  });

  it("supports explicit card styling and exposes child controls", () => {
    EventRouter.reset();
    resetCalls();

    const dialog = new Dialog("Confirm action", "Body copy")
      .cardColor(0x11223344)
      .cardBorder(2.0, 0x22334455)
      .cardCornerRadius(18.0);
    expect<bool>(dialog.titleText !== null).toBe(true);
    expect<bool>(dialog.bodyText !== null).toBe(true);
    expect<bool>(dialog.acceptActionButton !== dialog.cancelActionButton).toBe(true);
    dialog.build();
    resetCalls();

    dialog.show();
    const cardStyleIndex = findBoxStyleByColor(0x11223344);
    expect<i32>(cardStyleIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(cardStyleIndex, 2)).toBe(18.0);
    expect<f64>(getCallArg(cardStyleIndex, 6)).toBe(2.0);
    expect<f64>(getCallArg(cardStyleIndex, 7)).toBe(0x22334455);

    dialog.dispose();
  });
});
