# RadioButton

```ts
import { LabeledControlColors, LabeledControlSizing, RadioButton } from "./Fui";
```

- **Constructor:** `new RadioButton(value: string, label: string = value)`
- **Bind to group:** `bindGroup(group)`
- **Value setter:** `check(flag)`
- **Sizing:** `sizing(new LabeledControlSizing().indicatorSize(px).labelFontSize(px))`
- **Colors:** `colors(new LabeledControlColors().background(...).border(...).accent(...).textPrimary(...).textMuted(...))`
- **Change callback:** `onChanged(cb)` / `onChangedWith(owner, handler)`

Typical usage is via `RadioGroup.addOption(...)` rather than manual group binding.

Use `.sizing(...)` for routine built-in sizing without replacing the indicator template:

```ts
new RadioButton("density", "Compact")
  .sizing(new LabeledControlSizing()
    .indicatorSize(16.0)
    .labelFontSize(14.0));
```

If you supply a custom indicator template, the template remains authoritative for indicator visuals, and the same `LabeledControlColors` object is passed through to that presenter.


## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#controls)
- [SDK docs index](../../SDK_INDEX.md)
