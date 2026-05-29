export * from "../../../src/FuiExports";
export * from "../generated/HostEvents";

import { Node, createManagedApplication } from "../../../src/Fui";
import { RoutePageController } from "../design-system";
import { AdvancedControlsController } from "./advanced-controls/AdvancedControlsController";
import { createAdvancedControlsRoutePageModel } from "./advanced-controls/AdvancedControlsModel";

let latestAdvancedControlsController: AdvancedControlsController | null = null;

function buildController(): RoutePageController {
  const advancedControlsController = new AdvancedControlsController();
  latestAdvancedControlsController = advancedControlsController;
  return new RoutePageController(
    createAdvancedControlsRoutePageModel(),
    advancedControlsController.buildSections(),
    advancedControlsController,
  );
}

const app = createManagedApplication<RoutePageController>(
  buildController,
  (controller): Node => controller.getRoot(),
  (controller): void => controller.mount(),
  (controller): void => controller.dispose(),
);

export function __getAdvancedControlsActionCount(): i32 {
  const controller = app.getActivePage();
  if (controller === null) {
    return -1;
  }
  return controller.getActionCount();
}

export function __getAdvancedControlsAnimationTargetCode(): i32 {
  const controller = latestAdvancedControlsController;
  if (controller === null) {
    return -1;
  }
  return controller.animationTargetCode();
}
