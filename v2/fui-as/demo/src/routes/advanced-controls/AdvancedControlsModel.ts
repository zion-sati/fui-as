import { Worker, rgb } from "../../../../src/Fui";
import {
  demoAdvancedControlsRoute,
  demoHomeRoute,
  demoTemplatedControlsRoute,
  RoutePageModel,
  RoutePageNavItem,
} from "../../design-system";

export class AdvancedControlsModel {
  activeWorker: Worker | null = null;
  workerProgressPercent: i32 = 0;
  workerStateLabel: string = "idle";
  animationPreviewEmphasized: bool = false;
  animationScrollTargetLabel: string = "top";
}

function createNavItems(homeRoute: string, advancedControlsRoute: string, templatedControlsRoute: string): Array<RoutePageNavItem> {
  return [
    new RoutePageNavItem(homeRoute, "Dashboard"),
    new RoutePageNavItem(advancedControlsRoute, "Advanced controls"),
    new RoutePageNavItem(templatedControlsRoute, "Templated controls"),
  ];
}

function createHighlights(): Array<string> {
  return [
    "Explore TextArea behavior with live wrapping, read-only, scrollbar, line-height, and visibility controls.",
    "The animation showcase demonstrates typed bgColor/opacity transitions plus retained smooth scrolling and explicit scrollContentSize(...) on the same route.",
    "The drag-and-drop reorder sample demonstrates insertion markers, edge autoscroll inside ScrollBox, and retained row reordering on top of the phase-3 session APIs.",
    "The external file-drop sample proves metadata-first browser drag targeting ahead of the later first-class file bridge.",
    "The Fetch sample talks to the live JSONPlaceholder service through the shipped Fetch API and surfaces its completion metadata without browser-specific code.",
    "The worker sample pairs a ProgressBar with cooperative background work and cancellation.",
    "Switch the TextArea between variable and mono theme fonts to compare text behavior live.",
    "Load app-authored fonts with FontStack.load(...) and keep emoji fallback in the same sample.",
    "Routing keeps navigation and browser history consistent while this page owns its own app instance.",
  ];
}

export function createAdvancedControlsRoutePageModel(): RoutePageModel {
  const homeRoute = demoHomeRoute();
  const advancedControlsRoute = demoAdvancedControlsRoute();
  const templatedControlsRoute = demoTemplatedControlsRoute();
  return new RoutePageModel(
    "Advanced controls",
    "Explore advanced controls and interaction-heavy samples on a dedicated route.",
    "Advanced samples",
    rgb(16, 185, 129),
    "Ping advanced controls",
    "Advanced actions",
    createNavItems(homeRoute, advancedControlsRoute, templatedControlsRoute),
    createHighlights(),
  );
}
