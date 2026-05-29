# NavLink

```ts
import { NavLink } from "./Fui";
```

- **Constructor:** `new NavLink(href, label = href, openInNewTab = false)`
- **Update href:** `hrefTo(nextHref)`
- **Navigate callback:** `onNavigate(cb)`
- **Read href/focus:** `href`, `isFocused` getters

`NavLink` activates on pointer release or `Enter` key release. Primary shortcut modifier (`Cmd`/`Ctrl`) triggers new-tab behavior.


## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#controls)
- [SDK docs index](../../SDK_INDEX.md)
