export * from "../fui/FuiExports";
export * from "../host/generated/HostEvents";

import { Node, createManagedApplication } from "../fui/Fui";
import { HomeController } from "./mvc/pages/home/HomeController";

const app = createManagedApplication<HomeController>(
  () => new HomeController(),
  (controller): Node => controller.getRoot(),
  (controller): void => controller.mount(),
  (controller): void => controller.dispose(),
);

export function __runApp(): void {
  app.run();
}

export function __disposeApp(): void {
  app.dispose();
}
