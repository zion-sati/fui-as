import { Paint } from "../../src/drawing/Paint";
import { Path } from "../../src/drawing/Path";
import { DrawContext } from "../../src/drawing/DrawContext";
import { rgba } from "../../src/color";
import { Text } from "../../src/nodes/Text";

describe("Paint", () => {
  it("creates a default transparent paint", () => {
    const p = new Paint();
    expect<u32>(p.fillColor).toBe(0);
    expect<u32>(p.strokeColor).toBe(0);
    expect<f32>(p.strokeWidth).toBe(0);
    expect<bool>(p.hasFill()).toBe(false);
    expect<bool>(p.hasStroke()).toBe(false);
  });

  it("creates a fill paint", () => {
    const red = rgba(255, 0, 0, 255);
    const p = Paint.fill(red);
    expect<u32>(p.fillColor).toBe(red);
    expect<u32>(p.strokeColor).toBe(0);
    expect<f32>(p.strokeWidth).toBe(0);
    expect<bool>(p.hasFill()).toBe(true);
    expect<bool>(p.hasStroke()).toBe(false);
  });

  it("creates a stroke paint", () => {
    const blue = rgba(0, 0, 255, 255);
    const p = Paint.stroke(blue, 3);
    expect<u32>(p.fillColor).toBe(0);
    expect<u32>(p.strokeColor).toBe(blue);
    expect<f32>(p.strokeWidth).toBe(3);
    expect<bool>(p.hasFill()).toBe(false);
    expect<bool>(p.hasStroke()).toBe(true);
  });

  it("creates a filled and stroked paint", () => {
    const green = rgba(0, 255, 0, 255);
    const red = rgba(255, 0, 0, 255);
    const p = Paint.filledStroke(green, red, 2);
    expect<u32>(p.fillColor).toBe(green);
    expect<u32>(p.strokeColor).toBe(red);
    expect<f32>(p.strokeWidth).toBe(2);
    expect<bool>(p.hasFill()).toBe(true);
    expect<bool>(p.hasStroke()).toBe(true);
  });

  it("transparent alpha counts as no fill", () => {
    const p = Paint.fill(rgba(255, 0, 0, 0));
    expect<bool>(p.hasFill()).toBe(false);
  });

  it("zero stroke width counts as no stroke", () => {
    const p = Paint.stroke(rgba(0, 0, 255, 255), 0);
    expect<bool>(p.hasStroke()).toBe(false);
  });
});

describe("Path", () => {
  it("creates a path and allows disposal", () => {
    const path = new Path();
    // Path ID should be non-zero (allocated by mock)
    path.dispose();
    // Double dispose should not throw
    path.dispose();
  });

  it("builder methods return this for chaining", () => {
    const path = new Path();
    const result = path.moveTo(10, 20)
      .lineTo(30, 40)
      .quadTo(50, 60, 70, 80)
      .cubicTo(10, 20, 30, 40, 50, 60)
      .close()
      .addRect(0, 0, 100, 100)
      .addCircle(50, 50, 30);
    // @ts-ignore: comparing references
    expect<bool>(changetype<usize>(result) == changetype<usize>(path)).toBe(true);
    path.dispose();
  });

  it("exposes its internal path id", () => {
    const path = new Path();
    const id = path._pathId;
    // Mock returns 0, but the getter should exist and be callable
    expect<u32>(id).toBe(0);
    path.dispose();
  });
});

describe("DrawContext", () => {
  // Use a mock canvas pointer (0 for testing).
  const MOCK_CANVAS: usize = 0;

  it("state methods do not throw", () => {
    const ctx = new DrawContext(MOCK_CANVAS);
    ctx.save();
    ctx.restore();
    ctx.translate(10, 20);
    ctx.scale(2, 2);
    ctx.rotate(45);
    ctx.clipRect(0, 0, 100, 100);
    ctx.clipRoundRect(0, 0, 100, 100, 8);
    ctx.clipRoundedRect(0, 0, 100, 100, 4, 8, 12, 16);
  });

  it("drawing primitives do not throw", () => {
    const ctx = new DrawContext(MOCK_CANVAS);
    const red = rgba(255, 0, 0, 255);

    ctx.drawRect(0, 0, 100, 100, Paint.fill(red));
    ctx.drawCircle(50, 50, 30, Paint.stroke(red, 2));
    ctx.drawLine(0, 0, 100, 100, red, 1);
    ctx.drawRoundRect(10, 10, 80, 80, 8, 8, Paint.filledStroke(red, red, 2));
    ctx.flush();
  });

  it("path drawing does not throw", () => {
    const ctx = new DrawContext(MOCK_CANVAS);
    const path = new Path();
    path.addRect(10, 10, 50, 50);

    ctx.drawPath(path, Paint.fill(rgba(0, 255, 0, 255)));
    path.dispose();
  });

  it("prepared text node drawing does not throw", () => {
    const ctx = new DrawContext(MOCK_CANVAS);
    const text = new Text("Hello");
    ctx.drawTextNode(text, 10, 20);
  });

  it("image drawing does not throw", () => {
    const ctx = new DrawContext(MOCK_CANVAS);
    ctx.drawImage(1, 0, 0, 100, 100);
  });

  it("svg drawing does not throw", () => {
    const ctx = new DrawContext(MOCK_CANVAS);
    ctx.drawSvg(1, 0, 0, 100, 100);
  });
});
