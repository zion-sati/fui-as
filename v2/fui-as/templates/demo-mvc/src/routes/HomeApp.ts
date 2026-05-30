export * from "../fui/FuiExports";
export * from "../host/generated/HostEvents";

import { createManagedApplication } from "../fui/Fui";
import { HomeController } from "./home/HomeController";

const app = createManagedApplication<HomeController>(() => new HomeController());

export function __runApp(): void {
  app.run();
}

export function __disposeApp(): void {
  app.dispose();
}
