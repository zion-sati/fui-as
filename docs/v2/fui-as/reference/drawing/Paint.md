# Paint

Fill/stroke value object used by `DrawContext` primitive and path drawing APIs.

## Creation

### `new Paint()`

Creates a transparent paint with no fill and no stroke.

### `Paint.fill(color: u32): Paint`

Creates a fill-only paint.

### `Paint.stroke(color: u32, width: f32): Paint`

Creates a stroke-only paint.

### `Paint.filledStroke(fill: u32, stroke: u32, width: f32): Paint`

Creates a paint with both fill and stroke.

## Properties

- `fillColor: u32`
- `strokeColor: u32`
- `strokeWidth: f32`

## Helpers

- `hasFill(): bool`
- `hasStroke(): bool`

Transparent fill colors and zero-width strokes are treated as absent.
