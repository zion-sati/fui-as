# Dialog

```ts
import { Dialog } from "./Fui";
```

- **Constructor:** `new Dialog(title = "", body = "")`
- **Content:** `content(title, body)`
- **Lifecycle:** `show()`, `hide()`, `dispose()`
- **Actions:** `onAccept(cb)`, `onCancel(cb)` and owner-bound variants
- **Styling:** `backdropColor`, `backgroundBlur`, `cardColor`, `cardBorder`, `cardCornerRadius`, `cardShadow`
- **Accessors:** `titleText`, `bodyText`, `acceptActionButton`, `cancelActionButton`

`Dialog` is portal-backed and handles Enter/Escape while visible.


## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#controls)
- [SDK docs index](../../SDK_INDEX.md)
