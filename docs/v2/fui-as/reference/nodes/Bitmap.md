# Bitmap

A retained pixel buffer backed by a GPU texture. Supports direct pixel access, off-screen canvas drawing, and memory bitmap text rendering via the retained HarfBuzz text pipeline.

## Usage

```ts
import { Bitmap, Image, ImageSampling } from "effindom";
```

## Pixel access

```ts
const bmp = new Bitmap(200, 100);
bmp.pixels()[0] = 255; // write red to first pixel
bmp.commit();          // upload to GPU texture
```

## Drawing on the bitmap

```ts
const ctx = bmp.canvas();
ctx.drawRect(0, 0, 50, 50, Paint.fill(rgba(255, 0, 0, 255)));
ctx.drawCircle(100, 50, 30, Paint.stroke(blue, 2));
ctx.flush();
bmp.commit();
```

Display a bitmap through `Image` and choose scaling quality there:

```ts
new Image(bmp.textureId)
  .sampling(ImageSampling.nearest());
```

Use `ImageSampling.nearest()` for pixel-art-style bitmap scaling and
`ImageSampling.linear()` or cubic sampling for smoother scaled textures.

## Memory bitmap text rendering

Renders retained `Text` / `RichText` nodes or prepared `TextLayout` resources
into the bitmap pixel buffer using the full HarfBuzz shaping pipeline. This is
the same shaping, fallback, RichText style-run, underline, and per-span font-size
path used by on-screen text.

```ts
const scale = devicePixelRatio();
const bmp = new Bitmap(<u32>Math.ceil(200 * scale), <u32>Math.ceil(100 * scale));

const label = new RichText([
  span("Draw ").italic(),
  span("here")
    .fontFamily(activeTheme.value.fonts.monoFamily)
    .fontSize(30)
    .color(rgba(58, 197, 108, 255))
    .bold()
    .underline(),
])
  .fontFamily(theme.fonts.bodyFamily)
  .fontSize(24)
  .width(200).height(100);
label.build();

Bitmap.onTextReady(label, () => {
  bmp.render(label, 12, 28, scale);
  bmp.commit();
});
```

## Methods

### `canvas(): DrawContext`
Returns an off-screen immediate drawing context targeting this bitmap. Drawing
commands are batched on the context; call `ctx.flush()` before `commit()` when
you need pending commands uploaded.

### `render(node: Node, x: f32 = 0, y: f32 = 0, scale: f32 = 1): void`
Renders a built and prepared `Text` or `RichText` node into this bitmap's pixel
buffer at logical position `(x, y)`. Pass the device pixel ratio as `scale` when
the bitmap dimensions are DPR-sized.

### `renderTextLayout(layout: TextLayout, x: f32 = 0, y: f32 = 0, scale: f32 = 1): void`
Renders a ready `TextLayout` / `DynamicTextLayout` into this bitmap. Calling it
before readiness logs an SDK error and no-ops.

### `static prepareText(node: Node): void`
Low-level escape hatch that queues HarfBuzz text shaping for the given text node.
Most code should use `onTextReady(...)`, which waits for fonts and the loaded
frame before preparing.

### `onTextReady(node: Node, onReady: () => void): this`
Instance helper that waits until the Text/RichText node's required fonts are
available, waits until the app is loaded, queues text shaping, calls `onReady`,
and returns the bitmap.

### `onTextReadyWith<Owner>(owner: Owner, node: Node, onReady: (owner: Owner, node: Node) => void): this`
Owner-bound instance variant for AssemblyScript code that needs to mutate owner
state in the callback.

### `static onTextReady(node: Node, onReady: () => void): void`
Waits until the Text/RichText node's required fonts are available, then queues
text shaping and calls `onReady`.

### `static onTextReadyWith<Owner>(owner: Owner, node: Node, onReady: (owner: Owner, node: Node) => void): void`
Owner-bound variant for AssemblyScript code that needs to mutate owner state in
the callback.
