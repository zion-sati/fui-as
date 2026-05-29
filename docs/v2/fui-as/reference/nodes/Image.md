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


## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#nodes)
- [SDK docs index](../../SDK_INDEX.md)
