import { CursorStyle, KeyEventType, KeyModifier, PointerEventType, SemanticRole } from "../../src/core/ffi";
import { EventRouter } from "../../src/core/EventRouter";
import { NavLink } from "../../src/controls";
import {
  CALL_SET_DROP_SHADOW,
  CALL_NAVIGATE_TO,
  CALL_HIDE_URL_PREVIEW,
  CALL_SET_FOCUSABLE,
  CALL_SET_INTERACTIVE,
  CALL_SET_SEMANTIC_LABEL,
  CALL_SET_SEMANTIC_ROLE,
  CALL_SHOW_URL_PREVIEW,
  findCall,
  getCallArg,
  lastNavigationTargetEquals,
  lastNavigationTargetLength,
  lastUrlPreviewEquals,
  lastUrlPreviewLength,
  resetCalls,
} from "./FfiTestImports";

let activationCount: i32 = 0;
let lastPath = "";

function recordActivation(path: string): void {
  activationCount += 1;
  lastPath = path;
}

describe("NavLink", () => {
  beforeEach(() => {
    activationCount = 0;
    lastPath = "";
  });

  it("builds as a focusable semantic link", () => {
    resetCalls();

    const link = new NavLink("/settings", "Settings");
    link.build();

    const roleIndex = findCall(CALL_SET_SEMANTIC_ROLE);
    expect<i32>(roleIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(roleIndex, 1)).toBe(<f64>SemanticRole.Link);
    expect<i32>(findCall(CALL_SET_SEMANTIC_LABEL)).toBeGreaterThan(-1);

    const focusableIndex = findCall(CALL_SET_FOCUSABLE);
    expect<i32>(focusableIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(focusableIndex, 1)).toBe(1.0);

    const interactiveIndex = findCall(CALL_SET_INTERACTIVE);
    expect<i32>(interactiveIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(interactiveIndex, 1)).toBe(1.0);
    expect<CursorStyle>(link.cursorStyle).toBe(CursorStyle.Pointer);
  });

  it("shows and hides the shared URL preview on hover", () => {
    resetCalls();

    const link = new NavLink("/settings", "Settings");
    link._handlePointerEvent(PointerEventType.Enter, 0.0, 0.0);

    expect<i32>(findCall(CALL_SHOW_URL_PREVIEW)).toBeGreaterThan(-1);
    expect<i32>(lastUrlPreviewLength()).toBe(9);
    expect<bool>(lastUrlPreviewEquals("/settings")).toBe(true);

    resetCalls();
    link._handlePointerEvent(PointerEventType.Leave, 0.0, 0.0);
    expect<i32>(findCall(CALL_HIDE_URL_PREVIEW)).toBeGreaterThan(-1);
    expect<i32>(lastUrlPreviewLength()).toBe(0);
  });

  it("shows the shared URL preview while leaving focus chrome to the shared overlay", () => {
    resetCalls();

    const link = new NavLink("/settings", "Settings");
    link.build();
    resetCalls();

    link._handleFocusChanged(true);

    expect<i32>(findCall(CALL_SHOW_URL_PREVIEW)).toBeGreaterThan(-1);
    expect<bool>(lastUrlPreviewEquals("/settings")).toBe(true);
    expect<i32>(findCall(CALL_SET_DROP_SHADOW)).toBe(-1);

    resetCalls();
    link._handleFocusChanged(false);

    expect<i32>(findCall(CALL_HIDE_URL_PREVIEW)).toBeGreaterThan(-1);
  });

  it("hides the focus ring after pointer interaction while keeping focus preview behavior", () => {
    EventRouter.reset();
    resetCalls();

    const link = new NavLink("/settings", "Settings");
    link.build();
    link._handlePointerEvent(PointerEventType.Down, 0.0, 0.0, 0);
    resetCalls();

    link._handleFocusChanged(true);

    expect<i32>(findCall(CALL_SHOW_URL_PREVIEW)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_SET_DROP_SHADOW)).toBe(-1);
  });

  it("activates on pointer release and Enter key release", () => {
    resetCalls();
    const link = new NavLink("/settings", "Settings").onNavigate(recordActivation);

    link._handlePointerEvent(PointerEventType.Down, 0.0, 0.0);
    expect<i32>(activationCount).toBe(0);
    link._handlePointerEvent(PointerEventType.Up, 0.0, 0.0);
    expect<i32>(activationCount).toBe(1);
    expect<string>(lastPath).toBe("/settings");
    expect<i32>(findCall(CALL_NAVIGATE_TO)).toBeGreaterThan(-1);
    expect<i32>(lastNavigationTargetLength()).toBe(9);
    expect<bool>(lastNavigationTargetEquals("/settings")).toBe(true);

    resetCalls();
    link._handleKeyEvent(KeyEventType.Down, "Enter", 0);
    expect<i32>(activationCount).toBe(1);
    link._handleKeyEvent(KeyEventType.Up, "Enter", 0);
    expect<i32>(activationCount).toBe(2);
    expect<string>(lastPath).toBe("/settings");
    expect<i32>(findCall(CALL_NAVIGATE_TO)).toBeGreaterThan(-1);
    expect<bool>(lastNavigationTargetEquals("/settings")).toBe(true);
  });

  it("can request opening the target in a new tab", () => {
    resetCalls();

    const link = new NavLink("/diagnostics", "Diagnostics", true);
    link._handlePointerEvent(PointerEventType.Down, 0.0, 0.0);
    link._handlePointerEvent(PointerEventType.Up, 0.0, 0.0);

    const navigateIndex = findCall(CALL_NAVIGATE_TO);
    expect<i32>(navigateIndex).toBeGreaterThan(-1);
    expect<bool>(lastNavigationTargetEquals("/diagnostics")).toBe(true);
    expect<f64>(getCallArg(navigateIndex, 1)).toBe(1.0);
  });

  it("uses the platform primary modifier to force opening in a new tab", () => {
    resetCalls();

    const link = new NavLink("/settings", "Settings");
    link._handlePointerEvent(PointerEventType.Down, 0.0, 0.0, KeyModifier.Meta);
    link._handlePointerEvent(PointerEventType.Up, 0.0, 0.0, KeyModifier.Meta);

    const navigateIndex = findCall(CALL_NAVIGATE_TO);
    expect<i32>(navigateIndex).toBeGreaterThan(-1);
    expect<bool>(lastNavigationTargetEquals("/settings")).toBe(true);
    expect<f64>(getCallArg(navigateIndex, 1)).toBe(1.0);
  });

  it("cancels an armed pointer or Enter press when the interaction breaks", () => {
    const link = new NavLink("/settings", "Settings").onNavigate(recordActivation);

    link._handlePointerEvent(PointerEventType.Down, 0.0, 0.0);
    link._handlePointerEvent(PointerEventType.Leave, 0.0, 0.0);
    link._handlePointerEvent(PointerEventType.Up, 0.0, 0.0);
    expect<i32>(activationCount).toBe(0);

    link._handleKeyEvent(KeyEventType.Down, "Enter", 0);
    link._handleFocusChanged(false);
    link._handleKeyEvent(KeyEventType.Up, "Enter", 0);
    expect<i32>(activationCount).toBe(0);
  });
});
