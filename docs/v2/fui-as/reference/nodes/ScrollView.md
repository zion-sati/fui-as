# ScrollView

```ts
import { ScrollState, ScrollView } from "./Fui";
```

- **Constructor:** `new ScrollView()`
- **State:** `bindScrollState(state)`, `scrollState` getter
- **Sizing/layout:** `width`, `height`, `fillWidth`, `fillHeight`, `fillSize`, `flexBasis`
- **Scrolling:** `scrollEnabledX`, `scrollEnabledY`, `showScrollbars`, `friction`, `scrollOffset`
- **Children/events:** `child`, `children`, `onClick`, `onPointerEnter`, `onPointerLeave`

## Sizing guidance

`ScrollView` follows the same sizing semantics as `FlexBox`:

- `fillWidth()` / `fillHeight()` => fill the available space on that axis
- `Unit.Percent` => literal parent-relative ratio

Use `fillWidth()` or `fillHeight()` on the axis that should expand beside fixed
siblings. Use `Unit.Percent` only when the ratio itself is the requirement.

For the full matrix and examples, see:
- [Controls and nodes sizing guide](../../CONTROLS_AND_NODES.md#layout-sizing-guide-fill-vs-unitpercent)

## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#nodes)
- [SDK docs index](../../SDK_INDEX.md)
