# Keyboard Policy (v2 FUI-AS)

This page documents key behavior you can rely on when building with `./Fui`.

## Routing model (practical view)

1. Focused controls receive key events first.
2. Active modal/overlay surfaces can intercept keys globally while open.
3. Global interception follows top-most active surface first.
4. Focus-adorners are keyboard-visible only; pointer use can suppress them.

## Control key contracts

| Surface | Key(s) | Phase | Behavior |
|---|---|---|---|
| `Checkbox` / `Switch` / `RadioButton` | `Space` | Down + Up | Down arms pressed visual, Up commits action |
| `Form` | `Enter`, `Escape` | Down + Up | Down arms default/cancel button, Up commits |
| `Dialog` (active) | `Enter`, `Escape` | Global | Delegates to active `Form` default/cancel actions |
| `Dropdown` (closed) | `Enter`, `Space`, `ArrowDown`, `ArrowUp` | Down | Opens popup (`ArrowUp` also moves highlight) |
| `Dropdown` (open) | `Escape`, `Enter`, `Home`, `End`, `ArrowUp`, `ArrowDown` | Global Down | Close, commit, jump, or move highlight |
| `ContextMenu` (open) | `Escape` | Global Down | Closes menu |
| `NavLink` | `Enter` (+ primary shortcut) | Down + Up | Release-based activation, optional new-tab behavior |
| `Slider` | `Home`, `End`, `Arrow*` | Down | Step/range updates by orientation |

Modifier note:
- For built-in control handling paths above, key handling is the plain no-modifier path unless explicitly listed (for example NavLink primary shortcut new-tab behavior).

## Text editors (`TextInput` / `TextArea`)

- Editing/navigation keys are handled by the text engine path.
- Treat text key behavior (including IME and selection navigation) as engine-backed behavior exposed through SDK callbacks.

## Selection-area behavior

- `SelectionArea` exposes cross-selection text updates (`selectedText` signal).
- Shift+Arrow extension for existing cross-selection ranges is runtime/engine-backed and surfaces through retained callbacks.

## See also

- [SDK docs index](./SDK_INDEX.md)
- [Text input design](./TEXT_INPUT_DESIGN.md)
- [Overlays and portals](./OVERLAYS_AND_PORTALS.md)
- [Events and callbacks](./EVENTS_AND_CALLBACKS.md)
