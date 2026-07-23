import { Application } from "../../src/core/Application";
import { ContextMenuManager } from "../../src/core/ContextMenuManager";
import { ContextMenuEventArgs } from "../../src/core/Node";
import {
  HostCapability,
  HostContext,
  HostEnvironment,
  PlatformFamily,
} from "../../src/core/Platform";
import { FlexBox } from "../../src/nodes/FlexBox";
import { Text } from "../../src/nodes/Text";

let receivedEvent: ContextMenuEventArgs | null = null;
let invocationCount: i32 = 0;

function captureEvent(event: ContextMenuEventArgs): void {
  receivedEvent = event;
}

function countInvocation(_event: ContextMenuEventArgs): void {
  invocationCount += 1;
}

describe("ContextMenuEventArgs", () => {
  afterEach(() => {
    Application.unmount();
    ContextMenuManager.setMenu(null);
    receivedEvent = null;
    invocationCount = 0;
  });

  it("routes the descendant target, coordinates, and browser host snapshot to an ancestor handler", () => {
    const root = new FlexBox();
    root.onContextMenu(captureEvent);
    const child = new Text("child");
    root.child(child);
    Application.mount(root);

    ContextMenuManager.showForCurrentSelection(child.handle, 32, 48);

    expect<bool>(receivedEvent !== null).toBe(true);
    const event = changetype<ContextMenuEventArgs>(receivedEvent);
    expect<u64>(changetype<Text>(event.target).handle).toBe(child.handle);
    expect<f32>(event.x).toBe(32);
    expect<f32>(event.y).toBe(48);
    expect<HostEnvironment>(event.host.environment).toBe(HostEnvironment.Browser);
    expect<bool>(event.host.supports(HostCapability.NewBrowsingContext)).toBe(true);
  });

  it("keeps browser, desktop, and headless host facts explicit", () => {
    const browser = new ContextMenuEventArgs(
      null,
      0,
      0,
      new HostContext(PlatformFamily.Apple, HostEnvironment.Browser, HostCapability.Reload),
    );
    const desktop = new ContextMenuEventArgs(
      null,
      0,
      0,
      new HostContext(PlatformFamily.Apple, HostEnvironment.Desktop, HostCapability.OpenExternalUri),
    );
    const headless = new ContextMenuEventArgs(
      null,
      0,
      0,
      new HostContext(PlatformFamily.Linux, HostEnvironment.Headless, 0),
    );
    expect<bool>(browser.host.supports(HostCapability.Reload)).toBe(true);
    expect<bool>(desktop.host.supports(HostCapability.Reload)).toBe(false);
    expect<bool>(desktop.host.supports(HostCapability.OpenExternalUri)).toBe(true);
    expect<bool>(headless.host.supports(HostCapability.OpenExternalUri)).toBe(false);
  });

  it("keeps disabled ancestry ahead of custom handlers", () => {
    const root = new FlexBox();
    root.onContextMenu(countInvocation);
    const child = new Text("child");
    root.child(child);
    root.disableContextMenu();
    Application.mount(root);

    ContextMenuManager.showForCurrentSelection(child.handle, 4, 8);
    expect<i32>(invocationCount).toBe(0);
  });
});
