import {
  ClickEventArgs,
  Button,
  BrowserFile,
  Column,
  DragDropEffects,
  DropProposal,
  ExternalDropEventArgs,
  ExternalDropItemInfo,
  ExternalDropItemKind,
  FileErrorEventArgs,
  File,
  FileWorkerProcessProgress,
  FileWorkerProcessRequest,
  FileWorkerProcessResult,
  FlexBox,
  SemanticRole,
  Text,
  Theme,
  Unit,
  activeTheme,
} from "../../../../../src/Fui";

import {
  DemoText,
  DemoTextRecipe,
  RoutePageSection,
  createRoutePageSection,
  demoCardBackground,
  demoCardBackgroundAlt,
  demoDividerColor,
  demoMutedText,
  demoPrimaryText,
} from "../../../design-system";


function verticalSpacer(height: f32): FlexBox {
  return new FlexBox().fillWidth().height(height, Unit.Pixel);
}

function externalDropEnter(owner: ExternalDropDemoSection, args: ExternalDropEventArgs): DropProposal {
  return owner.handleExternalDrag(args);
}

function externalDropOver(owner: ExternalDropDemoSection, args: ExternalDropEventArgs): DropProposal {
  return owner.handleExternalDrag(args);
}

function externalDropLeave(owner: ExternalDropDemoSection, args: ExternalDropEventArgs): void {
  owner.handleExternalLeave(args);
}

function externalDropDrop(owner: ExternalDropDemoSection, args: ExternalDropEventArgs): void {
  owner.handleExternalDrop(args);
}

function startDroppedFileCopy(owner: ExternalDropDemoSection, _event: ClickEventArgs): void {
  owner.startDroppedFileCopy();
}

function handleCopyProgress(owner: ExternalDropDemoSection, progress: FileWorkerProcessProgress): void {
  owner.handleCopyProgress(progress);
}

function handleCopyComplete(owner: ExternalDropDemoSection, result: FileWorkerProcessResult): void {
  owner.handleCopyComplete(result);
}

function handleCopyError(owner: ExternalDropDemoSection, event: FileErrorEventArgs): void {
  owner.handleCopyError(event.message);
}

export class ExternalDropDemoSection {
  readonly statusText: Text = new DemoText("", DemoTextRecipe.StatusValue)
    .fontSize(15.0) as Text;
  readonly itemsText: Text = new DemoText("", DemoTextRecipe.StatusSupporting)
    .fontSize(15.0)
    .maxLines(4) as Text;
  readonly capabilityText: Text = new DemoText("", DemoTextRecipe.StatusSupporting)
    .fontSize(14.0)
    .maxLines(3) as Text;
  readonly hintText: Text = new DemoText(
    "Drop a file here, then choose Save dropped file copy. This demo keeps the save picker on the main thread, reads the dropped file in a dedicated Worker, and transfers each ArrayBuffer chunk back with a postMessage transfer list before writing it into the picked target file.",
    DemoTextRecipe.Hint,
  )
    .fontSize(15.0)
    .maxLines(6) as Text;
  readonly copyButton: Button = new Button("Save dropped file copy")
    .onClickWith<ExternalDropDemoSection>(this, startDroppedFileCopy)
    .fillWidth()
    .height(48.0, Unit.Pixel)
    .padding(14.0, 14.0, 14.0, 14.0)
    .cornerRadius(16.0)
    as Button;

  readonly dropTarget: FlexBox = new FlexBox()
    .fillWidth()
    .height(156.0, Unit.Pixel)
    .padding(18.0, 18.0, 18.0, 18.0)
    .cornerRadius(20.0)
    .allowExternalDrop(true)
    .onExternalDragEnterWith<ExternalDropDemoSection>(this, externalDropEnter)
    .onExternalDragOverWith<ExternalDropDemoSection>(this, externalDropOver)
    .onExternalDragLeaveWith<ExternalDropDemoSection>(this, externalDropLeave)
    .onExternalDropWith<ExternalDropDemoSection>(this, externalDropDrop)
    .semanticRole(SemanticRole.Form)
    .semanticLabel("External file drop target") as FlexBox;

  private readonly dropTitleText: Text = new DemoText("Drop files here", DemoTextRecipe.SectionTitle)
    .fontSize(18.0) as Text;
  private readonly dropBodyText: Text = new DemoText(
    "The drop target receives a first-class BrowserFile handle, then the sample copies it through a Worker-read plus picker-write pipeline. Chunk payloads hop back with zero-copy transfer-list handoff.",
    DemoTextRecipe.Supporting,
  )
    .fontSize(15.0)
    .maxLines(3) as Text;
  private readonly sectionBody!: FlexBox;
  private readonly lastItems: Array<ExternalDropItemInfo> = new Array<ExternalDropItemInfo>();
  private themeValue: Theme = activeTheme.value;
  private hoveringAccepted: bool = false;
  private ignoreNextLeave: bool = false;
  private droppedFile: BrowserFile | null = null;
  private activeCopyRequest: FileWorkerProcessRequest | null = null;
  private statusLabelValue: string = "";
  private itemsLabelValue: string = "";

  constructor() {
    this.dropTarget.child(
      Column(
        this.dropTitleText,
        verticalSpacer(8.0),
        this.dropBodyText,
      ).fillWidth(),
    );
    this.sectionBody = Column(
      this.dropTarget,
      verticalSpacer(14.0),
      this.statusText,
      verticalSpacer(6.0),
      this.itemsText,
      verticalSpacer(8.0),
      this.copyButton,
      verticalSpacer(8.0),
      this.capabilityText,
      verticalSpacer(10.0),
      this.hintText,
    ).fillWidth();
    this.syncStatus("External drop status: idle");
    this.itemsText.text("External drop items: none");
    this.syncCapabilities();
    this.applyTheme(this.themeValue);
  }

  buildSection(): RoutePageSection {
    return createRoutePageSection(
      "External file drop",
      "Drop a browser file onto a retained target, keep the in-app DragSession model separate, and then copy the dropped BrowserFile into a picked target file with worker-side chunk reads, transfer-list handoff, and main-thread picker-owned writes.",
      this.sectionBody,
    );
  }

  get statusLabel(): string {
    return this.statusLabelValue;
  }

  get itemsLabel(): string {
    return this.itemsLabelValue;
  }

  applyTheme(theme: Theme): void {
    this.themeValue = theme;
    this.dropTarget
      .bgColor(this.hoveringAccepted ? theme.colors.accentHovered : demoCardBackgroundAlt(theme))
      .border(1.0, this.hoveringAccepted ? theme.colors.accent : demoDividerColor(theme));
    const canCopy = this.canCopyDroppedFile();
    this.copyButton
      .bgColor(canCopy ? demoCardBackgroundAlt(theme) : demoCardBackground(theme))
      .border(1.0, demoDividerColor(theme));
    this.dropTitleText.textColor(this.hoveringAccepted ? theme.colors.surface : demoPrimaryText(theme));
    this.dropBodyText.textColor(this.hoveringAccepted ? theme.colors.surface : demoMutedText(theme));
    this.copyButton.textColor(canCopy ? demoPrimaryText(theme) : demoMutedText(theme));
    this.statusText.textColor(demoPrimaryText(theme));
    this.itemsText.textColor(demoMutedText(theme));
    this.capabilityText.textColor(demoMutedText(theme));
  }

  handleExternalDrag(args: ExternalDropEventArgs): DropProposal {
    this.ignoreNextLeave = false;
    this.replaceItems(args.items);
    const itemCount = args.items.length;
    if (itemCount == 0) {
      this.hoveringAccepted = false;
      this.syncStatus("External drop status: ignoring non-file drag");
      this.applyTheme(this.themeValue);
      return DropProposal.none();
    }
    this.hoveringAccepted = true;
    this.syncStatus("External drop status: hovering " + this.describeItemCount(itemCount) + " • effect Copy");
    this.applyTheme(this.themeValue);
    return new DropProposal(DragDropEffects.Copy, false);
  }

  handleExternalLeave(_args: ExternalDropEventArgs): void {
    if (this.ignoreNextLeave) {
      this.ignoreNextLeave = false;
      return;
    }
    this.hoveringAccepted = false;
    this.syncStatus(this.lastItems.length > 0
      ? "External drop status: ready for another drop"
      : "External drop status: idle");
    this.applyTheme(this.themeValue);
  }

  handleExternalDrop(args: ExternalDropEventArgs): void {
    this.hoveringAccepted = false;
    this.ignoreNextLeave = true;
    this.replaceItems(args.items);
    this.droppedFile = this.resolveDroppedFile(args.items);
    this.syncStatus("External drop status: dropped " + this.describeItemCount(args.items.length) + " • effect Copy");
    this.applyTheme(this.themeValue);
  }

  startDroppedFileCopy(): void {
    const file = this.droppedFile;
    if (file === null) {
      this.syncStatus("External drop status: drop a file first");
      return;
    }
    if (this.activeCopyRequest !== null) {
      this.syncStatus("External drop status: worker copy already running");
      return;
    }
    const capabilities = File.capabilities();
    if (!capabilities.canProcessInWorkerToPickedFile) {
      this.syncStatus("External drop status: this browser needs worker plus native save-picker support for the worker copy demo");
      return;
    }
    const suggestedName = this.resolveCopyFileName(file);
    this.activeCopyRequest = File.processFileInWorker(file)
      .worker("./workers/advanced_controls_workers.wasm", "fileProcessorWorker")
      .saveToPickedFile(suggestedName)
      .onProgressWith<ExternalDropDemoSection>(this, handleCopyProgress)
      .onCompleteWith<ExternalDropDemoSection>(this, handleCopyComplete)
      .onErrorWith<ExternalDropDemoSection>(this, handleCopyError)
      .start();
    this.syncStatus(
      "External drop status: starting worker copy for " +
      file.name +
      " with transfer-list chunk handoff to " +
      suggestedName,
    );
    this.applyTheme(this.themeValue);
  }

  private replaceItems(items: Array<ExternalDropItemInfo>): void {
    this.lastItems.length = 0;
    for (let index = 0; index < items.length; index += 1) {
      this.lastItems.push(unchecked(items[index]));
    }
    this.itemsLabelValue = "External drop items: " + this.describeItems();
    this.itemsText.text(this.itemsLabelValue);
  }

  private syncStatus(text: string): void {
    this.statusLabelValue = text;
    this.statusText.text(text);
  }

  private syncCapabilities(): void {
    const capabilities = File.capabilities();
    this.capabilityText.text(
      "File bridge capabilities: open=" + (capabilities.canPickOpen ? "yes" : "no") +
      " • chunk-read=" + (capabilities.canReadChunks ? "yes" : "no") +
      " • save=" + (capabilities.canSave ? "yes" : "no") +
      " • native-save-picker=" + (capabilities.canUseNativeSavePicker ? "yes" : "no") +
      " • worker-process-save=" + (capabilities.canProcessInWorkerToPickedFile ? "yes" : "no"),
    );
  }

  private handleCopyProgress(progress: FileWorkerProcessProgress): void {
    const outputFileName = progress.outputFileName;
    this.syncStatus(
      "External drop status: worker copying " +
      progress.processedBytes.toString() +
      " / " +
      progress.totalBytes.toString() +
      " bytes to " +
      (outputFileName === null ? "(stream)" : changetype<string>(outputFileName)) +
      "...",
    );
  }

  private handleCopyComplete(result: FileWorkerProcessResult): void {
    this.activeCopyRequest = null;
    const outputFileName = result.outputFileName;
    let hashDisplay = "";
    if (result.workerResult !== null) {
      hashDisplay = " — hash: " + changetype<string>(result.workerResult);
    }
    this.syncStatus(
      "External drop status: worker copied " +
      result.processedBytes.toString() +
      " bytes to " +
      (outputFileName === null ? "(stream)" : changetype<string>(outputFileName)) +
      "." + hashDisplay,
    );
    this.applyTheme(this.themeValue);
  }

  private handleCopyError(message: string): void {
    this.activeCopyRequest = null;
    this.syncStatus("External drop status: worker copy failed • " + message);
    this.applyTheme(this.themeValue);
  }

  private resolveDroppedFile(items: Array<ExternalDropItemInfo>): BrowserFile | null {
    for (let index = 0; index < items.length; index += 1) {
      const file = unchecked(items[index]).file;
      if (file !== null) {
        return file;
      }
    }
    return null;
  }

  private resolveCopyFileName(file: BrowserFile): string {
    const name = file.name;
    const dot = name.lastIndexOf(".");
    if (dot > 0) {
      return name.substring(0, dot) + "-copy" + name.substring(dot);
    }
    return name + "-copy";
  }

  private canCopyDroppedFile(): bool {
    return this.droppedFile !== null && this.activeCopyRequest === null && File.capabilities().canProcessInWorkerToPickedFile;
  }

  private describeItems(): string {
    if (this.lastItems.length == 0) {
      return "none";
    }
    let summary = "";
    for (let index = 0; index < this.lastItems.length; index += 1) {
      const item = unchecked(this.lastItems[index]);
      if (index > 0) {
        summary += " | ";
      }
      summary += this.describeItem(item);
    }
    return summary;
  }

  private describeItem(item: ExternalDropItemInfo): string {
    const kindLabel = item.kind == ExternalDropItemKind.File ? "file" : "item";
    const mimeType = item.mimeType;
    const mimeLabel = mimeType === null || mimeType.length == 0 ? "unknown" : mimeType;
    return item.name + " (" + kindLabel + ", " + mimeLabel + ", " + (<i32>item.sizeBytes).toString() + " bytes)";
  }

  private describeItemCount(count: i32): string {
    return count.toString() + (count == 1 ? " file" : " files");
  }

  dispose(): void {
    const activeCopyRequest = this.activeCopyRequest;
    if (activeCopyRequest !== null) {
      activeCopyRequest.dispose();
      this.activeCopyRequest = null;
    }
  }
}
