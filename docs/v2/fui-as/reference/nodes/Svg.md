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


## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#nodes)
- [SDK docs index](../../SDK_INDEX.md)
