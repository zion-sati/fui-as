import { ContextMenu, ContextMenuAction, MenuItem } from "../../src/controls/ContextMenu";
import { EventRouter } from "../../src/core/EventRouter";
import { KeyEventType, PointerEventType } from "../../src/core/ffi";
import { CALL_ADD_CHILD, CALL_REMOVE_CHILD, findCall, resetCalls } from "./FfiTestImports";

describe("ContextMenuBasic", () => {
  it("shows a menu and hides it with Escape", () => {
    EventRouter.reset();
    resetCalls();

    const items = new Array<MenuItem>();
    items.push(new MenuItem("Reload Page", ContextMenuAction.ReloadPage));
    const menu = new ContextMenu(items);
    menu.build();
    menu.show(null, 24.0, 36.0);

    expect<i32>(findCall(CALL_ADD_CHILD)).toBeGreaterThan(-1);

    resetCalls();
    expect<bool>(EventRouter.dispatchGlobalKeyEvent(KeyEventType.Down, "Escape", 0)).toBe(true);
    expect<i32>(findCall(CALL_REMOVE_CHILD)).toBeGreaterThan(-1);

    menu.dispose();
  });

  it("dismisses an active menu on primary pointer down outside its panel", () => {
    EventRouter.reset();
    resetCalls();

    const items = new Array<MenuItem>();
    items.push(new MenuItem("Reload Page", ContextMenuAction.ReloadPage));
    const menu = new ContextMenu(items);
    const handle = menu.build();
    menu.show(null, 24.0, 36.0);

    resetCalls();
    expect<bool>(EventRouter.dispatchPointerEvent(
      handle,
      PointerEventType.Down,
      1.0,
      1.0,
      0,
      1,
      1,
      0,
      1,
      0.5,
      1.0,
      1.0,
      1,
    )).toBe(true);
    expect<i32>(findCall(CALL_REMOVE_CHILD)).toBeGreaterThan(-1);

    menu.dispose();
  });
});
