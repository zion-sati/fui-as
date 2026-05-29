import { Application, Node } from "../../../../fui/Fui";
import { SettingsModel } from "./SettingsModel";
import { SettingsView } from "./SettingsView";

export class SettingsController {
  readonly model: SettingsModel = new SettingsModel();
  readonly view: SettingsView = new SettingsView(this.model);

  constructor() {
    this.view.actionButton.onClickWith(this, (controller) => {
      controller.model.saveCount += 1;
      controller.view.setSaveCount(controller.model.saveCount);
    });
  }

  getRoot(): Node {
    return this.view.getRoot();
  }

  mount(): void {
    Application.mount(this.view.getRoot());
  }

  dispose(): void {
    Application.unmount();
  }
}
