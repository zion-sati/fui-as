export * from "../fui/FuiExports";
export * from "../host/generated/HostEvents";

import { Node, createManagedApplication } from "../fui/Fui";
import { SettingsController } from "./mvc/pages/settings/SettingsController";

const app = createManagedApplication<SettingsController>(
  () => new SettingsController(),
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
