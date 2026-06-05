# TextArea

```ts
import { ScrollBarVisibility, TextArea, TextInputColors } from "./Fui";
```

- **Constructor:** `new TextArea(text = "")`
- **Inherits:** all `TextInput` APIs
- **Colors:** `colors(new TextInputColors().background(...).border(...).textPrimary(...).placeholder(...).caret(...).accent(...))`
- **Multiline controls:** `wrapping(...)`, `verticalScrollbarVisibility(...)`, `horizontalScrollbarVisibility(...)`

`TextArea` is multiline by default and uses retained scroll chrome for overflow behavior.

## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#controls)
- [SDK docs index](../../SDK_INDEX.md)
