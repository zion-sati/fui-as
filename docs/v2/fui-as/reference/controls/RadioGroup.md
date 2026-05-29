# RadioGroup

```ts
import { RadioGroup } from "./Fui";
```

- **Constructor:** `new RadioGroup()`
- **Add options:** `addOption(value, label?)`, `addOptions(radios)`, `addRadio(radio)`
- **Select:** `selectIndex(index)` (use `-1` to clear)
- **Read selected value:** `selectedValue` getter
- **Change callback:** `onChanged(cb)` / `onChangedWith(owner, handler)`

Keyboard navigation is handled inside the grouped radio behavior.


## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#controls)
- [SDK docs index](../../SDK_INDEX.md)
