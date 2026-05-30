import { ManagedApplicationController, Node } from "../../fui/Fui";
import { SettingsModel } from "./SettingsModel";
import { SettingsView } from "./SettingsView";

export class SettingsController extends ManagedApplicationController {
  readonly model: SettingsModel = new SettingsModel();
  readonly view: SettingsView = new SettingsView(this.model);

  constructor() {
    super();
    this.view.actionButton.onClickWith(this, (controller) => {
      controller.model.saveCount += 1;
      controller.view.setSaveCount(controller.model.saveCount);
    });
  }

  getRoot(): Node {
    return this.view.getRoot();
  }
}
