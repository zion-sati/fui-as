import {
  __fui_host_event_demoShellClockTickChanged as __dashboardHostEventClockTickChanged,
  __fui_host_event_demoShellDarkModeChanged as __dashboardHostEventDarkModeChanged,
  __fui_host_event_demoShellHueChanged as __dashboardHostEventHueChanged,
} from "../../demo/src/dashboard";
import {
  __fui_host_event_demoShellClockTickChanged as __demoRouteHostEventClockTickChanged,
  __fui_host_event_demoShellDarkModeChanged as __demoRouteHostEventDarkModeChanged,
  __fui_host_event_demoShellHueChanged as __demoRouteHostEventHueChanged,
} from "../../demo/src/routes/demo_home";
import {
  __fui_host_event_demoShellDarkModeChanged as __advancedControlsRouteHostEventDarkModeChanged,
  __fui_host_event_demoShellHueChanged as __advancedControlsRouteHostEventHueChanged,
} from "../../demo/src/routes/demo_advanced_controls";
import {
  __fui_host_event_demoShellClockTickChanged,
  __fui_host_event_demoShellDarkModeChanged,
  __fui_host_event_demoShellHueChanged,
  clearDemoShellClockTickChanged,
  clearDemoShellDarkModeChanged,
  clearDemoShellHueChanged,
  onDemoShellClockTickChanged,
  onDemoShellDarkModeChanged,
  onDemoShellHueChanged,
} from "../../demo/src/generated/HostEvents";
import { bind1 } from "../../src/FuiPrimitives";

class HostEventOwner {
  tick: i32 = -1;
  hue: i32 = -1;
  darkMode: bool = false;
}

describe("Host event bindings", () => {
  afterEach(() => {
    clearDemoShellClockTickChanged();
    clearDemoShellHueChanged();
    clearDemoShellDarkModeChanged();
  });

  it("routes bound host-event callbacks into AssemblyScript owners", () => {
    const owner = new HostEventOwner();
    onDemoShellClockTickChanged(bind1<HostEventOwner, i32>(owner, (target, value) => {
      target.tick = value;
    }));
    onDemoShellHueChanged(bind1<HostEventOwner, i32>(owner, (target, value) => {
      target.hue = value;
    }));
    onDemoShellDarkModeChanged(bind1<HostEventOwner, bool>(owner, (target, value) => {
      target.darkMode = value;
    }));

    __fui_host_event_demoShellClockTickChanged(42);
    __fui_host_event_demoShellHueChanged(275);
    __fui_host_event_demoShellDarkModeChanged(true);

    expect<i32>(owner.tick).toBe(42);
    expect<i32>(owner.hue).toBe(275);
    expect<bool>(owner.darkMode).toBe(true);
  });

  it("re-exports host-event handlers from the demo entrypoints", () => {
    const owner = new HostEventOwner();
    onDemoShellClockTickChanged(bind1<HostEventOwner, i32>(owner, (target, value) => {
      target.tick = value;
    }));
    onDemoShellHueChanged(bind1<HostEventOwner, i32>(owner, (target, value) => {
      target.hue = value;
    }));
    onDemoShellDarkModeChanged(bind1<HostEventOwner, bool>(owner, (target, value) => {
      target.darkMode = value;
    }));

    __dashboardHostEventClockTickChanged(9);
    __dashboardHostEventHueChanged(180);
    __dashboardHostEventDarkModeChanged(true);
    expect<i32>(owner.tick).toBe(9);
    expect<i32>(owner.hue).toBe(180);
    expect<bool>(owner.darkMode).toBe(true);

    __demoRouteHostEventClockTickChanged(12);
    __demoRouteHostEventHueChanged(240);
    __demoRouteHostEventDarkModeChanged(false);
    expect<i32>(owner.tick).toBe(12);
    expect<i32>(owner.hue).toBe(240);
    expect<bool>(owner.darkMode).toBe(false);

    __advancedControlsRouteHostEventHueChanged(310);
    __advancedControlsRouteHostEventDarkModeChanged(true);
    expect<i32>(owner.hue).toBe(310);
    expect<bool>(owner.darkMode).toBe(true);
  });
});
