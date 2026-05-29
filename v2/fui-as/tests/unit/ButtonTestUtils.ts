import { Button } from "../../src/controls";
import { CursorStyle, KeyEventType, KeyModifier, PointerEventType } from "../../src/core/ffi";
import { EventRouter } from "../../src/core/EventRouter";
import { activeTheme, defaultDarkTheme, generateTheme } from "../../src/core/Theme";
import { FontWeight } from "../../src/core/Typography";
import { FlexBox } from "../../src/nodes";
import {
  CALL_SET_BOX_STYLE,
  CALL_SET_CURSOR,
  CALL_SET_DROP_SHADOW,
  CALL_SET_FONT,
  CALL_SET_FOCUSABLE,
  CALL_SET_INTERACTIVE,
  CALL_SET_LAYER_EFFECT,
  CALL_CREATE_NODE,
  CALL_SET_BACKGROUND_COLOR,
  CALL_SET_TEXT,
  findCall,
  getCallCount,
  getCallSequence,
  getCallArg,
  lastTextEquals,
  resetCalls,
} from "./FfiTestImports";

let actionCount: i32 = 0;

export function incrementActionCount(): void {
  actionCount += 1;
}

export function resetActionCount(): void {
  actionCount = 0;
}

export function readActionCount(): i32 {
  return actionCount;
}

export function resetTheme(): void {
  activeTheme.value = defaultDarkTheme;
}

export function lastBackgroundColor(): u32 {
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

export function lastCallIndex(op: i32): i32 {
  const sequence = getCallSequence();
  let index = -1;
  for (let i = 0; i < sequence.length; ++i) {
    if (unchecked(sequence[i]) == op) {
      index = i;
    }
  }
  return index;
}

export function lastCursorStyle(): CursorStyle {
  const index = lastCallIndex(CALL_SET_CURSOR);
  if (index < 0) {
    unreachable();
  }
  return <CursorStyle>getCallArg(index, 0);
}

export function lastLayerOpacity(): f64 {
  const index = lastCallIndex(CALL_SET_LAYER_EFFECT);
  if (index < 0) {
    unreachable();
  }
  return getCallArg(index, 1);
}

export function lastBorderWidth(): f64 {
  const index = lastCallIndex(CALL_SET_BOX_STYLE);
  if (index < 0) {
    unreachable();
  }
  return getCallArg(index, 6);
}

export function lastBorderColor(): u32 {
  const index = lastCallIndex(CALL_SET_BOX_STYLE);
  if (index < 0) {
    unreachable();
  }
  return <u32>getCallArg(index, 7);
}

export function lastDropShadowColor(): u32 {
  const index = lastCallIndex(CALL_SET_DROP_SHADOW);
  if (index < 0) {
    unreachable();
  }
  return <u32>getCallArg(index, 1);
}

export function lastDropShadowSpread(): f64 {
  const index = lastCallIndex(CALL_SET_DROP_SHADOW);
  if (index < 0) {
    unreachable();
  }
  return getCallArg(index, 5);
}

export function hasHandleArg(op: i32, handle: u64, argIndex: i32, value: f64): bool {
  const count = getCallCount();
  const sequence = getCallSequence();
  for (let i = 0; i < count; ++i) {
    if (unchecked(sequence[i]) != op) {
      continue;
    }
    if (getCallArg(i, 0) == <f64>handle && getCallArg(i, argIndex) == value) {
      return true;
    }
  }
  return false;
}

export {
  Button,
  CursorStyle,
  KeyEventType,
  KeyModifier,
  PointerEventType,
  EventRouter,
  activeTheme,
  defaultDarkTheme,
  generateTheme,
  FontWeight,
  FlexBox,
  CALL_SET_BOX_STYLE,
  CALL_SET_CURSOR,
  CALL_SET_DROP_SHADOW,
  CALL_SET_FONT,
  CALL_SET_FOCUSABLE,
  CALL_SET_INTERACTIVE,
  CALL_SET_LAYER_EFFECT,
  CALL_CREATE_NODE,
  CALL_SET_BACKGROUND_COLOR,
  CALL_SET_TEXT,
  findCall,
  getCallArg,
  lastTextEquals,
  resetCalls,
};
