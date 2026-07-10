import {
  __fui_host_event_demoShellClockTickChanged as __dashboardHostEventClockTickChanged,
  __fui_host_event_demoShellDarkModeChanged as __dashboardHostEventDarkModeChanged,
  __fui_host_event_demoShellAccentColorChanged as __dashboardHostEventAccentColorChanged,
} from "../../demo/src/dashboard";
import {
  __fui_host_event_demoShellClockTickChanged as __demoRouteHostEventClockTickChanged,
  __fui_host_event_demoShellDarkModeChanged as __demoRouteHostEventDarkModeChanged,
  __fui_host_event_demoShellAccentColorChanged as __demoRouteHostEventAccentColorChanged,
} from "../../demo/src/routes/demo_home";
import {
  __fui_host_event_demoShellDarkModeChanged as __advancedControlsRouteHostEventDarkModeChanged,
  __fui_host_event_demoShellAccentColorChanged as __advancedControlsRouteHostEventAccentColorChanged,
} from "../../demo/src/routes/demo_advanced_controls";
import {
  __fui_host_event_demoShellClockTickChanged,
  __fui_host_event_demoShellDarkModeChanged,
  __fui_host_event_demoShellAccentColorChanged,
  clearDemoShellClockTickChanged,
  clearDemoShellDarkModeChanged,
  clearDemoShellAccentColorChanged,
  onDemoShellClockTickChanged,
  onDemoShellDarkModeChanged,
  onDemoShellAccentColorChanged,
} from "../../demo/src/generated/HostEvents";
import { bind1 } from "../../src/FuiPrimitives";

class HostEventOwner {
  tick: i32 = -1;
  accentColor: u32 = -1;
  darkMode: bool = false;
}

describe("Host event bindings", () => {
  afterEach(() => {
    clearDemoShellClockTickChanged();
    clearDemoShellAccentColorChanged();
    clearDemoShellDarkModeChanged();
  });

  it("routes bound host-event callbacks into AssemblyScript owners", () => {
    const owner = new HostEventOwner();
    onDemoShellClockTickChanged(bind1<HostEventOwner, i32>(owner, (target, value) => {
      target.tick = value;
    }));
    onDemoShellAccentColorChanged(bind1<HostEventOwner, u32>(owner, (target, value) => {
      target.accentColor = value;
    }));
    onDemoShellDarkModeChanged(bind1<HostEventOwner, bool>(owner, (target, value) => {
      target.darkMode = value;
    }));

    __fui_host_event_demoShellClockTickChanged(42);
    __fui_host_event_demoShellAccentColorChanged(0x336699ff);
    __fui_host_event_demoShellDarkModeChanged(true);

    expect<i32>(owner.tick).toBe(42);
    expect<u32>(owner.accentColor).toBe(0x336699ff);
    expect<bool>(owner.darkMode).toBe(true);
  });

  it("re-exports host-event handlers from the demo entrypoints", () => {
    const owner = new HostEventOwner();
    onDemoShellClockTickChanged(bind1<HostEventOwner, i32>(owner, (target, value) => {
      target.tick = value;
    }));
    onDemoShellAccentColorChanged(bind1<HostEventOwner, u32>(owner, (target, value) => {
      target.accentColor = value;
    }));
    onDemoShellDarkModeChanged(bind1<HostEventOwner, bool>(owner, (target, value) => {
      target.darkMode = value;
    }));

    __dashboardHostEventClockTickChanged(9);
    __dashboardHostEventAccentColorChanged(0x112233ff);
    __dashboardHostEventDarkModeChanged(true);
    expect<i32>(owner.tick).toBe(9);
    expect<u32>(owner.accentColor).toBe(0x112233ff);
    expect<bool>(owner.darkMode).toBe(true);

    __demoRouteHostEventClockTickChanged(12);
    __demoRouteHostEventAccentColorChanged(0x445566ff);
    __demoRouteHostEventDarkModeChanged(false);
    expect<i32>(owner.tick).toBe(12);
    expect<u32>(owner.accentColor).toBe(0x445566ff);
    expect<bool>(owner.darkMode).toBe(false);

    __advancedControlsRouteHostEventAccentColorChanged(0x778899ff);
    __advancedControlsRouteHostEventDarkModeChanged(true);
    expect<u32>(owner.accentColor).toBe(0x778899ff);
    expect<bool>(owner.darkMode).toBe(true);
  });
});
