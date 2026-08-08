import { Application } from "../../src/core/Application";
import { ContextMenuAction, MenuItem } from "../../src/controls/ContextMenu";
import { ContextMenuManager } from "../../src/core/ContextMenuManager";
import { HostCapability, HostContext, HostEnvironment, PlatformFamily } from "../../src/core/Platform";
import { NavLink } from "../../src/controls/NavLink";
import { TextInput } from "../../src/controls/TextInput";
import { FlexBox } from "../../src/nodes/FlexBox";
import { Image } from "../../src/nodes/Image";
import { Svg } from "../../src/nodes/Svg";
import { Text } from "../../src/nodes/Text";

const BROWSER_CAPABILITIES: u32 =
  HostCapability.BrowserHistory |
  HostCapability.Reload |
  HostCapability.NewBrowsingContext |
  HostCapability.OpenExternalUri |
  HostCapability.ClipboardRead |
  HostCapability.ClipboardWrite;

function hasAction(items: Array<MenuItem>, action: ContextMenuAction): bool {
  for (let index = 0; index < items.length; ++index) {
    if (unchecked(items[index]).action == action) {
      return true;
    }
  }
  return false;
}

function itemsFor(handle: u64, host: HostContext): Array<MenuItem> {
  return ContextMenuManager.buildBuiltInItemsForHost(handle, 10.0, 10.0, false, host);
}

describe("ContextMenu host policy", () => {
  it("filters blank, link, image, SVG, static text, and editable text by host capabilities", () => {
    const blank = new FlexBox();
    const link = new NavLink("https://example.test").child(new Text("Example")) as NavLink;
    const image = new Image().source("https://example.test/image.png");
    const svg = new Svg().source("https://example.test/image.svg");
    const staticText = new Text("Selectable");
    const editable = new TextInput("Editable");
    const root = new FlexBox().children([blank, link, image, svg, staticText, editable]);
    Application.mount(root);

    const browser = new HostContext(PlatformFamily.Apple, HostEnvironment.Browser, BROWSER_CAPABILITIES);
    const desktop = new HostContext(
      PlatformFamily.Apple,
      HostEnvironment.Desktop,
      HostCapability.OpenExternalUri | HostCapability.ClipboardRead | HostCapability.ClipboardWrite,
    );
    const headless = new HostContext(PlatformFamily.Linux, HostEnvironment.Headless, 0);

    expect<i32>(itemsFor(blank.builtHandle, desktop).length).toBe(0);
    expect<i32>(itemsFor(blank.builtHandle, headless).length).toBe(0);

    const browserLink = itemsFor(link.builtHandle, browser);
    expect<bool>(hasAction(browserLink, ContextMenuAction.OpenLinkInNewTab)).toBe(true);
    expect<bool>(hasAction(browserLink, ContextMenuAction.OpenLink)).toBe(true);
    const desktopLink = itemsFor(link.builtHandle, desktop);
    expect<bool>(hasAction(desktopLink, ContextMenuAction.OpenLinkInNewTab)).toBe(false);
    expect<bool>(hasAction(desktopLink, ContextMenuAction.OpenLink)).toBe(true);
    expect<i32>(itemsFor(link.builtHandle, headless).length).toBe(0);

    const browserImage = itemsFor(image.builtHandle, browser);
    expect<bool>(hasAction(browserImage, ContextMenuAction.OpenImageInNewTab)).toBe(true);
    expect<bool>(hasAction(browserImage, ContextMenuAction.OpenImage)).toBe(true);
    const desktopSvg = itemsFor(svg.builtHandle, desktop);
    expect<bool>(hasAction(desktopSvg, ContextMenuAction.OpenImageInNewTab)).toBe(false);
    expect<bool>(hasAction(desktopSvg, ContextMenuAction.OpenImage)).toBe(true);
    expect<i32>(itemsFor(svg.builtHandle, headless).length).toBe(0);

    const browserText = itemsFor(staticText.builtHandle, browser);
    expect<bool>(hasAction(browserText, ContextMenuAction.CopyCurrentSelection)).toBe(true);
    expect<bool>(hasAction(browserText, ContextMenuAction.SelectAllText)).toBe(true);
    const headlessText = itemsFor(staticText.builtHandle, headless);
    expect<bool>(hasAction(headlessText, ContextMenuAction.CopyCurrentSelection)).toBe(false);
    expect<bool>(hasAction(headlessText, ContextMenuAction.SelectAllText)).toBe(true);

    const browserEditable = itemsFor(editable.builtHandle, browser);
    expect<bool>(hasAction(browserEditable, ContextMenuAction.CutTextSelection)).toBe(true);
    expect<bool>(hasAction(browserEditable, ContextMenuAction.PasteText)).toBe(true);
    const headlessEditable = itemsFor(editable.builtHandle, headless);
    expect<bool>(hasAction(headlessEditable, ContextMenuAction.CutTextSelection)).toBe(false);
    expect<bool>(hasAction(headlessEditable, ContextMenuAction.PasteText)).toBe(false);
    expect<bool>(hasAction(headlessEditable, ContextMenuAction.UndoTextEdit)).toBe(true);
    expect<bool>(hasAction(headlessEditable, ContextMenuAction.SelectAllText)).toBe(true);

    Application.unmount();
  });
});
