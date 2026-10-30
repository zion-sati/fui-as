import { Popup, PopupPlacement } from "../../src/controls/Popup";
import { FlexBox } from "../../src/nodes";
import { PointerEventType, Unit } from "../../src/core/ffi";
import { PointerButton, PointerButtons, PointerEventArgs, PointerType } from "../../src/core/Node";
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
  setNodeBounds,
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

function click(node: FlexBox, x: f32, y: f32): void {
  node._handlePointerEventWithArgs(new PointerEventArgs(
    PointerEventType.Down, x, y, 0, 1, PointerType.Mouse, PointerButton.Primary, PointerButtons.Primary));
  node._handlePointerEventWithArgs(new PointerEventArgs(
    PointerEventType.Up, x, y, 0, 1, PointerType.Mouse, PointerButton.Primary, PointerButtons.None));
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

  it("keeps the popup open for clicks on its panel and hides it for backdrop clicks", () => {
    resetCalls();

    const popup = new Popup();
    popup.build();
    popup.showAtPoint(24.0, 36.0, 220.0, 96.0);
    setNodeBounds(popup.surface.builtHandle, 24.0, 36.0, 220.0, 96.0);
    const overlay = changetype<FlexBox>(popup.surface.parentNode);

    click(overlay, 60.0, 50.0);
    expect<bool>(popup.isOpen).toBe(true);

    click(overlay, 400.0, 300.0);
    expect<bool>(popup.isOpen).toBe(false);

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
