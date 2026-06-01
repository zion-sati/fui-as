import * as ui from "../bindings/ui";
import { markTextureAssetReady } from "./Assets";
import { Disposable } from "./Disposable";
import { allocateDynamicTextureId } from "./DynamicAssetIds";
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
  private disposed: bool = false;

  constructor(width: u32, height: u32) {
    const byteLength = validateBitmapDimensions(width, height);
    this.width = width;
    this.height = height;
    this.textureId = allocateDynamicTextureId();
    this.pixelBytes = new Uint8Array(<i32>byteLength);
  }

  pixels(): Uint8Array {
    this.ensureNotDisposed("Bitmap.pixels");
    return this.pixelBytes;
  }

  pixelPtr(): usize {
    const pixels = this.pixels();
    return pixels.length > 0 ? pixels.dataStart : 0;
  }

  commit(): u32 {
    this.ensureNotDisposed("Bitmap.commit");
    ui.bitmapCommit(this.textureId, this.pixelBytes, this.width, this.height);
    markTextureAssetReady(this.textureId, <f32>this.width, <f32>this.height);
    return this.textureId;
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    ui.bitmapRelease(this.textureId);
    this.pixelBytes = new Uint8Array(0);
  }

  private ensureNotDisposed(functionName: string): void {
    if (this.disposed) {
      throwObjectDisposed(functionName, "Bitmap");
    }
  }
}
