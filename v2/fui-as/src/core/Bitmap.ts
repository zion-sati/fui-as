import * as ui from "../bindings/ui";
import * as ffi from "../core/ffi";
import { markTextureAssetReady } from "./Assets";
import { Disposable } from "./Disposable";
import { allocateDynamicTextureId } from "./DynamicAssetIds";
import { DrawContext } from "../drawing/DrawContext";
import { throwObjectDisposed } from "./Errors";
import { error } from "./Logger";

const FUNCTION_BITMAP_CONSTRUCTOR = "Bitmap.constructor";

function throwBitmapError(category: string, message: string): void {
  error(category, message);
  throw new Error(message);
}

function validateBitmapDimensions(width: u32, height: u32): u32 {
  if (width == 0 || height == 0) {
    throwBitmapError("Validation", FUNCTION_BITMAP_CONSTRUCTOR + ": width and height must be greater than zero");
  }
  const totalBytes = <u64>width * <u64>height * 4;
  if (totalBytes > <u64>0x7fffffff) {
    throwBitmapError("Validation", FUNCTION_BITMAP_CONSTRUCTOR + ": bitmap byte length exceeds the supported AssemblyScript array size");
  }
  return <u32>totalBytes;
}

export class Bitmap implements Disposable {
  readonly width: u32;
  readonly height: u32;
  readonly textureId: u32;
  private pixelBytes: Uint8Array;
  private offscreenId: u32 = 0;
  private canvasUsed: bool = false;
  private disposed: bool = false;

  constructor(width: u32, height: u32) {
    const byteLength = validateBitmapDimensions(width, height);
    this.width = width;
    this.height = height;
    this.textureId = allocateDynamicTextureId();
    this.pixelBytes = new Uint8Array(<i32>byteLength);
    this.offscreenId = ffi.fui_canvas_create_offscreen(width, height);
  }

  pixels(): Uint8Array {
    this.ensureNotDisposed("Bitmap.pixels");
    return this.pixelBytes;
  }

  pixelPtr(): usize {
    const pixels = this.pixels();
    return pixels.length > 0 ? pixels.dataStart : 0;
  }

  /**
   * Returns a `DrawContext` targeting this bitmap's off‑screen raster
   * surface.  Drawing commands issued on the context are accumulated on
   * the off‑screen canvas and uploaded to the GPU texture on the next
   * `commit()` call.
   *
   * The returned `DrawContext` is valid for the lifetime of the `Bitmap`.
   * Do not store it beyond the `Bitmap`'s disposal.
   */
  canvas(): DrawContext {
    this.ensureNotDisposed("Bitmap.canvas");
    this.canvasUsed = true;
    const ptr = ffi.fui_canvas_get_offscreen_ptr(this.offscreenId);
    return new DrawContext(ptr);
  }

  commit(): u32 {
    this.ensureNotDisposed("Bitmap.commit");
    if (this.canvasUsed) {
      // Read the offscreen raster surface back into the pixel buffer
      ffi.fui_canvas_read_offscreen_pixels(
        this.offscreenId, this.pixelBytes.dataStart, this.width, this.height);
    }
    ui.bitmapCommit(this.textureId, this.pixelBytes, this.width, this.height);
    markTextureAssetReady(this.textureId, <f32>this.width, <f32>this.height);
    return this.textureId;
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    if (this.offscreenId !== 0) {
      ffi.fui_canvas_destroy_offscreen(this.offscreenId);
    }
    ui.bitmapRelease(this.textureId);
    this.pixelBytes = new Uint8Array(0);
  }

  private ensureNotDisposed(functionName: string): void {
    if (this.disposed) {
      throwObjectDisposed(functionName, "Bitmap");
    }
  }
}
