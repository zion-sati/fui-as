# VirtualList

```ts
import { VirtualList } from "./Fui";
```

- **Constructor:** `new VirtualList(totalItems, itemHeight, bindItem, maxVisible = 20)`
- **Accessors:** `scrollState`, `scrollBar`, `totalItems`, `itemHeight`, `totalContentHeight`
- **Updates:** `updateItemCount(next)`, `render()`
- **Sizing overrides:** `width(...)`, `height(...)`
- **Lifecycle:** `dispose()`

`VirtualList` uses pooled retained rows and exposes its owned vertical scrollbar for styling.


## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#nodes)
- [SDK docs index](../../SDK_INDEX.md)
