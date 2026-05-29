# FUI-AS Controls and Nodes (v2)

This page is the practical guide to the current public retained UI building blocks exported from `./Fui`.

For the complete export list, see:

- [API reference](./API_REFERENCE.md)
- [SDK docs index](./SDK_INDEX.md)
- [Per-type reference](./reference/README.md)

## Controls

| Control | Purpose | Key APIs |
|---|---|---|
| `Button` | Theme-aware action control | `onClick(...)`, `template(...)`, `bgColor(...)`, `hoverBgColor(...)`, `pressedBgColor(...)`, `textColor(...)`, `font(...)` |
| `Checkbox` | Boolean/tri-state check control | `check(...)`, `triState(...)`, `mixed(...)`, `onChanged(...)`, `template(...)` |
| `ContextMenu` / `MenuItem` | Retained context menu surface | menu items + styling (`menuWidth(...)`, `itemHeight(...)`, `itemColor(...)`, `separatorColor(...)`) |
| `Dialog` | Modal overlay with form-style actions | `show()`, `hide()`, `onAccept(...)`, `onCancel(...)`, dialog/card/backdrop styling, public accessors (`titleText`, `bodyText`, `acceptActionButton`, `cancelActionButton`) |
| `Dropdown` / `DropdownItem` | Non-editable selection popup control | `items(...)`, `selectIndex(...)`, `onChanged(...)`, popup sizing/styling (`maxVisibleItems(...)`, `popupWidth(...)`), `fieldTemplate(...)`, `chevronTemplate(...)`, `optionRowTemplate(...)` |
| `Form` | Enter/Escape default/cancel handling host | default/cancel action ownership for contained controls |
| `NavLink` | Route/link control with browser-harness integration | constructor `NavLink(href, label?, newTab?)`, `hrefTo(...)`, `onNavigate(...)` |
| `ProgressBar` | Determinate horizontal progress visualization | `value(...)`, `min(...)`, `max(...)`, `length(...)`, `thickness(...)`, `trackColor(...)`, `fillColor(...)` |
| `RadioButton` / `RadioGroup` | Single-choice grouped options | `addOption(...)`, `addOptions(...)`, `selectIndex(...)`, `selectedValue` (getter), `onChanged(...)`, radio `template(...)` |
| `SelectionArea` | Cross-node text selection host | `selectedText`, selection hooks, Shift+Arrow extension for existing selections |
| `AntiSelectionArea` | Selection barrier island | prevents parent `SelectionArea` from collecting subtree text |
| `Slider` | Single-value range control | `min(...)`, `max(...)`, `step(...)`, `orientation(...)`, `onChanged(...)`, `template(...)` |
| `Switch` | On/off toggle control | `check(...)`, `onChanged(...)`, `template(...)` |
| `TextInput` | Single-line editable text | `template(...)`, `text(...)`, `placeholder(...)`, `readOnly(...)`, `password(...)`, `maxChars(...)`, change/selection/focus callbacks |
| `TextArea` | Multiline editable text | `template(...)`, multiline input with wrapping and per-axis scrollbar visibility |

## Nodes

| Node | Purpose | Key APIs |
|---|---|---|
| `FlexBox` / `FlexBoxProps` | Base retained layout node | flex layout, sizing, spacing, borders, radius, gradient, blur, drop shadow |
| `Grid` | WPF-style retained grid layout | `rows(...)`, `columns(...)`, shared-size scope/group helpers |
| `Text` / `TextProps` | Retained text rendering node | typography (`fontFamily(...)`, `fontWeight(...)`, `lineHeight(...)`), box-alignment (`textAlign(...)`, `verticalAlign(...)`) |
| `RichText` / `RichTextSpan` | Attributed inline rich text on one retained text node | container defaults (`fontFamily(...)`, `fontWeight(...)`, `fontStyle(...)`, `fontSize(...)`, `textColor(...)`) plus helper spans (`span("...")`) with inline style (`color(...)`, `bgColor(...)`, `bold()`, `italic()`) |
| `Image` | Retained raster image node | object-fit plus URL/asset-backed image use |
| `Svg` | Retained SVG node | URL/asset-backed svg rendering |
| `Portal` | Overlay host node | detached overlay composition surfaces |
| `ScrollView` | Low-level retained viewport | shared scroll state/offset plumbing, `scrollTo(...)`, `scrollToAnimated(...)`, `scrollContentSize(...)`, `transitions(...)` |
| `ScrollState` | Shared scroll metrics/state object | offsets + content/viewport metrics for scroll surfaces |
| `ScrollBar` / `ScrollBarVisibility` | Retained scrollbar chrome | axis-aware style/sizing (`trackWidth(...)`, `thumbWidth(...)`, colors/radii) |
| `ScrollBox` | High-level scroll container | owned viewport + owned scrollbars, per-axis enable/visibility control, `scrollTo(...)`, `scrollToAnimated(...)`, `scrollContentSize(...)` |
| `VirtualList` | Pooled retained list surface | recycled rows + owned scrollbar (`list.scrollBar`) |
| `GradientStop` | Linear gradient stop value | `offset` + packed color |

## Helpers

- `Row(...)`
- `Column(...)`
- `px(...)`
- `pct(...)`
- `span(...)`

## Common node state APIs

All controls and nodes inherit `Node` state APIs, including:

- `nodeId(...)` for stable keyed identity across retained subtree replacement and
  persisted UI restoration
- `persistState(...)` for user-defined keyed persisted state adapters
- built-in persistence on value-owning controls when a stable `nodeId(...)` is
  present:
  - `Checkbox`
  - `Switch`
  - `Slider`
  - `Dropdown`
  - `RadioGroup`
  - `TextInput`
  - `TextArea`
- `enabled(...)` with inherited effective enablement
- `visibility(...)` with WPF-style values:
  - `Visibility.Normal` (default: rendered + interactive)
  - `Visibility.Hidden` (keeps layout slot; no render/hit/focus/semantics)
  - `Visibility.Collapsed` (removed from layout; no render/hit/focus/semantics)
- custom-control lifecycle expectation: node methods may run while unbuilt/invalid-handle during normal app runtime; this is an intentional architecture choice, not an incidental bridge artifact. See [Node handle lifecycle contract](./API_REFERENCE.md#node-handle-lifecycle-contract-custom-controls)

## Typed transitions

The initial declarative transition surface is now public through `./Fui`:

- `NodeTransitions`
  - `.opacity(timing)`
  - `.bgColor(timing)`
  - `.scrollOffset(timing)`

Current transition-aware nodes:

- `FlexBox.transitions(...)` for `opacity(...)` and `bgColor(...)`
- `ScrollView.transitions(...)` for `scrollOffset(...)`
- `ScrollBox.transitions(...)` as a convenience pass-through to its owned
  viewport

Transitions are opt-in per property. Re-targeting one property replaces only
that property’s active transition slot.

## Smooth scroll ownership

`ScrollView` and `ScrollBox` now expose explicit smooth-scroll APIs:

- `scrollTo(x, y)` for immediate programmatic jumps
- `scrollToAnimated(x, y, timing)` for typed smooth-scroll motion

They also expose explicit logical content sizing:

- `scrollContentSize(width, height)`

Use this when the logical scroll range is larger than the retained child subtree
currently mounted, such as pooled or virtualized content. A negative axis value
returns that axis to layout-derived sizing.

Ownership follows the shipped later-wins rule:

- programmatic smooth scroll clears active Ui momentum before taking over
- later user wheel/touch scroll input cancels the active programmatic scroll
  animation on that surface

The routed advanced-controls demo now exercises both the transition and
smooth-scroll surfaces with focused browser coverage.

## Typed control templating

`Button`, `Checkbox`, `RadioButton`, `Switch`, `Slider`, `Dropdown`, `TextInput`,
and `TextArea` now expose typed per-instance templating through the public
`./Fui` barrel:

- `ControlTemplateSet`
- `ButtonPresenter` / `ButtonTemplate`
- `DropdownFieldPresenter` / `DropdownFieldTemplate`
- `DropdownChevronPresenter` / `DropdownChevronTemplate`
- `DropdownOptionRowPresenter` / `DropdownOptionRowTemplate`
- `DropdownOptionRowMetrics`
- `PressableIndicatorMetrics`
- `CheckboxIndicatorPresenter` / `CheckboxIndicatorTemplate`
- `RadioIndicatorPresenter` / `RadioIndicatorTemplate`
- `SwitchIndicatorPresenter` / `SwitchIndicatorTemplate`
- `SliderPresenter` / `SliderTemplate`
- `SliderPresenterMetrics`
- `TextInputPresenter` / `TextInputTemplate`

This surface stays intentionally narrow: behavior, semantics, persistence, and
input stay in the built-in controls, while presenters own only the indicator or
chrome visual subtree.

Apps can also set house-style defaults once through
`Application.register(app => app.controlTemplates(templateSet)...)` or
`Application.useControlTemplates(templateSet)`. Per-instance template setters
still win over app defaults, and any control without either falls back to the
built-in shipped presenter.

## Notes

- Public app-facing imports are from `./Fui`.
- Runtime bridge exports are from `./FuiExports`.
- Internal popup plumbing exists in the SDK internals, but `Popup` is not part of the current public `./Fui` surface.
- For text-editing specifics, see:
  - [Text input behavior guide](./TEXT_INPUT_DESIGN.md)
  - [Text input reference](./TEXT_INPUT_REFERENCE.md)

## See also

- [SDK docs index](./SDK_INDEX.md)
- [Accessibility and semantics](./ACCESSIBILITY_AND_SEMANTICS.md)
- [Per-type reference](./reference/README.md)
- [Theming and style matrix](./THEMING_STYLE_MATRIX.md)
