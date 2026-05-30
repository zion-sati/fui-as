export * from "../fui/FuiExports";
export * from "../host/generated/HostEvents";

import { createManagedApplication } from "../fui/Fui";
import { SettingsController } from "./settings/SettingsController";

const app = createManagedApplication<SettingsController>(() => new SettingsController());

export function __runApp(): void {
  app.run();
}

export function __disposeApp(): void {
  app.dispose();
}
