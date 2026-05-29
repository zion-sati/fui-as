# Slider

```ts
import { Orientation, Slider } from "./Fui";
```

- **Constructor:** `new Slider(value = 0.0)`
- **Range:** `min(value)`, `max(value)`, `step(value)`
- **Geometry:** `length(value)`, `orientation(Orientation.Horizontal|Vertical)`
- **Change callback:** `onChanged(cb)` / `onChangedWith(owner, handler)`
- **Read current value:** `value` getter

Keyboard keys: `Home`, `End`, and axis-appropriate arrow keys (no modifiers).


## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#controls)
- [SDK docs index](../../SDK_INDEX.md)
