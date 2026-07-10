# DynamicTextLayout

Immediate-mode short text resource for frequently changing single-style labels.

```ts
const valueLabel = DynamicTextLayout.fixedCharset("0123456789.-% ")
  .fontFamily(theme.fonts.monoFamily)
  .fontSize(11)
  .color(rgba(255, 255, 255, 255))
  .overflow(DynamicTextOverflow.Reject);

valueLabel.setText("42.7%");

valueLabel.onReadyWith(this, (owner, readyLabel) => {
  owner.valueLabel = readyLabel;
});

ctx.drawTextLayout(valueLabel, x, y);
```

`DynamicTextLayout` is for one-line, one-style labels such as chart values,
telemetry tags, status counters, and cursor overlays. It currently uses the same
prepared text backing as `TextLayout` while enforcing the fixed-charset and
overflow contract. A later lower-level glyph resource can replace that backing
without changing call sites if profiling shows it is needed.

## Creation

### `static fixedCharset(charset: string): DynamicTextLayout`
Creates a dynamic layout that can validate updates against a declared character
set.

### `static numeric(): DynamicTextLayout`
Creates a numeric label builder on top of the fixed-charset path. Use
`precision(...)`, `prefix(...)`, `suffix(...)`, and `setValue(...)` to format
the text in AssemblyScript before it flows through the normal `setText(...)`
pipeline.

## Updates

### `setText(value: string): bool`
Updates the current label text. Returns `true` when accepted.

If the layout is already ready, accepted updates immediately re-prepare the
backing text so the next `drawTextLayout(...)` call can render it.

### `setValue(value: f64): bool`
Formats a numeric value and forwards the result through `setText(...)`.

### `precision(digits: i32): this`
Rounds `setValue(...)` output to a fixed number of fractional digits.

### `prefix(value: string): this`
Prepends a literal prefix to `setValue(...)` output.

### `suffix(value: string): this`
Appends a literal suffix to `setValue(...)` output.

### `currentText: string`
The last accepted text value.

## Overflow

### `overflow(mode: DynamicTextOverflow): this`

Supported modes:

- `DynamicTextOverflow.FallbackShape`: accept unsupported text and use the
  normal text preparation path for that value.
- `DynamicTextOverflow.Reject`: reject unsupported text and preserve the
  previous accepted value.

## Readiness

`DynamicTextLayout` uses the same readiness model as `TextLayout`:

- `isReady`
- `onReady(callback)`
- `onReadyWith(owner, handler)`

Readiness waits until the app loaded phase and all required fonts are available.
This includes lazy built-in fonts such as the bundled mono family.

## Drawing

Use the same draw API:

```ts
ctx.drawTextLayout(valueLabel, x, y);
```

Calling `drawTextLayout(...)` before readiness logs an SDK error and no-ops.

`Bitmap.renderTextLayout(valueLabel, x, y, scale)` can render the same resource
into a bitmap.

## Measurement

Use `measure()` after readiness to size surrounding chrome such as chart-label
chips:

```ts
const metrics = valueLabel.measure();
ctx.drawRoundRect(x, y, metrics.width + 10, 22, 5, 5, Paint.fill(chipColor));
ctx.drawTextLayout(valueLabel, x + 5, y + 4);
```

Calling `measure()` before readiness logs an SDK error and returns zero metrics.

## Styling

Common text APIs mirror `TextLayout`:

- `fontFamily(...)`
- `fontStack(...)`
- `fontSize(...)`
- `fontWeight(...)`
- `fontStyle(...)`
- `lineHeight(...)`
- `color(...)` / `textColor(...)`
- `width(...)`, `height(...)`
