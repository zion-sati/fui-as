# Image

```ts
import { Image, ImageSampling, ObjectFit } from "./Fui";
```

- **Constructor:** `new Image(textureId = 0, objectFit = ObjectFit.Fill)`
- **Source:** `texture(id)`, `source(url)`, `clearSource()`
- **Fit/quality/accessibility:** `objectFit(...)`, `sampling(...)`, `altText(...)`
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

## `ImageSampling`

`Image.sampling(...)` controls how the texture is sampled when it is drawn at a
different size from its source pixels. The default is `ImageSampling.linear()`.

```ts
Image.load("/photo.png")
  .objectFit(ObjectFit.Cover)
  .sampling(ImageSampling.cubicMitchell());

new Image(pixelArtTextureId)
  .sampling(ImageSampling.nearest());
```

- `ImageSampling.linear()` is the default UI-friendly interpolation.
- `ImageSampling.nearest()` preserves hard source texels for pixel art.
- `ImageSampling.linearMipmapNearest()` and `ImageSampling.linearMipmapLinear()` request mipmapped sampling.
- `ImageSampling.cubicMitchell()` is the smoother high-quality cubic option.
- `ImageSampling.cubicCatmullRom()` is sharper and can ring on hard edges.
- `ImageSampling.anisotropic(maxAniso)` requests anisotropic sampling, clamped by the runtime to a conservative supported range.

Nine-patch images currently keep the existing linear nine-slice path.

## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#nodes)
- [SDK docs index](../../SDK_INDEX.md)
