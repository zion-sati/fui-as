# TabView

Headless retained content switcher with one attached active panel.

`TabView` deliberately does not create tab headers or selector chrome. Compose
`Button`, `NavLink`, clickable `Text`, custom drawing, or any other suitable
control outside it, then call `selectIndex(...)` from that selector. This keeps
responsive layout, visuals, keyboard behavior, and selector semantics under
application control.

## Construction

- `new TabView(items?)`
- `new TabItem(label, contentFactory?)`
- `TabItem.content(factory)`
- `TabItem.contentView(view)`

The factory returns a `RetainedView`. It runs at most once, on first activation.
Inactive content remains owned but detached; activation/deactivation hooks run
on every switch, retained control and scroll state survive reselection, and
disposal is deterministic when an item is removed or the control is disposed.

## Selection and collection

- `items(...)`, `addItem(...)`
- `removeItem(...)`, `removeItemAt(...)`, `clearItems()`
- `selectIndex(...)`
- `selectedIndex`, `selectedItem`, `itemCount`
- `onSelectionChanged(...)`, `onSelectionChangedWith(...)`

Disabling or removing the selected item chooses the next enabled item, then the
previous enabled item. The control never attaches more than one panel root.
Re-entrant selection requests are serialized.

## Selector composition and accessibility

`TabView` projects `TabPanel` semantics for its selected-content host. A visual
selector is a separate application-owned control tree. If it behaves as a tab
strip, give its container `TabList` semantics, each selector `Tab` semantics,
and keep selected and disabled state synchronized with `TabView`.

This separation is intentional: selectors can wrap, scroll, collapse into a
menu, or use entirely custom visuals without fighting built-in tab chrome.

Use `TabView` for in-window navigation where the selected page does not need
its own URL. Use the routed harness for browser history, deep links,
restoration, and independently loaded route WASMs.
