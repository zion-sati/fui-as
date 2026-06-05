# Switch

```ts
import { LabeledControlColors, Switch } from "./Fui";
```

- **Constructor:** `new Switch(label: string)`
- **Value setter:** `check(flag)`
- **Colors:** `colors(new LabeledControlColors().background(...).border(...).accent(...).textPrimary(...).textMuted(...))`
- **Change callback:** `onChanged(cb)` / `onChangedWith(owner, handler)`
- **Read current value:** `checked` getter

`Switch` uses switch semantics and keyboard `Space` activation.
Color overrides flow into the built-in switch presenter and any custom
`SwitchIndicatorPresenter` template you attach.


## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#controls)
- [SDK docs index](../../SDK_INDEX.md)
