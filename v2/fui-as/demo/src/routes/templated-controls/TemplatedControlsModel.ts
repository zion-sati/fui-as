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
    "This route applies a house-style ControlTemplateSet once and lets Checkbox, RadioButton, Switch, Slider, and Dropdown pick it up automatically.",
    "One local override stays distinct to show per-instance template precedence over the app-level defaults.",
    "Every stateful control owns a stable nodeId so browser-history restores still work across remounts.",
    "The page lives in the same routed demo shell as the dashboard and advanced-controls pages, so template coverage exercises real route swaps, not just inline snippets.",
  ];
}

export function createTemplatedControlsRoutePageModel(): RoutePageModel {
  return new RoutePageModel(
    "Templated controls",
    "Inspect app-level control template defaults and local overrides on a dedicated demo route.",
    "Template showcase",
    rgb(244, 114, 182),
    "Record template ping",
    "Template actions",
    createNavItems(),
    createHighlights(),
  );
}
