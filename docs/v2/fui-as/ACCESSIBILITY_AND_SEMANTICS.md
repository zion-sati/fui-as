# Accessibility and Semantics (v2 FUI-AS)

This page is the SDK-user contract for semantic roles/labels and out-of-the-box accessibility defaults.

## Core model

- Every retained node can set:
  - `semanticRole(...)`
  - `semanticLabel(...)`
  - semantic states (`semanticChecked`, `semanticSelected`, `semanticExpanded`, `semanticValueRange`, `semanticOrientation`)
  - `requestSemanticAnnouncement()` when the currently focused node should replay its latest semantic summary through the host live-announcement path
- Explicit semantics override defaults.
- Defaults are applied where controls/nodes provide them, so common controls work without extra wiring.

## Out-of-the-box defaults

| Surface | Default role | Default label behavior | Auto semantic state |
|---|---|---|---|
| `Button` | `Button` | Constructor/`label(...)` text | n/a |
| `Checkbox` | `Checkbox` | Constructor/label text | `semanticChecked` (`False/True/Mixed`) |
| `Switch` | `Switch` | Constructor/label text | `semanticChecked` (`False/True`) |
| `RadioButton` | `Radio` | Constructor/label text | `semanticChecked` (`False/True`) |
| `RadioGroup` | `RadioGroup` | none by default | child radios carry checked state |
| `ProgressBar` | inherited container semantics | generated value/range label unless overridden | `semanticValueRange`, `semanticOrientation` |
| `Slider` | `Slider` | Generated label includes orientation + value + range | `semanticValueRange`, `semanticOrientation` |
| `Dropdown` | `ComboBox` | selected option label (or `"Dropdown"` if none) | `semanticExpanded`; options list/item semantics |
| `TextInput` | `Textbox` (editor node) | placeholder text when present; else `"Text input"`; password mode uses `"Password input"` | selection/focus/edit state through text engine |
| `TextArea` | `Textbox` (editor node) | placeholder text when present; else `"Text area"` | selection/focus/edit state through text engine |
| `NavLink` | `Link` | constructor label | n/a |
| `Dialog` | `Dialog` (card), heading/body semantic text | title/body text drive labels | modal semantic scope while open |
| `Form` | `Form` | none by default | n/a |
| `Text` | `StaticText` (when auto-applicable) | content text when no explicit semantic ancestor/role | n/a |
| `Image` / `Svg` | none unless set | use `altText(...)` to set image semantics | n/a |

## Important defaults to know

1. `TextInput`/`TextArea` semantics are on the editor text node (`Textbox` role), with placeholder-first default labels.
2. `Dropdown` keeps semantics aligned with state (`semanticExpanded`) and selected label.
3. `Slider` continuously updates semantic value/range and default label as value changes.
4. `Dialog` pushes semantic scope while open so active modal semantics are isolated to the topmost modal surface.

## Disabled semantics

These controls explicitly mirror enabled/disabled state into semantic disabled state:

- pressable labeled controls (`Checkbox`, `Switch`, `RadioButton`)
- `Dropdown`
- `Slider`
- `TextInput` / `TextArea` (via `TextInputCore`)

## Live announcements

- `Node.requestSemanticAnnouncement()` asks the host bridge to announce the currently focused node again using its latest semantic role/label/state.
- Built-in stateful controls (`Checkbox`, `Switch`, `RadioButton`, `RadioGroup`, `Slider`, `Dropdown`) already call it on user-driven state changes, so toggles and value updates do not wait for blur/refocus before being announced.
- Keep it focused on user-visible state changes. It is meant for the active control the user is already interacting with, not for background model churn.

## Visibility and semantic projection

`Node.visibility(...)` affects semantic projection the same way it affects rendering:

- `Visibility.Normal`: semantic records emit as usual.
- `Visibility.Hidden`: node stays in layout, but is omitted from paint/hit/focus and semantic export.
- `Visibility.Collapsed`: node is removed from layout and omitted from paint/hit/focus and semantic export.

## When to override

- Prefer the built-in defaults first. Controls like `Button`, `NavLink`, `Text`, `TextInput`, and `TextArea` already supply roles and names from their normal content/behavior.
- Use `semanticLabel(...)` when visible text is ambiguous (icon-only actions, shortened labels, contextual meaning).
- Use explicit `semanticRole(...)` when a generic node is acting as a specific semantic control.
- Use `altText(...)` on `Image`/`Svg` for meaningful non-decorative media.

## Example

```ts
import { Button, Image, Slider } from "./Fui";

const save = new Button("Save");

const volume = new Slider(35.0)
  .semanticLabel("Playback volume");

const logo = Image.load("/img/company-logo.png")
  .altText("Contoso company logo");
```

## See also

- [SDK docs index](./SDK_INDEX.md)
- [Controls and nodes](./CONTROLS_AND_NODES.md)
- [API reference](./API_REFERENCE.md)
- [Events and callbacks](./EVENTS_AND_CALLBACKS.md)
