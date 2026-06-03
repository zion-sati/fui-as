# Grid

```ts
import { Grid, GridUnit } from "./Fui";
```

- **Constructor:** `new Grid()`
- **Tracks:** `columns(count, values, units)`, `rows(count, values, units)`
  - `values` is an Array<number>. For `GridUnit.Star` the number is the star weight (e.g. `1.0`).
  - `units` is an Array<GridUnit> with entries from `GridUnit.Pixel | GridUnit.Auto | GridUnit.Star`.
- **Placement:** `placeChild(node, row, col, rowSpan = 1, colSpan = 1)` — appends the child and records its grid placement.
- **Shared sizes:** `columnSharedSizeGroup(index, group)`, `rowSharedSizeGroup(index, group)` and `Grid.sharedSizeScope(target, enabled)` to synchronize track sizes across multiple grids.

`Grid` extends `FlexBox`, so standard box styling/layout APIs (padding, margin, alignItems, fillWidth, etc.) also apply.

Quick example — aligned labels and inputs (common form layout):

```ts
// align label column to a fixed pixel width and let the input column take remaining space
const formGrid = new Grid()
  .columns(2, [200.0, 1.0], [GridUnit.Pixel, GridUnit.Star])
  .rows(2, [40.0, 40.0], [GridUnit.Pixel, GridUnit.Pixel])
  .placeChild(
    new DemoText("Standard Text Input:", DemoTextStyle.Body)
      .verticalAlign(TextVerticalAlign.Center),
    0, 0)
  .placeChild(
    new TextInput()
      .placeholder("Type here")
      .fontSize(14.0)
      .height(40.0, Unit.Pixel),
    0, 1)
  .placeChild(
    new DemoText("Password Text Input:", DemoTextStyle.Body)
      .verticalAlign(TextVerticalAlign.Center),
    1, 0)
  .placeChild(
    new TextInput("RandomPassword")
      .password()
      .fontSize(14.0)
      .height(40.0, Unit.Pixel),
    1, 1);
```

Notes:
- Use `GridUnit.Star` (and a numeric weight) to distribute remaining space across star tracks. `Auto` sizes to content; `Pixel` is fixed pixels.
- `placeChild()` appends the child; use `rowSpan` / `colSpan` to span multiple cells: `placeChild(node, 0, 0, 1, 2)`.
- For vertical centering of inline text, use `verticalAlign(TextVerticalAlign.Center)` on `Text` nodes or set `alignItems(AlignItems.Center)` on the grid.
- To make columns share the same width across several grids, call `Grid.sharedSizeScope(parent, true)` on a common ancestor and set `columnSharedSizeGroup(index, "group-name")` on each grid.

See also:
- ContextMenu control (v2/fui-as/src/controls/ContextMenu.ts) — a real-world example of a multi-column grid layout and shared-size usage.
- FlexBox docs for styling helpers and alignment primitives.
