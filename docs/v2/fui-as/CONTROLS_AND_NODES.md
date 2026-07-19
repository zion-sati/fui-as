# FUI-AS Controls and Nodes (v2)

This page is the practical guide to the public retained UI building blocks exported from `./Fui`.

For the complete export list, see:

- [API reference](./API_REFERENCE.md)
- [SDK docs index](./SDK_INDEX.md)
- [Per-type reference](./reference/README.md)
- [Forms and autofill guide](./FORMS_AND_AUTOFILL.md)

## Controls

| Control | Purpose | Key APIs |
|---|---|---|
| `Button` | Theme-aware action control | `onClick(...)`, `template(...)`, `colors(...)`, `bgColor(...)`, `hoverBgColor(...)`, `pressedBgColor(...)`, `textColor(...)`, `fontFamily(...)`, `fontSize(...)` |
| `Checkbox` | Boolean/tri-state check control | `check(...)`, `triState(...)`, `mixed(...)`, `onChanged(...)`, `onClick(...)`, `template(...)`, `colors(...)` |
| `ContextMenu` / `MenuItem` | Retained context menu surface | menu items + styling (`menuWidth(...)`, `itemHeight(...)`, `itemColor(...)`, `separatorColor(...)`) |
| `Dialog` | Modal overlay with form-style actions | `show()`, `hide()`, `onAccept(...)`, `onCancel(...)`, dialog/card/backdrop styling, public accessors (`titleText`, `bodyText`, `acceptActionButton`, `cancelActionButton`) |
| `Dropdown` / `DropdownItem` | Non-editable selection popup control | `items(...)`, `selectIndex(...)`, `onChanged(...)`, `colors(...)`, popup sizing/styling (`maxVisibleItems(...)`, `popupWidth(...)`), `fieldTemplate(...)`, `chevronTemplate(...)`, `optionRowTemplate(...)` |
| `Form` | Enter/Escape default/cancel handling host | default/cancel action ownership for contained controls |
| `NavLink` | Route/link control with browser-harness integration | constructor `NavLink(href, label?, newTab?)`, `hrefTo(...)`, `onNavigate(...)` |
| `ProgressBar` | Determinate horizontal or vertical progress visualization | `value(...)`, `min(...)`, `max(...)`, `length(...)`, `thickness(...)`, `orientation(...)`, `trackColor(...)`, `fillColor(...)` |
| `RadioButton` / `RadioGroup` | Single-choice grouped options | radio `onClick(...)`; group `addOption(...)`, `addOptions(...)`, `selectIndex(...)`, `selectedValue` (getter), `onChanged(...)`; radio `template(...)`, `colors(...)` |
| `SelectionArea` | Cross-node text selection host | `selectedText`, selection hooks, Shift+Arrow extension for existing selections |
| `AntiSelectionArea` | Selection barrier island | prevents parent `SelectionArea` from collecting subtree text |
| `Slider` | Single-value range control | `min(...)`, `max(...)`, `step(...)`, `orientation(...)`, `onChanged(...)`, `template(...)`, `colors(...)` |
| `Switch` | On/off toggle control | `check(...)`, `onChanged(...)`, `onClick(...)`, `template(...)`, `colors(...)` |
| `TextInput` | Single-line editable text | `template(...)`, `colors(...)`, `text(...)`, `placeholder(...)`, `readOnly(...)`, `password(...)`, `maxChars(...)`, change/selection/focus callbacks |
| `TextArea` | Multiline editable text | `template(...)`, `colors(...)`, multiline input with wrapping and per-axis scrollbar visibility |

### Forms and host autofill

For login/password-manager/browser-autofill flows:

- wrap related fields in `Form`
- give each participating field a stable `nodeId(...)`
- set `hostAutofill(...)` explicitly

See [Forms and autofill guide](./FORMS_AND_AUTOFILL.md).

## Nodes

| Node | Purpose | Key APIs |
|---|---|---|
| `FlexBox` / `FlexBoxProps` | Base retained layout node | flex layout, sizing, spacing, borders, radius, gradient, blur, drop shadow |
| `Grid` | WPF-style retained grid layout | `rows(...)`, `columns(...)`, shared-size scope/group helpers |
| `Text` / `TextProps` | Retained text rendering node | typography (`fontFamily(...)`, `fontWeight(...)`, `lineHeight(...)`), box-alignment (`textAlign(...)`, `verticalAlign(...)`) |
| `RichText` / `RichTextSpan` | Attributed inline rich text on one retained text node | container defaults (`fontFamily(...)`, `fontWeight(...)`, `fontStyle(...)`, `fontSize(...)`, `textColor(...)`) plus helper spans (`span("...")`) with inline style (`color(...)`, `bgColor(...)`, `bold()`, `italic()`) |
| `Bitmap` | Retained pixel buffer backed by a GPU texture | direct pixel access, off-screen canvas drawing, memory bitmap text rendering via retained HarfBuzz pipeline |
| `TextLayout` | Immediate-mode formatted text resource | `TextLayout.text(...)`, `TextLayout.rich(...)`, `onReady(...)`, `DrawContext.drawTextLayout(...)` |
| `DynamicTextLayout` | Immediate-mode short label resource | `DynamicTextLayout.fixedCharset(...)`, `setText(...)`, `DynamicTextOverflow`, `DrawContext.drawTextLayout(...)` |
| `Image` | Retained raster image node | object-fit, `ImageSampling`, nine-patch, URL/asset-backed image use |
| `Svg` | Retained SVG node | URL/asset-backed svg rendering, tinting, raster-variant `ImageSampling` |
| `Portal` | Overlay host node | detached overlay composition surfaces |
| `ScrollView` | Low-level retained viewport | shared scroll state/offset plumbing, `scrollTo(...)`, `scrollToAnimated(...)`, `scrollContentSize(...)`, `transitions(...)` |
| `ScrollState` | Shared scroll metrics/state object | offsets + content/viewport metrics for scroll surfaces |
| `ScrollBar` / `ScrollBarVisibility` | Retained scrollbar chrome | axis-aware style/sizing (`trackWidth(...)`, `thumbWidth(...)`, colors/radii) |
| `ScrollBox` | High-level scroll container | owned viewport + owned scrollbars, per-axis enable/visibility control, `scrollTo(...)`, `scrollToAnimated(...)`, `scrollContentSize(...)` |
| `VirtualList` | Pooled retained list surface | `onBindItem(...)` / `onBindItemWith(...)`, recycled rows + owned scrollbar (`list.scrollBar`) |
| `GradientStop` | Linear gradient stop value | `offset` + packed color |

## Helpers

- `Row(...)`
- `Column(...)`
- `px(...)`
- `pct(...)`
- `span(...)`

## Layout sizing guide (`fill*` vs `Unit.Percent`)

### Core layout concept

This is the most important sizing distinction in the SDK:

- `width(100.0, Unit.Percent)` = **make my box 100% of the parent**
- `fillWidth()` = **size me to the available inner width the parent layout is offering**
- `fillWidthPercent(50.0)` = **take 50% of the available inner width the parent layout is offering**

The same rule applies vertically:

- `height(100.0, Unit.Percent)` = **make my box 100% of the parent**
- `fillHeight()` = **size me to the available inner height the parent layout is offering**
- `fillHeightPercent(50.0)` = **take 50% of the available inner height the parent layout is offering**

If you come from web UI, `width(100%)` is a natural thing to try. In this SDK it
is still valid, but it means **literal percentage sizing** of the child box. For
normal flex-style "take the available space here" layout, prefer `fillWidth()`
and `fillHeight()`.

`fillWidth()` and `fillHeight()` mean "take the available space on this axis."
They are the default choice for stretch/fill layouts and account for the parent
content box, so padding and margins do not create the overflow problem that a
literal `100%` can.

`alignItems(...)` is a parent-level cross-axis policy, not a child size. Use it
to say "children in this container stretch/start/center on the cross axis."
Use `alignSelf(...)` when only one child should override that policy.

Use `width(..., Unit.Percent)` or `height(..., Unit.Percent)` only when the size
itself should be a fixed ratio of the parent, such as `25%` / `75%` splits.

Use `fillWidthPercent(...)` or `fillHeightPercent(...)` when the size should be a
fraction of the space layout is actually offering on that axis. This is the
missing middle ground between literal parent percentages and full fill.

`Unit.Auto` means "size to intrinsic content on this axis." Do not combine
`fillWidth()` with `width(..., Unit.Auto)` on width, or `fillHeight()` with
`height(..., Unit.Auto)` on height. Those are contradictory asks on the same axis
(`fill*` = expand to available space, `Unit.Auto` = shrink/grow to content).

### Decision table

| Goal | Row parent | Column parent | Why |
|---|---|---|---|
| Child should fill the parent on the cross-axis | `fillHeight()` | `fillWidth()` | Fill uses available-space sizing and respects the parent content box. |
| Child should take the available main-axis space next to fixed siblings | `fillWidth()` | `fillHeight()` | Fill is axis-aware; use the axis that is stretching, even when the other axis is fixed. |
| Child should take a fraction of the offered space on that axis | `fillWidthPercent(50.0)` | `fillHeightPercent(50.0)` | Available-space percent sizes from the axis layout offer, not from the parent box ratio. |
| Child should be a literal percentage of the parent | `width(30.0, Unit.Percent)` | `height(30.0, Unit.Percent)` | Percent means fixed ratio, not "fill the leftover space." |
| Child should size to intrinsic content | `width(0.0, Unit.Auto)` | `height(0.0, Unit.Auto)` | Auto sizes to content. Do not combine with `fill*` on the same axis. |
| Root/backdrop should fully cover its parent | `fillWidth().fillHeight()` | `fillWidth().fillHeight()` | Full-bleed container where no ratio sizing is intended. |

### The three "make it fill" APIs

These can look similar at the call site, but they mean different things:

| API | Meaning | Preferred usage |
|---|---|---|
| `alignItems(AlignItems.Stretch)` | Parent says children stretch on the container's cross axis by default. | Set a container-wide cross-axis policy. |
| `fillWidth()` / `fillHeight()` | Child takes the available space on that axis. | Default choice for normal app layout and demo code. |
| `fillWidthPercent(...)` / `fillHeightPercent(...)` | Child takes a percentage of the available space on that axis. | When you want "half of the offered space" rather than "half of the parent box." |
| `width(100.0, Unit.Percent)` / `height(100.0, Unit.Percent)` | Child becomes a literal 100% of the parent on that axis. | Only when you truly want ratio sizing math, not generic fill behavior. |

If your intent is "this child should take the available space here," prefer
`fillWidth()` / `fillHeight()`. Reserve `100%` percent sizing for explicit
ratio-based layouts.

### Box size vs available layout space

Another useful mental model:

- `width(...)` / `height(...)` author the node's **own box size**
- `fillWidth()` / `fillHeight()` ask layout to size the node from the parent's
  **available inner/content space**
- `fillWidthPercent(...)` / `fillHeightPercent(...)` ask layout for a **fraction**
  of that available inner/content space

That is why `width(100.0, Unit.Percent)` can still overflow when margins are
present: the `100%` sizes the child box first, and margin lives outside that
box. `fillWidth()` / `fillHeight()` are the safer defaults for ordinary layout.

### Min/max clamps

Use `minWidth(...)`, `maxWidth(...)`, `minHeight(...)`, and `maxHeight(...)` to
clamp a node after its normal sizing mode is chosen.

- `Unit.Pixel` = pixel clamp
- `Unit.Percent` = parent-relative clamp
- `Unit.Auto` = clear the clamp on that axis

These clamps work with explicit width/height, `fill*()`, and
`fill*Percent(...)`.

### Main-axis rule

In a `Row`, width is the main axis. In a `Column`, height is the main axis.
When you want a child to expand in the main direction, use the matching
`fill*()` API for that axis. When you want a fixed ratio instead, use
`Unit.Percent`.

### Examples

Fixed width, growing height:

```ts
const panel = Column(
  header.height(64.0, Unit.Pixel),
  body.width(280.0, Unit.Pixel).fillHeight(),
).fillWidth();
```

Header + body layout:

```ts
const page = Column(
  header.height(64.0, Unit.Pixel),
  body.fillWidth().fillHeight(),
).fillSize();
```

Intentional ratio split:

```ts
const split = Row(
  left.width(30.0, Unit.Percent),
  right.width(70.0, Unit.Percent),
).fillSize();
```

Available-space split with clamps:

```ts
const content = Row(
  sidebar.width(240.0, Unit.Pixel),
  body
    .fillWidthPercent(50.0)
    .minWidth(320.0)
    .maxWidth(60.0, Unit.Percent),
).fillSize();
```

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
- wheel input through `onWheel(...)` and `onWheelWith(...)`; see
  [Node input events](./API_REFERENCE.md#node-input-events)
- pointer input through structured callbacks such as
  `onPointerDownEvent(...)`, `onPointerMoveEvent(...)`,
  `onPointerUpEvent(...)`, and `onPointerCancelEvent(...)`; pointer args expose
  local/scene coordinates, pointer id/type, button state, modifiers, pressure,
  and contact size
- explicit two-finger gesture ownership through `panGesture(...)` and
  `pinchGesture(...)`; nodes can opt into pan, pinch, or both while unclaimed
  gestures continue to framework page zoom/pan. Set `event.handled = true` from
  the recognizer callback to claim the gesture and suppress framework defaults.
- long-press recognition through `longPressGesture(...)` and
  `longPressGestureWith(...)`; use `longPressRecognizer(LongPressGesture...)`
  when a control needs custom duration or movement tolerance. Long press uses
  the same routed `handled` ownership model and cancels on early release,
  movement, scroll, second touch, or pointer cancellation.
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

- `smoothScrolling(flag = true)` controls default wheel-input smoothing; rapid
  wheel events accumulate without debounce

- `scrollTo(x, y)` for immediate programmatic jumps
- `scrollToAnimated(x, y, timing)` for typed smooth-scroll motion

They also expose explicit logical content sizing:

- `scrollContentSize(width, height)`

Use this when the logical scroll range is larger than the retained child subtree
currently mounted, such as pooled or virtualized content. A negative axis value
returns that axis to layout-derived sizing.

Ownership follows the later-wins rule:

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
built-in presenter.

## Notes

- Public app-facing imports are from `./Fui`.
- Runtime bridge exports are from `./FuiExports`.
- Internal popup plumbing exists in the SDK internals, but `Popup` is not part of the public `./Fui` surface.
- For text-editing specifics, see:
  - [Text input behavior guide](./TEXT_INPUT_DESIGN.md)
  - [Text input reference](./TEXT_INPUT_REFERENCE.md)

## See also

- [SDK docs index](./SDK_INDEX.md)
- [Accessibility and semantics](./ACCESSIBILITY_AND_SEMANTICS.md)
- [Per-type reference](./reference/README.md)
- [Theming and style matrix](./THEMING_STYLE_MATRIX.md)
