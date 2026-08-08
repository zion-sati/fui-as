# NavLink

```ts
import { NavLink, Text } from "./Fui";
```

- **Constructor:** `new NavLink(href, openInNewTab = false)`
- **Update href:** `hrefTo(nextHref)`
- **Navigate callback:** `onNavigate(cb)`
- **Interaction styling:** `onInteractionStateChanged(cb)` or
  `bindInteractionState(owner, handler)`
- **Read href/focus:** `href`, `isFocused` getters

`NavLink` activates on pointer release or `Enter` key release. Primary shortcut modifier (`Cmd`/`Ctrl`) triggers new-tab behavior.

`NavLink` owns navigation behavior, not presentation. Compose any retained
content inside it and style that content from the interaction-state callback:

```ts
const label = new Text("Documentation").selectable(false) as Text;
const link = new NavLink("/docs")
  .child(label)
  .semanticLabel("Documentation") as NavLink;

link.onInteractionStateChanged((state, theme): void => {
  label.textColor(
    state.hovered || state.pressed
      ? theme.colors.accentHovered
      : theme.colors.accent,
  );
});
```


## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#controls)
- [SDK docs index](../../SDK_INDEX.md)
