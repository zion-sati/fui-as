# Checkbox

```ts
import { Checkbox, LabeledControlSizing } from "./Fui";
```

- **Constructor:** `new Checkbox(label: string)`
- **Mode:** `triState(flag = true)`
- **Value setters:** `check(flag)`, `mixed(flag)` (mixed requires tri-state)
- **Sizing:** `sizing(new LabeledControlSizing().indicatorSize(px).labelFontSize(px))`
- **Change callback:** `onChanged(cb)` / `onChangedWith(owner, handler)`

`Checkbox` supports semantic checked states (`true`, `false`, `mixed`) and keyboard `Space` activation.

Use `.sizing(...)` for routine built-in sizing without replacing the indicator template:

```ts
new Checkbox("Remember me")
  .sizing(new LabeledControlSizing()
    .indicatorSize(16.0)
    .labelFontSize(14.0));
```

If you supply a custom indicator template, the template remains authoritative for indicator visuals.


## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#controls)
- [SDK docs index](../../SDK_INDEX.md)
