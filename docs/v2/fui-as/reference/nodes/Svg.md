# Svg

```ts
import { Svg } from "./Fui";
```

- **Constructor:** `new Svg(svgId = 0, tintColor = 0)`
- **Source:** `svg(id)`, `source(url)`, `clearSource()`
- **Style/accessibility:** `tint(color)`, `altText(value)`
- **Asset status helpers:** `assetUrl()`, `assetWidth()`, `assetHeight()`, `assetError()`

URL-backed sources are ref-counted by URL in the runtime cache; swapping sources,
clearing, or disposing releases the previous URL-backed ownership automatically.

Intrinsic size comes from absolute root SVG `width`/`height` when they are present.
When the root uses percentage sizing, FUI-AS falls back to the SVG `viewBox` so
`assetWidth()` and `assetHeight()` still report the document's real intrinsic ratio.
Rendered SVGs also honor the source document's `preserveAspectRatio` behavior inside
the node's assigned layout box.


## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#nodes)
- [SDK docs index](../../SDK_INDEX.md)
