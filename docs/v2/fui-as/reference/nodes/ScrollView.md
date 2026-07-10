# ScrollView

```ts
import { ScrollState, ScrollView } from "./Fui";
```

- **Constructor:** `new ScrollView()`
- **State:** `bindScrollState(state)`, `scrollState` getter
- **Sizing/layout:** `width`, `height`, `fillWidth`, `fillHeight`, `fillWidthPercent`, `fillHeightPercent`, `fillSize`, `minWidth`, `maxWidth`, `minHeight`, `maxHeight`, `flexBasis`
- **Scrolling:** `scrollEnabledX`, `scrollEnabledY`, `showScrollbars`, `smoothScrolling`, `friction`, `scrollOffset`

`smoothScrolling()` is enabled by default. Wheel deltas accumulate into one
smooth target without waiting for a burst to finish. Pass `false` to restore
immediate wheel-step scrolling. Touch, scrollbar, and explicit programmatic
scrolling remain direct and take ownership immediately.
- **Children/events:** `child`, `children`, `onClick`, `onPointerEnter`, `onPointerLeave`

## Sizing guidance

`ScrollView` follows the same sizing semantics as `FlexBox`:

- `fillWidth()` / `fillHeight()` => fill the available space on that axis
- `fillWidthPercent(...)` / `fillHeightPercent(...)` => take a percentage of the
  available space on that axis
- `Unit.Percent` => literal parent-relative ratio

Use `fillWidth()` or `fillHeight()` on the axis that should expand beside fixed
siblings. Use `fillWidthPercent(...)` / `fillHeightPercent(...)` when you want a
fraction of that offered space. Use `Unit.Percent` only when the ratio itself is
the requirement.

For the full matrix and examples, see:
- [Controls and nodes sizing guide](../../CONTROLS_AND_NODES.md#layout-sizing-guide-fill-vs-unitpercent)

## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#nodes)
- [SDK docs index](../../SDK_INDEX.md)
