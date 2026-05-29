import {
  decodeHostServiceBytesResult,
  decodeHostServiceF64ArrayResult,
  decodeHostServiceI32ArrayResult,
  decodeHostServiceStringResult,
  hostServiceResultBufferPtr,
} from "../../src/FuiPrimitives";

describe("Host service bindings", () => {
  it("decodes string results from the shared host-service buffer", () => {
    const expectedSummary = "#3a6cc5";
    const encodedSummary = Uint8Array.wrap(String.UTF8.encode(expectedSummary, false));
    memory.copy(hostServiceResultBufferPtr(), encodedSummary.dataStart, encodedSummary.length);
    expect(decodeHostServiceStringResult(hostServiceResultBufferPtr(), <u32>encodedSummary.length, "demoShellAccentColorHex")).toBe(expectedSummary);
  });

  it("decodes byte-array results from the shared host-service buffer", () => {
    const expected = new Uint8Array(3);
    expected[0] = 7;
    expected[1] = 9;
    expected[2] = 11;
    memory.copy(hostServiceResultBufferPtr(), expected.dataStart, expected.length);
    const actual = decodeHostServiceBytesResult(hostServiceResultBufferPtr(), <u32>expected.length, "appBinaryPayload");
    expect<i32>(actual.length).toBe(3);
    expect<u8>(actual[0]).toBe(7);
    expect<u8>(actual[1]).toBe(9);
    expect<u8>(actual[2]).toBe(11);
  });

  it("decodes i32-array results from the shared host-service buffer", () => {
    const expected = new Int32Array(4);
    expected[0] = 3;
    expected[1] = 5;
    expected[2] = 8;
    expected[3] = 13;
    memory.copy(hostServiceResultBufferPtr(), expected.dataStart, expected.length << 2);
    const actual = decodeHostServiceI32ArrayResult(hostServiceResultBufferPtr(), <u32>(expected.length << 2), "appSpectrum");
    expect<i32>(actual.length).toBe(4);
    expect<i32>(actual[0]).toBe(3);
    expect<i32>(actual[1]).toBe(5);
    expect<i32>(actual[2]).toBe(8);
    expect<i32>(actual[3]).toBe(13);
  });

  it("decodes f64-array results from the shared host-service buffer", () => {
    const expected = new Float64Array(3);
    expected[0] = 0.25;
    expected[1] = 0.5;
    expected[2] = 0.75;
    memory.copy(hostServiceResultBufferPtr(), expected.dataStart, expected.length << 3);
    const actual = decodeHostServiceF64ArrayResult(hostServiceResultBufferPtr(), <u32>(expected.length << 3), "appWaveform");
    expect<i32>(actual.length).toBe(3);
    expect<f64>(actual[0]).toBe(0.25);
    expect<f64>(actual[1]).toBe(0.5);
    expect<f64>(actual[2]).toBe(0.75);
  });
});
