import { currentRoute } from "../../../src/Fui";

const SOURCE_DEMO_BASE: string = "/v2/fui-as/demo";
const SOURCE_HOME_ROUTE: string = "/v2/fui-as/demo/index.html";
const SOURCE_ADVANCED_CONTROLS_ROUTE: string = "/v2/fui-as/demo/advanced-controls/";
const SOURCE_TEMPLATED_CONTROLS_ROUTE: string = "/v2/fui-as/demo/templated-controls/";
const SOURCE_SCROLLBAR_GUTTER_ROUTE: string = "/v2/fui-as/demo/scrollbar-gutter/";
const PUBLISHED_HOME_ROUTE: string = "/";
const PUBLISHED_ADVANCED_CONTROLS_ROUTE: string = "/advanced-controls/";
const PUBLISHED_TEMPLATED_CONTROLS_ROUTE: string = "/templated-controls/";
const SHARED_FONT_BASE: string = "/v2/fonts/";

function isSourceDemoRoute(route: string): bool {
  if (route.length == 0) {
    return true;
  }
  return route.startsWith(SOURCE_DEMO_BASE);
}

export function demoHomeRoute(): string {
  return isSourceDemoRoute(currentRoute.value) ? SOURCE_HOME_ROUTE : PUBLISHED_HOME_ROUTE;
}

export function demoAdvancedControlsRoute(): string {
  return isSourceDemoRoute(currentRoute.value) ? SOURCE_ADVANCED_CONTROLS_ROUTE : PUBLISHED_ADVANCED_CONTROLS_ROUTE;
}

export function demoTemplatedControlsRoute(): string {
  return isSourceDemoRoute(currentRoute.value) ? SOURCE_TEMPLATED_CONTROLS_ROUTE : PUBLISHED_TEMPLATED_CONTROLS_ROUTE;
}

export function demoScrollbarGutterRoute(): string {
  return isSourceDemoRoute(currentRoute.value) ? SOURCE_SCROLLBAR_GUTTER_ROUTE : PUBLISHED_TEMPLATED_CONTROLS_ROUTE;
}

export function demoImmediateDrawingRoute(): string {
  return isSourceDemoRoute(currentRoute.value)
    ? "/v2/fui-as/demo/immediate-drawing/"
    : "/immediate-drawing/";
}

export function demoSharedFontUrl(assetFile: string): string {
  return SHARED_FONT_BASE + assetFile;
}
