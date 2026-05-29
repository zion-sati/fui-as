# Overlays and Portals (v2 FUI-AS)

This page documents overlay lifecycle and positioning behavior for portal-backed controls.

## What SDK users should expect

- Overlay controls (`Dialog`, `ContextMenu`, `Dropdown`) attach and detach overlay content cleanly.
- Opening and closing are safe to call repeatedly (idempotent behavior).
- Overlay surfaces are clamped to viewport bounds so they do not render off-screen.

## Overlay behavior matrix

| Surface | Open trigger | Placement | Close triggers | Key ownership while open |
|---|---|---|---|---|
| `Dropdown` | Trigger click/activation keys | Anchored to trigger | Overlay click, selection commit, `Escape` | Yes (global key filter) |
| `ContextMenu` | `show(items, x, y)` | Pointer-position point placement | `hide()`, action invoke, overlay click, `Escape` | Yes (global key filter) |
| `Dialog` | `show()` | Centered modal | `hide()`, accept/cancel actions, backdrop click | Yes (`Form` key handler for `Enter`/`Escape`) |

## `Dropdown`

- Opens a popup panel anchored to the trigger control.
- Overlay click closes dropdown.
- Keyboard navigation while open: `ArrowUp`, `ArrowDown`, `Home`, `End`, `Enter`, `Escape`.
- Popup sizing options:
  - `maxVisibleItems(...)`
  - `popupWidth(...)`
  - `popupPanelColor(...)`
  - `popupPanelBackgroundBlur(...)`
- Global key behavior while open:
  - `ArrowUp`, `ArrowDown`, `Home`, `End`, `Enter`, `Escape`

## `ContextMenu`

- Opens at pointer position with viewport clamping.
- `Escape` closes the menu.
- Supports menu and panel styling (`menuWidth`, `itemHeight`, `itemPadding`, colors, blur, border, corner radius, shadow).
- Supports visibility callbacks via `onVisibilityChanged(...)`.
- Uses top-most menu key ownership while visible (`Escape` closes).

## `Dialog`

- `show()` opens a centered modal surface and focuses the accept action.
- `hide()` closes the modal and tears down active modal keyboard handling.
- `Enter`/`Escape` map to accept/cancel while the dialog is open.
- Action hooks:
  - `onAccept(...)`
  - `onCancel(...)`
  - owner-bound variants (`onAcceptWith`, `onCancelWith`)
- Exposes style accessors for deeper customization:
  - `titleText`, `bodyText`, `acceptActionButton`, `cancelActionButton`

## Lifecycle guarantees

1. Open/close calls are idempotent.
2. Closing/destroying an overlay removes active keyboard interception.
3. Overlay visuals are detached cleanly on close.
4. Modal overlays keep keyboard ownership scoped to the active visible overlay surface.

## Styling model

- Overlay controls generally expose:
  - backdrop styling (`backdropColor`, `backgroundBlur`)
  - panel/card styling (colors, border, radius, shadow)

Theme defaults apply unless explicitly overridden by control APIs.

## See also

- [SDK docs index](./SDK_INDEX.md)
- [Keyboard policy](./KEYBOARD_POLICY.md)
- [Controls and nodes](./CONTROLS_AND_NODES.md)
- [Events and callbacks](./EVENTS_AND_CALLBACKS.md)
