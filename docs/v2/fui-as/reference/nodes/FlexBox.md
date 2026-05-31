# FlexBox

```ts
import { FlexBox, Unit } from "./Fui";
```

- **Constructor:** `new FlexBox()`
- **Sizing:** `width`, `height`, `fillWidth`, `fillHeight`, `fillSize`, `flexBasis`
- **Layout:** `flexDirection`, `justifyContent`, `alignItems`, `padding`, `margin`
- **Positioning:** `positionType`, `positionAbsolute`, `position`
- **Visuals:** `bgColor`, `cornerRadius`, `corners`, `border`, `borderDashed`, `opacity`, `blur`, `dropShadow`, `backgroundBlur`, `linearGradient`
- **Children/events:** `child`, `children`, `onClick`, `onPointerEnter`, `onPointerLeave`

`FlexBox` is the base retained box node used by most controls.

`margin(...)` adds external spacing outside the node's border box, while
`padding(...)` still reserves internal space inside the node.

## Sizing semantics

- `fillWidth()` fills the available width on that axis.
- `fillHeight()` fills the available height on that axis.
- `fillSize()` fills both axes.

Use `fill*` when you want the node to take the available space on an axis.
Use `Unit.Percent` when you want a literal ratio of the parent.

For the full decision matrix and examples, see:
- [Controls and nodes sizing guide](../../CONTROLS_AND_NODES.md#layout-sizing-guide-fill-vs-unitpercent)

## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#nodes)
- [SDK docs index](../../SDK_INDEX.md)
