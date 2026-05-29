import { Popup, PopupPlacement } from "../../src/controls/Popup";
import { FlexBox } from "../../src/nodes";
import { Unit } from "../../src/core/ffi";
import {
  CALL_ADD_CHILD,
  CALL_PUSH_SEMANTIC_SCOPE,
  CALL_REMOVE_CHILD,
  CALL_REMOVE_SEMANTIC_SCOPE,
  CALL_SET_BACKGROUND_BLUR,
  CALL_SET_BOX_STYLE,
  CALL_SET_HEIGHT,
  CALL_SET_POSITION,
  CALL_SET_WIDTH,
  findCall,
  getCallArg,
  getCallSequence,
  resetCalls,
} from "./FfiTestImports";

function findBoxStyleByColor(color: u32): i32 {
  const target = color >>> 0;
  const sequence = getCallSequence();
  for (let index = 0; index < sequence.length; ++index) {
    if (unchecked(sequence[index]) == CALL_SET_BOX_STYLE && <u32>getCallArg(index, 1) == target) {
      return index;
    }
  }
  return -1;
}

function findCallWithArg(op: i32, argIndex: i32, value: f64): i32 {
  const sequence = getCallSequence();
  for (let index = 0; index < sequence.length; ++index) {
    if (unchecked(sequence[index]) == op && getCallArg(index, argIndex) == value) {
      return index;
    }
  }
  return -1;
}

describe("Popup", () => {
  it("shows anchored popup content with backdrop styling and semantic scope", () => {
    resetCalls();

    const popup = new Popup()
      .placement(PopupPlacement.Top)
      .backdropColor(0x11223344)
      .backgroundBlur(9.0)
      .panelColor(0x55667788)
      .child(new FlexBox().width(80.0, Unit.Pixel).height(24.0, Unit.Pixel));
    popup.build();
    resetCalls();

    popup.showAnchored(24.0, 80.0, 140.0, 30.0, 220.0, 96.0);

    expect<i32>(findCall(CALL_ADD_CHILD)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_PUSH_SEMANTIC_SCOPE)).toBeGreaterThan(-1);
    expect<i32>(findCallWithArg(CALL_SET_WIDTH, 1, 220.0)).toBeGreaterThan(-1);
    expect<i32>(findCallWithArg(CALL_SET_HEIGHT, 1, 96.0)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_SET_POSITION)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_SET_BACKGROUND_BLUR)).toBeGreaterThan(-1);
    expect<f64>(getCallArg(findCall(CALL_SET_BACKGROUND_BLUR), 1)).toBe(9.0);
    expect<i32>(findBoxStyleByColor(0x11223344)).toBeGreaterThan(-1);
    expect<i32>(findBoxStyleByColor(0x55667788)).toBeGreaterThan(-1);

    resetCalls();
    popup.hide();

    expect<i32>(findCall(CALL_REMOVE_CHILD)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_REMOVE_SEMANTIC_SCOPE)).toBeGreaterThan(-1);

    popup.dispose();
  });

  it("supports transparent blurred popup surfaces without blurring the full-window backdrop", () => {
    resetCalls();

    const popup = new Popup()
      .panelColor(0x55667744)
      .panelBackgroundBlur(11.0)
      .child(new FlexBox().width(80.0, Unit.Pixel).height(24.0, Unit.Pixel));
    popup.build();
    resetCalls();

    popup.showAtPoint(24.0, 36.0, 220.0, 96.0);

    expect<i32>(findCallWithArg(CALL_SET_BACKGROUND_BLUR, 1, 11.0)).toBeGreaterThan(-1);
    expect<i32>(findCallWithArg(CALL_SET_BACKGROUND_BLUR, 1, 0.0)).toBeGreaterThan(-1);
    expect<i32>(findBoxStyleByColor(0x55667744)).toBeGreaterThan(-1);

    popup.dispose();
  });
});
