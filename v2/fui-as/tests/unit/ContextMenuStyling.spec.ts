import { ContextMenu, ContextMenuAction, MenuItem } from "../../src/controls/ContextMenu";
import { EventRouter } from "../../src/core/EventRouter";
import { CALL_SET_HEIGHT, CALL_SET_WIDTH, getCallArg, getCallSequence, resetCalls } from "./FfiTestImports";

function findCallWithArg(op: i32, argIndex: i32, value: f64): i32 {
  const sequence = getCallSequence();
  for (let index = 0; index < sequence.length; ++index) {
    if (unchecked(sequence[index]) == op && getCallArg(index, argIndex) == value) {
      return index;
    }
  }
  return -1;
}

describe("ContextMenuStyling", () => {
  it("applies explicit menu width and item height overrides", () => {
    EventRouter.reset();
    resetCalls();

    const items = new Array<MenuItem>();
    items.push(new MenuItem("Reload Page", ContextMenuAction.ReloadPage));
    const menu = new ContextMenu(items)
      .menuWidth(260.0)
      .itemHeight(40.0);
    menu.build();

    resetCalls();
    menu.show(null, 24.0, 36.0);

    expect<i32>(findCallWithArg(CALL_SET_WIDTH, 1, 260.0)).toBeGreaterThan(-1);
    expect<i32>(findCallWithArg(CALL_SET_HEIGHT, 1, 40.0)).toBeGreaterThan(-1);

    menu.dispose();
  });
});
