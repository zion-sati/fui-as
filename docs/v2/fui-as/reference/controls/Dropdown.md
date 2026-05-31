# Dropdown

```ts
import { Dropdown, DropdownItem } from "./Fui";
```

- **Types:** `new DropdownItem(value, label = value)`
- **Control constructor:** `new Dropdown()`
- **Items:** `items(list)`
- **Selection:** `selectIndex(index)`, `selectedIndex` getter
- **Change callback:** `onChanged(cb)` / `onChangedWith(owner, handler)`
- **Popup sizing:** `maxVisibleItems(count)`, `popupWidth(px)`
- **Popup panel style:** `popupPanelColor(color)`, `popupPanelBackgroundBlur(sigma)`
- **Templates:** `fieldTemplate(template)`, `chevronTemplate(template)`, `optionRowTemplate(template)`

While open, `Dropdown` handles `ArrowUp/Down`, `Home/End`, `Enter`, and `Escape`.
If the trigger scrolls fully out of the viewport while open, the popup dismisses automatically and updates its semantic expanded state.


## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#controls)
- [SDK docs index](../../SDK_INDEX.md)
