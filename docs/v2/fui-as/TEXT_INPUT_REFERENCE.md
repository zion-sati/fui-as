# TextInput / TextArea Reference (v2 FUI-AS)

Public imports:

```ts
import { TextInput, TextArea, ScrollBarVisibility } from "./Fui";
```

## `TextInput`

Single-line retained text editor.

### Constructor

- `new TextInput(text: string = "")`

### Read-only properties

- `value: string`
- `selectionStart: u32`
- `selectionEnd: u32`
- `isFocused: bool`
- `isReadOnly: bool`
- `isPassword: bool`
- `editorNode: TextCore`

### Core methods

- `text(value: string): this`
- `placeholder(value: string): this`
- `maxChars(limit: i32): this` (`limit < 0` => unlimited)
- `readOnly(flag: bool = true): this`
- `password(flag: bool = true): this`
- `fontFamily(family: FontFamily | null): this`
- `fontSize(size: f32): this`
- `lineHeight(px: f32): this`
- `semanticLabel(label: string): this`
- `focusNow(): this`

### Callbacks

- `onChanged(cb: (text: string) => void): this`
- `onTextChanged(cb: (text: string) => void): this` (alias)
- `onChangedWith<Owner>(owner, handler): this`
- `onSelectionChanged(cb: (start: u32, end: u32) => void): this`
- `onSelectionChangedWith<Owner>(owner, handler): this`
- `onFocusChanged(cb: (focused: bool) => void): this`
- `onFocusChangedWith<Owner>(owner, handler): this`

## `TextArea`

Multiline retained text editor built on `TextInputCore`.

### Constructor

- `new TextArea(text: string = "")`

### Inherited text APIs

`TextArea` includes all text/focus/selection APIs from `TextInput`.

### Multiline-specific methods

- `wrapping(flag: bool = true): this`
- `verticalScrollbarVisibility(mode: ScrollBarVisibility): this`
- `horizontalScrollbarVisibility(mode: ScrollBarVisibility): this`

## Behavior notes

1. Callback order is state-first, callback-second (internal state updates before handlers fire).
2. Disabled controls reject interactive edits/focus entry and apply disabled visuals.
3. `lineHeight(px)` applies to both editor text and placeholder text.
4. In multiline mode, horizontal scrollbar visibility is ignored when wrapping is enabled (forced hidden).

## See also

- [SDK docs index](./SDK_INDEX.md)
- [Text input design](./TEXT_INPUT_DESIGN.md)
- [Keyboard policy](./KEYBOARD_POLICY.md)
- [Controls and nodes](./CONTROLS_AND_NODES.md)
