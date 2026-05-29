import { fui_navigate_to } from "./ffi";
import { Signal } from "./Signal";

export const currentRoute = new Signal<string>("");

export function navigateTo(target: string, openInNewTab: bool = false): void {
  const bytes = Uint8Array.wrap(String.UTF8.encode(target, false));
  fui_navigate_to(bytes.length > 0 ? bytes.dataStart : 0, <u32>bytes.length, openInNewTab);
}

export function handleRouteChanged(route: string): void {
  currentRoute.value = route;
}
