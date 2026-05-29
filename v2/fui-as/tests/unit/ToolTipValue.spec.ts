import { PopupPlacement, ToolTip } from "../../src/core/ToolTip";

describe("ToolTipValue", () => {
  it("stores configured tooltip values", () => {
    const tip = ToolTip.text("Helpful")
      .initialShowDelay(-5)
      .betweenShowDelay(12)
      .showDuration(34)
      .placement(PopupPlacement.Bottom)
      .horizontalOffset(5.0)
      .verticalOffset(-3.0)
      .openOnFocus(false)
      .panelColor(0x11223344)
      .textColor(0x55667788);

    expect<string>(tip.contentText).toBe("Helpful");
    expect<i32>(tip.initialShowDelayMs).toBe(0);
    expect<i32>(tip.betweenShowDelayMs).toBe(12);
    expect<i32>(tip.showDurationMs).toBe(34);
    expect<i32>(tip.popupPlacement).toBe(PopupPlacement.Bottom);
    expect<f32>(tip.horizontalOffsetValuePx).toBe(5.0);
    expect<f32>(tip.verticalOffsetValuePx).toBe(-3.0);
    expect<bool>(tip.opensOnFocus).toBe(false);
    expect<bool>(tip.hasPanelColorOverride).toBe(true);
    expect<u32>(tip.panelBackgroundColor).toBe(0x11223344);
    expect<bool>(tip.hasTextColorOverride).toBe(true);
    expect<u32>(tip.tooltipTextColor).toBe(0x55667788);
  });
});
