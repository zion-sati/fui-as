export * from "../../../src/FuiExports";
export * from "../generated/HostEvents";

import { createManagedApplication } from "../../../src/Fui";
import { ScrollbarGutterBugController } from "./scrollbar-gutter/ScrollbarGutterBugController";

const app = createManagedApplication<ScrollbarGutterBugController>(
  () => new ScrollbarGutterBugController(),
);

export function __runApp(): void {
  app.run();
}

export function __disposeApp(): void {
  app.dispose();
}
