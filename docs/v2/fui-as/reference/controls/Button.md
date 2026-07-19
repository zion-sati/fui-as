# Button

```ts
import { Button, ButtonColors } from "./Fui";
```

- **Constructor:** `new Button(label: string)`
- **Action:** `onClick((event) => ...)`, `onClickWith(owner, handler)`
- **State callback:** `onHoverChanged(cb)`
- **Content:** `label(text)`
- **Colors:** `colors(new ButtonColors().background(...).backgroundHover(...).backgroundPressed(...).border(...).textPrimary(...))`
- **Style overrides:** `bgColor`, `hoverBgColor`, `pressedBgColor`, `textColor`
- **Typography:** `fontFamily`, `fontWeight`, `fontStyle`, `fontSize`

`Button` extends `FlexBox`, so layout/box APIs (size, padding, border, radius, shadow) are also available.
By default, the built-in presenter uses `theme.colors.textOnAccent` for the label
so accent-backed buttons keep a readable foreground across light and dark themes.
Buttons also opt out of implicit cross-axis stretch by default, so a button in a
column stays content-sized unless you explicitly give it `fillWidth()`,
`width(...)`, `alignSelf(AlignSelf.Stretch)`, or other sizing overrides.
Color overrides flow into the built-in presenter and any custom `ButtonPresenter`
template you attach.

`onClick` is semantic activation: it fires once for supported pointer or
keyboard activation and receives count-free `ClickEventArgs`. Use inherited
`onPointerClick`, `onPointerDoubleClick`, and `onPointerTripleClick` only for raw
routed pointer gestures.

## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#controls)
- [SDK docs index](../../SDK_INDEX.md)
