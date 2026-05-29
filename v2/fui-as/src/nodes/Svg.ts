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
import * as ui from "../bindings/ui";
import { HandleValue, NodeType, SemanticRole } from "../core/ffi";
import { Signal } from "../core/Signal";
import { FlexBox, FlexBoxProps } from "./FlexBox";

export class Svg extends FlexBox {
  private svgIdValue: u32;
  private sourceUrlValue: string = "";
  private tintColorValue: u32 = 0;
  private ownedSvgAssetId: u32 = 0;

  constructor(svgId: u32 = 0, tintColor: u32 = 0) {
    super();
    this.svgIdValue = svgId;
    this.tintColorValue = tintColor;
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
    if (this.hasBuiltHandle()) {
      this.applySvgSource();
      this.notifyRetainedMutation();
    }
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
    this.applySvgSource();
    return this.handle;
  }

  dispose(): void {
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

  private releaseOwnedSourceAsset(): void {
    if (this.ownedSvgAssetId == 0) {
      return;
    }
    releaseSvgAsset(this.ownedSvgAssetId);
    this.ownedSvgAssetId = 0;
  }
}
