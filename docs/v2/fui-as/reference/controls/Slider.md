# Slider

```ts
import { Orientation, Slider, SliderColors, SliderSizing } from "./Fui";
```

- **Constructor:** `new Slider(value = 0.0)`
- **Range:** `min(value)`, `max(value)`, `step(value)`
- **Geometry:** `length(value)`, `fillLength()`, `orientation(Orientation.Horizontal|Vertical)`
- **Sizing:** `sizing(new SliderSizing().thumbSize(px).trackThickness(px))`
- **Colors:** `colors(new SliderColors().track(...).fill(...).thumb(...))`
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

`length(...)` sets the track's length along the slider's orientation in pixels; the focus chrome adds a few pixels
around it. `fillLength()` makes the slider fill its container along its orientation instead, as `fillWidth()` or
`fillHeight()` does, so it follows the container on any screen. Calling `length(...)` again returns to a fixed length.

```ts
new Slider(40.0).fillLength();
```

If you supply a custom slider template, the template remains authoritative for presenter geometry. The slider sizes the
presenter's root to its track area, a fixed length or the length it fills, so `SliderPresenter.layout(state)` lays out
relative to that root (percentages along the track, as the default presenter does) and receives no length.


## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#controls)
- [SDK docs index](../../SDK_INDEX.md)
