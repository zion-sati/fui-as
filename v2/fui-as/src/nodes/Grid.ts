import * as ui from "../bindings/ui";
import { setGridSharedSizeScope } from "../core/AttachedProperties";
import { GridUnit, HandleValue, NodeType } from "../core/ffi";
import { PointerClickEventArgs, PointerEventArgs, Node } from "../core/Node";
import { FlexBox } from "./FlexBox";

class GridPlacement {
  readonly child: Node;
  readonly row: u32;
  readonly col: u32;
  readonly rowSpan: u32;
  readonly colSpan: u32;

  constructor(child: Node, row: u32, col: u32, rowSpan: u32, colSpan: u32) {
    this.child = child;
    this.row = row;
    this.col = col;
    this.rowSpan = rowSpan;
    this.colSpan = colSpan;
  }
}

export class Grid extends FlexBox {
  private columnValues: Float32Array | null = null;
  private columnTypes: Uint8Array | null = null;
  private rowValues: Float32Array | null = null;
  private rowTypes: Uint8Array | null = null;
  private readonly columnSharedSizeGroups: Array<string> = new Array<string>();
  private readonly rowSharedSizeGroups: Array<string> = new Array<string>();
  private readonly placements: Array<GridPlacement> = new Array<GridPlacement>();

  static sharedSizeScope(target: Node, enabled: bool = true): void {
    if (!setGridSharedSizeScope(target._attachedPropertyKey(), enabled)) {
      return;
    }
    const handle = target.builtHandle;
    if (handle != <u64>HandleValue.Invalid) {
      ui.setIsSharedSizeScope(handle, enabled);
      target._notifyRetainedLayoutMutation();
    }
  }

  columns(count: u32, values: Array<f32>, types: Array<GridUnit>): this {
    const valueCount = <u32>values.length;
    const typeCount = <u32>types.length;
    this.columnValues = new Float32Array(count);
    this.columnTypes = new Uint8Array(count);
    for (let i: u32 = 0; i < count; ++i) {
      if (i < valueCount) {
        unchecked(changetype<Float32Array>(this.columnValues)[i] = unchecked(values[i]));
      }
      if (i < typeCount) {
        unchecked(changetype<Uint8Array>(this.columnTypes)[i] = <u8>unchecked(types[i]));
      }
    }
    return this;
  }

  rows(count: u32, values: Array<f32>, types: Array<GridUnit>): this {
    const valueCount = <u32>values.length;
    const typeCount = <u32>types.length;
    this.rowValues = new Float32Array(count);
    this.rowTypes = new Uint8Array(count);
    for (let i: u32 = 0; i < count; ++i) {
      if (i < valueCount) {
        unchecked(changetype<Float32Array>(this.rowValues)[i] = unchecked(values[i]));
      }
      if (i < typeCount) {
        unchecked(changetype<Uint8Array>(this.rowTypes)[i] = <u8>unchecked(types[i]));
      }
    }
    return this;
  }

  placeChild(child: Node, row: u32, col: u32, rowSpan: u32 = 1, colSpan: u32 = 1): this {
    this.appendChild(child);
    this.placements.push(new GridPlacement(child, row, col, rowSpan, colSpan));
    return this;
  }

  columnSharedSizeGroup(index: u32, group: string): this {
    while (<u32>this.columnSharedSizeGroups.length <= index) {
      this.columnSharedSizeGroups.push("");
    }
    unchecked(this.columnSharedSizeGroups[index] = group);
    if (this.hasBuiltHandle()) {
      ui.gridSetColumnSharedSizeGroup(this.handle, index, group);
      this.notifyRetainedLayoutMutation();
    }
    return this;
  }

  clearColumnSharedSizeGroup(index: u32): this {
    if (index < <u32>this.columnSharedSizeGroups.length) {
      unchecked(this.columnSharedSizeGroups[index] = "");
      if (this.hasBuiltHandle()) {
        ui.gridSetColumnSharedSizeGroup(this.handle, index, "");
        this.notifyRetainedLayoutMutation();
      }
    }
    return this;
  }

  rowSharedSizeGroup(index: u32, group: string): this {
    while (<u32>this.rowSharedSizeGroups.length <= index) {
      this.rowSharedSizeGroups.push("");
    }
    unchecked(this.rowSharedSizeGroups[index] = group);
    if (this.hasBuiltHandle()) {
      ui.gridSetRowSharedSizeGroup(this.handle, index, group);
      this.notifyRetainedLayoutMutation();
    }
    return this;
  }

  clearRowSharedSizeGroup(index: u32): this {
    if (index < <u32>this.rowSharedSizeGroups.length) {
      unchecked(this.rowSharedSizeGroups[index] = "");
      if (this.hasBuiltHandle()) {
        ui.gridSetRowSharedSizeGroup(this.handle, index, "");
        this.notifyRetainedLayoutMutation();
      }
    }
    return this;
  }

  onPointerClick(cb: (event: PointerClickEventArgs) => void): this {
    super.onPointerClick(cb);
    return this;
  }

  onPointerDoubleClick(cb: (event: PointerClickEventArgs) => void): this {
    super.onPointerDoubleClick(cb);
    return this;
  }

  onPointerTripleClick(cb: (event: PointerClickEventArgs) => void): this {
    super.onPointerTripleClick(cb);
    return this;
  }

  onPointerEnter(cb: (event: PointerEventArgs) => void): this {
    super.onPointerEnter(cb);
    return this;
  }

  onPointerLeave(cb: (event: PointerEventArgs) => void): this {
    super.onPointerLeave(cb);
    return this;
  }

  build(): u64 {
    if (this.hasBuiltHandle()) {
      return this.handle;
    }

    this.buildStyledNode(NodeType.Grid, false);
    if (this.columnValues !== null && this.columnTypes !== null) {
      ui.gridSetColumns(this.handle, changetype<Float32Array>(this.columnValues), changetype<Uint8Array>(this.columnTypes));
    }
    if (this.rowValues !== null && this.rowTypes !== null) {
      ui.gridSetRows(this.handle, changetype<Float32Array>(this.rowValues), changetype<Uint8Array>(this.rowTypes));
    }
    for (let i = 0; i < this.columnSharedSizeGroups.length; ++i) {
      const group = unchecked(this.columnSharedSizeGroups[i]);
      if (group.length > 0) {
        ui.gridSetColumnSharedSizeGroup(this.handle, <u32>i, group);
      }
    }
    for (let i = 0; i < this.rowSharedSizeGroups.length; ++i) {
      const group = unchecked(this.rowSharedSizeGroups[i]);
      if (group.length > 0) {
        ui.gridSetRowSharedSizeGroup(this.handle, <u32>i, group);
      }
    }
    for (let i = 0; i < this.placements.length; ++i) {
      const placement = unchecked(this.placements[i]);
      const childHandle = placement.child.build();
      ui.addChild(this.handle, childHandle);
      ui.setGridPlacement(childHandle, placement.row, placement.col, placement.rowSpan, placement.colSpan);
    }
    return this.handle;
  }

  dispose(): void {
    this.placements.length = 0;
    super.dispose();
  }

  protected usesFlexChildLayoutDiagnostics(): bool {
    return false;
  }
}
