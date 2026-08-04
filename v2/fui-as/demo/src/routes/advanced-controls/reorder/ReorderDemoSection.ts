import {
  AlignItems,
  Column,
  CursorStyle,
  DragCompletedEventArgs,
  DragDataObject,
  DragDropEffects,
  DragEventArgs,
  DropProposal,
  FlexBox,
  FlexDirection,
  JustifyContent,
  Portal,
  Row,
  ScrollBarVisibility,
  SemanticRole,
  Text,
  Theme,
  Unit,
  Visibility,
  activeTheme,
  cancelTimer,
  Disposable,
  disposeAll,
  HandlerAction,
  scheduleTimer,
  viewportHeightSignal,
  viewportWidthSignal,
} from "../../../../../src/Fui";
import { clearCurrentSelection } from "../../../../../src/FuiPrimitives";
import {
  DemoScrollBox,
  DemoText,
  DemoTextRecipe,
  RoutePageSection,
  applyDemoScrollBoxTheme,
  createRoutePageSection,
  demoCardBackground,
  demoCardBackgroundAlt,
  demoDividerColor,
  demoMutedText,
  demoPrimaryText,
} from "../../../design-system";
import {
  REORDER_DRAG_FORMAT,
  REORDER_AUTOSCROLL_STEP_PX,
  REORDER_MARKER_HEIGHT_PX,
  REORDER_ROW_BODY_HEIGHT_PX,
  REORDER_VIEWPORT_HEIGHT_PX,
  ReorderDemoItem,
  ReorderVisibleRange,
  computeNextReorderAutoScrollOffset,
  computeReorderContentHeight,
  computeReorderEdgeInsertionIndex,
  computeReorderPointerAutoScrollDelta,
  computeReorderVisibleRange,
  createReorderDemoItems,
  findReorderItemIndex,
  moveReorderItem,
  normalizeReorderInsertionIndex,
} from "./ReorderDemoLogic";

const AUTOSCROLL_TIMER_ID: u32 = 4101;
const AUTOSCROLL_DELAY_MS: i32 = 16;
const PREVIEW_WIDTH_PX: f32 = 272.0;
const PREVIEW_HEIGHT_PX: f32 = 116.0;
const PREVIEW_OFFSET_X_PX: f32 = 2.0;
const PREVIEW_OFFSET_Y_PX: f32 = 2.0;
const PREVIEW_MARGIN_PX: f32 = 12.0;

let activeAutoScrollController: ReorderDemoSection | null = null;

function verticalSpacer(height: f32): FlexBox {
  return new FlexBox().fillWidth().height(height, Unit.Pixel);
}

function rowDragData(owner: ReorderRowView): DragDataObject | null {
  return owner.provideDragData();
}

function rowDragCompleted(owner: ReorderRowView, event: DragCompletedEventArgs): void {
  owner.handleDragCompleted(event.effect);
}

function rowDragOver(owner: ReorderRowView, args: DragEventArgs): DropProposal {
  return owner.handleDragOver(args);
}

function rowDragLeave(owner: ReorderRowView, args: DragEventArgs): void {
  owner.handleDragLeave(args);
}

function rowDrop(owner: ReorderRowView, args: DragEventArgs): void {
  owner.handleDrop(args);
}

function reorderAutoScrollTimer(): void {
  const controller = activeAutoScrollController;
  if (controller !== null) {
    controller.handleAutoScrollTimer();
  }
}

class ReorderRowView {
  readonly marker: FlexBox = new FlexBox()
    .fillWidth()
    .height(REORDER_MARKER_HEIGHT_PX, Unit.Pixel)
    .cornerRadius(REORDER_MARKER_HEIGHT_PX * 0.5)
    .opacity(0.0) as FlexBox;
  readonly gripLabel: Text = new DemoText("Drag", DemoTextRecipe.StatusValue)
    .fontSize(14.0)
    .selectable(false)
    .cursor(CursorStyle.Grab)
    .bindDragData<ReorderRowView>(this, rowDragData)
    .dragAllowedEffects(DragDropEffects.Move)
    .onDragCompletedWith<ReorderRowView>(this, rowDragCompleted) as Text;
  readonly grip!: FlexBox;
  readonly titleText: Text = new DemoText("", DemoTextRecipe.Body)
    .fontSize(16.0) as Text;
  readonly detailText: Text = new DemoText("", DemoTextRecipe.Hint)
    .fontSize(14.0)
    .maxLines(2) as Text;
  readonly card!: FlexBox;
  readonly slot!: FlexBox;

  private currentItem: ReorderDemoItem | null = null;
  private pendingDragItemId: string | null = null;

  constructor(private readonly controller: ReorderDemoSection, readonly rawIndex: i32) {
    const gripBody = new FlexBox()
      .width(76.0, Unit.Pixel)
      .height(40.0, Unit.Pixel)
      .cornerRadius(12.0)
      .justifyContent(JustifyContent.Center)
      .alignItems(AlignItems.Center)
      .child(this.gripLabel) as FlexBox;
    this.grip = gripBody
      .cursor(CursorStyle.Grab)
      .semanticRole(SemanticRole.Button)
      .semanticLabel("Drag grip")
      .bindDragData<ReorderRowView>(this, rowDragData)
      .dragAllowedEffects(DragDropEffects.Move)
      .onDragCompletedWith<ReorderRowView>(this, rowDragCompleted) as FlexBox;

    const textColumn = Column(
      this.titleText,
      verticalSpacer(4.0),
      this.detailText,
    ).fillWidth();

    this.card = new FlexBox()
      .fillWidth()
      .height(REORDER_ROW_BODY_HEIGHT_PX, Unit.Pixel)
      .padding(16.0, 14.0, 16.0, 14.0)
      .cornerRadius(18.0)
      .child(
        Row(
          this.grip,
          new FlexBox().width(14.0, Unit.Pixel).height(1.0, Unit.Pixel),
          textColumn,
        ).fillWidth(),
      ) as FlexBox;

    this.slot = new FlexBox()
      .fillWidth()
      .flexDirection(FlexDirection.Column)
      .allowDrop(true)
      .onDragEnterWith<ReorderRowView>(this, rowDragOver)
      .onDragOverWith<ReorderRowView>(this, rowDragOver)
      .onDragLeaveWith<ReorderRowView>(this, rowDragLeave)
      .onDropWith<ReorderRowView>(this, rowDrop) as FlexBox;
    this.slot.child(this.marker).child(this.card);
  }

  get itemId(): string | null {
    const item = this.currentItem;
    return item === null ? null : item.id;
  }

  bindItem(item: ReorderDemoItem): void {
    this.currentItem = item;
    this.titleText.text(item.label);
    this.detailText.text(item.detail);
    this.grip.semanticLabel("Drag grip for " + item.label);
    this.card.semanticRole(SemanticRole.StaticText).semanticLabel("Reorder item " + (this.rawIndex + 1).toString() + ": " + item.label);
  }

  provideDragData(): DragDataObject | null {
    const item = this.currentItem;
    if (item === null) {
      return null;
    }
    this.pendingDragItemId = item.id;
    return this.controller.beginDrag(item);
  }

  handleDragCompleted(effect: DragDropEffects): void {
    const draggedItemId = this.pendingDragItemId;
    this.pendingDragItemId = null;
    if (draggedItemId !== null) {
      this.controller.completeDrag(draggedItemId, effect);
    }
  }

  handleDragOver(args: DragEventArgs): DropProposal {
    return this.controller.previewInsertion(args, this.rawIndex);
  }

  handleDragLeave(args: DragEventArgs): void {
    this.controller.handleTargetLeave(args);
  }

  handleDrop(args: DragEventArgs): void {
    this.controller.dropAtPreview(args);
  }

  applyTheme(theme: Theme, activeSourceId: string | null, rawInsertionIndex: i32): void {
    const item = this.currentItem;
    const isSource = item !== null && item.id == activeSourceId;
    const markerVisible = rawInsertionIndex == this.rawIndex;
    this.marker
      .bgColor(theme.colors.accent)
      .opacity(markerVisible ? 1.0 : 0.0);
    this.card
      .bgColor(isSource ? theme.colors.accentHovered : ((this.rawIndex & 1) == 0 ? demoCardBackground(theme) : demoCardBackgroundAlt(theme)))
      .border(1.0, isSource ? theme.colors.accent : demoDividerColor(theme));
    this.titleText.textColor(isSource ? theme.colors.surface : demoPrimaryText(theme));
    this.detailText.textColor(isSource ? theme.colors.surface : demoMutedText(theme));
    this.grip
      .bgColor(isSource ? theme.colors.accent : demoCardBackgroundAlt(theme))
      .border(1.0, isSource ? theme.colors.accentPressed : demoDividerColor(theme))
      .cursor(isSource ? CursorStyle.Grabbing : CursorStyle.Grab);
    this.gripLabel
      .textColor(isSource ? theme.colors.surface : demoPrimaryText(theme))
      .cursor(isSource ? CursorStyle.Grabbing : CursorStyle.Grab);
  }
}

export class ReorderDemoSection {
  private readonly rows: Array<ReorderRowView> = new Array<ReorderRowView>();
  private readonly items: Array<ReorderDemoItem> = createReorderDemoItems();
  private readonly disposables: Array<Disposable> = new Array<Disposable>();
  private readonly scrollContent: FlexBox = new FlexBox()
    .fillWidth()
    .flexDirection(FlexDirection.Column);
  readonly scrollBox: DemoScrollBox;
  readonly orderStatusText: Text = new DemoText("", DemoTextRecipe.StatusValue)
    .fontSize(15.0) as Text;
  readonly dragStatusText: Text = new DemoText("", DemoTextRecipe.StatusSupporting)
    .fontSize(15.0) as Text;
  readonly viewportStatusText: Text = new DemoText("", DemoTextRecipe.StatusSupporting)
    .fontSize(15.0) as Text;
  readonly previewCaptionText: Text = new DemoText("Dragging", DemoTextRecipe.Hint)
    .fontSize(13.0) as Text;
  readonly previewTitleText: Text = new DemoText("", DemoTextRecipe.Body)
    .fontSize(16.0) as Text;
  readonly previewDetailText: Text = new DemoText("", DemoTextRecipe.Hint)
    .fontSize(14.0)
    .maxLines(2) as Text;
  readonly previewEffectText: Text = new DemoText("", DemoTextRecipe.StatusValue)
    .fontSize(13.0) as Text;
  readonly previewGhost: FlexBox = new FlexBox()
    .positionAbsolute()
    .width(PREVIEW_WIDTH_PX, Unit.Pixel)
    .padding(14.0, 14.0, 14.0, 14.0)
    .cornerRadius(18.0)
    .child(
      Column(
        this.previewCaptionText,
        verticalSpacer(6.0),
        this.previewTitleText,
        verticalSpacer(4.0),
        this.previewDetailText,
        verticalSpacer(10.0),
        this.previewEffectText,
      ).fillWidth(),
    )
    .opacity(0.0)
    .visibility(Visibility.Hidden)
    .semanticRole(SemanticRole.StaticText)
    .semanticLabel("Reorder drag preview") as FlexBox;
  readonly previewPortal: Portal = new Portal()
    .positionAbsolute()
    .position(0.0, 0.0)
    .fillSize()
    .child(this.previewGhost) as Portal;
  readonly hintText: Text = new DemoText(
    "Drag a grip with a mouse, or touch and hold before moving. Release to drop. Hold near the viewport edge (or just beyond it) to auto-scroll the inner ScrollBox while the outer route page stays scrollable.",
    DemoTextRecipe.Hint,
  )
    .fontSize(15.0)
    .maxLines(4) as Text;
  readonly endMarker: FlexBox = new FlexBox()
    .fillWidth()
    .height(REORDER_MARKER_HEIGHT_PX, Unit.Pixel)
    .cornerRadius(REORDER_MARKER_HEIGHT_PX * 0.5)
    .opacity(0.0) as FlexBox;
  readonly endDropText: Text = new DemoText("Drop at end of reorder list", DemoTextRecipe.Hint)
    .fontSize(14.0) as Text;
  readonly endDropZone!: FlexBox;

  private readonly sectionBody!: FlexBox;
  private readonly sectionRoot!: FlexBox;
  private themeValue: Theme = activeTheme.value;
  private activeDragItemId: string | null = null;
  private rawInsertionIndex: i32 = -1;
  private autoScrollDeltaY: f32 = 0.0;
  private dragStatusMessage: string = "Reorder drag status: idle";
  private previewPointerX: f32 = NaN;
  private previewPointerY: f32 = NaN;
  private previewEffect: DragDropEffects = DragDropEffects.None;
  private previewInsertionSlot: i32 = -1;

  constructor() {
    this.scrollBox = new DemoScrollBox()
      .scrollEnabledX(false)
      .scrollEnabledY(true)
      .verticalScrollbarVisibility(ScrollBarVisibility.Always)
      .horizontalScrollbarVisibility(ScrollBarVisibility.Never)
      .fillWidth()
      .height(REORDER_VIEWPORT_HEIGHT_PX, Unit.Pixel)
      .semanticRole(SemanticRole.StaticText)
      .semanticLabel("Reorder demo viewport") as DemoScrollBox;
    this.scrollBox.child(this.scrollContent);

    for (let index = 0; index < this.items.length; index += 1) {
      const row = new ReorderRowView(this, index);
      row.bindItem(unchecked(this.items[index]));
      this.rows.push(row);
      this.scrollContent.child(row.slot);
    }

    this.endDropZone = new FlexBox()
      .fillWidth()
      .height(44.0, Unit.Pixel)
      .allowDrop(true)
      .onDragEnterWith<ReorderDemoSection>(this, reorderEndDragOver)
      .onDragOverWith<ReorderDemoSection>(this, reorderEndDragOver)
      .onDragLeaveWith<ReorderDemoSection>(this, reorderEndDragLeave)
      .onDropWith<ReorderDemoSection>(this, reorderEndDrop) as FlexBox;
    this.endDropZone.child(this.endMarker);
    this.endDropZone.child(
      new FlexBox()
        .fillWidth()
        .height(36.0, Unit.Pixel)
        .cornerRadius(14.0)
        .justifyContent(JustifyContent.Center)
        .alignItems(AlignItems.Center)
        .child(this.endDropText),
    );
    this.scrollContent.child(this.endDropZone);
    this.scrollBox.scrollContentSize(-1.0, computeReorderContentHeight(this.items.length));

    this.sectionBody = Column(
      this.scrollBox,
      verticalSpacer(14.0),
      this.orderStatusText,
      verticalSpacer(6.0),
      this.dragStatusText,
      verticalSpacer(6.0),
      this.viewportStatusText,
      verticalSpacer(10.0),
      this.hintText,
    ).fillWidth();
    this.sectionRoot = new FlexBox()
      .fillWidth()
      .clipToBounds(false)
      .child(this.sectionBody)
      .child(this.previewPortal) as FlexBox;

    this.track(this.scrollBox.scrollState.offsetY.addAction(
      new HandlerAction<ReorderDemoSection, f32>(this, (owner, _value): void => owner.syncViewportStatus()),
    ));
    this.track(this.scrollBox.scrollState.viewportHeight.addAction(
      new HandlerAction<ReorderDemoSection, f32>(this, (owner, _value): void => owner.syncViewportStatus()),
    ));

    this.syncAll();
  }

  buildSection(): RoutePageSection {
    return createRoutePageSection(
      "Drag-and-drop reorder / Custom control",
      "Use the drag/drop session API to reorder retained rows inside an inner ScrollBox, including insertion markers, drag-preview polish, cursor feedback, and edge autoscroll.",
      this.sectionRoot,
    );
  }

  applyTheme(theme: Theme): void {
    this.themeValue = theme;
    applyDemoScrollBoxTheme(this.scrollBox, theme);
    for (let index = 0; index < this.rows.length; index += 1) {
      unchecked(this.rows[index]).applyTheme(theme, this.activeDragItemId, this.rawInsertionIndex);
    }
    this.endMarker.bgColor(theme.colors.accent).opacity(this.rawInsertionIndex == this.items.length ? 1.0 : 0.0);
    this.endDropZone
      .bgColor(demoCardBackgroundAlt(theme))
      .border(1.0, demoDividerColor(theme));
    this.endDropText.textColor(demoMutedText(theme));
    this.orderStatusText.textColor(demoPrimaryText(theme));
    this.dragStatusText.textColor(demoMutedText(theme));
    this.viewportStatusText.textColor(demoMutedText(theme));
    this.previewGhost
      .bgColor(theme.colors.surface)
      .border(1.0, this.previewEffect == DragDropEffects.Move ? theme.colors.accent : demoDividerColor(theme))
      .dropShadow(
        theme.toolTip.panelShadowColor,
        0.0,
        theme.toolTip.shadowOffsetY,
        theme.toolTip.shadowBlur,
        theme.toolTip.shadowSpread,
      );
    this.previewCaptionText.textColor(demoMutedText(theme));
    this.previewTitleText.textColor(demoPrimaryText(theme));
    this.previewDetailText.textColor(demoMutedText(theme));
    this.previewEffectText.textColor(this.previewEffect == DragDropEffects.Move ? theme.colors.accent : demoPrimaryText(theme));
  }

  dispose(): void {
    this.stopAutoScroll();
    if (activeAutoScrollController === this) {
      activeAutoScrollController = null;
    }
    disposeAll(this.disposables);
  }

  beginDrag(item: ReorderDemoItem): DragDataObject {
    clearCurrentSelection();
    this.activeDragItemId = item.id;
    const sourceIndex = findReorderItemIndex(this.items, item.id);
    this.rawInsertionIndex = sourceIndex >= 0 ? sourceIndex : -1;
    this.previewPointerX = NaN;
    this.previewPointerY = NaN;
    this.previewEffect = DragDropEffects.None;
    this.previewInsertionSlot = -1;
    this.dragStatusMessage = "Reorder drag status: dragging " + item.label;
    this.syncAll();
    return new DragDataObject()
      .setFormat(REORDER_DRAG_FORMAT, item.id)
      .setText(item.label);
  }

  completeDrag(itemId: string, effect: DragDropEffects): void {
    const item = this.findItem(itemId);
    const itemLabel = item === null ? "item" : item.label;
    this.activeDragItemId = null;
    this.rawInsertionIndex = -1;
    this.previewPointerX = NaN;
    this.previewPointerY = NaN;
    this.previewEffect = DragDropEffects.None;
    this.previewInsertionSlot = -1;
    this.stopAutoScroll();
    if (effect == DragDropEffects.Move) {
      const newIndex = findReorderItemIndex(this.items, itemId);
      this.dragStatusMessage = "Reorder drag status: moved " + itemLabel + " to slot " + (newIndex + 1).toString();
    } else {
      this.dragStatusMessage = "Reorder drag status: cancelled " + itemLabel;
    }
    this.syncAll();
  }

  previewInsertion(args: DragEventArgs, rawInsertionIndex: i32): DropProposal {
    const itemId = this.readDraggedItemId(args);
    if (itemId === null || findReorderItemIndex(this.items, itemId) < 0) {
      this.stopAutoScroll();
      return DropProposal.none();
    }
    this.activeDragItemId = itemId;
    this.rawInsertionIndex = rawInsertionIndex;
    const visibleRange = this.readVisibleRange();
    this.setAutoScrollDelta(
      this.computePointerAutoScrollDelta(args.y),
    );
    const normalizedIndex = normalizeReorderInsertionIndex(findReorderItemIndex(this.items, itemId), rawInsertionIndex, this.items.length);
    this.previewPointerX = args.x;
    this.previewPointerY = args.y;
    this.previewEffect = DragDropEffects.Move;
    this.previewInsertionSlot = normalizedIndex;
    this.dragStatusMessage = "Reorder drag status: preview slot " + (normalizedIndex + 1).toString();
    this.syncAll();
    return new DropProposal(DragDropEffects.Move, true);
  }

  handleTargetLeave(args: DragEventArgs): void {
    if (this.activeDragItemId === null) {
      return;
    }
    this.previewPointerX = args.x;
    this.previewPointerY = args.y;
    const visibleRange = this.readVisibleRange();
    this.setAutoScrollDelta(
      this.computePointerAutoScrollDelta(args.y),
    );
    if (this.autoScrollDeltaY == 0.0) {
      this.rawInsertionIndex = -1;
      this.previewEffect = DragDropEffects.None;
      this.previewInsertionSlot = -1;
      this.dragStatusMessage = "Reorder drag status: dragging " + this.activeDragLabel();
    } else {
      const direction = this.autoScrollDeltaY < 0.0 ? -1 : 1;
      this.rawInsertionIndex = computeReorderEdgeInsertionIndex(direction, this.items.length, visibleRange);
      const activeDragItemId = this.activeDragItemId;
      const sourceIndex = activeDragItemId === null ? -1 : findReorderItemIndex(this.items, activeDragItemId);
      this.previewEffect = DragDropEffects.Move;
      this.previewInsertionSlot = this.rawInsertionIndex < 0 || sourceIndex < 0
        ? -1
        : normalizeReorderInsertionIndex(sourceIndex, this.rawInsertionIndex, this.items.length);
      this.dragStatusMessage = "Reorder drag status: auto-scrolling " + (direction < 0 ? "up" : "down");
    }
    this.syncAll();
  }

  dropAtPreview(args: DragEventArgs): void {
    const itemId = this.readDraggedItemId(args);
    if (itemId === null || this.rawInsertionIndex < 0) {
      return;
    }
    moveReorderItem(this.items, itemId, this.rawInsertionIndex);
    for (let index = 0; index < this.rows.length; index += 1) {
      unchecked(this.rows[index]).bindItem(unchecked(this.items[index]));
    }
    this.syncAll();
  }

  handleEndDragOver(args: DragEventArgs): DropProposal {
    return this.previewInsertion(args, this.items.length);
  }

  handleAutoScrollTimer(): void {
    if (this.activeDragItemId === null || this.autoScrollDeltaY == 0.0) {
      this.stopAutoScroll();
      return;
    }
    const viewportHeight = this.readViewportHeight();
    const nextOffset = computeNextReorderAutoScrollOffset(
      this.scrollBox.scrollState.offsetY.value,
      this.autoScrollDeltaY,
      this.items.length,
      viewportHeight,
    );
    if (nextOffset == this.scrollBox.scrollState.offsetY.value) {
      this.stopAutoScroll();
      return;
    }
    this.scrollBox.scrollOffset(0.0, nextOffset);
    const visibleRange = this.readVisibleRange();
    const direction = this.autoScrollDeltaY < 0.0 ? -1 : 1;
    this.rawInsertionIndex = computeReorderEdgeInsertionIndex(direction, this.items.length, visibleRange);
    this.dragStatusMessage = "Reorder drag status: auto-scrolling " + (direction < 0 ? "up" : "down");
    this.syncAll();
    this.armAutoScrollTimer();
  }

  orderSummaryLabel(): string {
    let summary = "Reorder order: ";
    for (let index = 0; index < this.items.length; index += 1) {
      if (index > 0) {
        summary += " | ";
      }
      summary += unchecked(this.items[index]).label;
    }
    return summary;
  }

  private activeDragLabel(): string {
    const item = this.findItem(this.activeDragItemId);
    return item === null ? "item" : item.label;
  }

  private syncPreviewGhost(): void {
    const item = this.findItem(this.activeDragItemId);
    if (item === null || isNaN(this.previewPointerX) || isNaN(this.previewPointerY)) {
      this.previewGhost.visibility(Visibility.Hidden);
      this.previewGhost.opacity(0.0);
      return;
    }
    this.previewTitleText.text(item.label);
    this.previewDetailText.text(item.detail);
    this.previewEffectText.text(
      this.previewEffect == DragDropEffects.Move && this.previewInsertionSlot >= 0
        ? "Drop to move to slot " + (this.previewInsertionSlot + 1).toString()
        : "Release outside the list to cancel",
    );
    this.previewGhost.semanticLabel("Reorder drag preview for " + item.label);
    const sectionBounds = this.sectionRoot.getBounds();
    const sectionLeft = unchecked(sectionBounds[0]);
    const sectionTop = unchecked(sectionBounds[1]);
    const sectionWidth = unchecked(sectionBounds[2]) > 0.0
      ? unchecked(sectionBounds[2])
      : (viewportWidthSignal.value > 0.0 ? viewportWidthSignal.value : PREVIEW_WIDTH_PX + (PREVIEW_MARGIN_PX * 2.0));
    const sectionHeight = unchecked(sectionBounds[3]) > 0.0
      ? unchecked(sectionBounds[3])
      : (viewportHeightSignal.value > 0.0 ? viewportHeightSignal.value : PREVIEW_HEIGHT_PX + (PREVIEW_MARGIN_PX * 2.0));
    const pointerLocal = this.sectionRoot.absoluteToLocalPosition(this.previewPointerX, this.previewPointerY);
    const pointerLocalX = unchecked(pointerLocal[0]);
    const pointerLocalY = unchecked(pointerLocal[1]);
    const maxX = Math.max(PREVIEW_MARGIN_PX, sectionWidth - PREVIEW_WIDTH_PX - PREVIEW_MARGIN_PX);
    const maxY = Math.max(PREVIEW_MARGIN_PX, sectionHeight - PREVIEW_HEIGHT_PX - PREVIEW_MARGIN_PX);
    const previewX = <f32>Math.max(PREVIEW_MARGIN_PX, Math.min(maxX, pointerLocalX + PREVIEW_OFFSET_X_PX));
    const previewY = <f32>Math.max(PREVIEW_MARGIN_PX, Math.min(maxY, pointerLocalY + PREVIEW_OFFSET_Y_PX));
    this.previewGhost.position(previewX, previewY);
    this.previewGhost.visibility(Visibility.Normal);
    this.previewGhost.opacity(0.96);
  }

  private syncAll(): void {
    this.orderStatusText.text(this.orderSummaryLabel());
    this.dragStatusText.text(this.dragStatusMessage);
    this.syncViewportStatus();
    this.syncPreviewGhost();
    this.applyTheme(this.themeValue);
  }

  private syncViewportStatus(): void {
    const visibleRange = this.readVisibleRange();
    const firstVisible = visibleRange.lastVisibleIndex < 0 ? 0 : visibleRange.firstVisibleIndex + 1;
    const lastVisible = visibleRange.lastVisibleIndex < 0 ? 0 : visibleRange.lastVisibleIndex + 1;
    this.viewportStatusText.text(
      "Reorder viewport status: offset " + (<i32>this.scrollBox.scrollState.offsetY.value).toString() +
      " | visible " + firstVisible.toString() + "-" + lastVisible.toString(),
    );
  }

  private readVisibleRange(): ReorderVisibleRange {
    return computeReorderVisibleRange(this.items.length, this.scrollBox.scrollState.offsetY.value, this.readViewportHeight());
  }

  private readViewportHeight(): f32 {
    const current = this.scrollBox.scrollState.viewportHeight.value;
    return current > 0.0 ? current : REORDER_VIEWPORT_HEIGHT_PX;
  }

  private readDraggedItemId(args: DragEventArgs): string | null {
    return args.session.data.getFormat(REORDER_DRAG_FORMAT);
  }

  private findItem(itemId: string | null): ReorderDemoItem | null {
    if (itemId === null) {
      return null;
    }
    const index = findReorderItemIndex(this.items, itemId);
    return index < 0 ? null : unchecked(this.items[index]);
  }

  private setAutoScrollDelta(nextDeltaY: f32): void {
    let deltaDifference = this.autoScrollDeltaY - nextDeltaY;
    if (deltaDifference < 0.0) {
      deltaDifference = -deltaDifference;
    }
    if (deltaDifference <= 0.05) {
      if (nextDeltaY != 0.0) {
        this.armAutoScrollTimer();
      }
      return;
    }
    this.autoScrollDeltaY = nextDeltaY;
    if (nextDeltaY == 0.0) {
      cancelTimer(AUTOSCROLL_TIMER_ID);
      return;
    }
    this.armAutoScrollTimer();
  }

  private computePointerAutoScrollDelta(pointerY: f32): f32 {
    const bounds = this.scrollBox.viewport.getBounds();
    return computeReorderPointerAutoScrollDelta(pointerY, unchecked(bounds[1]), unchecked(bounds[3]));
  }

  private armAutoScrollTimer(): void {
    activeAutoScrollController = this;
    scheduleTimer(AUTOSCROLL_TIMER_ID, AUTOSCROLL_DELAY_MS, reorderAutoScrollTimer);
  }

  private stopAutoScroll(): void {
    this.autoScrollDeltaY = 0.0;
    cancelTimer(AUTOSCROLL_TIMER_ID);
  }

  private track(disposable: Disposable): void {
    this.disposables.push(disposable);
  }
}

function reorderEndDragOver(owner: ReorderDemoSection, args: DragEventArgs): DropProposal {
  return owner.handleEndDragOver(args);
}

function reorderEndDragLeave(owner: ReorderDemoSection, args: DragEventArgs): void {
  owner.handleTargetLeave(args);
}

function reorderEndDrop(owner: ReorderDemoSection, args: DragEventArgs): void {
  owner.dropAtPreview(args);
}
