# Theming and Style Matrix (v2 FUI-AS)

This page shows what is theme-driven by default and what you can override explicitly.

## Theme source APIs

- `useSystemTheme()` — framework follows host dark-mode + accent updates.
- `useCustomTheme(theme)` — framework uses your supplied theme object.
- `setAccentColor(color)` — rebuilds current light/dark theme with a custom accent.
- `activeTheme` — current effective theme signal.
- `bindTheme(owner, handler)` — immediate owner-bound subscription helper for custom controls; returns the disposable listener for your usual cleanup path.

## Precedence rules

1. Per-control explicit style overrides win over theme defaults.
2. Theme updates re-apply only non-overridden style fields.
3. Controls with no explicit style override APIs are fully theme-driven.

## Control style matrix

| Control | Theme-driven defaults | Explicit style overrides | Theme-change behavior |
|---|---|---|---|
| `Button` | Accent/hover/pressed bg, border, radius, padding, font, text color | `bgColor`, `hoverBgColor`, `pressedBgColor`, `border*`, `cornerRadius`/`corners`, `padding`, `font*`, `textColor`, `dropShadow` | Overridden fields stay fixed; non-overridden fields track theme |
| `Dropdown` | Trigger surface/border/text/chevron, popup border/shadow/colors | `maxVisibleItems`, `popupWidth`, `popupPanelColor`, `popupPanelBackgroundBlur` | Popup panel color/blur overrides persist; other chrome tracks theme |
| `ContextMenu` | Panel/item colors, typography, metrics, separator, shadow | `menuWidth`, `itemHeight`, `itemPadding`, `itemColor`, `itemHoverColor`, `itemTextColor`, `itemCornerRadius`, `itemFont*`, `separatorColor`, `panelColor`, `panelBorder`, `panelCornerRadius`, `panelShadow`, `panelBackgroundBlur`, `backdropColor`, `backgroundBlur` | Overridden fields persist; remaining fields track theme |
| `Dialog` | Backdrop, card surface/border/radius/shadow, title/body text fonts and colors | `backdropColor`, `backgroundBlur`, `cardColor`, `cardBorder`, `cardCornerRadius`, `cardShadow` | Overridden backdrop/card fields persist; text style continues tracking theme fonts/colors |
| `ScrollBar` | Track/thumb colors | `trackColor`, `thumbColor`, thickness/geometry APIs | Overridden colors persist; non-overridden colors track theme |
| `TextInput` / `TextArea` | Surface, border, text colors, caret, spacing, disabled opacity, default typography | `fontFamily`, `fontSize`, `lineHeight` | Typography overrides persist; container colors/border track theme |
| `Checkbox` / `Switch` / `RadioButton` / `RadioGroup` / `Slider` | Built-in control visuals from theme tokens | No dedicated high-level token override APIs on these controls | Track theme |
| `NavLink` | Focus chrome + inherited box/text style defaults | Use inherited `FlexBox`/`Text` styling APIs | Explicit inherited styling persists; focus chrome tracks theme |

## Node style matrix

| Node | Theme defaults | Explicit styling |
|---|---|---|
| `FlexBox`, `Grid`, `Portal` | None by default | Full explicit box/layer styling (`bgColor`, `border`, `cornerRadius`, `linearGradient`, `blur`, `backgroundBlur`, `dropShadow`, etc.) |
| `Text` | Uses assigned text styles; selection color may follow theme when default selection behavior is used | `font*`, `textColor`, `lineHeight`, alignment APIs |
| `ScrollView`, `ScrollBox`, `VirtualList` | Scroll chrome in `ScrollBar` follows theme | Explicit scrollbar styling through `scrollBar` accessors / `ScrollBar` APIs |
| `Image`, `Svg` | No theme token dependency by default | Explicit tint/object-fit and box styling |

## See also

- [SDK docs index](./SDK_INDEX.md)
- [Controls and nodes](./CONTROLS_AND_NODES.md)
- [Per-type reference](./reference/README.md)
