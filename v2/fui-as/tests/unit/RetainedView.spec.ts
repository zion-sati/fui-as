import { retainedView, RetainedView } from "../../src/core/RetainedView";
import { Disposable } from "../../src/core/Disposable";
import { FlexBox } from "../../src/nodes/FlexBox";

class Probe implements Disposable {
  count: i32 = 0;
  dispose(): void { this.count += 1; }
}

const lifecycleEvents = new Array<string>();
function recordActivate(_view: RetainedView): void { lifecycleEvents.push("activate"); }
function recordDeactivate(_view: RetainedView): void { lifecycleEvents.push("deactivate"); }
function recordDispose(_view: RetainedView): void { lifecycleEvents.push("dispose"); }

describe("RetainedView", () => {
  it("orders lifecycle, retains resources, and disposes once", () => {
    const root = new FlexBox();
    const probe = new Probe();
    lifecycleEvents.length = 0;
    const view = retainedView(root)
      .retain(probe)
      .onActivate(recordActivate)
      .onDeactivate(recordDeactivate)
      .onDispose(recordDispose);

    view.activate();
    view.activate();
    view.deactivate();
    view.activate();
    view.dispose();
    view.dispose();

    expect(lifecycleEvents.join(",")).toBe("activate,deactivate,activate,deactivate,dispose");
    expect(probe.count).toBe(1);
    expect(view.isDisposed).toBe(true);
    expect(view.isActive).toBe(false);
  });
});
