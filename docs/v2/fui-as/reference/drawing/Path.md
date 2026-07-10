# Path

Reusable vector path resource for `DrawContext.drawPath(...)`.

Dispose paths when they are no longer needed.

## Builder API

- `moveTo(x: f32, y: f32): this`
- `lineTo(x: f32, y: f32): this`
- `quadTo(cx: f32, cy: f32, x: f32, y: f32): this`
- `cubicTo(c1x: f32, c1y: f32, c2x: f32, c2y: f32, x: f32, y: f32): this`
- `close(): this`
- `addRect(x: f32, y: f32, w: f32, h: f32): this`
- `addCircle(cx: f32, cy: f32, radius: f32): this`

## Lifecycle

### `dispose(): void`

Releases the underlying path resource. Repeated disposal is safe.

## Drawing

```ts
const path = new Path()
  .moveTo(10, 10)
  .lineTo(80, 20)
  .lineTo(40, 70)
  .close();

ctx.drawPath(path, Paint.fill(rgba(58, 197, 108, 255)));
```
