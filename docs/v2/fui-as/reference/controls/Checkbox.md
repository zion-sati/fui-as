# Checkbox

```ts
import { Checkbox } from "./Fui";
```

- **Constructor:** `new Checkbox(label: string)`
- **Mode:** `triState(flag = true)`
- **Value setters:** `check(flag)`, `mixed(flag)` (mixed requires tri-state)
- **Change callback:** `onChanged(cb)` / `onChangedWith(owner, handler)`

`Checkbox` supports semantic checked states (`true`, `false`, `mixed`) and keyboard `Space` activation.


## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#controls)
- [SDK docs index](../../SDK_INDEX.md)
