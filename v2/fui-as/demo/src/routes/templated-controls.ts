export * from "../../../src/FuiExports";
export * from "../generated/HostEvents";

import { Node, createManagedApplication } from "../../../src/Fui";
import { RoutePageController } from "../design-system";
import { TemplatedControlsController } from "./templated-controls/TemplatedControlsController";
import { createTemplatedControlsRoutePageModel } from "./templated-controls/TemplatedControlsModel";

function buildController(): RoutePageController {
  const templatedControlsController = new TemplatedControlsController();
  return new RoutePageController(
    createTemplatedControlsRoutePageModel(),
    templatedControlsController.buildSections(),
    templatedControlsController,
  );
}

createManagedApplication<RoutePageController>(
  buildController,
  (controller): Node => controller.getRoot(),
  (controller): void => controller.mount(),
  (controller): void => controller.dispose(),
);
