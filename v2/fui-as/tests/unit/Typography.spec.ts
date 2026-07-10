import { FontFace, FontFaceLoadedEventArgs, FontFamily, FontStack, FontsLoadedEventArgs } from "../../src/core/Typography";

let typographyReadyCalls = 0;

function incrementFontsLoadedCalls(_event: FontsLoadedEventArgs): void {
  typographyReadyCalls += 1;
}

function incrementFontFaceLoadedCalls(_event: FontFaceLoadedEventArgs): void {
  typographyReadyCalls += 1;
}

describe("Typography font readiness", () => {
  beforeEach(() => {
    typographyReadyCalls = 0;
  });

  it("treats preloaded built-in fonts as already loaded", () => {
    FontFace.whenFontsLoaded([1, 2, 3, 4, 5, 6], incrementFontsLoadedCalls);

    expect<i32>(typographyReadyCalls).toBe(1);
  });

  it("waits until every requested lazy font has loaded", () => {
    FontFace.whenFontsLoaded([9101, 9102], incrementFontsLoadedCalls);

    expect<i32>(typographyReadyCalls).toBe(0);
    FontFace._dispatchFontLoaded(9101);
    expect<i32>(typographyReadyCalls).toBe(0);
    FontFace._dispatchFontLoaded(9102);
    expect<i32>(typographyReadyCalls).toBe(1);
    FontFace._dispatchFontLoaded(9102);
    expect<i32>(typographyReadyCalls).toBe(1);
  });

  it("invokes onLoaded immediately for a font that has already loaded", () => {
    FontFace._dispatchFontLoaded(9103);
    new FontFace(9103).onLoaded(incrementFontFaceLoadedCalls);

    expect<i32>(typographyReadyCalls).toBe(1);
  });

  it("reports font ids required by stacks and families", () => {
    const stackIds = FontStack._fromId(9201)._fallbackId(9202)._fallbackId(9203).requiredFontIds();
    const familyIds = FontFamily._fromIds(9301, 9302, 9303, 9304).requiredFontIds();

    expect<i32>(stackIds.length).toBe(3);
    expect<u32>(unchecked(stackIds[0])).toBe(9201);
    expect<u32>(unchecked(stackIds[1])).toBe(9202);
    expect<u32>(unchecked(stackIds[2])).toBe(9203);
    expect<i32>(familyIds.length).toBe(4);
    expect<u32>(unchecked(familyIds[0])).toBe(9301);
    expect<u32>(unchecked(familyIds[1])).toBe(9302);
    expect<u32>(unchecked(familyIds[2])).toBe(9303);
    expect<u32>(unchecked(familyIds[3])).toBe(9304);
  });
});
