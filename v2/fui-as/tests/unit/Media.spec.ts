import { AssetLoadState, Image, ImageSampling, ObjectFit, Svg, Unit, getTextureAssetError, getTextureAssetState, loadSvg, loadTexture } from "../../src/Fui";
import { __fui_on_svg_failed, __fui_on_svg_loaded, __fui_on_texture_failed, __fui_on_texture_loaded } from "../../src/core/Assets";
import {
  CALL_CREATE_NODE,
  CALL_SET_HEIGHT,
  CALL_LOAD_SVG,
  CALL_LOAD_TEXTURE,
  CALL_RELEASE_SVG,
  CALL_RELEASE_TEXTURE,
  CALL_SET_IMAGE,
  CALL_SET_IMAGE_NINE,
  CALL_SET_SEMANTIC_LABEL,
  CALL_SET_SEMANTIC_ROLE,
  CALL_SET_SVG,
  CALL_SET_WIDTH,
  getCallArg,
  getCallSequence,
  lastSvgUrlEquals,
  lastTextureUrlEquals,
  lastLogCategoryEquals,
  lastLogMessageEquals,
  resetCalls,
  setLogsEnabled,
} from "./FfiTestImports";
import { SemanticRole } from "../../src/core/ffi";

function findLastCall(op: i32): i32 {
  const sequence = getCallSequence();
  let index = -1;
  for (let i = 0; i < sequence.length; ++i) {
    if (unchecked(sequence[i]) == op) {
      index = i;
    }
  }
  return index;
}

describe("Media nodes", () => {
  it("image builds an image node and emits object-fit texture state", () => {
    resetCalls();

    const image = new Image(77, ObjectFit.Contain)
      .width(120.0, Unit.Pixel)
      .height(72.0, Unit.Pixel)
      .cornerRadius(14.0);
    const handle = image.build();

    const createIndex = findLastCall(CALL_CREATE_NODE);
    expect<i32>(createIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(createIndex, 0)).toBe(2.0);

    const imageIndex = findLastCall(CALL_SET_IMAGE);
    expect<i32>(imageIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(imageIndex, 0)).toBe(<f64>handle);
    expect<f64>(getCallArg(imageIndex, 1)).toBe(77.0);
    expect<f64>(getCallArg(imageIndex, 2)).toBe(<f64>ObjectFit.Contain);

    image.dispose();
  });

  it("image can switch to nine-patch registration after build", () => {
    resetCalls();

    const image = new Image(91, ObjectFit.Fill);
    const handle = image.build();
    resetCalls();

    image
      .sampling(ImageSampling.nearest())
      .imageNine(4.0, 6.0, 8.0, 10.0);

    const imageNineIndex = findLastCall(CALL_SET_IMAGE_NINE);
    expect<i32>(imageNineIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(imageNineIndex, 0)).toBe(<f64>handle);
    expect<f64>(getCallArg(imageNineIndex, 1)).toBe(91.0);
    expect<f64>(getCallArg(imageNineIndex, 2)).toBe(4.0);
    expect<f64>(getCallArg(imageNineIndex, 3)).toBe(6.0);
    expect<f64>(getCallArg(imageNineIndex, 4)).toBe(8.0);
    expect<f64>(getCallArg(imageNineIndex, 5)).toBe(10.0);
    expect<f64>(getCallArg(imageNineIndex, 6)).toBe(1.0);
    expect<f64>(getCallArg(imageNineIndex, 7)).toBe(0.0);

    image.dispose();
  });

  it("svg builds an svg node and emits tint state", () => {
    resetCalls();

    const svg = new Svg(13, 0xff3366ff)
      .width(96.0, Unit.Pixel)
      .height(96.0, Unit.Pixel);
    const handle = svg.build();

    const createIndex = findLastCall(CALL_CREATE_NODE);
    expect<i32>(createIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(createIndex, 0)).toBe(3.0);

    const svgIndex = findLastCall(CALL_SET_SVG);
    expect<i32>(svgIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(svgIndex, 0)).toBe(<f64>handle);
    expect<f64>(getCallArg(svgIndex, 1)).toBe(13.0);
    expect<f64>(getCallArg(svgIndex, 2)).toBe(<f64>0xff3366ff);

    svg.dispose();
  });

  it("svg can load from a url without exposing an explicit asset id", () => {
    resetCalls();

    const svg = Svg.load("/icons/url-backed.svg", 0xff2244ff)
      .width(96.0, Unit.Pixel)
      .height(96.0, Unit.Pixel);
    const handle = svg.build();

    const svgLoadIndex = findLastCall(CALL_LOAD_SVG);
    expect<i32>(svgLoadIndex).toBeGreaterThan(-1);
    expect<bool>(lastSvgUrlEquals("/icons/url-backed.svg")).toBe(true);

    const svgIndex = findLastCall(CALL_SET_SVG);
    expect<i32>(svgIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(svgIndex, 0)).toBe(<f64>handle);
    expect<f64>(getCallArg(svgIndex, 1)).toBeGreaterThan(0.0);
    expect<f64>(getCallArg(svgIndex, 2)).toBe(<f64>0xff2244ff);

    svg.dispose();
  });

  it("svg source swaps keep distinct asset ids per url", () => {
    resetCalls();

    const svg = Svg.load("/icons/dropdown-collapsed.svg");
    const handle = svg.build();
    let svgIndex = findLastCall(CALL_SET_SVG);
    expect<i32>(svgIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(svgIndex, 0)).toBe(<f64>handle);
    const collapsedId = <u32>getCallArg(svgIndex, 1);
    expect<u32>(collapsedId).toBeGreaterThan(0);

    resetCalls();
    svg.source("/icons/dropdown-expanded.svg");
    expect<i32>(findLastCall(CALL_LOAD_SVG)).toBeGreaterThan(-1);
    svgIndex = findLastCall(CALL_SET_SVG);
    expect<i32>(svgIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(svgIndex, 0)).toBe(<f64>handle);
    const expandedId = <u32>getCallArg(svgIndex, 1);
    expect<u32>(expandedId).toBeGreaterThan(0);
    expect<u32>(expandedId).not.toBe(collapsedId);

    resetCalls();
    svg.source("/icons/dropdown-collapsed.svg");
    expect<i32>(findLastCall(CALL_LOAD_SVG)).toBeGreaterThan(-1);
    svgIndex = findLastCall(CALL_SET_SVG);
    expect<i32>(svgIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(svgIndex, 0)).toBe(<f64>handle);
    const collapsedAgainId = <u32>getCallArg(svgIndex, 1);
    expect<u32>(collapsedAgainId).toBeGreaterThan(0);
    expect<u32>(collapsedAgainId).not.toBe(expandedId);

    resetCalls();
    svg.clearSource();
    let releaseIndex = findLastCall(CALL_RELEASE_SVG);
    expect<i32>(releaseIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(releaseIndex, 0)).toBe(<f64>collapsedAgainId);

    resetCalls();
    svg.source("/icons/dropdown-expanded.svg");
    svg.dispose();
    releaseIndex = findLastCall(CALL_RELEASE_SVG);
    expect<i32>(releaseIndex).toBeGreaterThan(-1);
  });

  it("image and svg altText promote media into image semantics", () => {
    resetCalls();

    const image = new Image(55, ObjectFit.Cover);
    const imageHandle = image.build();
    resetCalls();

    image.altText("Preview image");

    let roleIndex = findLastCall(CALL_SET_SEMANTIC_ROLE);
    expect<i32>(roleIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(roleIndex, 0)).toBe(<f64>imageHandle);
    expect<f64>(getCallArg(roleIndex, 1)).toBe(<f64>SemanticRole.Image);
    let labelIndex = findLastCall(CALL_SET_SEMANTIC_LABEL);
    expect<i32>(labelIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(labelIndex, 0)).toBe(<f64>imageHandle);

    const svg = new Svg(21);
    const svgHandle = svg.build();
    resetCalls();

    svg.altText("Preview icon");

    roleIndex = findLastCall(CALL_SET_SEMANTIC_ROLE);
    expect<i32>(roleIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(roleIndex, 0)).toBe(<f64>svgHandle);
    expect<f64>(getCallArg(roleIndex, 1)).toBe(<f64>SemanticRole.Image);
    labelIndex = findLastCall(CALL_SET_SEMANTIC_LABEL);
    expect<i32>(labelIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(labelIndex, 0)).toBe(<f64>svgHandle);

    image.dispose();
    svg.dispose();
  });

  it("asset helpers forward svg and texture loads through fui_host", () => {
    resetCalls();

    loadSvg(31, "/icons/retained.svg");
    loadTexture(32, "/images/retained.png");

    const svgLoadIndex = findLastCall(CALL_LOAD_SVG);
    expect<i32>(svgLoadIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(svgLoadIndex, 0)).toBe(31.0);
    expect<bool>(lastSvgUrlEquals("/icons/retained.svg")).toBe(true);

    const textureLoadIndex = findLastCall(CALL_LOAD_TEXTURE);
    expect<i32>(textureLoadIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(textureLoadIndex, 0)).toBe(32.0);
    expect<bool>(lastTextureUrlEquals("/images/retained.png")).toBe(true);
    expect<AssetLoadState>(getTextureAssetState(32).value).toBe(AssetLoadState.Loading);
  });

  it("image can load from a url without exposing an explicit asset id", () => {
    resetCalls();

    const image = Image.load("/images/url-backed.png", ObjectFit.Contain)
      .width(120.0, Unit.Pixel)
      .height(72.0, Unit.Pixel);
    const handle = image.build();

    const textureLoadIndex = findLastCall(CALL_LOAD_TEXTURE);
    expect<i32>(textureLoadIndex).toBeGreaterThan(-1);
    expect<bool>(lastTextureUrlEquals("/images/url-backed.png")).toBe(true);

    const imageIndex = findLastCall(CALL_SET_IMAGE);
    expect<i32>(imageIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(imageIndex, 0)).toBe(<f64>handle);
    expect<f64>(getCallArg(imageIndex, 1)).toBeGreaterThan(0.0);
    expect<f64>(getCallArg(imageIndex, 2)).toBe(<f64>ObjectFit.Contain);

    image.dispose();
  });

  it("image source swaps keep distinct texture ids per url", () => {
    resetCalls();

    const image = Image.load("/images/dropdown-collapsed.png", ObjectFit.Contain);
    const handle = image.build();
    let imageIndex = findLastCall(CALL_SET_IMAGE);
    expect<i32>(imageIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(imageIndex, 0)).toBe(<f64>handle);
    const collapsedId = <u32>getCallArg(imageIndex, 1);
    expect<u32>(collapsedId).toBeGreaterThan(0);

    resetCalls();
    image.source("/images/dropdown-expanded.png");
    expect<i32>(findLastCall(CALL_LOAD_TEXTURE)).toBeGreaterThan(-1);
    imageIndex = findLastCall(CALL_SET_IMAGE);
    expect<i32>(imageIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(imageIndex, 0)).toBe(<f64>handle);
    const expandedId = <u32>getCallArg(imageIndex, 1);
    expect<u32>(expandedId).toBeGreaterThan(0);
    expect<u32>(expandedId).not.toBe(collapsedId);

    resetCalls();
    image.source("/images/dropdown-collapsed.png");
    expect<i32>(findLastCall(CALL_LOAD_TEXTURE)).toBeGreaterThan(-1);
    imageIndex = findLastCall(CALL_SET_IMAGE);
    expect<i32>(imageIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(imageIndex, 0)).toBe(<f64>handle);
    const collapsedAgainId = <u32>getCallArg(imageIndex, 1);
    expect<u32>(collapsedAgainId).toBeGreaterThan(0);
    expect<u32>(collapsedAgainId).not.toBe(expandedId);

    resetCalls();
    image.clearSource();
    let releaseIndex = findLastCall(CALL_RELEASE_TEXTURE);
    expect<i32>(releaseIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(releaseIndex, 0)).toBe(<f64>collapsedAgainId);

    resetCalls();
    image.source("/images/dropdown-expanded.png");
    image.dispose();
    releaseIndex = findLastCall(CALL_RELEASE_TEXTURE);
    expect<i32>(releaseIndex).toBeGreaterThan(-1);
  });

  it("shared url-backed textures release only after the final owner is disposed", () => {
    resetCalls();

    const first = Image.load("/images/shared.png", ObjectFit.Contain);
    const second = Image.load("/images/shared.png", ObjectFit.Contain);
    first.build();
    second.build();

    const sharedLoadIndex = findLastCall(CALL_LOAD_TEXTURE);
    expect<i32>(sharedLoadIndex).toBeGreaterThan(-1);

    resetCalls();
    first.dispose();
    expect<i32>(findLastCall(CALL_RELEASE_TEXTURE)).toBe(-1);

    resetCalls();
    second.dispose();
    expect<i32>(findLastCall(CALL_RELEASE_TEXTURE)).toBeGreaterThan(-1);
  });

  it("asset load callbacks drive swap-in state without failing app startup", () => {
    resetCalls();
    setLogsEnabled(true);

    const image = new Image(48, ObjectFit.Cover);
    loadTexture(48, "/images/async.png");
    expect<AssetLoadState>(image.assetState()).toBe(AssetLoadState.Loading);
    expect<f32>(image.assetWidth()).toBe(0.0);
    expect<f32>(image.assetHeight()).toBe(0.0);

    __fui_on_texture_loaded(48, 96.0, 64.0);
    expect<AssetLoadState>(image.assetState()).toBe(AssetLoadState.Ready);
    expect<f32>(image.assetWidth()).toBe(96.0);
    expect<f32>(image.assetHeight()).toBe(64.0);

    loadTexture(48, "/images/broken.png");
    const errorBytes = Uint8Array.wrap(String.UTF8.encode("Texture decode failed", false));
    __fui_on_texture_failed(48, errorBytes.length > 0 ? errorBytes.dataStart : 0, <u32>errorBytes.length);
    expect<AssetLoadState>(image.assetState()).toBe(AssetLoadState.Failed);
    expect<bool>(getTextureAssetError(48) == "Texture decode failed").toBe(true);
    expect<bool>(lastLogCategoryEquals("Warning/Assets")).toBe(true);
    expect<bool>(lastLogMessageEquals('Texture load failed for "/images/broken.png": Texture decode failed')).toBe(true);
    expect<f32>(image.assetWidth()).toBe(0.0);
    expect<f32>(image.assetHeight()).toBe(0.0);

    loadSvg(19, "/icons/ready.svg");
    __fui_on_svg_loaded(19, 128.0, 112.0);
    const svg = new Svg(19);
    expect<AssetLoadState>(svg.assetState()).toBe(AssetLoadState.Ready);
    expect<f32>(svg.assetWidth()).toBe(128.0);
    expect<f32>(svg.assetHeight()).toBe(112.0);
  });

  it("image auto sizing resolves to intrinsic texture dimensions once the asset is ready", () => {
    resetCalls();

    const image = Image.load("/images/intrinsic.png", ObjectFit.Contain)
      .width(0.0, Unit.Auto)
      .height(0.0, Unit.Auto);
    const handle = image.build();

    let widthIndex = findLastCall(CALL_SET_WIDTH);
    expect<i32>(widthIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(widthIndex, 0)).toBe(<f64>handle);
    expect<f64>(getCallArg(widthIndex, 1)).toBe(0.0);
    expect<f64>(getCallArg(widthIndex, 2)).toBe(<f64>Unit.Auto);

    let heightIndex = findLastCall(CALL_SET_HEIGHT);
    expect<i32>(heightIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(heightIndex, 0)).toBe(<f64>handle);
    expect<f64>(getCallArg(heightIndex, 1)).toBe(0.0);
    expect<f64>(getCallArg(heightIndex, 2)).toBe(<f64>Unit.Auto);

    const imageIndex = findLastCall(CALL_SET_IMAGE);
    expect<i32>(imageIndex).toBeGreaterThan(-1);
    const textureId = <u32>getCallArg(imageIndex, 1);

    resetCalls();
    __fui_on_texture_loaded(textureId, 96.0, 64.0);

    widthIndex = findLastCall(CALL_SET_WIDTH);
    expect<i32>(widthIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(widthIndex, 0)).toBe(<f64>handle);
    expect<f64>(getCallArg(widthIndex, 1)).toBe(96.0);
    expect<f64>(getCallArg(widthIndex, 2)).toBe(<f64>Unit.Pixel);

    heightIndex = findLastCall(CALL_SET_HEIGHT);
    expect<i32>(heightIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(heightIndex, 0)).toBe(<f64>handle);
    expect<f64>(getCallArg(heightIndex, 1)).toBe(64.0);
    expect<f64>(getCallArg(heightIndex, 2)).toBe(<f64>Unit.Pixel);

    image.dispose();
  });

  it("svg auto sizing resolves to intrinsic dimensions once the asset is ready", () => {
    resetCalls();

    const svg = Svg.load("/icons/intrinsic.svg")
      .width(0.0, Unit.Auto)
      .height(0.0, Unit.Auto);
    const handle = svg.build();

    let widthIndex = findLastCall(CALL_SET_WIDTH);
    expect<i32>(widthIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(widthIndex, 0)).toBe(<f64>handle);
    expect<f64>(getCallArg(widthIndex, 1)).toBe(0.0);
    expect<f64>(getCallArg(widthIndex, 2)).toBe(<f64>Unit.Auto);

    let heightIndex = findLastCall(CALL_SET_HEIGHT);
    expect<i32>(heightIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(heightIndex, 0)).toBe(<f64>handle);
    expect<f64>(getCallArg(heightIndex, 1)).toBe(0.0);
    expect<f64>(getCallArg(heightIndex, 2)).toBe(<f64>Unit.Auto);

    const svgIndex = findLastCall(CALL_SET_SVG);
    expect<i32>(svgIndex).toBeGreaterThan(-1);
    const svgId = <u32>getCallArg(svgIndex, 1);

    resetCalls();
    __fui_on_svg_loaded(svgId, 48.0, 36.0);

    widthIndex = findLastCall(CALL_SET_WIDTH);
    expect<i32>(widthIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(widthIndex, 0)).toBe(<f64>handle);
    expect<f64>(getCallArg(widthIndex, 1)).toBe(48.0);
    expect<f64>(getCallArg(widthIndex, 2)).toBe(<f64>Unit.Pixel);

    heightIndex = findLastCall(CALL_SET_HEIGHT);
    expect<i32>(heightIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(heightIndex, 0)).toBe(<f64>handle);
    expect<f64>(getCallArg(heightIndex, 1)).toBe(36.0);
    expect<f64>(getCallArg(heightIndex, 2)).toBe(<f64>Unit.Pixel);

    svg.dispose();
  });

  it("image defaults unspecified size to intrinsic auto sizing", () => {
    resetCalls();

    const image = Image.load("/images/default-auto.png", ObjectFit.Contain);
    const handle = image.build();

    let widthIndex = findLastCall(CALL_SET_WIDTH);
    expect<i32>(widthIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(widthIndex, 0)).toBe(<f64>handle);
    expect<f64>(getCallArg(widthIndex, 1)).toBe(0.0);
    expect<f64>(getCallArg(widthIndex, 2)).toBe(<f64>Unit.Auto);

    let heightIndex = findLastCall(CALL_SET_HEIGHT);
    expect<i32>(heightIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(heightIndex, 0)).toBe(<f64>handle);
    expect<f64>(getCallArg(heightIndex, 1)).toBe(0.0);
    expect<f64>(getCallArg(heightIndex, 2)).toBe(<f64>Unit.Auto);

    const imageIndex = findLastCall(CALL_SET_IMAGE);
    expect<i32>(imageIndex).toBeGreaterThan(-1);
    const textureId = <u32>getCallArg(imageIndex, 1);

    resetCalls();
    __fui_on_texture_loaded(textureId, 80.0, 50.0);

    widthIndex = findLastCall(CALL_SET_WIDTH);
    expect<i32>(widthIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(widthIndex, 1)).toBe(80.0);
    expect<f64>(getCallArg(widthIndex, 2)).toBe(<f64>Unit.Pixel);

    heightIndex = findLastCall(CALL_SET_HEIGHT);
    expect<i32>(heightIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(heightIndex, 1)).toBe(50.0);
    expect<f64>(getCallArg(heightIndex, 2)).toBe(<f64>Unit.Pixel);

    image.dispose();
  });

  it("svg defaults unspecified size to intrinsic auto sizing", () => {
    resetCalls();

    const svg = Svg.load("/icons/default-auto.svg");
    const handle = svg.build();

    let widthIndex = findLastCall(CALL_SET_WIDTH);
    expect<i32>(widthIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(widthIndex, 0)).toBe(<f64>handle);
    expect<f64>(getCallArg(widthIndex, 1)).toBe(0.0);
    expect<f64>(getCallArg(widthIndex, 2)).toBe(<f64>Unit.Auto);

    let heightIndex = findLastCall(CALL_SET_HEIGHT);
    expect<i32>(heightIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(heightIndex, 0)).toBe(<f64>handle);
    expect<f64>(getCallArg(heightIndex, 1)).toBe(0.0);
    expect<f64>(getCallArg(heightIndex, 2)).toBe(<f64>Unit.Auto);

    const svgIndex = findLastCall(CALL_SET_SVG);
    expect<i32>(svgIndex).toBeGreaterThan(-1);
    const svgId = <u32>getCallArg(svgIndex, 1);

    resetCalls();
    __fui_on_svg_loaded(svgId, 72.0, 54.0);

    widthIndex = findLastCall(CALL_SET_WIDTH);
    expect<i32>(widthIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(widthIndex, 1)).toBe(72.0);
    expect<f64>(getCallArg(widthIndex, 2)).toBe(<f64>Unit.Pixel);

    heightIndex = findLastCall(CALL_SET_HEIGHT);
    expect<i32>(heightIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(heightIndex, 1)).toBe(54.0);
    expect<f64>(getCallArg(heightIndex, 2)).toBe(<f64>Unit.Pixel);

    svg.dispose();
  });

  it("asset failure callbacks remain non-fatal even with empty host errors", () => {
    resetCalls();
    setLogsEnabled(true);

    const image = Image.load("/images/missing.png", ObjectFit.Cover);
    image.build();
    const imageIndex = findLastCall(CALL_SET_IMAGE);
    expect<i32>(imageIndex).toBeGreaterThan(-1);
    const textureId = <u32>getCallArg(imageIndex, 1);
    expect<u32>(textureId).toBeGreaterThan(0);
    __fui_on_texture_failed(textureId, 0, 0);
    expect<AssetLoadState>(image.assetState()).toBe(AssetLoadState.Failed);
    expect<bool>(lastLogCategoryEquals("Warning/Assets")).toBe(true);
    expect<bool>(lastLogMessageEquals('Texture load failed for "/images/missing.png": unknown error')).toBe(true);

    const svg = Svg.load("/icons/missing.svg");
    svg.build();
    const svgIndex = findLastCall(CALL_SET_SVG);
    expect<i32>(svgIndex).toBeGreaterThan(-1);
    const svgId = <u32>getCallArg(svgIndex, 1);
    expect<u32>(svgId).toBeGreaterThan(0);
    __fui_on_svg_failed(svgId, 0, 0);
    expect<AssetLoadState>(svg.assetState()).toBe(AssetLoadState.Failed);
    expect<bool>(lastLogCategoryEquals("Warning/Assets")).toBe(true);
    expect<bool>(lastLogMessageEquals('SVG load failed for "/icons/missing.svg": unknown error')).toBe(true);
  });
});
