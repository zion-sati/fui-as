import { currentRoute } from "../../fui/Fui";

const SOURCE_DEMO_BASE: string = "/v2/fui-as/demo-mvc";
const SOURCE_HOME_ROUTE: string = "/v2/fui-as/demo-mvc/home/";
const SOURCE_SETTINGS_ROUTE: string = "/v2/fui-as/demo-mvc/settings/";
const PUBLISHED_HOME_ROUTE: string = "/home/";
const PUBLISHED_SETTINGS_ROUTE: string = "/settings/";

function isSourceDemoRoute(route: string): bool {
  if (route.length == 0) {
    return true;
  }
  return route.startsWith(SOURCE_DEMO_BASE);
}

export function homeRoute(): string {
  return isSourceDemoRoute(currentRoute.value) ? SOURCE_HOME_ROUTE : PUBLISHED_HOME_ROUTE;
}

export function settingsRoute(): string {
  return isSourceDemoRoute(currentRoute.value) ? SOURCE_SETTINGS_ROUTE : PUBLISHED_SETTINGS_ROUTE;
}
