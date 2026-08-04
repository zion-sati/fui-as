# TextLayout

Immediate-mode formatted text resource for `DrawContext`.

```ts
const label = TextLayout.text("Revenue")
  .fontFamily(theme.fonts.bodyFamily)
  .fontSize(13)
  .color(rgba(255, 255, 255, 255));

label.onReadyWith(this, (owner, readyLabel) => {
  owner.label = readyLabel;
});

ctx.drawTextLayout(label, x, y);
```

`TextLayout` uses the retained text shaping pipeline internally, so it supports
font readiness, fallback fonts, and RichText style runs without exposing raw font
ids.

## Creation

### `static text(value: string): TextLayout`
Creates a plain text layout.

### `static rich(spans: Array<RichTextSpan>): TextLayout`
Creates a RichText-backed layout from spans.

## Readiness

### `isReady: bool`
True after the app is loaded, required fonts are available, and the layout has
prepared metrics/glyphs for its current text and style.

### `onReady(callback: () => void): this`
Waits for the app loaded phase and required fonts, prepares the layout, then
invokes the callback. This also handles lazy built-in fonts such as the bundled
mono family.

### `onReadyWith<Owner>(owner: Owner, handler: (owner: Owner, layout: TextLayout) => void): this`
Owner-bound readiness callback.

## Drawing

### `DrawContext.drawTextLayout(layout: TextLayout, x: f32, y: f32): void`
Draws the prepared layout at the supplied origin.

### `Bitmap.renderTextLayout(layout: TextLayout, x: f32 = 0, y: f32 = 0, scale: f32 = 1): bool`
Renders the prepared layout into a bitmap. Pass the device pixel ratio as
`scale` when the bitmap dimensions are DPR-sized. Returns `false` when the
prepared node is not yet available in the renderer and can be retried next frame.

## Measurement

### `measure(): TextMetrics`
Returns the prepared width, height, baseline, line count, and maximum line
width. Calling `measure()` before readiness logs an SDK error and returns zero
metrics.

### `measuredWidth: f32`
Convenience getter for `measure().width`.

### `measuredHeight: f32`
Convenience getter for `measure().height`.

## Styling

Common text APIs mirror `Text`:

- `fontFamily(...)`
- `fontStack(...)`
- `fontSize(...)`
- `fontWeight(...)`
- `fontStyle(...)`
- `lineHeight(...)`
- `color(...)` / `textColor(...)`
- `width(...)`, `height(...)`
- `wrap(...)` / `wrapping(...)`
- `overflow(...)`
