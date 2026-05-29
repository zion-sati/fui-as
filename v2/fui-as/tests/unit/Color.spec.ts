import { rgb, rgba } from "../../src/color";

describe("color helpers", () => {
  it("packs rgba channels as 0xRRGGBBAA", () => {
    expect<u32>(rgba(0x12, 0x34, 0x56, 0x78)).toBe(0x12345678);
  });

  it("packs rgb colors as fully opaque rgba values", () => {
    expect<u32>(rgb(0xab, 0xcd, 0xef)).toBe(0xabcdefff);
  });
});
