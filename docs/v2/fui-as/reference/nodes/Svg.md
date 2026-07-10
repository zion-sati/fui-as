# Svg

```ts
import { ImageSampling, Svg } from "./Fui";
```

- **Constructor:** `new Svg(svgId = 0, tintColor = 0)`
- **Source:** `svg(id)`, `source(url)`, `clearSource()`
- **Style/quality/accessibility:** `tint(color)`, `sampling(...)`, `altText(value)`
- **Asset status helpers:** `assetUrl()`, `assetWidth()`, `assetHeight()`, `assetError()`

URL-backed sources are ref-counted by URL in the runtime cache; swapping sources,
clearing, or disposing releases the previous URL-backed ownership automatically.

Intrinsic size comes from absolute root SVG `width`/`height` when they are present.
When the root uses percentage sizing, FUI-AS falls back to the SVG `viewBox` so
`assetWidth()` and `assetHeight()` still report the document's real intrinsic ratio.
Rendered SVGs also honor the source document's `preserveAspectRatio` behavior inside
the node's assigned layout box.

Like `Image`, `Svg` defaults both axes to `Unit.Auto`, so an unsized SVG still
uses intrinsic sizing once the source is ready. `.width(0, Unit.Auto)` /
`.height(0, Unit.Auto)` resolve from the loaded asset's intrinsic size, and if
one axis stays pixel-sized while the other is `Unit.Auto`, the auto axis preserves
the SVG's intrinsic aspect ratio.

## `ImageSampling`

`Svg.sampling(...)` controls sampling for retained SVG raster variants when the
cached raster is drawn into the node's layout box. The default is
`ImageSampling.linear()`.

```ts
Svg.load("/mark.svg")
  .sampling(ImageSampling.cubicMitchell());
```

Supported values match `Image`: `linear()`, `nearest()`,
`linearMipmapNearest()`, `linearMipmapLinear()`, `cubicMitchell()`,
`cubicCatmullRom()`, and `anisotropic(maxAniso)`.


## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#nodes)
- [SDK docs index](../../SDK_INDEX.md)
