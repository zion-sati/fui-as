import * as ui from "../bindings/ui";
import * as ffi from "../core/ffi";
import { markTextureAssetReady } from "./Assets";
import { Disposable } from "./Disposable";
import { allocateDynamicTextureId } from "./DynamicAssetIds";
import { DrawContext } from "../drawing/DrawContext";
import { throwObjectDisposed } from "./Errors";
import { LoadedEventArgs, onLoadedWith } from "./FrameScheduler";
import { error } from "./Logger";
import { Node } from "./Node";
import { FontFace, FontsLoadedEventArgs } from "./Typography";
import { TextLayout } from "../text/TextLayout";

const FUNCTION_BITMAP_CONSTRUCTOR = "Bitmap.constructor";

export class BitmapTextReadyEventArgs {
  readonly node: Node;

  constructor(node: Node) {
    this.node = node;
  }
}

export type BitmapTextReadyHandler<Owner> = (owner: Owner, event: BitmapTextReadyEventArgs) => void;

class BitmapTextReadyCallback {
  constructor(
    private readonly node: Node,
    private readonly callback: (event: BitmapTextReadyEventArgs) => void,
  ) {}

  handleReady(): void {
    onLoadedWith<BitmapTextReadyCallback>(this, handleBitmapTextLoaded);
  }

  handleLoaded(): void {
    Bitmap.prepareText(this.node);
    this.callback(new BitmapTextReadyEventArgs(this.node));
  }
}

class BitmapTextReadyHandlerAction<Owner> {
  constructor(
    private readonly node: Node,
    private readonly owner: Owner,
    private readonly handler: BitmapTextReadyHandler<Owner>,
  ) {}

  handleReady(): void {
    onLoadedWith<BitmapTextReadyHandlerAction<Owner>>(
      this,
      (action: BitmapTextReadyHandlerAction<Owner>, _event: LoadedEventArgs): void => {
        action.handleLoaded();
      },
    );
  }

  handleLoaded(): void {
    Bitmap.prepareText(this.node);
    this.handler(this.owner, new BitmapTextReadyEventArgs(this.node));
  }
}

function handleBitmapTextReady(callback: BitmapTextReadyCallback): void {
  callback.handleReady();
}

function handleBitmapTextLoaded(callback: BitmapTextReadyCallback, _event: LoadedEventArgs): void {
  callback.handleLoaded();
}

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

const MAX_DIRTY_RECTS: i32 = 16;
const RECT_STRIDE: i32 = 4;  // x, y, w, h

export class Bitmap implements Disposable {
  readonly width: u32;
  readonly height: u32;
  readonly textureId: u32;
  private pixelBytes: Uint8Array;
  private offscreenId: u32 = 0;
  private canvasUsed: bool = false;
  private drawContext: DrawContext | null = null;
  private disposed: bool = false;
  private dirtyRects: StaticArray<u32> = new StaticArray<u32>(MAX_DIRTY_RECTS * RECT_STRIDE);
  private dirtyCount: i32 = 0;

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
    if (this.drawContext !== null) {
      return this.drawContext!;
    }
    const ptr = ffi.fui_canvas_get_offscreen_ptr(this.offscreenId);
    const context = new DrawContext(ptr);
    this.drawContext = context;
    return context;
  }

  /**
   * Renders a retained text node into this bitmap's pixel buffer.
   * Call `Bitmap.prepareText(node)` before the commit that makes the
   * prepared glyphs visible in core.
   *
   * @param node  A built Text or RichText node sized to match this bitmap's dimensions.
   */
  render(node: Node, x: f32 = 0.0, y: f32 = 0.0, scale: f32 = 1.0): void {
    this.ensureNotDisposed("Bitmap.render");
    const handle = node.builtHandle;
    if (handle == <u64>0) return;
    ui.renderNodeToRgba(handle, this.width, this.height, this.pixelPtr(), <u32>this.pixelBytes.length, scale, x, y);
  }

  renderTextLayout(layout: TextLayout, x: f32 = 0.0, y: f32 = 0.0, scale: f32 = 1.0): void {
    this.ensureNotDisposed("Bitmap.renderTextLayout");
    if (!layout.isReady) {
      error("TextLayout", "Bitmap.renderTextLayout() called before the TextLayout was ready; register onReady/onReadyWith and render after the callback.");
      return;
    }
    this.render(layout._drawNode(), x, y, scale);
  }

  /** Queue text shaping for a built text node before the next CommitFrame. */
  static prepareText(node: Node): void {
    ui.prepareNode(node.builtHandle);
  }

  onTextReady(node: Node, onReady: (event: BitmapTextReadyEventArgs) => void): this {
    Bitmap.onTextReady(node, onReady);
    return this;
  }

  onTextReadyWith<Owner>(owner: Owner, node: Node, onReady: BitmapTextReadyHandler<Owner>): this {
    Bitmap.onTextReadyWith<Owner>(owner, node, onReady);
    return this;
  }

  static onTextReady(node: Node, onReady: (event: BitmapTextReadyEventArgs) => void): void {
    const callback = new BitmapTextReadyCallback(node, onReady);
    FontFace.whenFontsLoadedWith<BitmapTextReadyCallback>(
      node._requiredFontIds(),
      callback,
      handleBitmapTextReady,
    );
  }

  static onTextReadyWith<Owner>(owner: Owner, node: Node, onReady: BitmapTextReadyHandler<Owner>): void {
    const callback = new BitmapTextReadyHandlerAction<Owner>(node, owner, onReady);
    FontFace.whenFontsLoadedWith<BitmapTextReadyHandlerAction<Owner>>(
      node._requiredFontIds(),
      callback,
      (action: BitmapTextReadyHandlerAction<Owner>, _event: FontsLoadedEventArgs): void => {
        action.handleReady();
      },
    );
  }

  /**
   * Mark a rectangular region as dirty. Call one or more times before
   * commit(). If no dirty rects are registered, commit() uploads the
   * entire buffer (current behavior, backward‑compatible).
   *
   * @param x  Left edge, clamped to [0, width).
   * @param y  Top edge, clamped to [0, height).
   * @param w  Width, clamped so x+w ≤ width.
   * @param h  Height, clamped so y+h ≤ height.
   */
  dirtyRect(x: u32, y: u32, w: u32, h: u32): void {
    if (w == 0 || h == 0) return;
    if (x >= this.width) return;
    if (y >= this.height) return;
    const cx = x;
    const cy = y;
    const cw = x + w > this.width ? this.width - x : w;
    const ch = y + h > this.height ? this.height - y : h;
    if (this.dirtyCount < MAX_DIRTY_RECTS) {
      const base = this.dirtyCount * RECT_STRIDE;
      unchecked(this.dirtyRects[base] = cx);
      unchecked(this.dirtyRects[base + 1] = cy);
      unchecked(this.dirtyRects[base + 2] = cw);
      unchecked(this.dirtyRects[base + 3] = ch);
      this.dirtyCount++;
    }
  }

  clearDirtyRects(): void {
    this.dirtyCount = 0;
  }

  hasDirtyRects(): bool {
    return this.dirtyCount > 0;
  }

  commit(): u32 {
    this.ensureNotDisposed("Bitmap.commit");
    if (this.canvasUsed) {
      if (this.drawContext !== null) {
        this.drawContext!.flush();
      }
      ffi.fui_canvas_read_offscreen_pixels(
        this.offscreenId, this.pixelBytes.dataStart, this.width, this.height);
    }
    if (this.dirtyCount > 0) {
      for (let i: i32 = 0; i < this.dirtyCount; i++) {
        const base = i * RECT_STRIDE;
        const drx = unchecked(this.dirtyRects[base]);
        const dry = unchecked(this.dirtyRects[base + 1]);
        const drw = unchecked(this.dirtyRects[base + 2]);
        const drh = unchecked(this.dirtyRects[base + 3]);
        const rectBytes = new Uint8Array(<i32>(drw * drh * 4));
        for (let row: u32 = 0; row < drh; row++) {
          const srcIdx: i32 = <i32>(dry + row) * <i32>this.width * 4 + <i32>drx * 4;
          const dstIdx: i32 = <i32>row * <i32>drw * 4;
          memory.copy(rectBytes.dataStart + dstIdx, this.pixelBytes.dataStart + srcIdx, <i32>(drw * 4));
        }
        ffi.fui_bitmap_commit_dirty(
          this.textureId, rectBytes.dataStart, drw * drh * 4,
          this.width, this.height, drx, dry, drw, drh,
        );
      }
      this.dirtyCount = 0;
    } else {
      ui.bitmapCommit(this.textureId, this.pixelBytes, this.width, this.height);
    }
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
    this.drawContext = null;
  }

  private ensureNotDisposed(functionName: string): void {
    if (this.disposed) {
      throwObjectDisposed(functionName, "Bitmap");
    }
  }
}
