# TextInput

```ts
import { TextInput, TextInputColors } from "./Fui";
```

- **Constructor:** `new TextInput(text = "")`
- **Value/placeholder:** `text(...)`, `placeholder(...)`
- **Modes:** `readOnly(...)`, `password(...)`
- **Colors:** `colors(new TextInputColors().background(...).border(...).textPrimary(...).placeholder(...).caret(...).accent(...))`
- **Limits/typography:** `maxChars(...)`, `fontFamily(...)`, `fontSize(...)`, `lineHeight(...)`
- **Focus:** `focusNow()`
- **Callbacks:** `onChanged`, `onSelectionChanged`, `onFocusChanged` (+ owner-bound variants)
- **Read-only properties:** `value`, `selectionStart`, `selectionEnd`, `isFocused`, `isReadOnly`, `isPassword`

For full details, see [Text input reference](../../TEXT_INPUT_REFERENCE.md).


## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#controls)
- [SDK docs index](../../SDK_INDEX.md)
