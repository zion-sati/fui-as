# FlexBox

```ts
import { FlexBox, Unit } from "./Fui";
```

- **Constructor:** `new FlexBox()`
- **Sizing:** `width`, `height`, `fillWidth`, `fillHeight`, `fillSize`, `flexBasis`, `flexGrow`, `grow`
- **Layout:** `flexDirection`, `justifyContent`, `alignItems`, `padding`, `margin`
- **Positioning:** `positionType`, `positionAbsolute`, `position`
- **Visuals:** `bgColor`, `cornerRadius`, `corners`, `border`, `borderDashed`, `opacity`, `blur`, `dropShadow`, `backgroundBlur`, `linearGradient`
- **Children/events:** `child`, `children`, `onClick`, `onPointerEnter`, `onPointerLeave`

`FlexBox` is the base retained box node used by most controls.

`margin(...)` adds external spacing outside the node's border box, while
`padding(...)` still reserves internal space inside the node.


## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#nodes)
- [SDK docs index](../../SDK_INDEX.md)
