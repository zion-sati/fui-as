import {
  Application,
  Column,
  FlexBox,
  Row,
  Text,
  createManagedApplication,
  rgb,
} from "../../../src/Fui";
export * from "../../../src/FuiExports";

const PANEL_TEXT: u32 = rgb(0xe2, 0xe8, 0xf0);
const SPACING: f32 = 32.0;

class SmokeApp {
  private readonly root: FlexBox;

  constructor() {
    const left = new Text("left")
      .fontSize(28.0)
      .textColor(PANEL_TEXT) as Text;

    const right = new Text("right")
      .fontSize(28.0)
      .textColor(PANEL_TEXT) as Text;

    const blueBox = new FlexBox()
      .width(120.0)
      .height(96.0)
      .bgColor(0x006CFFFF) as FlexBox;

    this.root = Column(
      Row(left, new FlexBox().width(SPACING).height(1.0), right),
      new FlexBox().height(24.0),
      blueBox,
    )
      .padding(24.0, 24.0, 24.0, 24.0);
  }

  getRoot(): FlexBox {
    return this.root;
  }

  dispose(): void {}
}

const smokeHarness = createManagedApplication<SmokeApp>(
  () => new SmokeApp(),
  (app) => app.getRoot(),
  null,
  (app) => app.dispose(),
);

export function __runSmokeApp(): void {
  smokeHarness.run();
}

export function __runSmokeAppWithNullChild(): void {
  const spacer = new FlexBox();
  spacer.child(changetype<FlexBox>(0));
}
