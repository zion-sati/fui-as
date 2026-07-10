import { Application, Bitmap, FlexBox, Image, ObjectFit, Paint, TextLayout, Unit, rgba } from "../../src/Fui";
import { resetCommitState } from "../../src/core/FrameScheduler";
import { BitmapTextReadyEventArgs } from "../../src/core/Bitmap";
import { FontFace, FontFamily, FontStack } from "../../src/core/Typography";
import { RichText, span } from "../../src/nodes";
import {
  CALL_BITMAP_COMMIT,
  CALL_BITMAP_RELEASE,
  CALL_CREATE_NODE,
  CALL_LOG,
  CALL_PREPARE_NODE,
  CALL_RENDER_NODE_TO_RGBA,
  CALL_SET_HEIGHT,
  CALL_SET_IMAGE,
  CALL_SET_WIDTH,
  findCall,
  getCallArg,
  getCallSequence,
  lastBitmapBytesEquals,
  lastBitmapBytesLength,
  lastLogCategoryEquals,
  lastLogMessageEquals,
  resetCalls,
  setLogsEnabled,
} from "./FfiTestImports";

function findLastCall(op: i32): i32 {
  const sequence = getCallSequence();
  let index = -1;
  for (let i = 0; i < sequence.length; ++i) {
    if (unchecked(sequence[i]) == op) {
      index = i;
    }
  }
  return index;
}

class BitmapPrepareOwner {
  readyCalls: i32 = 0;
}

function countPreparedText(owner: BitmapPrepareOwner, event: BitmapTextReadyEventArgs): void {
  if (event.node !== null) {
    owner.readyCalls += 1;
  }
}

describe("Bitmap", () => {
  it("exposes a live pixel buffer and uploads it through fui_host", () => {
    resetCalls();

    const bitmap = new Bitmap(2, 2);
    const pixels = bitmap.pixels();
    expect<i32>(pixels.length).toBe(16);
    expect<usize>(bitmap.pixelPtr()).toBe(pixels.dataStart);

    pixels[0] = 0x80;
    pixels[3] = 0x80;
    pixels[12] = 0x00;
    pixels[13] = 0x40;
    pixels[14] = 0x80;
    pixels[15] = 0xff;

    const textureId = bitmap.commit();
    expect<u32>(textureId).toBeGreaterThan(0);

    const commitIndex = findCall(CALL_BITMAP_COMMIT);
    expect<i32>(commitIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(commitIndex, 0)).toBe(<f64>textureId);
    expect<f64>(getCallArg(commitIndex, 1)).toBe(16.0);
    expect<f64>(getCallArg(commitIndex, 2)).toBe(2.0);
    expect<f64>(getCallArg(commitIndex, 3)).toBe(2.0);
    expect<i32>(lastBitmapBytesLength()).toBe(16);
    expect<bool>(lastBitmapBytesEquals(pixels)).toBe(true);

    bitmap.dispose();
  });

  it("provides a stable texture id for retained image nodes", () => {
    resetCalls();

    const bitmap = new Bitmap(1, 1);
    const image = new Image(bitmap.textureId, ObjectFit.Contain);
    const handle = image.build();

    const createIndex = findCall(CALL_CREATE_NODE);
    expect<i32>(createIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(createIndex, 0)).toBe(2.0);

    const imageIndex = findLastCall(CALL_SET_IMAGE);
    expect<i32>(imageIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(imageIndex, 0)).toBe(<f64>handle);
    expect<f64>(getCallArg(imageIndex, 1)).toBe(<f64>bitmap.textureId);
    expect<f64>(getCallArg(imageIndex, 2)).toBe(<f64>ObjectFit.Contain);

    image.dispose();
    bitmap.dispose();
  });

  it("publishes bitmap dimensions for image auto sizing", () => {
    resetCalls();

    const bitmap = new Bitmap(40, 20);
    bitmap.commit();
    resetCalls();

    const image = new Image(bitmap.textureId, ObjectFit.Contain)
      .width(0.0, Unit.Auto)
      .height(0.0, Unit.Auto);
    const handle = image.build();

    const widthIndex = findLastCall(CALL_SET_WIDTH);
    expect<i32>(widthIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(widthIndex, 0)).toBe(<f64>handle);
    expect<f64>(getCallArg(widthIndex, 1)).toBe(40.0);
    expect<f64>(getCallArg(widthIndex, 2)).toBe(<f64>Unit.Pixel);

    const heightIndex = findLastCall(CALL_SET_HEIGHT);
    expect<i32>(heightIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(heightIndex, 0)).toBe(<f64>handle);
    expect<f64>(getCallArg(heightIndex, 1)).toBe(20.0);
    expect<f64>(getCallArg(heightIndex, 2)).toBe(<f64>Unit.Pixel);

    image.dispose();
    bitmap.dispose();
  });

  it("releases the texture once when disposed repeatedly", () => {
    resetCalls();

    const bitmap = new Bitmap(1, 1);
    bitmap.dispose();
    bitmap.dispose();

    const sequence = getCallSequence();
    let releaseCount = 0;
    for (let i = 0; i < sequence.length; ++i) {
      if (unchecked(sequence[i]) == CALL_BITMAP_RELEASE) {
        releaseCount += 1;
      }
    }
    expect<i32>(releaseCount).toBe(1);
  });

  it("provides a DrawContext via canvas() that targets the offscreen surface", () => {
    resetCalls();

    const bitmap = new Bitmap(4, 4);
    const ctx = bitmap.canvas();
    // Smoke: drawing on the canvas context should not throw
    const red = rgba(255, 0, 0, 255);
    ctx.drawRect(0, 0, 4, 4, Paint.fill(red));
    ctx.drawCircle(2, 2, 1, Paint.stroke(red, 1));

    // commit() after canvas use should still produce a valid texture ID
    const textureId = bitmap.commit();
    expect<u32>(textureId).toBe(bitmap.textureId);

    bitmap.dispose();
  });

  it("disposes the offscreen surface along with the bitmap", () => {
    resetCalls();

    const bitmap = new Bitmap(1, 1);
    bitmap.dispose();

    // Verify the bitmap release was called (offscreen destroy is FFI, not tracked)
    const sequence = getCallSequence();
    let releaseCount = 0;
    for (let i = 0; i < sequence.length; ++i) {
      if (unchecked(sequence[i]) == CALL_BITMAP_RELEASE) {
        releaseCount += 1;
      }
    }
    expect<i32>(releaseCount).toBe(1);
  });

  it("renders prepared TextLayout resources and logs before readiness", () => {
    resetCalls();
    resetCommitState();
    setLogsEnabled(true);

    const bitmap = new Bitmap(32, 16);
    const layout = TextLayout.text("Chip")
      .fontFamily(FontFamily.withRegularStack(FontStack._fromId(1)))
      .fontSize(12);

    bitmap.renderTextLayout(layout);
    expect<i32>(findCall(CALL_LOG)).toBeGreaterThan(-1);
    expect<bool>(lastLogCategoryEquals("Error/TextLayout")).toBe(true);
    expect<bool>(lastLogMessageEquals("Bitmap.renderTextLayout() called before the TextLayout was ready; register onReady/onReadyWith and render after the callback.")).toBe(true);

    layout.onReady((): void => {});
    Application.mount(new FlexBox());
    bitmap.renderTextLayout(layout);

    expect<bool>(layout.isReady).toBe(true);
    expect<f32>(layout.measure().width).toBeGreaterThan(0.0);
    const defaultRenderIndex = findCall(CALL_RENDER_NODE_TO_RGBA);
    expect<i32>(defaultRenderIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(defaultRenderIndex, 4)).toBe(1.0);

    resetCalls();
    bitmap.renderTextLayout(layout, 0.0, 0.0, 2.0);
    const scaledRenderIndex = findCall(CALL_RENDER_NODE_TO_RGBA);
    expect<i32>(scaledRenderIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(scaledRenderIndex, 4)).toBe(2.0);

    resetCalls();
    bitmap.renderTextLayout(layout, 6.0, 7.0, 3.0);
    const placedRenderIndex = findCall(CALL_RENDER_NODE_TO_RGBA);
    expect<i32>(placedRenderIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(placedRenderIndex, 4)).toBe(3.0);
    expect<f64>(getCallArg(placedRenderIndex, 5)).toBe(6.0);
    expect<f64>(getCallArg(placedRenderIndex, 6)).toBe(7.0);
    bitmap.dispose();
  });

  it("waits for required fonts before preparing text", () => {
    resetCalls();
    resetCommitState();

    const rich = new RichText([
      span("Draw "),
      span("here").fontFamily(FontFamily.withRegularStack(FontStack._fromId(9401))),
    ])
      .fontFamily(FontFamily.withRegularStack(FontStack._fromId(1)))
      .fontSize(24.0);
    rich.build();
    resetCalls();
    const owner = new BitmapPrepareOwner();

    Bitmap.onTextReadyWith<BitmapPrepareOwner>(owner, rich, countPreparedText);

    expect<i32>(owner.readyCalls).toBe(0);
    expect<i32>(findCall(CALL_PREPARE_NODE)).toBe(-1);

    FontFace._dispatchFontLoaded(9401);

    expect<i32>(owner.readyCalls).toBe(0);
    expect<i32>(findCall(CALL_PREPARE_NODE)).toBe(-1);

    Application.mount(new FlexBox());

    const prepareIndex = findCall(CALL_PREPARE_NODE);
    expect<i32>(owner.readyCalls).toBe(1);
    expect<i32>(prepareIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(prepareIndex, 0)).toBe(<f64>rich.builtHandle);
  });

  it("instance text readiness helper returns the bitmap and routes owner callbacks", () => {
    resetCalls();
    resetCommitState();

    const rich = new RichText([
      span("Value ").fontFamily(FontFamily.withRegularStack(FontStack._fromId(1))),
    ])
      .fontFamily(FontFamily.withRegularStack(FontStack._fromId(1)))
      .fontSize(18.0);
    rich.build();
    resetCalls();
    const owner = new BitmapPrepareOwner();
    const bitmap = new Bitmap(1, 1);

    const returned = bitmap.onTextReadyWith<BitmapPrepareOwner>(owner, rich, countPreparedText);

    // @ts-ignore: comparing references
    expect<bool>(changetype<usize>(returned) == changetype<usize>(bitmap)).toBe(true);
    expect<i32>(owner.readyCalls).toBe(0);

    Application.mount(new FlexBox());

    expect<i32>(owner.readyCalls).toBe(1);
    const prepareIndex = findCall(CALL_PREPARE_NODE);
    expect<i32>(prepareIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(prepareIndex, 0)).toBe(<f64>rich.builtHandle);

    bitmap.dispose();
  });
});
