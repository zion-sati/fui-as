import { Button, rgb } from "../../../fui/Fui";

const BUTTON_RADIUS: f32 = 12.0;
const BUTTON_PADDING_X: f32 = 18.0;
const BUTTON_PADDING_Y: f32 = 10.0;
const BUTTON_BG: u32 = rgb(59, 130, 246);
const BUTTON_TEXT: u32 = rgb(241, 245, 249);

export class PrimaryButton extends Button {
  constructor(label: string) {
    super(label);
    this
      .cornerRadius(BUTTON_RADIUS)
      .padding(BUTTON_PADDING_X, BUTTON_PADDING_Y, BUTTON_PADDING_X, BUTTON_PADDING_Y)
      .bgColor(BUTTON_BG)
      .textColor(BUTTON_TEXT)
      .fontSize(14.0);
  }
}
