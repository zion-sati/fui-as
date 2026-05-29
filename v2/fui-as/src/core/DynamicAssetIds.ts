const FIRST_DYNAMIC_SVG_ID: u32 = 0x10000000;
const FIRST_DYNAMIC_TEXTURE_ID: u32 = 0x20000000;
const MAX_DYNAMIC_ASSET_ID: u32 = 0xffffffff;

let nextDynamicSvgId: u32 = FIRST_DYNAMIC_SVG_ID;
let nextDynamicTextureId: u32 = FIRST_DYNAMIC_TEXTURE_ID;

export function allocateDynamicSvgId(): u32 {
  if (nextDynamicSvgId == MAX_DYNAMIC_ASSET_ID) {
    throw new Error("Dynamic SVG asset id space exhausted.");
  }
  const allocated = nextDynamicSvgId;
  nextDynamicSvgId += 1;
  return allocated;
}

export function allocateDynamicTextureId(): u32 {
  if (nextDynamicTextureId == MAX_DYNAMIC_ASSET_ID) {
    throw new Error("Dynamic texture asset id space exhausted.");
  }
  const allocated = nextDynamicTextureId;
  nextDynamicTextureId += 1;
  return allocated;
}
