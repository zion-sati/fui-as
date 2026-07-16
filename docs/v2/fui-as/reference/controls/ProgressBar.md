# ProgressBar

```ts
import { Orientation, ProgressBar } from "./Fui";
```

- **Constructor:** `new ProgressBar(value = 0.0)`
- **Range:** `min(value)`, `max(value)`, `value(value)`
- **Geometry:** `length(value)`, `thickness(value)`, `orientation(Orientation.Horizontal|Vertical)`
- **Styling:** `trackColor(color)`, `fillColor(color)`
- **Read current value:** `valueNow` getter

`ProgressBar` is determinate and defaults to horizontal. `length(...)` controls
the orientation axis and `thickness(...)` controls the cross axis. Horizontal
bars fill left-to-right; vertical bars fill bottom-to-top.

```ts
new ProgressBar(40.0)
  .orientation(Orientation.Vertical)
  .length(180.0)
  .thickness(14.0);
```

The control exposes semantic value-range and orientation state, but it is not
interactive like `Slider`.

## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#controls)
- [SDK docs index](../../SDK_INDEX.md)
