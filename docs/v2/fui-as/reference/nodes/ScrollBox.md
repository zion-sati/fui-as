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

When a scroll child uses `Unit.Auto` sizing, intrinsic child size now drives
overflow on both axes. To stretch to viewport width/height instead, use
`fillWidth()` / `fillHeight()` on the scroll content root.

Do not mix `fill*` and `Unit.Auto` on the same axis for the same node (for
example `fillWidth()` + `width(..., Unit.Auto)`), because that asks for both
"fill available space" and "size to content" simultaneously.


## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#nodes)
- [SDK docs index](../../SDK_INDEX.md)
