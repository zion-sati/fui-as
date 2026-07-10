# RichText

```ts
import { RichText, Span, span } from "./Fui";
```

- **Constructor:** `new RichText(fragments = [])`
- **Helpers:** `span(text)` returns `RichTextSpan`, `new Span(text)` is the lightweight alias
- **Overarching styling:** `fontStack(...)`, `fontFamily(...)`, `fontWeight(...)`, `fontStyle(...)`, `fontSize(...)`, `textColor(...)`
- **Fragment styling:** span fragments, plus `color(...)`, `bgColor(...)`, `bold()`, `italic()`, `underline()`, `strikethrough()`, `fontFamily(...)`, `fontSize(...)`, `fontWeight(...)`, `fontStyle(...)`
- **Content updates:** `fragmentsValue(...)`, `push(...)`, `text(...)`, `RichText.fromText(...)`

`RichText` compiles helper-span fragments into one attributed retained `Text` node, so shaping stays unified across span boundaries. Container-level font and color setters act as defaults for spans that do not override them. Use `fontFamily(...)` for normal style resolution and `fontStack(...)` only when intentionally selecting one concrete stack as the regular face.

`bgColor(...)` on spans renders inline background rects per span while keeping text shaping unified on one retained node. Underline and strikethrough render as inline decoration strips.

## Example

```ts
new RichText([
  span("Hello").bold().color(0xffffffff),
  new Span(" world").italic().bgColor(0x223344ff),
]);
```

## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#nodes)
- [SDK docs index](../../SDK_INDEX.md)
