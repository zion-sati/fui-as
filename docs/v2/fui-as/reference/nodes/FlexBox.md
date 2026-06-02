# FlexBox

```ts
import { FlexBox, Unit } from "./Fui";
```

- **Constructor:** `new FlexBox()`
- **Sizing:** `width`, `height`, `fillWidth`, `fillHeight`, `fillWidthPercent`, `fillHeightPercent`, `fillSize`, `minWidth`, `maxWidth`, `minHeight`, `maxHeight`, `flexBasis`
- **Layout:** `flexDirection`, `justifyContent`, `alignItems`, `alignSelf`, `padding`, `margin`
- **Positioning:** `positionType`, `positionAbsolute`, `position`
- **Visuals:** `bgColor`, `cornerRadius`, `corners`, `border`, `borderDashed`, `opacity`, `blur`, `dropShadow`, `backgroundBlur`, `linearGradient`
- **Children/events:** `child`, `children`, `onClick`, `onPointerEnter`, `onPointerLeave`

`FlexBox` is the base retained box node used by most controls.

`margin(...)` adds external spacing outside the node's border box, while
`padding(...)` still reserves internal space inside the node.

## Sizing semantics

The core sizing distinction is:

- `width(100.0, Unit.Percent)` = make this node's box 100% of the parent
- `fillWidth()` = size this node to the available inner width the parent layout
  is offering
- `fillWidthPercent(50.0)` = take 50% of the available inner width the parent
  layout is offering

Likewise on height:

- `height(100.0, Unit.Percent)` = make this node's box 100% of the parent
- `fillHeight()` = size this node to the available inner height the parent
  layout is offering
- `fillHeightPercent(50.0)` = take 50% of the available inner height the parent
  layout is offering

- `fillWidth()` fills the available width on that axis.
- `fillHeight()` fills the available height on that axis.
- `fillWidthPercent(...)` / `fillHeightPercent(...)` fill a fraction of the
  available space on that axis.
- `fillSize()` fills both axes.
- `minWidth(...)`, `maxWidth(...)`, `minHeight(...)`, and `maxHeight(...)`
  clamp the resolved size after the primary sizing mode is chosen.
- `width(0.0, Unit.Auto)` / `height(0.0, Unit.Auto)` size to intrinsic content.

Use `fill*` when you want the node itself to take the available space on an
axis.
Use `Unit.Percent` when you want a literal ratio of the parent.
Do not combine `fillWidth()` with `width(..., Unit.Auto)` on width, or
`fillHeight()` with `height(..., Unit.Auto)` on height: those are contradictory
instructions on the same axis.

`alignItems(...)` is different: it is a parent-level cross-axis policy for this
container's children. Use `alignItems(AlignItems.Stretch)` when the container
should make its children stretch by default on the cross axis.

Use `alignSelf(...)` when one child should override the parent container's
cross-axis alignment without changing sibling behavior.

For the full decision matrix and examples, see:
- [Controls and nodes sizing guide](../../CONTROLS_AND_NODES.md#layout-sizing-guide-fill-vs-unitpercent)

## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#nodes)
- [SDK docs index](../../SDK_INDEX.md)
