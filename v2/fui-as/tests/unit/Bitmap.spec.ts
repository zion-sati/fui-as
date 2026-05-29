import { Bitmap, Image, ObjectFit } from "../../src/Fui";
import {
  CALL_BITMAP_COMMIT,
  CALL_BITMAP_RELEASE,
  CALL_CREATE_NODE,
  CALL_SET_IMAGE,
  findCall,
  getCallArg,
  getCallSequence,
  lastBitmapBytesEquals,
  lastBitmapBytesLength,
  resetCalls,
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
});
