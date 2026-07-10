import {
  acquireTextureAsset,
  AssetLoadState,
  getTextureAssetError,
  getTextureAssetHeight,
  getTextureAssetState,
  getTextureAssetUrl,
  getTextureAssetWidth,
  releaseTextureAsset,
} from "../core/Assets";
import { Action, HandlerAction } from "../core/Action";
import * as ui from "../bindings/ui";
import { NodeType, ObjectFit, SemanticRole, Unit } from "../core/ffi";
import { ImageSampling } from "../core/ImageSampling";
import { Signal } from "../core/Signal";
import { FlexBox, FlexBoxProps } from "./FlexBox";

export class Image extends FlexBox {
  private textureIdValue: u32;
  private sourceUrlValue: string = "";
  private objectFitValue: ObjectFit;
  private samplingValue: ImageSampling = ImageSampling.linear();
  private ownedTextureAssetId: u32 = 0;
  private hasNinePatch: bool = false;
  private insetLeft: f32 = 0.0;
  private insetTop: f32 = 0.0;
  private insetRight: f32 = 0.0;
  private insetBottom: f32 = 0.0;
  private requestedWidthValue: f32 = 0.0;
  private requestedWidthUnit: Unit = Unit.Auto;
  private hasRequestedWidth: bool = true;
  private requestedHeightValue: f32 = 0.0;
  private requestedHeightUnit: Unit = Unit.Auto;
  private hasRequestedHeight: bool = true;
  private assetStateAction: Action<AssetLoadState> | null = null;
  private trackedTextureAssetId: u32 = 0;

  constructor(textureId: u32 = 0, objectFit: ObjectFit = ObjectFit.Fill) {
    super();
    this.textureIdValue = textureId;
    this.objectFitValue = objectFit;
    this.attachAssetStateListener();
  }

  static from(props: FlexBoxProps, textureId: u32 = 0, objectFit: ObjectFit = ObjectFit.Fill): Image {
    const image = new Image(textureId, objectFit);
    return image.applyProps(props);
  }

  static load(url: string, objectFit: ObjectFit = ObjectFit.Fill): Image {
    return new Image(0, objectFit).source(url);
  }

  static fromUrl(props: FlexBoxProps, url: string, objectFit: ObjectFit = ObjectFit.Fill): Image {
    return Image.load(url, objectFit).applyProps(props);
  }

  texture(textureId: u32): this {
    this.releaseOwnedSourceAsset();
    this.sourceUrlValue = "";
    this.textureIdValue = textureId;
    this.attachAssetStateListener();
    this.applyResolvedSizing();
    if (this.hasBuiltHandle()) {
      this.applyImageSource();
      this.notifyRetainedMutation();
    }
    return this;
  }

  source(url: string): this {
    if (url.length == 0) {
      return this.clearSource();
    }
    if (this.ownedTextureAssetId != 0 && this.sourceUrlValue == url) {
      return this;
    }
    this.releaseOwnedSourceAsset();
    this.sourceUrlValue = url;
    this.textureIdValue = acquireTextureAsset(url);
    this.ownedTextureAssetId = this.textureIdValue;
    this.attachAssetStateListener();
    this.applyResolvedSizing();
    if (this.hasBuiltHandle()) {
      this.applyImageSource();
      this.notifyRetainedMutation();
    }
    return this;
  }

  clearSource(): this {
    this.releaseOwnedSourceAsset();
    this.sourceUrlValue = "";
    this.textureIdValue = 0;
    this.hasNinePatch = false;
    this.insetLeft = 0.0;
    this.insetTop = 0.0;
    this.insetRight = 0.0;
    this.insetBottom = 0.0;
    this.attachAssetStateListener();
    this.applyResolvedSizing();
    if (this.hasBuiltHandle()) {
      this.applyImageSource();
      this.notifyRetainedMutation();
    }
    return this;
  }

  objectFit(objectFit: ObjectFit): this {
    this.objectFitValue = objectFit;
    if (this.hasBuiltHandle()) {
      this.applyImageSource();
      this.notifyRetainedMutation();
    }
    return this;
  }

  sampling(sampling: ImageSampling): this {
    this.samplingValue = sampling;
    if (this.hasBuiltHandle()) {
      this.applyImageSource();
      this.notifyRetainedMutation();
    }
    return this;
  }

  altText(value: string): this {
    this.semanticRole(SemanticRole.Image);
    this.semanticLabel(value);
    return this;
  }

  imageNine(insetLeft: f32, insetTop: f32, insetRight: f32, insetBottom: f32): this {
    this.hasNinePatch = true;
    this.insetLeft = insetLeft;
    this.insetTop = insetTop;
    this.insetRight = insetRight;
    this.insetBottom = insetBottom;
    if (this.hasBuiltHandle()) {
      this.applyImageSource();
      this.notifyRetainedMutation();
    }
    return this;
  }

  clearImageNine(): this {
    this.hasNinePatch = false;
    this.insetLeft = 0.0;
    this.insetTop = 0.0;
    this.insetRight = 0.0;
    this.insetBottom = 0.0;
    if (this.hasBuiltHandle()) {
      this.applyImageSource();
      this.notifyRetainedMutation();
    }
    return this;
  }

  width(value: f32, unit: Unit = Unit.Pixel): this {
    this.requestedWidthValue = value;
    this.requestedWidthUnit = unit;
    this.hasRequestedWidth = true;
    this.applyResolvedSizing();
    return this;
  }

  height(value: f32, unit: Unit = Unit.Pixel): this {
    this.requestedHeightValue = value;
    this.requestedHeightUnit = unit;
    this.hasRequestedHeight = true;
    this.applyResolvedSizing();
    return this;
  }

  build(): u64 {
    this.buildStyledNode(NodeType.Image, false);
    this.applyResolvedSizing();
    this.applyImageSource();
    return this.handle;
  }

  dispose(): void {
    this.detachAssetStateListener();
    this.releaseOwnedSourceAsset();
    super.dispose();
  }

  assetStateSignal(): Signal<AssetLoadState> {
    return getTextureAssetState(this.textureIdValue);
  }

  assetState(): AssetLoadState {
    return this.assetStateSignal().value;
  }

  assetError(): string {
    return getTextureAssetError(this.textureIdValue);
  }

  assetUrl(): string {
    return this.sourceUrlValue.length > 0 ? this.sourceUrlValue : getTextureAssetUrl(this.textureIdValue);
  }

  assetWidth(): f32 {
    return getTextureAssetWidth(this.textureIdValue);
  }

  assetHeight(): f32 {
    return getTextureAssetHeight(this.textureIdValue);
  }

  private applyImageSource(): void {
    if (this.hasNinePatch) {
      ui.setImageNine(
        this.handle,
        this.textureIdValue,
        this.insetLeft,
        this.insetTop,
        this.insetRight,
        this.insetBottom,
        <u32>this.samplingValue.kind,
        this.samplingValue.maxAniso,
      );
      return;
    }
    ui.setImage(
      this.handle,
      this.textureIdValue,
      <u32>this.objectFitValue,
      <u32>this.samplingValue.kind,
      this.samplingValue.maxAniso,
    );
  }

  private applyResolvedSizing(): void {
    if (!this.hasRequestedWidth && !this.hasRequestedHeight) {
      return;
    }

    const assetWidth = this.assetWidth();
    const assetHeight = this.assetHeight();
    const hasIntrinsicSize = assetWidth > 0.0 && assetHeight > 0.0;

    if (this.hasRequestedWidth) {
      let resolvedWidthValue = this.requestedWidthValue;
      let resolvedWidthUnit = this.requestedWidthUnit;
      if (this.requestedWidthUnit == Unit.Auto && hasIntrinsicSize) {
        if (this.hasRequestedHeight && this.requestedHeightUnit == Unit.Pixel) {
          resolvedWidthValue = this.requestedHeightValue * (assetWidth / assetHeight);
        } else {
          resolvedWidthValue = assetWidth;
        }
        resolvedWidthUnit = Unit.Pixel;
      }
      super.width(resolvedWidthValue, resolvedWidthUnit);
    }

    if (this.hasRequestedHeight) {
      let resolvedHeightValue = this.requestedHeightValue;
      let resolvedHeightUnit = this.requestedHeightUnit;
      if (this.requestedHeightUnit == Unit.Auto && hasIntrinsicSize) {
        if (this.hasRequestedWidth && this.requestedWidthUnit == Unit.Pixel) {
          resolvedHeightValue = this.requestedWidthValue * (assetHeight / assetWidth);
        } else {
          resolvedHeightValue = assetHeight;
        }
        resolvedHeightUnit = Unit.Pixel;
      }
      super.height(resolvedHeightValue, resolvedHeightUnit);
    }
  }

  private attachAssetStateListener(): void {
    if (this.trackedTextureAssetId == this.textureIdValue) {
      return;
    }
    this.detachAssetStateListener();
    this.trackedTextureAssetId = this.textureIdValue;
    if (this.textureIdValue == 0) {
      return;
    }
    this.assetStateAction = getTextureAssetState(this.textureIdValue).addAction(
      new HandlerAction<Image, AssetLoadState>(this, (image: Image, _state: AssetLoadState): void => {
        image.applyResolvedSizing();
      }),
    );
  }

  private detachAssetStateListener(): void {
    if (this.assetStateAction !== null) {
      changetype<Action<AssetLoadState>>(this.assetStateAction).dispose();
      this.assetStateAction = null;
    }
    this.trackedTextureAssetId = 0;
  }

  private releaseOwnedSourceAsset(): void {
    if (this.ownedTextureAssetId == 0) {
      return;
    }
    releaseTextureAsset(this.ownedTextureAssetId);
    this.ownedTextureAssetId = 0;
  }
}
