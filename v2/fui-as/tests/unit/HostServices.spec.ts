import {
  decodeHostServiceBytesResult,
  decodeHostServiceF64ArrayResult,
  decodeHostServiceI64ArrayResult,
  decodeHostServiceI32ArrayResult,
  decodeHostServiceStringResult,
  decodeHostServiceU64ArrayResult,
  decodeHostServiceU32ArrayResult,
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

  it("decodes u32-array results from the shared host-service buffer", () => {
    const expected = new Uint32Array(3);
    expected[0] = 1;
    expected[1] = 2147483648;
    expected[2] = 4294967295;
    memory.copy(hostServiceResultBufferPtr(), expected.dataStart, expected.length << 2);
    const actual = decodeHostServiceU32ArrayResult(hostServiceResultBufferPtr(), <u32>(expected.length << 2), "appIndices");
    expect<i32>(actual.length).toBe(3);
    expect<u32>(actual[0]).toBe(1);
    expect<u32>(actual[1]).toBe(2147483648);
    expect<u32>(actual[2]).toBe(4294967295);
  });

  it("decodes i64-array results from the shared host-service buffer", () => {
    const expected = new Int64Array(2);
    expected[0] = <i64>-9;
    expected[1] = <i64>9223372036854775807;
    memory.copy(hostServiceResultBufferPtr(), expected.dataStart, expected.length << 3);
    const actual = decodeHostServiceI64ArrayResult(hostServiceResultBufferPtr(), <u32>(expected.length << 3), "appLongs");
    expect<i32>(actual.length).toBe(2);
    expect<i64>(actual[0]).toBe(<i64>-9);
    expect<i64>(actual[1]).toBe(<i64>9223372036854775807);
  });

  it("decodes u64-array results from the shared host-service buffer", () => {
    const expected = new Uint64Array(2);
    expected[0] = <u64>7;
    expected[1] = <u64>18446744073709551615;
    memory.copy(hostServiceResultBufferPtr(), expected.dataStart, expected.length << 3);
    const actual = decodeHostServiceU64ArrayResult(hostServiceResultBufferPtr(), <u32>(expected.length << 3), "appULongs");
    expect<i32>(actual.length).toBe(2);
    expect<u64>(actual[0]).toBe(<u64>7);
    expect<u64>(actual[1]).toBe(<u64>18446744073709551615);
  });
});
