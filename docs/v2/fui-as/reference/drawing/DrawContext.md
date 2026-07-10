# DrawContext

Immediate-mode drawing context for `CustomDrawable.draw(ctx)` and
`Bitmap.canvas()`.

Commands are batched. Call `flush()` before the end of a custom draw callback
when you need deterministic submission, and before `Bitmap.commit()` when using
an off-screen bitmap context.

## State

- `save(): void`
- `restore(): void`
- `translate(x: f32, y: f32): void`
- `scale(sx: f32, sy: f32): void`
- `rotate(degrees: f32): void`

## Clipping

- `clipRect(x: f32, y: f32, w: f32, h: f32): void`
- `clipRoundRect(x: f32, y: f32, w: f32, h: f32, radius: f32): void`
- `clipRoundedRect(x: f32, y: f32, w: f32, h: f32, topLeft: f32, topRight: f32, bottomRight: f32, bottomLeft: f32): void`

## Primitives

- `drawRect(x: f32, y: f32, w: f32, h: f32, paint: Paint): void`
- `drawCircle(cx: f32, cy: f32, radius: f32, paint: Paint): void`
- `drawLine(x1: f32, y1: f32, x2: f32, y2: f32, color: u32, strokeWidth: f32): void`
- `drawRoundRect(x: f32, y: f32, w: f32, h: f32, rx: f32, ry: f32, paint: Paint): void`
- `drawPath(path: Path, paint: Paint): void`

## Text

- `drawTextNode(node: Node, x: f32, y: f32): void`
- `drawTextLayout(layout: TextLayout, x: f32, y: f32): void`

`drawTextLayout(...)` expects a ready `TextLayout` or `DynamicTextLayout`.
Calling it before readiness logs an SDK error and no-ops.

## Images and SVG

- `drawImage(textureId: u32, x: f32, y: f32, w: f32, h: f32, sampling: ImageSampling = ImageSampling.linear()): void`
- `drawSvg(svgId: u32, x: f32, y: f32, w: f32, h: f32): void`

Use texture IDs from `Bitmap.textureId` or loaded image assets, and SVG IDs from
loaded SVG assets.

`drawImage(...)` supports the same `ImageSampling` factories as retained
`Image`: `linear()`, `nearest()`, mipmapped linear variants, cubic Mitchell,
cubic Catmull-Rom, and `anisotropic(maxAniso)`. `drawSvg(...)` currently replays
vector SVG content directly, so texture sampling does not apply to that path.

## Submission

### `flush(): void`

Submits queued draw commands to the underlying canvas. Empty flushes are no-ops.
