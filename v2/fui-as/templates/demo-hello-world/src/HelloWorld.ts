import {
  AlignItems,
  Button,
  Column,
  JustifyContent,
  rgb,
  SelectionArea,
  Text,
  TextAlign,
  Unit,
} from "./fui/Fui";
import { Callback1 } from "./fui/FuiPrimitives";
import { onAppClockTick } from "./host/generated/HostEvents";
import { appClockNowUnixSeconds } from "./host/generated/HostServices";

class ClockTickHandler extends Callback1<i32> {
  private readonly owner: HelloWorld;

  constructor(owner: HelloWorld) {
    super();
    this.owner = owner;
  }

  invoke(value: i32): void {
    this.owner.setEventTime(value);
  }
}

class HelloWorld {
  private clickCount: i32 = 0;
  private readonly counterLabel: Text = new Text("Clicked 0 times");
  private readonly hostServiceLabel: Text = new Text("Host service time: -");
  private readonly hostEventLabel: Text = new Text("Host event tick: -");
  private readonly clockTickHandler: ClockTickHandler = new ClockTickHandler(this);

  constructor() {
    this.counterLabel.fontSize(20.0);
    this.hostServiceLabel.fontSize(14.0).textColor(rgb(191, 219, 254));
    this.hostEventLabel.fontSize(14.0).textColor(rgb(134, 239, 172));
    this.refreshHostServiceTime();
    onAppClockTick(this.clockTickHandler);
  }

  private refreshHostServiceTime(): void {
    const seconds = appClockNowUnixSeconds();
    this.hostServiceLabel.text("Host service time: " + seconds.toString());
  }

  private setEventTime(seconds: i32): void {
    this.hostEventLabel.text("Host event tick: " + seconds.toString());
  }

  buildPage(): SelectionArea {
    
    const title = new Text("Hello world from FUI-AS")
      .fontSize(36.0)
      .textAlign(TextAlign.Center)
      .width(100.0, Unit.Percent);

    const subtitle = new Text("A tiny app in two files: App.ts + HelloWorld.ts")
      .fontSize(16.0)
      .textAlign(TextAlign.Center)
      .width(100.0, Unit.Percent);

    const button = new Button("Click me")
      .margin(0.0, 18.0, 0.0, 12.0)
      .onClickWith<HelloWorld>(this, owner => {
        owner.clickCount += 1;
        owner.counterLabel.text(
          "Clicked " + owner.clickCount.toString() + " time" + (owner.clickCount == 1 ? "" : "s"),
        );
        owner.refreshHostServiceTime();
      });
    
    const note = new Text(
      "For production apps, move to an explicit MVC structure once screens, state, or host integration grows.",
    )
      .fontSize(14.0)
      .textAlign(TextAlign.Center)
      .width(680.0, Unit.Pixel);

    return new SelectionArea()
      .fillWidth()
      .fillHeight()
      .child(
        Column(
          title,
          subtitle,
          button,
          this.counterLabel,
          this.hostServiceLabel,
          this.hostEventLabel,
          note)
          .fillWidth()
          .fillHeight()
          .padding(24.0, 24.0, 24.0, 24.0)
          .justifyContent(JustifyContent.Center)
          .alignItems(AlignItems.Center))
      .bgColor(rgb(0, 0, 0)) as SelectionArea;
  }
}

export function createHelloWorldPage(): SelectionArea {
  return new HelloWorld().buildPage();
}
