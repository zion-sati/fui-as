import { FlexBox, JustifyContent, Row, Unit } from "../../../fui/Fui";
import { NavPill } from "./NavPill";
import { homeRoute, settingsRoute } from "../routes";

function navSpacer(): FlexBox {
  return new FlexBox().width(10.0, Unit.Pixel).height(1.0, Unit.Pixel);
}

export function createNavBar(homeIsActive: bool): FlexBox {
  const homePill = new NavPill(homeRoute(), "Home").active(homeIsActive);
  const settingsPill = new NavPill(settingsRoute(), "Settings").active(!homeIsActive);
  return Row()
    .width(100.0, Unit.Percent)
    .justifyContent(JustifyContent.End)
    .child(homePill)
    .child(navSpacer())
    .child(settingsPill);
}
