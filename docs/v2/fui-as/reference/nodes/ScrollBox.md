# ScrollBox

```ts
import { ScrollBox, ScrollState } from "./Fui";
```

- **Constructor:** `new ScrollBox(scrollState = new ScrollState(), viewportOverride = null)`
- **State/accessors:** `scrollState`, `viewport`, `verticalScrollBar`, `horizontalScrollBar`
- **Content:** `child(node)`, `children(nodes)`
- **Scrolling:** `scrollEnabledX`, `scrollEnabledY`, `scrollOffset`
- **Chrome:** `verticalScrollbarVisibility`, `horizontalScrollbarVisibility`, `scrollbarGutter`
- **Lifecycle:** `dispose()`

`ScrollBox` wraps a `ScrollView` and owns both scrollbar directions.


## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#nodes)
- [SDK docs index](../../SDK_INDEX.md)
