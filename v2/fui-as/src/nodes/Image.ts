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
import * as ui from "../bindings/ui";
import { HandleValue, NodeType, ObjectFit, SemanticRole } from "../core/ffi";
import { Signal } from "../core/Signal";
import { FlexBox, FlexBoxProps } from "./FlexBox";

export class Image extends FlexBox {
  private textureIdValue: u32;
  private sourceUrlValue: string = "";
  private objectFitValue: ObjectFit;
  private ownedTextureAssetId: u32 = 0;
  private hasNinePatch: bool = false;
  private insetLeft: f32 = 0.0;
  private insetTop: f32 = 0.0;
  private insetRight: f32 = 0.0;
  private insetBottom: f32 = 0.0;

  constructor(textureId: u32 = 0, objectFit: ObjectFit = ObjectFit.Fill) {
    super();
    this.textureIdValue = textureId;
    this.objectFitValue = objectFit;
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

  build(): u64 {
    this.buildStyledNode(NodeType.Image, false);
    this.applyImageSource();
    return this.handle;
  }

  dispose(): void {
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
      );
      return;
    }
    ui.setImage(this.handle, this.textureIdValue, <u32>this.objectFitValue);
  }

  private releaseOwnedSourceAsset(): void {
    if (this.ownedTextureAssetId == 0) {
      return;
    }
    releaseTextureAsset(this.ownedTextureAssetId);
    this.ownedTextureAssetId = 0;
  }
}
