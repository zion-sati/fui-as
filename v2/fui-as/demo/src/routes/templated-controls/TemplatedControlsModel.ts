import { rgb } from "../../../../src/Fui";
import {
  demoAdvancedControlsRoute,
  demoHomeRoute,
  demoTemplatedControlsRoute,
  RoutePageModel,
  RoutePageNavItem,
} from "../../design-system";

function createNavItems(): Array<RoutePageNavItem> {
  return [
    new RoutePageNavItem(demoHomeRoute(), "Dashboard"),
    new RoutePageNavItem(demoAdvancedControlsRoute(), "Advanced controls"),
    new RoutePageNavItem(demoTemplatedControlsRoute(), "Templated controls"),
  ];
}

function createHighlights(): Array<string> {
  return [
    "This route applies explicit house templates through its design-system controls, without mutable application-wide template state.",
    "One local override stays distinct to show that per-control templates remain independent of the shared design-system constructors.",
    "Per-instance color objects tint the same presenter-owned chrome, so apps can restyle built-ins without forking the shipped control behavior.",
    "Every stateful control owns a stable nodeId so browser-history restores still work across remounts.",
    "The page lives in the same routed demo shell as the dashboard and advanced-controls pages, so template coverage exercises real route swaps, not just inline snippets.",
  ];
}

export function createTemplatedControlsRoutePageModel(): RoutePageModel {
  return new RoutePageModel(
    "Templated controls",
    "Inspect explicit design-system templates, local overrides, and presenter-aware color overrides on a dedicated demo route.",
    "Template showcase",
    rgb(244, 114, 182),
    "Record template ping",
    "Template actions",
    createNavItems(),
    createHighlights(),
  );
}
