import { ContextMenu } from "../../src/controls/ContextMenu";
import { ContextMenuManager } from "../../src/core/ContextMenuManager";

describe("ContextMenuManagerLifecycle", () => {
  it("creates a default menu and accepts menu swaps", () => {
    const defaultMenu = ContextMenuManager.createDefaultMenu();

    expect<bool>(defaultMenu instanceof ContextMenu).toBe(true);

    ContextMenuManager.setMenu(defaultMenu);
    ContextMenuManager.setMenu(null);

    defaultMenu.dispose();
  });
});
