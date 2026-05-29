# RadioButton

```ts
import { RadioButton } from "./Fui";
```

- **Constructor:** `new RadioButton(value: string, label: string = value)`
- **Bind to group:** `bindGroup(group)`
- **Value setter:** `check(flag)`
- **Change callback:** `onChanged(cb)` / `onChangedWith(owner, handler)`

Typical usage is via `RadioGroup.addOption(...)` rather than manual group binding.


## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#controls)
- [SDK docs index](../../SDK_INDEX.md)
