import { CursorStyle, KeyEventType, KeyModifier, PointerEventType, SemanticRole } from "../../src/core/ffi";
import { EventRouter } from "../../src/core/EventRouter";
import { Node, PointerButton, PointerButtons, PointerEventArgs, PointerType } from "../../src/core/Node";
import { NavLink, NavLinkInteractionState } from "../../src/controls";
import { NavigateEventArgs } from "../../src/controls/NavLink";
import { Theme, activeTheme } from "../../src/core/Theme";
import { FlexBox, Text } from "../../src/nodes";
import {
  CALL_ADD_CHILD,
  CALL_CREATE_NODE,
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
  getCallSequence,
  lastNavigationTargetEquals,
  lastNavigationTargetLength,
  lastUrlPreviewEquals,
  lastUrlPreviewLength,
  resetCalls,
} from "./FfiTestImports";

let activationCount: i32 = 0;
let lastPath = "";

class InteractionStateOwner {
  count: i32 = 0;
  lastState: NavLinkInteractionState | null = null;
  lastAccent: u32 = 0;
}

function recordInteractionState(
  owner: InteractionStateOwner,
  state: NavLinkInteractionState,
  theme: Theme,
): void {
  owner.count += 1;
  owner.lastState = state;
  owner.lastAccent = theme.colors.accent;
}

function recordActivation(event: NavigateEventArgs): void {
  activationCount += 1;
  lastPath = event.path;
}

function countCalls(op: i32): i32 {
  const sequence = getCallSequence();
  let count = 0;
  for (let index = 0; index < sequence.length; ++index) {
    if (unchecked(sequence[index]) == op) {
      count += 1;
    }
  }
  return count;
}

describe("NavLink", () => {
  beforeEach(() => {
    activationCount = 0;
    lastPath = "";
  });

  it("builds as a focusable semantic link", () => {
    resetCalls();

    const link = new NavLink("/settings").semanticLabel("Settings") as NavLink;
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
    expect<i32>(countCalls(CALL_CREATE_NODE)).toBe(1);
  });

  it("hosts arbitrary caller-owned content without creating an implicit label", () => {
    resetCalls();
    const content = new FlexBox();
    const icon = new Text("icon");
    const label = new Text("Settings");
    content.children([icon, label]);
    const link = new NavLink("/settings").child(content).semanticLabel("Settings") as NavLink;

    link.build();

    expect<i32>(countCalls(CALL_CREATE_NODE)).toBe(4);
    expect<i32>(countCalls(CALL_ADD_CHILD)).toBe(3);
  });

  it("retains replaces and updates authored interaction-state bindings", () => {
    resetCalls();

    const firstOwner = new InteractionStateOwner();
    const replacementOwner = new InteractionStateOwner();
    const link = new NavLink("/settings");
    link.bindInteractionState<InteractionStateOwner>(firstOwner, recordInteractionState);

    expect<i32>(firstOwner.count).toBe(1);
    let state = changetype<NavLinkInteractionState>(firstOwner.lastState);
    expect<bool>(state.hovered).toBe(false);
    expect<bool>(state.pressed).toBe(false);
    expect<bool>(state.focused).toBe(false);
    expect<bool>(state.enabled).toBe(true);
    expect<u32>(firstOwner.lastAccent).toBe(activeTheme.value.colors.accent);

    link._handlePointerEvent(PointerEventType.Enter, 0.0, 0.0);
    state = changetype<NavLinkInteractionState>(firstOwner.lastState);
    expect<bool>(state.hovered).toBe(true);

    link._handlePointerEvent(PointerEventType.Down, 0.0, 0.0);
    state = changetype<NavLinkInteractionState>(firstOwner.lastState);
    expect<bool>(state.pressed).toBe(true);

    link._handlePointerEvent(PointerEventType.Up, 0.0, 0.0);
    state = changetype<NavLinkInteractionState>(firstOwner.lastState);
    expect<bool>(state.pressed).toBe(false);

    link._handleFocusChanged(true);
    state = changetype<NavLinkInteractionState>(firstOwner.lastState);
    expect<bool>(state.focused).toBe(true);

    link.enabled(false);
    state = changetype<NavLinkInteractionState>(firstOwner.lastState);
    expect<bool>(state.hovered).toBe(false);
    expect<bool>(state.pressed).toBe(false);
    expect<bool>(state.focused).toBe(false);
    expect<bool>(state.enabled).toBe(false);

    link.bindInteractionState<InteractionStateOwner>(replacementOwner, recordInteractionState);
    expect<i32>(replacementOwner.count).toBe(1);
    link.enabled(true);
    expect<i32>(replacementOwner.count).toBe(2);
    expect<i32>(firstOwner.count).toBeGreaterThan(1);
    const firstOwnerCountAfterReplacement = firstOwner.count;
    link._handlePointerEvent(PointerEventType.Enter, 0.0, 0.0);
    expect<i32>(replacementOwner.count).toBe(3);
    expect<i32>(firstOwner.count).toBe(firstOwnerCountAfterReplacement);
  });

  it("shows and hides the shared URL preview on hover", () => {
    resetCalls();

    const link = new NavLink("/settings");
    link.build();
    resetCalls();
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

    const link = new NavLink("/settings");
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

    const link = new NavLink("/settings");
    link.build();
    link._handlePointerEvent(PointerEventType.Down, 0.0, 0.0, 0);
    resetCalls();

    link._handleFocusChanged(true);

    expect<i32>(findCall(CALL_SHOW_URL_PREVIEW)).toBeGreaterThan(-1);
    expect<i32>(findCall(CALL_SET_DROP_SHADOW)).toBe(-1);
  });

  it("activates on pointer release and Enter key release", () => {
    resetCalls();
    const link = new NavLink("/settings").onNavigate(recordActivation);

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

  it("does not activate from a right-click pointer release", () => {
    resetCalls();
    const link = new NavLink("/settings").onNavigate(recordActivation);

    Node._dispatchPointerEventWithArgs(
      link,
      new PointerEventArgs(PointerEventType.Down, 0.0, 0.0, 0, 1, PointerType.Mouse, PointerButton.Secondary, PointerButtons.Secondary, 0.0, 0.0, 0.0, 1),
    );
    Node._dispatchPointerEventWithArgs(
      link,
      new PointerEventArgs(PointerEventType.Up, 0.0, 0.0, 0, 1, PointerType.Mouse, PointerButton.Secondary, PointerButtons.None, 0.0, 0.0, 0.0, 1),
    );

    expect<i32>(activationCount).toBe(0);
    expect<i32>(findCall(CALL_NAVIGATE_TO)).toBe(-1);
  });

  it("opens the target in a new tab from a middle-click pointer release", () => {
    resetCalls();
    const link = new NavLink("/settings").onNavigate(recordActivation);

    Node._dispatchPointerEventWithArgs(
      link,
      new PointerEventArgs(PointerEventType.Down, 0.0, 0.0, 0, 1, PointerType.Mouse, PointerButton.Auxiliary, PointerButtons.Auxiliary, 0.0, 0.0, 0.0, 1),
    );
    Node._dispatchPointerEventWithArgs(
      link,
      new PointerEventArgs(PointerEventType.Up, 0.0, 0.0, 0, 1, PointerType.Mouse, PointerButton.Auxiliary, PointerButtons.None, 0.0, 0.0, 0.0, 1),
    );

    const navigateIndex = findCall(CALL_NAVIGATE_TO);
    expect<i32>(activationCount).toBe(1);
    expect<i32>(navigateIndex).toBeGreaterThan(-1);
    expect<bool>(lastNavigationTargetEquals("/settings")).toBe(true);
    expect<f64>(getCallArg(navigateIndex, 1)).toBe(1.0);
  });

  it("can request opening the target in a new tab", () => {
    resetCalls();

    const link = new NavLink("/diagnostics", true);
    link._handlePointerEvent(PointerEventType.Down, 0.0, 0.0);
    link._handlePointerEvent(PointerEventType.Up, 0.0, 0.0);

    const navigateIndex = findCall(CALL_NAVIGATE_TO);
    expect<i32>(navigateIndex).toBeGreaterThan(-1);
    expect<bool>(lastNavigationTargetEquals("/diagnostics")).toBe(true);
    expect<f64>(getCallArg(navigateIndex, 1)).toBe(1.0);
  });

  it("uses the platform primary modifier to force opening in a new tab", () => {
    resetCalls();

    const link = new NavLink("/settings");
    link._handlePointerEvent(PointerEventType.Down, 0.0, 0.0, KeyModifier.Meta);
    link._handlePointerEvent(PointerEventType.Up, 0.0, 0.0, KeyModifier.Meta);

    const navigateIndex = findCall(CALL_NAVIGATE_TO);
    expect<i32>(navigateIndex).toBeGreaterThan(-1);
    expect<bool>(lastNavigationTargetEquals("/settings")).toBe(true);
    expect<f64>(getCallArg(navigateIndex, 1)).toBe(1.0);
  });

  it("cancels an armed pointer or Enter press when the interaction breaks", () => {
    const link = new NavLink("/settings").onNavigate(recordActivation);

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
