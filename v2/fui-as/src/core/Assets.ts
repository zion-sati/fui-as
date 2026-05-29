import * as ui from "../bindings/ui";
import { allocateDynamicSvgId, allocateDynamicTextureId } from "./DynamicAssetIds";
import { Signal } from "./Signal";
import { warn } from "./Logger";

export enum AssetLoadState {
  Idle = 0,
  Loading = 1,
  Ready = 2,
  Failed = 3,
}

class AssetRecord {
  readonly state: Signal<AssetLoadState> = new Signal<AssetLoadState>(AssetLoadState.Idle);
  error: string = "";
  width: f32 = 0.0;
  height: f32 = 0.0;
  url: string = "";
}

const svgAssets = new Map<u32, AssetRecord>();
const textureAssets = new Map<u32, AssetRecord>();
const svgIdsByUrl = new Map<string, u32>();
const textureIdsByUrl = new Map<string, u32>();
const svgRefCounts = new Map<u32, i32>();
const textureRefCounts = new Map<u32, i32>();
const pinnedSvgIds = new Set<u32>();
const pinnedTextureIds = new Set<u32>();

function getAssetRecord(records: Map<u32, AssetRecord>, assetId: u32): AssetRecord {
  if (!records.has(assetId)) {
    records.set(assetId, new AssetRecord());
  }
  return unchecked(records.get(assetId));
}

function beginLoad(record: AssetRecord): void {
  record.error = "";
  record.width = 0.0;
  record.height = 0.0;
  record.state.value = AssetLoadState.Loading;
}

function markLoaded(record: AssetRecord, width: f32, height: f32): void {
  record.error = "";
  record.width = width;
  record.height = height;
  record.state.value = AssetLoadState.Ready;
}

function markFailed(record: AssetRecord, error: string): void {
  record.error = error;
  record.width = 0.0;
  record.height = 0.0;
  record.state.value = AssetLoadState.Failed;
}

function incrementRefCount(refCounts: Map<u32, i32>, assetId: u32): void {
  const nextCount = (refCounts.has(assetId) ? unchecked(refCounts.get(assetId)) : 0) + 1;
  refCounts.set(assetId, nextCount);
}

function decrementRefCount(refCounts: Map<u32, i32>, assetId: u32): i32 {
  if (!refCounts.has(assetId)) {
    return -1;
  }
  const nextCount = unchecked(refCounts.get(assetId)) - 1;
  if (nextCount <= 0) {
    refCounts.delete(assetId);
    return 0;
  }
  refCounts.set(assetId, nextCount);
  return nextCount;
}

function removeUrlBinding(urlToId: Map<string, u32>, url: string, assetId: u32): void {
  if (url.length == 0 || !urlToId.has(url)) {
    return;
  }
  if (unchecked(urlToId.get(url)) != assetId) {
    return;
  }
  urlToId.delete(url);
}

export function getSvgAssetState(svgId: u32): Signal<AssetLoadState> {
  return getAssetRecord(svgAssets, svgId).state;
}

export function getTextureAssetState(textureId: u32): Signal<AssetLoadState> {
  return getAssetRecord(textureAssets, textureId).state;
}

export function getSvgAssetError(svgId: u32): string {
  return getAssetRecord(svgAssets, svgId).error;
}

export function getSvgAssetUrl(svgId: u32): string {
  return getAssetRecord(svgAssets, svgId).url;
}

export function getSvgAssetWidth(svgId: u32): f32 {
  return getAssetRecord(svgAssets, svgId).width;
}

export function getSvgAssetHeight(svgId: u32): f32 {
  return getAssetRecord(svgAssets, svgId).height;
}

export function getTextureAssetError(textureId: u32): string {
  return getAssetRecord(textureAssets, textureId).error;
}

export function getTextureAssetUrl(textureId: u32): string {
  return getAssetRecord(textureAssets, textureId).url;
}

export function getTextureAssetWidth(textureId: u32): f32 {
  return getAssetRecord(textureAssets, textureId).width;
}

export function getTextureAssetHeight(textureId: u32): f32 {
  return getAssetRecord(textureAssets, textureId).height;
}

function loadSvgInternal(svgId: u32, url: string, pinned: bool): void {
  const record = getAssetRecord(svgAssets, svgId);
  if (record.url.length > 0 && record.url != url) {
    removeUrlBinding(svgIdsByUrl, record.url, svgId);
  }
  svgIdsByUrl.set(url, svgId);
  if (pinned) {
    pinnedSvgIds.add(svgId);
  } else {
    pinnedSvgIds.delete(svgId);
  }
  record.url = url;
  beginLoad(record);
  ui.loadSvg(svgId, url);
}

function loadTextureInternal(textureId: u32, url: string, pinned: bool): void {
  const record = getAssetRecord(textureAssets, textureId);
  if (record.url.length > 0 && record.url != url) {
    removeUrlBinding(textureIdsByUrl, record.url, textureId);
  }
  textureIdsByUrl.set(url, textureId);
  if (pinned) {
    pinnedTextureIds.add(textureId);
  } else {
    pinnedTextureIds.delete(textureId);
  }
  record.url = url;
  beginLoad(record);
  ui.loadTexture(textureId, url);
}

export function loadSvg(svgId: u32, url: string): void {
  loadSvgInternal(svgId, url, true);
}

export function loadTexture(textureId: u32, url: string): void {
  loadTextureInternal(textureId, url, true);
}

export function acquireSvgAsset(url: string): u32 {
  if (url.length == 0) {
    return 0;
  }
  let svgId = 0;
  if (svgIdsByUrl.has(url)) {
    svgId = unchecked(svgIdsByUrl.get(url));
  } else {
    svgId = allocateDynamicSvgId();
    loadSvgInternal(svgId, url, false);
  }
  incrementRefCount(svgRefCounts, svgId);
  return svgId;
}

export function acquireTextureAsset(url: string): u32 {
  if (url.length == 0) {
    return 0;
  }
  let textureId = 0;
  if (textureIdsByUrl.has(url)) {
    textureId = unchecked(textureIdsByUrl.get(url));
  } else {
    textureId = allocateDynamicTextureId();
    loadTextureInternal(textureId, url, false);
  }
  incrementRefCount(textureRefCounts, textureId);
  return textureId;
}

export function releaseSvgAsset(svgId: u32): void {
  if (svgId == 0) {
    return;
  }
  const remainingRefCount = decrementRefCount(svgRefCounts, svgId);
  if (remainingRefCount > 0 || remainingRefCount < 0 || pinnedSvgIds.has(svgId)) {
    return;
  }
  const record = getAssetRecord(svgAssets, svgId);
  removeUrlBinding(svgIdsByUrl, record.url, svgId);
  svgAssets.delete(svgId);
  ui.releaseSvg(svgId);
}

export function releaseTextureAsset(textureId: u32): void {
  if (textureId == 0) {
    return;
  }
  const remainingRefCount = decrementRefCount(textureRefCounts, textureId);
  if (remainingRefCount > 0 || remainingRefCount < 0 || pinnedTextureIds.has(textureId)) {
    return;
  }
  const record = getAssetRecord(textureAssets, textureId);
  removeUrlBinding(textureIdsByUrl, record.url, textureId);
  textureAssets.delete(textureId);
  ui.releaseTexture(textureId);
}

export function ensureSvgAsset(url: string): u32 {
  return acquireSvgAsset(url);
}

export function ensureTextureAsset(url: string): u32 {
  return acquireTextureAsset(url);
}

export function __fui_on_svg_loaded(svgId: u32, width: f32, height: f32): void {
  markLoaded(getAssetRecord(svgAssets, svgId), width, height);
}

export function __fui_on_svg_failed(svgId: u32, errorPtr: usize, errorLen: u32): void {
  const error = errorLen > 0 ? String.UTF8.decodeUnsafe(errorPtr, <usize>errorLen, false) : "";
  const record = getAssetRecord(svgAssets, svgId);
  markFailed(record, error);
  warn(
    "Assets",
    "SVG load failed for \"" +
      record.url +
      "\": " +
      (error.length > 0 ? error : "unknown error"),
  );
}

export function __fui_on_texture_loaded(textureId: u32, width: f32, height: f32): void {
  markLoaded(getAssetRecord(textureAssets, textureId), width, height);
}

export function __fui_on_texture_failed(textureId: u32, errorPtr: usize, errorLen: u32): void {
  const error = errorLen > 0 ? String.UTF8.decodeUnsafe(errorPtr, <usize>errorLen, false) : "";
  const record = getAssetRecord(textureAssets, textureId);
  markFailed(record, error);
  warn(
    "Assets",
    "Texture load failed for \"" +
      record.url +
      "\": " +
      (error.length > 0 ? error : "unknown error"),
  );
}
