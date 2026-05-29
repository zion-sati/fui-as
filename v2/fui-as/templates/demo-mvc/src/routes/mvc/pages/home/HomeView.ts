import { Column, FlexBox, JustifyContent, Row, SelectionArea, Text, Unit, rgb } from "../../../../fui/Fui";
import { MvcNavPill } from "../../shared/design-system/MvcNavPill";
import { MvcPrimaryButton } from "../../shared/design-system/MvcPrimaryButton";
import { mvcHomeRoute, mvcSettingsRoute } from "../../shared/routes";
import { HomeModel } from "./HomeModel";

function navSpacer(): FlexBox {
  return new FlexBox().width(10.0, Unit.Pixel).height(1.0, Unit.Pixel);
}

export class HomeView {
  readonly actionButton: MvcPrimaryButton;
  private readonly statusText: Text;
  private readonly hostServiceText: Text;
  private readonly hostEventText: Text;
  private readonly root!: SelectionArea;

  constructor(model: HomeModel) {
    const homePill = new MvcNavPill(mvcHomeRoute(), "Home").active(true);
    const settingsPill = new MvcNavPill(mvcSettingsRoute(), "Settings").active(false);

    const navBar = Row()
      .width(100.0, Unit.Percent)
      .justifyContent(JustifyContent.End)
      .child(homePill)
      .child(navSpacer())
      .child(settingsPill);

    const title = new Text(model.title).fontSize(34.0).textColor(rgb(241, 245, 249)) as Text;
    const subtitle = new Text(model.subtitle).fontSize(16.0).textColor(rgb(148, 163, 184)) as Text;
    this.statusText = new Text("Home counter: 0").fontSize(18.0).textColor(rgb(147, 197, 253)) as Text;
    this.hostServiceText = new Text("Host service time: -").fontSize(15.0).textColor(rgb(191, 219, 254)) as Text;
    this.hostEventText = new Text("Host event tick: -").fontSize(15.0).textColor(rgb(134, 239, 172)) as Text;
    this.actionButton = new MvcPrimaryButton(model.actionLabel);

    const content = Column(
      navBar,
      new FlexBox().height(24.0, Unit.Pixel),
      title,
      new FlexBox().height(12.0, Unit.Pixel),
      subtitle,
      new FlexBox().height(20.0, Unit.Pixel),
      this.statusText,
      new FlexBox().height(10.0, Unit.Pixel),
      this.hostServiceText,
      this.hostEventText,
      new FlexBox().height(16.0, Unit.Pixel),
      this.actionButton,
    )
      .width(100.0, Unit.Percent)
      .height(100.0, Unit.Percent)
      .padding(24.0, 24.0, 24.0, 24.0);

    this.root = new SelectionArea()
      .fillWidth()
      .fillHeight()
      .bgColor(rgb(2, 6, 23))
      .child(content) as SelectionArea;
  }

  getRoot(): SelectionArea {
    return this.root;
  }

  setActionCount(count: i32): void {
    this.statusText.text("Home counter: " + count.toString());
  }

  setHostServiceSeconds(value: i32): void {
    this.hostServiceText.text("Host service time: " + value.toString());
  }

  setHostEventSeconds(value: i32): void {
    this.hostEventText.text("Host event tick: " + value.toString());
  }
}
