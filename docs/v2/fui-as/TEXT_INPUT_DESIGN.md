# Text Input Behavior Guide (v2 FUI-AS)

This page explains what SDK users can rely on when using `TextInput` and `TextArea`.

## Which control to use

- `TextInput`: single-line editing
- `TextArea`: multiline editing with wrapping + scrollbars

## Common behavior (`TextInput` and `TextArea`)

- Pointer-down on the control focuses the editor.
- Empty value + non-empty placeholder shows placeholder text.
- Selection and focus callbacks are state-first:
  - internal state updates first
  - your callback runs after state is current
- Disabled controls are non-editable and dimmed.
- `readOnly(true)` keeps focus/selection behavior but blocks text edits.
- `password(true)` obscures rendered text.
- `maxChars(limit)` enforces text length limits (`limit < 0` means unlimited).

## Placeholder and semantics

- Placeholder only appears when value is empty.
- Default semantic labeling falls back to placeholder text when present.
- If there is no placeholder, defaults are text-input specific (`Text input` / `Text area`), with password mode using `Password input`.

## Text callbacks

- `onChanged(...)` and `onTextChanged(...)` are equivalent.
- `onSelectionChanged(...)` reports `(start, end)` whenever selection changes.
- `onFocusChanged(...)` reports focus transitions.

## `TextArea` wrapping and scrollbars

- `wrapping(true)`:
  - content tracks viewport width
  - horizontal scrolling disabled
  - horizontal scrollbar hidden
- `wrapping(false)`:
  - content may exceed viewport width
  - horizontal scrolling enabled
  - horizontal scrollbar follows configured visibility
- Vertical scrolling remains enabled.

## Styling behavior

- Theme defaults control background, border, text, caret, spacing, and disabled opacity.
- `fontFamily(...)`, `fontSize(...)`, and `lineHeight(...)` override typography per control.
- `lineHeight(...)` applies to both content text and placeholder text.

## See also

- [SDK docs index](./SDK_INDEX.md)
- [Accessibility and semantics](./ACCESSIBILITY_AND_SEMANTICS.md)
- [Text input reference](./TEXT_INPUT_REFERENCE.md)
- [Keyboard policy](./KEYBOARD_POLICY.md)
- [Events and callbacks](./EVENTS_AND_CALLBACKS.md)
