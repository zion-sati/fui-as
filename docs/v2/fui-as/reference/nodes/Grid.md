# Grid

```ts
import { Grid, GridUnit } from "./Fui";
```

- **Constructor:** `new Grid()`
- **Tracks:** `columns(count, values, units)`, `rows(count, values, units)`
- **Placement:** `placeChild(node, row, col, rowSpan = 1, colSpan = 1)`
- **Shared sizes:** `columnSharedSizeGroup`, `rowSharedSizeGroup`, clear variants, and `Grid.sharedSizeScope(...)`

`Grid` extends `FlexBox`, so standard box styling/layout APIs also apply.


## See also

- [Per-type reference index](../README.md)
- [Controls and nodes](../../CONTROLS_AND_NODES.md#nodes)
- [SDK docs index](../../SDK_INDEX.md)
