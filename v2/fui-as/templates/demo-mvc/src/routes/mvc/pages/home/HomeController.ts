import { Application, Node } from "../../../../fui/Fui";
import { Callback1 } from "../../../../fui/FuiPrimitives";
import { onAppClockTick } from "../../../../host/generated/HostEvents";
import { appClockNowUnixSeconds } from "../../../../host/generated/HostServices";
import { HomeModel } from "./HomeModel";
import { HomeView } from "./HomeView";

class ClockTickHandler extends Callback1<i32> {
  private readonly controller: HomeController;

  constructor(controller: HomeController) {
    super();
    this.controller = controller;
  }

  invoke(value: i32): void {
    this.controller.model.hostEventSeconds = value;
    this.controller.view.setHostEventSeconds(value);
  }
}

export class HomeController {
  readonly model: HomeModel = new HomeModel();
  readonly view: HomeView = new HomeView(this.model);
  private readonly clockTickHandler: ClockTickHandler = new ClockTickHandler(this);

  constructor() {
    this.view.actionButton.onClickWith(this, (controller) => {
      controller.model.actionCount += 1;
      controller.view.setActionCount(controller.model.actionCount);
      controller.refreshHostServiceTime();
    });
    onAppClockTick(this.clockTickHandler);
    this.refreshHostServiceTime();
  }

  private refreshHostServiceTime(): void {
    const seconds = appClockNowUnixSeconds();
    this.model.hostServiceSeconds = seconds;
    this.view.setHostServiceSeconds(seconds);
  }

  getRoot(): Node {
    return this.view.getRoot();
  }

  mount(): void {
    Application.mount(this.view.getRoot());
  }

  dispose(): void {
    onAppClockTick(null);
    Application.unmount();
  }
}
