# Dropdown

```ts
import { Dropdown, DropdownItem, DropdownSizing } from "./Fui";
```

- **Types:** `new DropdownItem(value, label = value)`
- **Control constructor:** `new Dropdown()`
- **Items:** `items(list)`
- **Selection:** `selectIndex(index)`, `selectedIndex` getter
- **Change callback:** `onChanged(cb)` / `onChangedWith(owner, handler)`
- **Sizing:** `sizing(new DropdownSizing().fieldFontSize(px).optionFontSize(px).fieldHeight(px).optionHeight(px).chevronBoxSize(px).chevronIconSize(px))`
- **Popup sizing:** `maxVisibleItems(count)`, `popupWidth(px)`
- **Popup panel style:** `popupPanelColor(color)`, `popupPanelBackgroundBlur(sigma)`
- **Templates:** `fieldTemplate(template)`, `chevronTemplate(template)`, `optionRowTemplate(template)`

While open, `Dropdown` handles `ArrowUp/Down`, `Home/End`, `Enter`, and `Escape`.
If the trigger scrolls fully out of the viewport while open, the popup dismisses automatically and updates its semantic expanded state.

Use `.sizing(...)` for routine built-in trigger and row sizing without replacing dropdown presenters:

```ts
new Dropdown()
  .sizing(new DropdownSizing()
    .fieldFontSize(14.0)
    .optionFontSize(14.0)
    .fieldHeight(28.0)
    .optionHeight(28.0)
    .chevronBoxSize(16.0)
    .chevronIconSize(12.0));
```

Sizing only affects the built-in presenter path. If you override the field, chevron, or option-row template, that custom template remains authoritative for that part.


## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#controls)
- [SDK docs index](../../SDK_INDEX.md)
