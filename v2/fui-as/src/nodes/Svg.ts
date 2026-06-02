import {
  acquireSvgAsset,
  AssetLoadState,
  getSvgAssetError,
  getSvgAssetHeight,
  getSvgAssetState,
  getSvgAssetUrl,
  getSvgAssetWidth,
  releaseSvgAsset,
} from "../core/Assets";
import { Action, HandlerAction } from "../core/Action";
import * as ui from "../bindings/ui";
import { HandleValue, NodeType, SemanticRole, Unit } from "../core/ffi";
import { Signal } from "../core/Signal";
import { FlexBox, FlexBoxProps } from "./FlexBox";

export class Svg extends FlexBox {
  private svgIdValue: u32;
  private sourceUrlValue: string = "";
  private tintColorValue: u32 = 0;
  private ownedSvgAssetId: u32 = 0;
  private requestedWidthValue: f32 = 0.0;
  private requestedWidthUnit: Unit = Unit.Auto;
  private hasRequestedWidth: bool = true;
  private requestedHeightValue: f32 = 0.0;
  private requestedHeightUnit: Unit = Unit.Auto;
  private hasRequestedHeight: bool = true;
  private assetStateAction: Action<AssetLoadState> | null = null;
  private trackedSvgAssetId: u32 = 0;

  constructor(svgId: u32 = 0, tintColor: u32 = 0) {
    super();
    this.svgIdValue = svgId;
    this.tintColorValue = tintColor;
    this.attachAssetStateListener();
  }

  static from(props: FlexBoxProps, svgId: u32 = 0, tintColor: u32 = 0): Svg {
    const svg = new Svg(svgId, tintColor);
    return svg.applyProps(props);
  }

  static load(url: string, tintColor: u32 = 0): Svg {
    return new Svg(0, tintColor).source(url);
  }

  static fromUrl(props: FlexBoxProps, url: string, tintColor: u32 = 0): Svg {
    return Svg.load(url, tintColor).applyProps(props);
  }

  svg(svgId: u32): this {
    this.releaseOwnedSourceAsset();
    this.sourceUrlValue = "";
    this.svgIdValue = svgId;
    this.attachAssetStateListener();
    this.applyResolvedSizing();
    if (this.hasBuiltHandle()) {
      this.applySvgSource();
      this.notifyRetainedMutation();
    }
    return this;
  }

  source(url: string): this {
    if (url.length == 0) {
      return this.clearSource();
    }
    if (this.ownedSvgAssetId != 0 && this.sourceUrlValue == url) {
      return this;
    }
    this.releaseOwnedSourceAsset();
    this.sourceUrlValue = url;
    this.svgIdValue = acquireSvgAsset(url);
    this.ownedSvgAssetId = this.svgIdValue;
    this.attachAssetStateListener();
    this.applyResolvedSizing();
    if (this.hasBuiltHandle()) {
      this.applySvgSource();
      this.notifyRetainedMutation();
    }
    return this;
  }

  clearSource(): this {
    this.releaseOwnedSourceAsset();
    this.sourceUrlValue = "";
    this.svgIdValue = 0;
    this.attachAssetStateListener();
    this.applyResolvedSizing();
    if (this.hasBuiltHandle()) {
      this.applySvgSource();
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

  tint(color: u32): this {
    this.tintColorValue = color;
    if (this.hasBuiltHandle()) {
      this.applySvgSource();
      this.notifyRetainedMutation();
    }
    return this;
  }

  altText(value: string): this {
    this.semanticRole(SemanticRole.Image);
    this.semanticLabel(value);
    return this;
  }

  build(): u64 {
    this.buildStyledNode(NodeType.Svg, false);
    this.applyResolvedSizing();
    this.applySvgSource();
    return this.handle;
  }

  dispose(): void {
    this.detachAssetStateListener();
    this.releaseOwnedSourceAsset();
    super.dispose();
  }

  assetStateSignal(): Signal<AssetLoadState> {
    return getSvgAssetState(this.svgIdValue);
  }

  assetState(): AssetLoadState {
    return this.assetStateSignal().value;
  }

  assetError(): string {
    return getSvgAssetError(this.svgIdValue);
  }

  assetUrl(): string {
    return this.sourceUrlValue.length > 0 ? this.sourceUrlValue : getSvgAssetUrl(this.svgIdValue);
  }

  assetWidth(): f32 {
    return getSvgAssetWidth(this.svgIdValue);
  }

  assetHeight(): f32 {
    return getSvgAssetHeight(this.svgIdValue);
  }

  private applySvgSource(): void {
    ui.setSvg(this.handle, this.svgIdValue, this.tintColorValue);
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
    if (this.trackedSvgAssetId == this.svgIdValue) {
      return;
    }
    this.detachAssetStateListener();
    this.trackedSvgAssetId = this.svgIdValue;
    if (this.svgIdValue == 0) {
      return;
    }
    this.assetStateAction = getSvgAssetState(this.svgIdValue).addAction(
      new HandlerAction<Svg, AssetLoadState>(this, (svg: Svg, _state: AssetLoadState): void => {
        svg.applyResolvedSizing();
      }),
    );
  }

  private detachAssetStateListener(): void {
    if (this.assetStateAction !== null) {
      changetype<Action<AssetLoadState>>(this.assetStateAction).dispose();
      this.assetStateAction = null;
    }
    this.trackedSvgAssetId = 0;
  }

  private releaseOwnedSourceAsset(): void {
    if (this.ownedSvgAssetId == 0) {
      return;
    }
    releaseSvgAsset(this.ownedSvgAssetId);
    this.ownedSvgAssetId = 0;
  }
}
