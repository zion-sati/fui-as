import { NavLink, Text, rgb } from "../../../../fui/Fui";

const PILL_RADIUS: f32 = 999.0;
const PILL_PADDING_X: f32 = 16.0;
const PILL_PADDING_Y: f32 = 8.0;
const PILL_INACTIVE_BG: u32 = rgb(33, 45, 67);
const PILL_ACTIVE_BG: u32 = rgb(34, 197, 94);
const PILL_INACTIVE_TEXT: u32 = rgb(226, 232, 240);
const PILL_ACTIVE_TEXT: u32 = rgb(12, 16, 24);

export class MvcNavPill extends NavLink {
  private readonly labelNode: Text;
  private activeValue: bool = false;

  constructor(href: string, label: string) {
    super(href, label, false);
    this.labelNode = new Text(label)
      .fontSize(14.0)
      .selectable(false) as Text;
    this
      .cornerRadius(PILL_RADIUS)
      .padding(PILL_PADDING_X, PILL_PADDING_Y, PILL_PADDING_X, PILL_PADDING_Y)
      .child(this.labelNode);
    this.applyVisualState();
  }

  active(flag: bool = true): this {
    this.activeValue = flag;
    this.applyVisualState();
    return this;
  }

  private applyVisualState(): void {
    if (this.activeValue) {
      this.bgColor(PILL_ACTIVE_BG);
      this.labelNode.textColor(PILL_ACTIVE_TEXT);
      return;
    }
    this.bgColor(PILL_INACTIVE_BG);
    this.labelNode.textColor(PILL_INACTIVE_TEXT);
  }
}
