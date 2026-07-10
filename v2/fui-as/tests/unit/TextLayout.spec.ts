import { Application, DrawContext, FlexBox, FontFamily, FontStack, TextLayoutReadyEventArgs, activeTheme, rgba, TextLayout } from "../../src/Fui";
import { resetCommitState } from "../../src/core/FrameScheduler";
import { FontFace } from "../../src/core/Typography";
import { RichTextSpan, span } from "../../src/nodes";
import {
  CALL_PREPARE_NODE,
  CALL_SET_FONT,
  CALL_LOG,
  findCall,
  getCallCount,
  getCallArg,
  getCallSequence,
  lastLogCategoryEquals,
  lastLogMessageEquals,
  resetCalls,
  setLogsEnabled,
} from "./FfiTestImports";

class TextLayoutOwner {
  readyCalls: i32 = 0;
  lastReady: TextLayout | null = null;
}

function countReady(owner: TextLayoutOwner, event: TextLayoutReadyEventArgs): void {
  owner.readyCalls += 1;
  owner.lastReady = event.layout;
}

function findSetFontForHandle(handle: u64): i32 {
  const count = getCallCount();
  const sequence = getCallSequence();
  for (let index = 0; index < count; ++index) {
    if (unchecked(sequence[index]) == CALL_SET_FONT && getCallArg(index, 0) == <f64>handle) {
      return index;
    }
  }
  return -1;
}

describe("TextLayout", () => {
  it("waits until loaded before building, then prepares once fonts are ready", () => {
    resetCalls();
    resetCommitState();

    const layout = TextLayout.text("Value")
      .fontFamily(FontFamily.withRegularStack(FontStack._fromId(9402)))
      .fontSize(16)
      .color(rgba(255, 255, 255, 255));
    const owner = new TextLayoutOwner();

    layout.onReadyWith<TextLayoutOwner>(owner, countReady);

    expect<bool>(layout.isReady).toBe(false);
    expect<i32>(owner.readyCalls).toBe(0);
    expect<i32>(findCall(CALL_SET_FONT)).toBe(-1);
    expect<i32>(findCall(CALL_PREPARE_NODE)).toBe(-1);

    FontFace._dispatchFontLoaded(9402);

    expect<bool>(layout.isReady).toBe(false);
    expect<i32>(owner.readyCalls).toBe(0);
    expect<i32>(findCall(CALL_PREPARE_NODE)).toBe(-1);

    Application.mount(new FlexBox());

    expect<i32>(findCall(CALL_SET_FONT)).toBeGreaterThan(-1);
    const prepareIndex = findCall(CALL_PREPARE_NODE);
    expect<bool>(layout.isReady).toBe(true);
    expect<i32>(owner.readyCalls).toBe(1);
    expect<i32>(prepareIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(prepareIndex, 0)).toBe(<f64>layout._drawNode().builtHandle);
  });

  it("requests default lazy mono fonts after mount before waiting for readiness", () => {
    resetCalls();
    resetCommitState();

    const layout = TextLayout.text("Mono")
      .fontFamily(activeTheme.value.fonts.monoFamily)
      .fontSize(14);

    layout.onReady((): void => {});

    expect<i32>(findCall(CALL_SET_FONT)).toBe(-1);
    Application.mount(new FlexBox());

    const fontIndex = findSetFontForHandle(layout._drawNode().builtHandle);
    expect<i32>(fontIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(fontIndex, 1)).toBe(7.0);
    expect<bool>(layout.isReady).toBe(false);
    expect<i32>(findCall(CALL_PREPARE_NODE)).toBe(-1);

    FontFace._dispatchFontLoaded(7);

    expect<bool>(layout.isReady).toBe(true);
    expect<i32>(findCall(CALL_PREPARE_NODE)).toBeGreaterThan(-1);
  });

  it("supports rich text style runs and immediate drawing", () => {
    resetCalls();
    resetCommitState();

    const fragments = new Array<RichTextSpan>();
    fragments.push(span("Draw "));
    fragments.push(span("here").fontFamily(FontFamily.withRegularStack(FontStack._fromId(1))).fontSize(24));
    const layout = TextLayout.rich(fragments)
      .fontFamily(FontFamily.withRegularStack(FontStack._fromId(1)))
      .fontSize(18)
      .width(160)
      .height(48);

    layout.onReady((): void => {});

    expect<bool>(layout.isReady).toBe(false);

    Application.mount(new FlexBox());

    const ctx = new DrawContext(0);
    ctx.drawTextLayout(layout, 12, 24);

    expect<bool>(layout.isReady).toBe(true);
    expect<i32>(findCall(CALL_PREPARE_NODE)).toBeGreaterThan(-1);
  });

  it("reports prepared metrics after readiness", () => {
    resetCalls();
    resetCommitState();

    const layout = TextLayout.text("Metric")
      .fontFamily(FontFamily.withRegularStack(FontStack._fromId(1)))
      .fontSize(20);

    layout.onReady((): void => {});
    Application.mount(new FlexBox());

    const metrics = layout.measure();
    expect<bool>(layout.isReady).toBe(true);
    expect<f32>(metrics.width).toBeGreaterThan(0.0);
    expect<f32>(metrics.height).toBeGreaterThan(0.0);
    expect<f32>(metrics.baseline).toBeGreaterThan(0.0);
    expect<i32>(metrics.lineCount).toBe(1);
    expect<f32>(layout.measuredWidth).toBe(metrics.width);
    expect<f32>(layout.measuredHeight).toBe(metrics.height);
  });

  it("marks itself not ready after mutation", () => {
    resetCalls();
    resetCommitState();

    const layout = TextLayout.text("A")
      .fontFamily(FontFamily.withRegularStack(FontStack._fromId(1)))
      .fontSize(12);

    layout.onReady((): void => {});
    Application.mount(new FlexBox());
    expect<bool>(layout.isReady).toBe(true);

    layout.text("B");
    expect<bool>(layout.isReady).toBe(false);
  });

  it("logs and skips immediate drawing before the layout is ready", () => {
    resetCalls();
    resetCommitState();
    setLogsEnabled(true);

    const layout = TextLayout.text("Pending")
      .fontFamily(FontFamily.withRegularStack(FontStack._fromId(9403)))
      .fontSize(12);

    const ctx = new DrawContext(0);
    ctx.drawTextLayout(layout, 4, 8);

    expect<i32>(findCall(CALL_PREPARE_NODE)).toBe(-1);
    expect<i32>(findCall(CALL_LOG)).toBeGreaterThan(-1);
    expect<bool>(lastLogCategoryEquals("Error/TextLayout")).toBe(true);
    expect<bool>(lastLogMessageEquals("DrawContext.drawTextLayout() called before the TextLayout was ready; register onReady/onReadyWith and draw after the callback.")).toBe(true);
  });

  it("logs and returns zero metrics before the layout is ready", () => {
    resetCalls();
    resetCommitState();
    setLogsEnabled(true);

    const layout = TextLayout.text("Pending")
      .fontFamily(FontFamily.withRegularStack(FontStack._fromId(9404)))
      .fontSize(12);

    const metrics = layout.measure();

    expect<f32>(metrics.width).toBe(0.0);
    expect<f32>(metrics.height).toBe(0.0);
    expect<i32>(metrics.lineCount).toBe(0);
    expect<i32>(findCall(CALL_PREPARE_NODE)).toBe(-1);
    expect<i32>(findCall(CALL_LOG)).toBeGreaterThan(-1);
    expect<bool>(lastLogCategoryEquals("Error/TextLayout")).toBe(true);
    expect<bool>(lastLogMessageEquals("TextLayout.measure() called before the TextLayout was ready; register onReady/onReadyWith and measure after the callback.")).toBe(true);
  });
});
