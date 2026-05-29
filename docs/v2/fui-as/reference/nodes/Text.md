# Text

```ts
import { Text } from "./Fui";
```

- **Constructor:** `new Text(content = "")`
- **Content:** `text(content)`, `semanticLabel(label)`
- **Overflow fades:** `overflowFade(horizontal = true, vertical = false)`

`Text` extends `TextCore`, so typography and selection/editability APIs from the text stack are available (for example `fontFamily`, `fontWeight`, `lineHeight`, `textAlign`, `verticalAlign`, `selectable`).

Defaults are theme-driven: if you set `fontSize(...)` without choosing a font,
`Text` resolves against `activeTheme.value.fonts.bodyFamily`; if you do not call
`textColor(...)`, it uses `activeTheme.value.colors.textPrimary`.

`overflowFade(...)` is available on `Text` only. It adds directional fade
masks for clipped text without changing the underlying glyph layout.


## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#nodes)
- [SDK docs index](../../SDK_INDEX.md)
