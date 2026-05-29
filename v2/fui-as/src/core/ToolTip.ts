import { PopupPlacement } from "../controls/internal/PopupPresenter";

export { PopupPlacement } from "../controls/internal/PopupPresenter";

export class ToolTip {
  private textValue: string = "";
  private initialShowDelayMsValue: i32 = 700;
  private betweenShowDelayMsValue: i32 = 100;
  private showDurationMsValue: i32 = 5000;
  private placementValue: PopupPlacement = PopupPlacement.Top;
  private horizontalOffsetValue: f32 = 0.0;
  private verticalOffsetValue: f32 = 0.0;
  private openOnFocusValue: bool = true;
  private panelBackgroundColorValue: u32 = 0;
  private textColorValue: u32 = 0;
  private panelBackgroundOverridden: bool = false;
  private textColorOverridden: bool = false;

  static text(value: string): ToolTip {
    return new ToolTip().text(value);
  }

  text(value: string): this {
    this.textValue = value;
    return this;
  }

  get contentText(): string {
    return this.textValue;
  }

  initialShowDelay(value: i32): this {
    this.initialShowDelayMsValue = value >= 0 ? value : 0;
    return this;
  }

  get initialShowDelayMs(): i32 {
    return this.initialShowDelayMsValue;
  }

  betweenShowDelay(value: i32): this {
    this.betweenShowDelayMsValue = value >= 0 ? value : 0;
    return this;
  }

  get betweenShowDelayMs(): i32 {
    return this.betweenShowDelayMsValue;
  }

  showDuration(value: i32): this {
    this.showDurationMsValue = value >= 0 ? value : 0;
    return this;
  }

  get showDurationMs(): i32 {
    return this.showDurationMsValue;
  }

  placement(value: PopupPlacement): this {
    this.placementValue = value;
    return this;
  }

  get popupPlacement(): PopupPlacement {
    return this.placementValue;
  }

  horizontalOffset(value: f32): this {
    this.horizontalOffsetValue = value;
    return this;
  }

  get horizontalOffsetValuePx(): f32 {
    return this.horizontalOffsetValue;
  }

  verticalOffset(value: f32): this {
    this.verticalOffsetValue = value;
    return this;
  }

  get verticalOffsetValuePx(): f32 {
    return this.verticalOffsetValue;
  }

  openOnFocus(flag: bool = true): this {
    this.openOnFocusValue = flag;
    return this;
  }

  get opensOnFocus(): bool {
    return this.openOnFocusValue;
  }

  panelColor(color: u32): this {
    this.panelBackgroundOverridden = true;
    this.panelBackgroundColorValue = color;
    return this;
  }

  get hasPanelColorOverride(): bool {
    return this.panelBackgroundOverridden;
  }

  get panelBackgroundColor(): u32 {
    return this.panelBackgroundColorValue;
  }

  textColor(color: u32): this {
    this.textColorOverridden = true;
    this.textColorValue = color;
    return this;
  }

  get hasTextColorOverride(): bool {
    return this.textColorOverridden;
  }

  get tooltipTextColor(): u32 {
    return this.textColorValue;
  }
}
