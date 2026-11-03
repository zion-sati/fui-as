import { ContextMenu, ContextMenuAction, MenuItem, runContextMenuAction } from "../../src/controls/ContextMenu";
import { EventRouter } from "../../src/core/EventRouter";
import { CALL_REMOVE_CHILD, findCall, resetCalls } from "./FfiTestImports";

let plainRuns: i32 = 0;

class Counter {
  runs: i32 = 0;
}

describe("ContextMenu commands", () => {
  it("runs a command's function when chosen", () => {
    plainRuns = 0;
    const item = MenuItem.command("Rename", (): void => {
      plainRuns++;
    });

    runContextMenuAction(item);

    expect<i32>(item.action).toBe(ContextMenuAction.Command);
    expect<i32>(plainRuns).toBe(1);
  });

  it("runs an owner-bound command with its owner", () => {
    const counter = new Counter();
    const item = MenuItem.commandWith<Counter>("Delete", counter, (owner: Counter): void => {
      owner.runs++;
    });

    runContextMenuAction(item);
    runContextMenuAction(item);

    expect<i32>(counter.runs).toBe(2);
  });

  it("does not run a disabled command", () => {
    const counter = new Counter();
    const item = MenuItem.commandWith<Counter>("Delete", counter, (owner: Counter): void => {
      owner.runs++;
    }, true);

    runContextMenuAction(item);

    expect<i32>(counter.runs).toBe(0);
  });

  it("runs a command chosen from a menu, then closes the menu", () => {
    EventRouter.reset();
    resetCalls();
    const counter = new Counter();
    const items = new Array<MenuItem>();
    items.push(MenuItem.commandWith<Counter>("Rename", counter, (owner: Counter): void => {
      owner.runs++;
    }));
    items.push(MenuItem.separator());
    items.push(new MenuItem("Reload Page", ContextMenuAction.ReloadPage));
    const menu = new ContextMenu(items);
    menu.build();
    menu.show(null, 24.0, 36.0);
    resetCalls();

    ContextMenu.invokeActiveSlot(0);

    expect<i32>(counter.runs).toBe(1);
    expect<i32>(findCall(CALL_REMOVE_CHILD)).toBeGreaterThan(-1);
    menu.dispose();
  });
});
