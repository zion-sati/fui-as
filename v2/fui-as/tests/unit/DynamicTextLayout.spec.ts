import {
  Application,
  DrawContext,
  DynamicTextLayout,
  DynamicTextOverflow,
  FlexBox,
  FontFamily,
  FontStack,
  rgba,
  TextLayout,
  TextLayoutReadyEventArgs,
} from "../../src/Fui";
import { resetCommitState } from "../../src/core/FrameScheduler";
import { FontFace } from "../../src/core/Typography";
import {
  CALL_PREPARE_NODE,
  findCall,
  getCallArg,
  resetCalls,
} from "./FfiTestImports";

class DynamicTextLayoutOwner {
  readyCalls: i32 = 0;
  lastReady: TextLayout | null = null;
}

function countDynamicReady(owner: DynamicTextLayoutOwner, event: TextLayoutReadyEventArgs): void {
  owner.readyCalls += 1;
  owner.lastReady = event.layout;
}

describe("DynamicTextLayout", () => {
  it("waits for required fonts before preparing a fixed charset label", () => {
    resetCalls();
    resetCommitState();

    const layout = DynamicTextLayout.fixedCharset("0123456789.%")
      .fontFamily(FontFamily.withRegularStack(FontStack._fromId(9410)))
      .fontSize(11)
      .color(rgba(255, 255, 255, 255));
    const owner = new DynamicTextLayoutOwner();

    expect<bool>(layout.setText("42.7%")).toBe(true);
    layout.onReadyWith<DynamicTextLayoutOwner>(owner, countDynamicReady);

    expect<bool>(layout.isReady).toBe(false);
    expect<i32>(owner.readyCalls).toBe(0);
    expect<i32>(findCall(CALL_PREPARE_NODE)).toBe(-1);

    FontFace._dispatchFontLoaded(9410);

    expect<bool>(layout.isReady).toBe(false);
    expect<i32>(owner.readyCalls).toBe(0);

    Application.mount(new FlexBox());

    const prepareIndex = findCall(CALL_PREPARE_NODE);
    expect<bool>(layout.isReady).toBe(true);
    expect<i32>(owner.readyCalls).toBe(1);
    expect<i32>(prepareIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(prepareIndex, 0)).toBe(<f64>layout._drawNode().builtHandle);
  });

  it("rejects unsupported text and preserves the previous valid text in reject mode", () => {
    resetCalls();
    resetCommitState();

    const layout = DynamicTextLayout.fixedCharset("0123456789")
      .overflow(DynamicTextOverflow.Reject);

    expect<bool>(layout.setText("123")).toBe(true);
    expect<string>(layout.currentText).toBe("123");
    expect<bool>(layout.setText("12A")).toBe(false);
    expect<string>(layout.currentText).toBe("123");
  });

  it("accepts unsupported text in fallback shape mode", () => {
    resetCalls();
    resetCommitState();

    const layout = DynamicTextLayout.fixedCharset("0123456789")
      .overflow(DynamicTextOverflow.FallbackShape);

    expect<bool>(layout.setText("12A")).toBe(true);
    expect<string>(layout.currentText).toBe("12A");
  });

  it("re-prepares immediately when text changes after readiness", () => {
    resetCalls();
    resetCommitState();

    const layout = DynamicTextLayout.fixedCharset("0123456789")
      .fontFamily(FontFamily.withRegularStack(FontStack._fromId(1)))
      .fontSize(12);

    expect<bool>(layout.setText("1")).toBe(true);
    layout.onReady((): void => {});
    Application.mount(new FlexBox());
    expect<bool>(layout.isReady).toBe(true);

    resetCalls();
    expect<bool>(layout.setText("2")).toBe(true);
    expect<bool>(layout.isReady).toBe(true);
    expect<i32>(findCall(CALL_PREPARE_NODE)).toBeGreaterThan(-1);
  });

  it("updates measured width when text changes after readiness", () => {
    resetCalls();
    resetCommitState();

    const layout = DynamicTextLayout.fixedCharset("0123456789")
      .fontFamily(FontFamily.withRegularStack(FontStack._fromId(1)))
      .fontSize(12);

    expect<bool>(layout.setText("1")).toBe(true);
    layout.onReady((): void => {});
    Application.mount(new FlexBox());
    const shortWidth = layout.measure().width;

    expect<bool>(layout.setText("1234")).toBe(true);
    const longWidth = layout.measure().width;

    expect<bool>(layout.isReady).toBe(true);
    expect<f32>(longWidth).toBeGreaterThan(shortWidth);
  });

  it("draws through DrawContext.drawTextLayout once ready", () => {
    resetCalls();
    resetCommitState();

    const layout = DynamicTextLayout.fixedCharset("abc")
      .fontFamily(FontFamily.withRegularStack(FontStack._fromId(1)))
      .fontSize(12);

    layout.setText("abc");
    layout.onReady((): void => {});
    Application.mount(new FlexBox());

    const ctx = new DrawContext(0);
    ctx.drawTextLayout(layout, 3, 4);

    expect<bool>(layout.isReady).toBe(true);
  });

  it("formats numeric values with precision, prefix, and suffix", () => {
    resetCalls();
    resetCommitState();

    const layout = DynamicTextLayout.numeric()
      .precision(1)
      .prefix("$")
      .suffix("%");

    expect<bool>(layout.setValue(42.67)).toBe(true);
    expect<string>(layout.currentText).toBe("$42.7%");
  });

  it("refreshes numeric text when formatting options change", () => {
    resetCalls();
    resetCommitState();

    const layout = DynamicTextLayout.numeric()
      .precision(0)
      .fontFamily(FontFamily.withRegularStack(FontStack._fromId(1)))
      .fontSize(12);

    expect<bool>(layout.setValue(42.67)).toBe(true);
    layout.onReady((): void => {});
    Application.mount(new FlexBox());

    expect<string>(layout.currentText).toBe("43");

    layout.precision(2).prefix("$").suffix(" ms");

    expect<string>(layout.currentText).toBe("$42.67 ms");
    expect<bool>(layout.isReady).toBe(true);
    expect<i32>(findCall(CALL_PREPARE_NODE)).toBeGreaterThan(-1);
  });
});
