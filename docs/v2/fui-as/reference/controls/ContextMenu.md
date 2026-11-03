# ContextMenu

```ts
import { ContextMenu, ContextMenuAction, MenuItem } from "./Fui";
```

- **Constructor:** `new ContextMenu(items)`, or `new ContextMenu()` then `items(items)`
- **Show/hide:** `show(target, x, y)` (`null` for scene coordinates, or a node for coordinates relative to it), `hide()`
- **Visibility callback:** `onVisibilityChanged(cb)`
- **Menu style:** `menuWidth`, `itemHeight`, `itemPadding`, `itemColor`, `itemHoverColor`, `itemTextColor`, `itemCornerRadius`, `itemFont*`, `separatorColor`
- **Panel/backdrop style:** `panelColor`, `panelBorder`, `panelCornerRadius`, `panelShadow`, `panelBackgroundBlur`, `backdropColor`, `backgroundBlur`

`MenuItem.command(label, invoke)` and `MenuItem.commandWith(label, owner, handler)` are application commands, such
as Rename or Delete: choosing one runs its callback and nothing else, and passing `true` as the last argument disables
it. `new MenuItem(label, action, payload)` runs a built-in `ContextMenuAction` (copy, paste, open link, reload), and
`MenuItem.separator()` draws a divider.

```ts
const items = new Array<MenuItem>();
items.push(MenuItem.commandWith<Editor>("Rename", editor, (editor: Editor): void => editor.beginRename()));
items.push(MenuItem.separator());
items.push(new MenuItem("Copy", ContextMenuAction.CopyCurrentSelection));
new ContextMenu(items).show(null, x, y);
```


## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#controls)
- [SDK docs index](../../SDK_INDEX.md)
