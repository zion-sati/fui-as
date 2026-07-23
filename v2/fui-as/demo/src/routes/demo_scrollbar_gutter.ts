export * from "../../../src/FuiExports";
export * from "../generated/HostEvents";

import { Application, createManagedApplication } from "../../../src/Fui";
import { ScrollbarGutterBugController } from "./scrollbar-gutter/ScrollbarGutterBugController";

const app = createManagedApplication<ScrollbarGutterBugController>(
  () => new ScrollbarGutterBugController(),
);

export function __runApp(): void {
  Application.caption("EffinDOM FUI-AS Demo • Scrollbar Gutter");
  app.run();
}

export function __disposeApp(): void {
  app.dispose();
}
