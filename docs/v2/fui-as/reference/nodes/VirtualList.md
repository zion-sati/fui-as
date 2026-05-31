# VirtualList

```ts
import { VirtualList } from "./Fui";
```

- **Constructor:** `new VirtualList(totalItems, itemHeight, maxVisible = 20)`
- **Binding:** `.onBindItem(renderer)`, `.onBindItemWith(owner, renderer)`
- **Accessors:** `scrollState`, `scrollBar`, `totalItems`, `itemHeight`, `totalContentHeight`
- **Updates:** `updateItemCount(next)`, `render()`
- **Sizing overrides:** `width(...)`, `height(...)`
- **Lifecycle:** `dispose()`

`VirtualList` uses pooled retained rows and exposes its owned vertical scrollbar for styling.
If you forget to bind rows before the first render, it throws `VirtualListItemBindingError`.

## Sizing guidance

`VirtualList` itself is a `FlexBox` container around an owned `ScrollBox`, so it
uses the same sizing rules:

- in a `Column`, prefer `fillHeight()` when the list should take remaining
  vertical space below fixed siblings (headers/toolbars)
- in a `Row`, prefer `fillWidth()` when the list should take remaining
  horizontal space beside fixed siblings (sidebars)
- use `fillWidth()` / `fillHeight()` when the list should fill the available
  space on the cross axis

Common shell pattern:

```ts
const list = new VirtualList(totalItems, itemHeight)
  .onBindItem(bindItem)
  .fillWidth()
  .fillHeight();
```

For the full decision matrix and axis rules, see:
- [Controls and nodes sizing guide](../../CONTROLS_AND_NODES.md#layout-sizing-guide-fill-vs-unitpercent)

## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#nodes)
- [SDK docs index](../../SDK_INDEX.md)
