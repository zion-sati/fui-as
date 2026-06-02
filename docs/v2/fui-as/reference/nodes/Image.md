# Image

```ts
import { Image, ObjectFit } from "./Fui";
```

- **Constructor:** `new Image(textureId = 0, objectFit = ObjectFit.Fill)`
- **Source:** `texture(id)`, `source(url)`, `clearSource()`
- **Fit/accessibility:** `objectFit(...)`, `altText(...)`
- **Nine-patch:** `imageNine(left, top, right, bottom)`, `clearImageNine()`
- **Asset status helpers:** `assetUrl()`, `assetWidth()`, `assetHeight()`, `assetError()`

URL-backed sources are ref-counted by URL in the runtime cache; swapping sources,
clearing, or disposing releases the previous URL-backed ownership automatically.

Images default both axes to `Unit.Auto`, so forgetting to set `width(...)` /
`height(...)` still gives you intrinsic sizing once the asset is ready.
`width(0.0, Unit.Auto)` and `height(0.0, Unit.Auto)` resolve from the loaded
texture's intrinsic pixel dimensions. If both axes are `Auto`, the image uses its
natural size once the asset is ready. If one axis is explicit pixels and the other
is `Auto`, the auto axis derives from the texture aspect ratio.

## `ObjectFit`

`ObjectFit` controls how the texture is mapped into the image node's layout box:

- `ObjectFit.Fill` stretches the texture to exactly match the box.
- `ObjectFit.Contain` preserves aspect ratio and fits the whole texture inside the box.
- `ObjectFit.Cover` preserves aspect ratio and fills the box, cropping overflow if needed.
- `ObjectFit.None` draws at intrinsic size without fit scaling.
- `ObjectFit.ScaleDown` behaves like `None` unless the texture would overflow the box, then it scales down like `Contain`.


## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#nodes)
- [SDK docs index](../../SDK_INDEX.md)
