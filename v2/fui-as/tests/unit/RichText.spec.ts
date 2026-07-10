import { FontFamily, FontStack, FontStyle, FontWeight } from "../../src/core/Typography";
import { RichText, Span, span } from "../../src/nodes";
import {
  CALL_SET_FONT,
  CALL_SET_TEXT,
  CALL_SET_TEXT_STYLE_RUNS,
  getCallArg,
  getCallSequence,
  findCall,
  lastTextEquals,
  resetCalls,
} from "./FfiTestImports";

function hasCallForHandle(op: i32, handle: u64): bool {
  const sequence = getCallSequence();
  for (let i = 0; i < sequence.length; ++i) {
    if (unchecked(sequence[i]) == op && getCallArg(i, 0) == <f64>handle) {
      return true;
    }
  }
  return false;
}

function findCallIndex(op: i32): i32 {
  const sequence = getCallSequence();
  for (let i = 0; i < sequence.length; ++i) {
    if (unchecked(sequence[i]) == op) {
      return i;
    }
  }
  return -1;
}

function containsFontId(fontIds: Array<u32>, fontId: u32): bool {
  for (let index = 0; index < fontIds.length; ++index) {
    if (unchecked(fontIds[index]) == fontId) {
      return true;
    }
  }
  return false;
}

describe("RichText", () => {
  beforeEach(() => {
    resetCalls();
  });

  it("builds attributed style runs on one text node", () => {
    const rich = new RichText([
      span("Hello ").color(0x11223344).bold().italic(),
      span("😄 ").underline().color(0x55667788),
      span("World").strikethrough().color(0x99aabbcc),
    ]);

    rich.build();

    expect<i32>(rich.childCount).toBe(0);
    expect<bool>(hasCallForHandle(CALL_SET_TEXT, rich.builtHandle)).toBe(true);
    expect<bool>(hasCallForHandle(CALL_SET_FONT, rich.builtHandle)).toBe(true);
    expect<bool>(lastTextEquals("Hello 😄 World")).toBe(true);
    expect<bool>(hasCallForHandle(CALL_SET_TEXT_STYLE_RUNS, rich.builtHandle)).toBe(true);
    const callIndex = findCallIndex(CALL_SET_TEXT_STYLE_RUNS);
    expect<bool>(callIndex >= 0).toBe(true);
    expect<f64>(getCallArg(callIndex, 1)).toBe(3);
  });

  it("keeps style runs when a span uses background color", () => {
    const rich = new RichText([
      span("A").bgColor(0x11223344).underline().color(0xaabbccdd),
      span("B").bold().italic().strikethrough().color(0x55667788),
    ]);

    rich.build();

    expect<bool>(hasCallForHandle(CALL_SET_TEXT, rich.builtHandle)).toBe(true);
    expect<bool>(hasCallForHandle(CALL_SET_FONT, rich.builtHandle)).toBe(true);
    expect<bool>(lastTextEquals("AB")).toBe(true);
    expect<bool>(hasCallForHandle(CALL_SET_TEXT_STYLE_RUNS, rich.builtHandle)).toBe(true);
    const callIndex = findCallIndex(CALL_SET_TEXT_STYLE_RUNS);
    expect<bool>(callIndex >= 0).toBe(true);
    expect<f64>(getCallArg(callIndex, 1)).toBe(2);
  });

  it("applies an overarching font style across helper spans", () => {
    const family = FontFamily._fromIds(11, 12, 13, 14);
    const rich = new RichText([
      span("Hello "),
      span("world").bold(),
    ])
      .fontFamily(family)
      .fontWeight(FontWeight.Bold)
      .fontStyle(FontStyle.Italic)
      .fontSize(21.0);

    rich.build();

    const fontIndex = findCall(CALL_SET_FONT);
    expect<i32>(fontIndex).toBeGreaterThan(-1);
    expect<f64>(getCallArg(fontIndex, 1)).toBe(14.0);
    expect<f64>(getCallArg(fontIndex, 2)).toBe(21.0);
    expect<bool>(hasCallForHandle(CALL_SET_TEXT_STYLE_RUNS, rich.builtHandle)).toBe(true);
    expect<bool>(lastTextEquals("Hello world")).toBe(true);
  });

  it("resolves a span-level font family override without using FontStack", () => {
    const baseFamily = FontFamily._fromIds(11, 12, 13, 14);
    const overrideFamily = FontFamily._fromIds(21, 22, 23, 24);
    const rich = new RichText([
      span("Base "),
      span("Mono").fontFamily(overrideFamily),
      span(" Tail"),
    ])
      .fontFamily(baseFamily)
      .fontWeight(FontWeight.Bold)
      .fontSize(20.0);

    rich.build();

    const callIndex = findCallIndex(CALL_SET_TEXT_STYLE_RUNS);
    expect<i32>(callIndex).toBeGreaterThan(-1);

    const runCount = <u32>getCallArg(callIndex, 1);
    const runsPtr = <usize>getCallArg(callIndex, 2);

    expect<u32>(runCount).toBe(3);
    expect<u32>(load<u32>(runsPtr + 8)).toBe(12);
    expect<u32>(load<u32>(runsPtr + 36)).toBe(22);
    expect<u32>(load<u32>(runsPtr + 64)).toBe(12);
    expect<bool>(lastTextEquals("Base Mono Tail")).toBe(true);
  });

  it("reports every font id required by its resolved style runs", () => {
    const baseFamily = FontFamily._fromIds(11, 12, 13, 14);
    const overrideFamily = FontFamily._fromIds(21, 22, 23, 24);
    const rich = new RichText([
      span("Base "),
      span("Mono").fontFamily(overrideFamily).bold(),
      span(" Tail").italic(),
    ])
      .fontFamily(baseFamily)
      .fontSize(20.0);

    const fontIds = rich._requiredFontIds();

    expect<bool>(containsFontId(fontIds, 11)).toBe(true);
    expect<bool>(containsFontId(fontIds, 22)).toBe(true);
    expect<bool>(containsFontId(fontIds, 13)).toBe(true);
  });
});
