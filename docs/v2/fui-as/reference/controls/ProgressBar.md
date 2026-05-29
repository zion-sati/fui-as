# ProgressBar

```ts
import { ProgressBar } from "./Fui";
```

- **Constructor:** `new ProgressBar(value = 0.0)`
- **Range:** `min(value)`, `max(value)`, `value(value)`
- **Geometry:** `length(value)`, `thickness(value)`
- **Styling:** `trackColor(color)`, `fillColor(color)`
- **Read current value:** `valueNow` getter

`ProgressBar` is determinate and horizontal-only in the current slice. It exposes
semantic value-range state, but it is not interactive like `Slider`.

## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#controls)
- [SDK docs index](../../SDK_INDEX.md)
