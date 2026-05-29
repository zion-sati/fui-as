import { Column, FlexBox, JustifyContent, Row, SelectionArea, Text, Unit, rgb } from "../../../../fui/Fui";
import { MvcNavPill } from "../../shared/design-system/MvcNavPill";
import { MvcPrimaryButton } from "../../shared/design-system/MvcPrimaryButton";
import { mvcHomeRoute, mvcSettingsRoute } from "../../shared/routes";
import { SettingsModel } from "./SettingsModel";

function navSpacer(): FlexBox {
  return new FlexBox().width(10.0, Unit.Pixel).height(1.0, Unit.Pixel);
}

export class SettingsView {
  readonly actionButton: MvcPrimaryButton;
  private readonly statusText: Text;
  private readonly root!: SelectionArea;

  constructor(model: SettingsModel) {
    const homePill = new MvcNavPill(mvcHomeRoute(), "Home").active(false);
    const settingsPill = new MvcNavPill(mvcSettingsRoute(), "Settings").active(true);

    const navBar = Row()
      .width(100.0, Unit.Percent)
      .justifyContent(JustifyContent.End)
      .child(homePill)
      .child(navSpacer())
      .child(settingsPill);

    const title = new Text(model.title).fontSize(34.0).textColor(rgb(241, 245, 249)) as Text;
    const subtitle = new Text(model.subtitle).fontSize(16.0).textColor(rgb(148, 163, 184)) as Text;
    this.statusText = new Text("Settings saved: 0").fontSize(18.0).textColor(rgb(134, 239, 172)) as Text;
    this.actionButton = new MvcPrimaryButton(model.actionLabel);

    const content = Column(
      navBar,
      new FlexBox().height(24.0, Unit.Pixel),
      title,
      new FlexBox().height(12.0, Unit.Pixel),
      subtitle,
      new FlexBox().height(20.0, Unit.Pixel),
      this.statusText,
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

  setSaveCount(count: i32): void {
    this.statusText.text("Settings saved: " + count.toString());
  }
}
