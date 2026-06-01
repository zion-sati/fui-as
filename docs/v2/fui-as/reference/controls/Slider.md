# Slider

```ts
import { Orientation, Slider, SliderSizing } from "./Fui";
```

- **Constructor:** `new Slider(value = 0.0)`
- **Range:** `min(value)`, `max(value)`, `step(value)`
- **Geometry:** `length(value)`, `orientation(Orientation.Horizontal|Vertical)`
- **Sizing:** `sizing(new SliderSizing().thumbSize(px).trackThickness(px))`
- **Change callback:** `onChanged(cb)` / `onChangedWith(owner, handler)`
- **Read current value:** `value` getter

Keyboard keys: `Home`, `End`, and axis-appropriate arrow keys (no modifiers).

Use `.sizing(...)` for routine built-in thumb/track sizing without replacing the presenter template:

```ts
new Slider(25.0)
  .sizing(new SliderSizing()
    .thumbSize(16.0)
    .trackThickness(4.0));
```

If you supply a custom slider template, the template remains authoritative for presenter geometry.


## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#controls)
- [SDK docs index](../../SDK_INDEX.md)
