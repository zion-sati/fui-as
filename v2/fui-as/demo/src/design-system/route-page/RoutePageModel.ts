import { Signal } from "../../../../src/Fui";

export class RoutePageNavItem {
  constructor(
    readonly routePath: string,
    readonly label: string,
  ) {}
}

export class RoutePageModel {
  readonly actionCount: Signal<i32> = new Signal<i32>(0);

  constructor(
    readonly title: string,
    readonly description: string,
    readonly badge: string,
    readonly accentColor: u32,
    readonly buttonLabel: string,
    readonly counterLabel: string,
    readonly navItems: Array<RoutePageNavItem>,
    readonly highlights: Array<string>,
  ) {}
}
