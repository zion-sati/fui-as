export * from "../../../src/FuiExports";
export * from "../generated/HostEvents";

import { Application, DynamicTextLayout, Node, PointerEventArgs, RichText, TextLayout, TextLayoutReadyEventArgs, createApplication, onLoaded, activeTheme, devicePixelRatio, rgba, rgb, span } from "../../../src/Fui";
import { FlexBox } from "../../../src/nodes/FlexBox";
import { Text } from "../../../src/nodes/Text";
import { CustomDrawable } from "../../../src/nodes/CustomDrawable";
import { FlexDirection, FlexWrap } from "../../../src/core/ffi";
import { DrawContext } from "../../../src/drawing/DrawContext";
import { Paint } from "../../../src/drawing/Paint";
import { Bitmap } from "../../../src/core/Bitmap";
import { Signal } from "../../../src/core/Signal";
import { HandlerAction } from "../../../src/core/Action";
import { scheduleTimer } from "../../../src/core/Timers";
import { SemanticRole } from "../../../src/core/ffi";


function onBrushD(event: PointerEventArgs): void {
  const p = demo.paintCanvas!;
  p.brushDown(event.x, event.y);
}
function onBrushM(event: PointerEventArgs): void {
  const p = demo.paintCanvas!;
  p.brushMove(event.x, event.y);
}
function onBrushU(event: PointerEventArgs): void {
  const p = demo.paintCanvas!;
  p.brushUp(event.x, event.y);
}
function onBrushC(event: PointerEventArgs): void {
  const p = demo.paintCanvas!;
  p.brushUp(event.x, event.y);
}

function onYarnD(event: PointerEventArgs): void {
  const yv = demo.yarn!;
  yv.pointerDown(event.x, event.y);
}
function onYarnM(event: PointerEventArgs): void {
  const yv = demo.yarn!;
  yv.pointerMove(event.x, event.y);
}
function onYarnU(_event: PointerEventArgs): void {
  const yv = demo.yarn!;
  yv.pointerUp();
}
function onYarnC(_event: PointerEventArgs): void {
  const yv = demo.yarn!;
  yv.pointerUp();
}


class PaintCanvas extends CustomDrawable {
  bmp: Bitmap = new Bitmap(1, 1);
  private bitmapScale: f32 = 1.0;
  private hintLabel: Text | null = null;
  private hintBaked: bool = false;
  private painting: bool = false;

  constructor() {
    super();
    this.width(300).height(300)
      .semanticRole(SemanticRole.Image)
      .semanticLabel("Paint canvas \\u2014 drag to draw")
      .nodeId("widget-paint");
    this.bitmapScale = devicePixelRatio();
    if (this.bitmapScale <= 0.0) {
      this.bitmapScale = 1.0;
    }
    const backingSize = <u32>Math.max(1.0, Math.ceil(<f64>(300.0 * this.bitmapScale)));
    this.bmp = new Bitmap(backingSize, backingSize);
    // Start transparent — card background is painted on frame buffer
    const pxs = this.bmp.pixels();
    for (let i: i32 = 0; i < <i32>pxs.length; i += 4) {
      unchecked(pxs[i] = 0);
      unchecked(pxs[i + 1] = 0);
      unchecked(pxs[i + 2] = 0);
      unchecked(pxs[i + 3] = 0);
    }
    this.bmp.commit();
    this.onPointerDown(onBrushD);
    this.onPointerMove(onBrushM);
    this.onPointerUp(onBrushU);
    this.onPointerCancel(onBrushC);
  }

  brushDown(x: f32, y: f32): void {
    this.capturePointer();
    this.painting = true;
    this.brushAtLogical(x, y, 8.0, NEEDLE);
    this.bmp.clearDirtyRects();
    this.bmp.commit();
    this.markDirty();
  }

  brushMove(x: f32, y: f32): void {
    if (!this.painting) return;
    this.brushAtLogical(x, y, 8.0, NEEDLE);
    this.bmp.clearDirtyRects();
    this.bmp.commit();
    this.markDirty();
  }

  brushUp(_x: f32, _y: f32): void {
    this.painting = false;
    this.releasePointer();
  }

  setHintLabel(label: Text): void {
    this.hintLabel = label;
    this.hintBaked = false;
    this.markDirty();
  }

  private brushAtLogical(x: f32, y: f32, radius: f32, color: u32): void {
    this.brushAt(
      <i32>Math.round(<f64>(x * this.bitmapScale)),
      <i32>Math.round(<f64>(y * this.bitmapScale)),
      <i32>Math.max(1.0, Math.round(<f64>(radius * this.bitmapScale))),
      color,
    );
  }

  private brushAt(cx: i32, cy: i32, R: i32, color: u32): void {
    const pxs = this.bmp.pixels();
    const w = <i32>this.bmp.width;
    const h = <i32>this.bmp.height;
    for (let dy: i32 = -R; dy <= R; dy++) {
      for (let dx: i32 = -R; dx <= R; dx++) {
        if (dx * dx + dy * dy > R * R) continue;
        const px = cx + dx;
        const py = cy + dy;
        if (px < 0 || px >= w || py < 0 || py >= h) continue;
        const idx = (py * w + px) * 4;
        unchecked(pxs[idx] = <u8>((color >> 24) & 0xff));
        unchecked(pxs[idx + 1] = <u8>((color >> 16) & 0xff));
        unchecked(pxs[idx + 2] = <u8>((color >> 8) & 0xff));
        unchecked(pxs[idx + 3] = 0xff);
      }
    }
  }

  draw(ctx: DrawContext): void {
    const S: f32 = this.getBounds()[2];
    ctx.drawRoundRect(0, 0, S, S, 12, 12, Paint.fill(CARD));
    ctx.drawImage(this.bmp.textureId, 0, 0, S, S);
    if (!this.hintBaked && this.hintLabel !== null) {
      this.bmp.render(this.hintLabel!, 16.0, 32.0, this.bitmapScale);
      this.bmp.commit();
      this.hintBaked = true;
    }
    // Corner brackets...
    const hint = rgba(150, 150, 170, 120);
    const L: f32 = 16; const M: f32 = 8;
    ctx.drawLine(M, L, M, M, hint, 1.5);
    ctx.drawLine(M, M, L, M, hint, 1.5);
    ctx.drawLine(S - L, M, S - M, M, hint, 1.5);
    ctx.drawLine(S - M, M, S - M, L, hint, 1.5);
    ctx.drawLine(M, S - L, M, S - M, hint, 1.5);
    ctx.drawLine(M, S - M, L, S - M, hint, 1.5);
    ctx.drawLine(S - L, S - M, S - M, S - M, hint, 1.5);
    ctx.drawLine(S - M, S - M, S - M, S - L, hint, 1.5);
  }
}

class DemoState {
  gaugeValue: f32 = 0;
  gaugeDir: f32 = 1;
  gauge: Gauge | null = null;
  chart: BarChart | null = null;
  wave: Waveform | null = null;
  spark: Sparkline | null = null;
  pie: PieChart | null = null;
  scatter: ScatterPlot | null = null;
  yarn: DancingYarn | null = null;
  paintCanvas: PaintCanvas | null = null;

  init(): void {
    this.gauge = new Gauge();
    this.chart = new BarChart();
    this.wave = new Waveform();
    this.spark = new Sparkline();
    this.pie = new PieChart();
    this.scatter = new ScatterPlot();
    this.yarn = new DancingYarn();
    this.paintCanvas = new PaintCanvas();
  }

  tick(): void {
    const gauge = this.gauge!;
    const chart = this.chart!;
    const wave = this.wave!;
    const spark = this.spark!;
    const pie = this.pie!;
    const scatter = this.scatter!;
    const yarn = this.yarn!;
    this.gaugeValue += this.gaugeDir * 2.0;
    if (this.gaugeValue >= 100) { this.gaugeValue = 100; this.gaugeDir = -1; }
    if (this.gaugeValue <= 0)   { this.gaugeValue = 0;   this.gaugeDir = 1;  }
    gauge.value.value = this.gaugeValue;
    chart.pushValues(
      this.gaugeValue,
      <f32>Math.abs(<f64>(this.gaugeValue - 50)) * 2.0,
      <f32>Math.sin(<f64>this.gaugeValue / 100.0 * Math.PI) * 80.0 + 20.0,
      <f32>Math.cos(<f64>this.gaugeValue / 100.0 * Math.PI * 0.7) * 60.0 + 40.0,
    );
    wave.pushValues(
      this.gaugeValue,
      <f32>Math.abs(<f64>(this.gaugeValue - 50)) * 2.0,
      <f32>Math.sin(<f64>this.gaugeValue / 100.0 * Math.PI) * 80.0 + 20.0,
      <f32>Math.cos(<f64>this.gaugeValue / 100.0 * Math.PI * 0.7) * 60.0 + 40.0,
    );
    spark.push(this.gaugeValue);
    pie.pushValues(
      this.gaugeValue,
      <f32>Math.abs(<f64>(this.gaugeValue - 50)) * 2.0,
      <f32>Math.sin(<f64>this.gaugeValue / 100.0 * Math.PI) * 40.0 + 30.0,
      <f32>Math.cos(<f64>this.gaugeValue / 100.0 * Math.PI * 0.7) * 30.0 + 20.0,
    );
    scatter.pushValues(
      <f32>Math.sin(<f64>this.gaugeValue / 100.0 * Math.PI * 2),
      <f32>Math.cos(<f64>this.gaugeValue / 100.0 * Math.PI * 2),
      <f32>Math.sin(<f64>this.gaugeValue / 100.0 * Math.PI * 3),
      <f32>Math.sin(<f64>this.gaugeValue / 100.0 * Math.PI * 1.5),
    );
    yarn.tick();
    scheduleTimer(0, 25, tick);
  }
}

let demo = new DemoState();

function tick(): void { demo.tick(); }

const ACCENT = rgba(58, 108, 197, 255);
const GRAY   = rgba(200, 200, 200, 255);
const NEEDLE = rgba(220, 50, 50, 255);
const CARD   = rgba(35, 35, 50, 255);

function handlePlotTitleReady(owner: CustomDrawable, _event: TextLayoutReadyEventArgs): void {
  owner.markDirty();
}

function createPlotTitle(owner: CustomDrawable, title: string): TextLayout {
  return TextLayout.text(title)
    .fontFamily(activeTheme.value.fonts.bodyFamily)
    .fontSize(13)
    .color(rgba(235, 238, 245, 210))
    .width(180)
    .height(24)
    .onReadyWith<CustomDrawable>(owner, handlePlotTitleReady);
}

function drawPlotTitle(ctx: DrawContext, title: TextLayout | null): void {
  if (title !== null && title.isReady) {
    ctx.drawTextLayout(title, 16, 24);
  }
}

function handleDynamicLabelReady(owner: CustomDrawable, _event: TextLayoutReadyEventArgs): void {
  owner.markDirty();
}

function createDynamicLabel(owner: CustomDrawable, color: u32): DynamicTextLayout {
  return DynamicTextLayout.fixedCharset("0123456789.-, ")
    .fontFamily(activeTheme.value.fonts.bodyFamily)
    .fontSize(12)
    .color(color)
    .width(72)
    .height(20)
    .onReadyWith<CustomDrawable>(owner, handleDynamicLabelReady);
}

function createDynamicMonoLabel(owner: CustomDrawable, color: u32): DynamicTextLayout {
  return DynamicTextLayout.fixedCharset("0123456789.-, ")
    .fontFamily(activeTheme.value.fonts.monoFamily)
    .fontSize(12)
    .color(color)
    .width(72)
    .height(20)
    .onReadyWith<CustomDrawable>(owner, handleDynamicLabelReady);
}

function createDynamicNumericLabel(owner: CustomDrawable, color: u32, precision: i32 = 0): DynamicTextLayout {
  return DynamicTextLayout.numeric()
    .precision(precision)
    .fontFamily(activeTheme.value.fonts.bodyFamily)
    .fontSize(12)
    .color(color)
    .width(72)
    .height(20)
    .onReadyWith<CustomDrawable>(owner, handleDynamicLabelReady);
}

function drawDynamicLabel(ctx: DrawContext, label: DynamicTextLayout | null, x: f32, y: f32): void {
  if (label !== null && label.isReady) {
    const metrics = label.measure();
    const width: f32 = metrics.width + 10.0;
    const h: f32 = 22;
    ctx.drawRoundRect(x, y, width, h, 5, 5, Paint.fill(rgba(8, 10, 18, 225)));
    ctx.drawTextLayout(label, x + 5, y + 4);
  }
}

function formatTenths(value: f32): string {
  let scaled = <i32>Math.round(<f64>(value * 10.0));
  let sign = "";
  if (scaled < 0) {
    sign = "-";
    scaled = -scaled;
  }
  const whole = scaled / 10;
  const frac = scaled % 10;
  return sign + whole.toString() + "." + frac.toString();
}

class Gauge extends CustomDrawable {
  value: Signal<f32> = new Signal<f32>(0);
  private title: TextLayout | null = null;

  constructor() {
    super();
    this.width(300).height(300);
    this.title = createPlotTitle(this, "Gauge");
    this.value.addAction(new HandlerAction<Gauge, f32>(
      this,
      (g: Gauge, _v: f32): void => { g.markDirty(); },
    ));
  }

  draw(ctx: DrawContext): void {
    const v: f32 = this.value.value;
    const b = this.getBounds();
    const S: f32 = b[2];
    const cx: f32 = S / 2.0;
    const cy: f32 = S / 2.0;
    ctx.drawRoundRect(0, 0, S, S, 12, 12, Paint.fill(CARD));
    drawPlotTitle(ctx, this.title);
    ctx.drawCircle(cx, cy, S * 0.4, Paint.stroke(GRAY, 6));
    const a: f32 = ((v / 100.0) * 270.0 - 135.0) * <f32>Math.PI / 180.0;
    ctx.drawLine(cx, cy,
      cx + S * 0.3 * <f32>Math.cos(<f64>a),
      cy + S * 0.3 * <f32>Math.sin(<f64>a),
      NEEDLE, 3);
    ctx.drawCircle(cx, cy, 6, Paint.fill(ACCENT));
  }
}

const BAR1 = rgba(58, 108, 197, 180);
const BAR2 = rgba(58, 197, 108, 180);
const BAR3 = rgba(197, 108, 58, 180);
const BAR4 = rgba(158, 58, 197, 180);

class BarChart extends CustomDrawable {
  private v0: f32 = 0; private v1: f32 = 0;
  private v2: f32 = 0; private v3: f32 = 0;
  private title: TextLayout | null = null;
  private l0: DynamicTextLayout | null = null;
  private l1: DynamicTextLayout | null = null;
  private l2: DynamicTextLayout | null = null;
  private l3: DynamicTextLayout | null = null;

  constructor() {
    super();
    this.width(300).height(300);
    this.title = createPlotTitle(this, "Bar chart");
    this.l0 = createDynamicNumericLabel(this, rgba(220, 232, 255, 230));
    this.l1 = createDynamicNumericLabel(this, rgba(220, 255, 232, 230));
    this.l2 = createDynamicNumericLabel(this, rgba(255, 232, 220, 230));
    this.l3 = createDynamicNumericLabel(this, rgba(245, 220, 255, 230));
  }

  pushValues(a: f32, b: f32, c: f32, d: f32): void {
    this.v0 = a; this.v1 = b; this.v2 = c; this.v3 = d;
    if (this.l0 !== null) this.l0!.setValue(a);
    if (this.l1 !== null) this.l1!.setValue(b);
    if (this.l2 !== null) this.l2!.setValue(c);
    if (this.l3 !== null) this.l3!.setValue(d);
    this.markDirty();
  }

  draw(ctx: DrawContext): void {
    const b = this.getBounds();
    const S: f32 = b[2]; const pad: f32 = 14; const barW: f32 = 48; const gap: f32 = 16;
    const baseY: f32 = S - pad;
    ctx.drawRoundRect(0, 0, S, S, 12, 12, Paint.fill(CARD));
    drawPlotTitle(ctx, this.title);
    // Bars
    const x0: f32 = pad;
    const x1: f32 = pad + (barW + gap);
    const x2: f32 = pad + (barW + gap) * 2;
    const x3: f32 = pad + (barW + gap) * 3;
    const h0 = (this.v0 / 100.0) * (S - pad * 2);
    const h1 = (this.v1 / 100.0) * (S - pad * 2);
    const h2 = (this.v2 / 100.0) * (S - pad * 2);
    const h3 = (this.v3 / 100.0) * (S - pad * 2);
    ctx.drawRect(x0, baseY - h0, barW, h0, Paint.fill(BAR1));
    ctx.drawRect(x1, baseY - h1, barW, h1, Paint.fill(BAR2));
    ctx.drawRect(x2, baseY - h2, barW, h2, Paint.fill(BAR3));
    ctx.drawRect(x3, baseY - h3, barW, h3, Paint.fill(BAR4));
    drawDynamicLabel(ctx, this.l0, x0 + 2, baseY - h0 - 28);
    drawDynamicLabel(ctx, this.l1, x1 + 2, baseY - h1 - 28);
    drawDynamicLabel(ctx, this.l2, x2 + 2, baseY - h2 - 28);
    drawDynamicLabel(ctx, this.l3, x3 + 2, baseY - h3 - 28);
  }
}

const WAVE_LINE = rgba(58, 197, 158, 255);
const WAVE_DIM  = rgba(58, 197, 158, 60);

class Waveform extends CustomDrawable {
  private v0: f32 = 0; private v1: f32 = 0;
  private v2: f32 = 0; private v3: f32 = 0;
  private title: TextLayout | null = null;

  constructor() {
    super();
    this.width(300).height(300);
    this.title = createPlotTitle(this, "Waveform");
  }

  pushValues(a: f32, b: f32, c: f32, d: f32): void {
    this.v0 = a; this.v1 = b; this.v2 = c; this.v3 = d; this.markDirty();
  }

  draw(ctx: DrawContext): void {
    const b = this.getBounds();
    const S: f32 = b[2]; const pad: f32 = 14; const mid: f32 = S / 2.0; const amp: f32 = S * 0.33;
    const steps: i32 = 40;
    ctx.drawRoundRect(0, 0, S, S, 12, 12, Paint.fill(CARD));
    drawPlotTitle(ctx, this.title);
    for (let j: i32 = 0; j < 4; j++) {
      const phase: f32 = <f32>j * 1.2;
      const color: u32 = j == 2 ? WAVE_LINE : WAVE_DIM;
      for (let i: i32 = 1; i < steps; i++) {
        const x0: f32 = pad + <f32>(i - 1) / <f32>(steps - 1) * (S - pad * 2);
        const x1: f32 = pad + <f32>(i)     / <f32>(steps - 1) * (S - pad * 2);
        const t0: f32 = <f32>(i - 1) * 0.3 + phase;
        const t1: f32 = <f32>(i)     * 0.3 + phase;
        let sv: f32 = 0;
        if      (j == 0) { sv = this.v0 / 100.0; }
        else if (j == 1) { sv = this.v1 / 100.0; }
        else if (j == 2) { sv = this.v2 / 100.0; }
        else             { sv = this.v3 / 100.0; }
        ctx.drawLine(x0, mid + <f32>Math.sin(<f64>t0) * amp * sv,
                     x1, mid + <f32>Math.sin(<f64>t1) * amp * sv, color, 1.5);
      }
    }
  }
}

const SPARK_LINE = rgba(255, 180, 60, 255);

class Sparkline extends CustomDrawable {
  private history: StaticArray<f32> = new StaticArray<f32>(80);
  private writePos: i32 = 0;
  private len: i32 = 0;
  private title: TextLayout | null = null;

  constructor() {
    super();
    this.width(300).height(300);
    this.title = createPlotTitle(this, "Sparkline");
  }

  push(v: f32): void {
    unchecked(this.history[this.writePos] = v);
    this.writePos = (this.writePos + 1) % 80;
    if (this.len < 80) this.len++;
    this.markDirty();
  }

  draw(ctx: DrawContext): void {
    const b = this.getBounds();
    const S: f32 = b[2]; const pad: f32 = 14;
    ctx.drawRoundRect(0, 0, S, S, 12, 12, Paint.fill(CARD));
    drawPlotTitle(ctx, this.title);
    if (this.len < 2) return;
    const stepX: f32 = (S - pad * 2) / <f32>(this.len - 1);
    for (let i: i32 = 1; i < this.len; i++) {
      const pIdx: i32 = (this.writePos - this.len + i - 1 + 80) % 80;
      const cIdx: i32 = (this.writePos - this.len + i + 80) % 80;
      const x0: f32 = pad + stepX * <f32>(i - 1);
      const y0: f32 = S - pad - (unchecked(this.history[pIdx]) / 100.0) * (S - pad * 2);
      const x1: f32 = pad + stepX * <f32>(i);
      const y1: f32 = S - pad - (unchecked(this.history[cIdx]) / 100.0) * (S - pad * 2);
      ctx.drawLine(x0, y0, x1, y1, SPARK_LINE, 2.0);
    }
  }
}

const PIE1 = rgba(58, 108, 197, 220);
const PIE2 = rgba(58, 197, 108, 220);
const PIE3 = rgba(197, 108, 58, 220);
const PIE4 = rgba(158, 58, 197, 220);

class PieChart extends CustomDrawable {
  private v0: f32 = 0; private v1: f32 = 0;
  private v2: f32 = 0; private v3: f32 = 0;
  private title: TextLayout | null = null;

  constructor() {
    super();
    this.width(300).height(300);
    this.title = createPlotTitle(this, "Pie chart");
  }

  pushValues(a: f32, b: f32, c: f32, d: f32): void {
    this.v0 = a; this.v1 = b; this.v2 = c; this.v3 = d; this.markDirty();
  }

  draw(ctx: DrawContext): void {
    const b = this.getBounds();
    const S: f32 = b[2]; const cx: f32 = S / 2.0; const cy: f32 = S / 2.0;
    const R: f32 = S * 0.4;
    ctx.drawRoundRect(0, 0, S, S, 12, 12, Paint.fill(CARD));
    drawPlotTitle(ctx, this.title);
    // Draw wedges from center using triangle fan approximation
    const total: f32 = this.v0 + this.v1 + this.v2 + this.v3;
    if (total <= 0) return;
    const vals: StaticArray<f32> = [this.v0, this.v1, this.v2, this.v3];
    const colors: StaticArray<u32> = [PIE1, PIE2, PIE3, PIE4];
    let startAngle: f32 = -90.0;
    const steps: i32 = 10;
    for (let w: i32 = 0; w < 4; w++) {
      const sweep: f32 = (vals[w] / total) * 360.0;
      if (sweep < 1.0) { startAngle += sweep; continue; }
      const da: f32 = sweep / <f32>steps;
      for (let i: i32 = 0; i < steps; i++) {
        const a0: f64 = <f64>(startAngle + da * <f32>i) * Math.PI / 180.0;
        const a1: f64 = <f64>(startAngle + da * <f32>(i + 1)) * Math.PI / 180.0;
        const x1: f32 = cx + R * <f32>Math.cos(a0);
        const y1: f32 = cy + R * <f32>Math.sin(a0);
        const x2: f32 = cx + R * <f32>Math.cos(a1);
        const y2: f32 = cy + R * <f32>Math.sin(a1);
        ctx.drawLine(cx, cy, x1, y1, colors[w], 1.0);
        ctx.drawLine(cx, cy, x2, y2, colors[w], 1.0);
        ctx.drawLine(x1, y1, x2, y2, colors[w], 1.0);
      }
      startAngle += sweep;
    }
    ctx.drawCircle(cx, cy, R, Paint.stroke(GRAY, 1));
  }
}

const SCAT1 = rgba(58, 108, 197, 255);
const SCAT2 = rgba(58, 197, 108, 255);
const SCAT3 = rgba(197, 108, 58, 255);
const SCAT4 = rgba(255, 180, 60, 255);

class ScatterPlot extends CustomDrawable {
  private x0: f32 = 0; private y0: f32 = 0;
  private x1: f32 = 0; private y1: f32 = 0;
  private x2: f32 = 0; private y2: f32 = 0;
  private x3: f32 = 0; private y3: f32 = 0;
  private title: TextLayout | null = null;
  private l0: DynamicTextLayout | null = null;
  private l1: DynamicTextLayout | null = null;
  private l2: DynamicTextLayout | null = null;
  private l3: DynamicTextLayout | null = null;

  constructor() {
    super();
    this.width(300).height(300);
    this.title = createPlotTitle(this, "Scatter plot");
    this.l0 = createDynamicMonoLabel(this, rgba(220, 232, 255, 230));
    this.l1 = createDynamicMonoLabel(this, rgba(220, 255, 232, 230));
    this.l2 = createDynamicMonoLabel(this, rgba(255, 232, 220, 230));
    this.l3 = createDynamicMonoLabel(this, rgba(255, 238, 190, 230));
  }

  pushValues(a: f32, b: f32, c: f32, d: f32): void {
    // Map [-1..1] to screen coords
    const bnds = this.getBounds();
    const S: f32 = bnds[2]; const pad: f32 = 30;
    const scale: f32 = (S - pad * 2) / 2.0;
    const cx: f32 = S / 2.0; const cy: f32 = S / 2.0;
    this.x0 = cx + a * scale; this.y0 = cy + b * scale;
    this.x1 = cx + c * scale; this.y1 = cy + a * scale * 0.7;
    this.x2 = cx + b * scale; this.y2 = cy + d * scale;
    this.x3 = cx + d * scale; this.y3 = cy + c * scale * 0.7;
    if (this.l0 !== null) this.l0!.setText(formatTenths(a) + "," + formatTenths(b));
    if (this.l1 !== null) this.l1!.setText(formatTenths(c) + "," + formatTenths(a * 0.7));
    if (this.l2 !== null) this.l2!.setText(formatTenths(b) + "," + formatTenths(d));
    if (this.l3 !== null) this.l3!.setText(formatTenths(d) + "," + formatTenths(c * 0.7));
    this.markDirty();
  }

  draw(ctx: DrawContext): void {
    const b = this.getBounds();
    const S: f32 = b[2];
    ctx.drawRoundRect(0, 0, S, S, 12, 12, Paint.fill(CARD));
    drawPlotTitle(ctx, this.title);
    // Faint connecting lines
    ctx.drawLine(this.x0, this.y0, this.x1, this.y1, rgba(255, 255, 255, 30), 0.5);
    ctx.drawLine(this.x1, this.y1, this.x2, this.y2, rgba(255, 255, 255, 30), 0.5);
    ctx.drawLine(this.x2, this.y2, this.x3, this.y3, rgba(255, 255, 255, 30), 0.5);
    ctx.drawLine(this.x3, this.y3, this.x0, this.y0, rgba(255, 255, 255, 30), 0.5);
    // Dots
    ctx.drawCircle(this.x0, this.y0, 6, Paint.fill(SCAT1));
    ctx.drawCircle(this.x1, this.y1, 6, Paint.fill(SCAT2));
    ctx.drawCircle(this.x2, this.y2, 6, Paint.fill(SCAT3));
    ctx.drawCircle(this.x3, this.y3, 6, Paint.fill(SCAT4));
    drawDynamicLabel(ctx, this.l0, this.x0 + 8, this.y0 - 24);
    drawDynamicLabel(ctx, this.l1, this.x1 + 8, this.y1 - 24);
    drawDynamicLabel(ctx, this.l2, this.x2 + 8, this.y2 - 24);
    drawDynamicLabel(ctx, this.l3, this.x3 + 8, this.y3 - 24);
  }
}

const YARN_A = rgba(255, 114, 168, 230);
const YARN_B = rgba(116, 222, 255, 230);
const YARN_C = rgba(255, 216, 111, 230);

function clampUnit(value: f32): f32 {
  if (value < 0.0) return 0.0;
  if (value > 1.0) return 1.0;
  return value;
}

function lerpF32(a: f32, b: f32, t: f32): f32 {
  return a + ((b - a) * t);
}

function fadeNoise(t: f32): f32 {
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

function hash3(ix: i32, iy: i32, iz: i32): f32 {
  let h = ix * 374761393 + iy * 668265263 + iz * 2147483647;
  h = (h ^ (h >> 13)) * 1274126177;
  h = h ^ (h >> 16);
  return <f32>(h & 0x7fffffff) / 2147483647.0;
}

function valueNoise3(x: f32, y: f32, z: f32): f32 {
  const ix = <i32>Math.floor(<f64>x);
  const iy = <i32>Math.floor(<f64>y);
  const iz = <i32>Math.floor(<f64>z);
  const fx = x - <f32>ix;
  const fy = y - <f32>iy;
  const fz = z - <f32>iz;
  const ux = fadeNoise(fx);
  const uy = fadeNoise(fy);
  const uz = fadeNoise(fz);

  const x00 = lerpF32(hash3(ix, iy, iz), hash3(ix + 1, iy, iz), ux);
  const x10 = lerpF32(hash3(ix, iy + 1, iz), hash3(ix + 1, iy + 1, iz), ux);
  const x01 = lerpF32(hash3(ix, iy, iz + 1), hash3(ix + 1, iy, iz + 1), ux);
  const x11 = lerpF32(hash3(ix, iy + 1, iz + 1), hash3(ix + 1, iy + 1, iz + 1), ux);
  const y0 = lerpF32(x00, x10, uy);
  const y1 = lerpF32(x01, x11, uy);
  return lerpF32(y0, y1, uz);
}

function yarnColor(t: f32): u32 {
  const wave = <f32>Math.sin(<f64>(t * Math.PI * 2.0));
  const warm = clampUnit(0.5 + wave * 0.5);
  const cool = 1.0 - warm;
  const r = <u32>Math.round(116.0 * cool + 255.0 * warm);
  const g = <u32>Math.round(222.0 * cool + 132.0 * warm);
  const b = <u32>Math.round(255.0 * cool + 150.0 * warm);
  return rgba(r, g, b, 230);
}

class DancingYarn extends CustomDrawable {
  private title: TextLayout | null = null;
  private nx: f32 = 0.0;
  private ny: f32 = 2.7;
  private nz: f32 = 5.1;
  private dx: f32 = 1.0;
  private dy: f32 = 1.0;
  private dz: f32 = -1.0;
  private dragging: bool = false;
  private pointerX: f32 = 150.0;
  private pointerY: f32 = 150.0;
  private pull: f32 = 0.0;

  constructor() {
    super();
    this.width(300).height(300)
      .semanticRole(SemanticRole.Image)
      .semanticLabel("Dancing yarn interactive noise panel")
      .nodeId("widget-yarn");
    this.title = createPlotTitle(this, "Dancing yarn");
    this.onPointerDown(onYarnD);
    this.onPointerMove(onYarnM);
    this.onPointerUp(onYarnU);
    this.onPointerCancel(onYarnC);
  }

  pointerDown(x: f32, y: f32): void {
    this.capturePointer();
    this.dragging = true;
    this.pointerX = x;
    this.pointerY = y;
    this.pull = 1.0;
    this.markDirty();
  }

  pointerMove(x: f32, y: f32): void {
    if (!this.dragging) return;
    this.pointerX = x;
    this.pointerY = y;
    this.pull = 1.0;
    this.markDirty();
  }

  pointerUp(): void {
    this.dragging = false;
    this.releasePointer();
    this.markDirty();
  }

  tick(): void {
    this.nx += 0.032 * this.dx;
    this.ny += 0.021 * this.dy;
    this.nz += 0.027 * this.dz;
    if (this.nx > 9.0) { this.nx = 9.0; this.dx = -1.0; }
    if (this.nx < 0.0) { this.nx = 0.0; this.dx = 1.0; }
    if (this.ny > 9.0) { this.ny = 9.0; this.dy = -1.0; }
    if (this.ny < 0.0) { this.ny = 0.0; this.dy = 1.0; }
    if (this.nz > 9.0) { this.nz = 9.0; this.dz = -1.0; }
    if (this.nz < 0.0) { this.nz = 0.0; this.dz = 1.0; }
    if (!this.dragging && this.pull > 0.0) {
      this.pull *= 0.88;
      if (this.pull < 0.02) this.pull = 0.0;
    }
    this.markDirty();
  }

  draw(ctx: DrawContext): void {
    const b = this.getBounds();
    const S: f32 = b[2];
    const cx: f32 = S / 2.0;
    const cy: f32 = S / 2.0 + 8.0;
    const steps: i32 = 132;
    const pointerBiasY = (this.pointerX / S - 0.5) * 1.7 * this.pull;
    const pointerBiasZ = (this.pointerY / S - 0.5) * 1.7 * this.pull;

    ctx.drawRoundRect(0, 0, S, S, 12, 12, Paint.fill(CARD));
    drawPlotTitle(ctx, this.title);
    ctx.save();
    ctx.clipRoundRect(0, 0, S, S, 12);
    ctx.drawCircle(this.pointerX, this.pointerY, 22.0 + 10.0 * this.pull, Paint.stroke(rgba(255, 255, 255, <u32>Math.round(36.0 + 70.0 * this.pull)), 1.0));

    let prevX: f32 = 0.0;
    let prevY: f32 = 0.0;
    for (let i: i32 = 0; i < steps; i++) {
      const t: f32 = <f32>i / <f32>(steps - 1);
      const xBase: f32 = 28.0 + t * (S - 56.0);
      const centered: f32 = (t - 0.5) * 2.0;
      const envelope: f32 = 1.0 - centered * centered;
      const n0: f32 = valueNoise3(t * 4.2 + this.nx, this.ny + pointerBiasY, this.nz + pointerBiasZ);
      const n1: f32 = valueNoise3(t * 5.6 + this.nx + 6.0, this.ny + 3.0 + pointerBiasY, this.nz + 1.4 + pointerBiasZ);
      const n2: f32 = valueNoise3(t * 7.3 + this.nx + 2.0, this.ny + 8.0 + pointerBiasY, this.nz + 4.0 + pointerBiasZ);
      const angle: f32 = (n0 * 2.0 - 1.0) * <f32>Math.PI * 1.35;
      const radius: f32 = (24.0 + n1 * 46.0) * (0.35 + envelope * 0.95);
      let x: f32 = <f32>(xBase + <f32>Math.cos(<f64>angle) * radius * 0.72);
      let y: f32 = <f32>(cy + <f32>Math.sin(<f64>angle) * radius + (n2 - 0.5) * 42.0);

      const pdx = this.pointerX - x;
      const pdy = this.pointerY - y;
      const dist = <f32>Math.sqrt(<f64>(pdx * pdx + pdy * pdy));
      let influence = 1.0 - dist / 145.0;
      if (influence < 0.0) influence = 0.0;
      influence = influence * influence * this.pull;
      x += <f32>(pdx * influence * 0.62);
      y += <f32>(pdy * influence * 0.62);
      x += <f32>(<f32>Math.sin(<f64>(t * 18.0 + this.nz)) * influence * 20.0);
      y += <f32>(<f32>Math.cos(<f64>(t * 17.0 + this.ny)) * influence * 20.0);

      if (i > 0) {
        const color = yarnColor(t + this.nx * 0.07);
        const stroke: f32 = <f32>(1.3 + n2 * 2.2 + influence * 1.4);
        ctx.drawLine(prevX, prevY, x, y, color, stroke);
      }
      if (i % 19 == 0) {
        ctx.drawCircle(x, y, <f32>(2.2 + n1 * 2.2), Paint.fill(i % 38 == 0 ? YARN_C : YARN_A));
      }
      prevX = x;
      prevY = y;
    }

    ctx.drawCircle(cx, cy, 76, Paint.stroke(rgba(255, 255, 255, 22), 1.0));
    ctx.restore();
  }
}

function buildPage(): Node {
  Application.caption("EffinDOM FUI-AS Demo • Immediate Drawing");
  demo.init();
  onLoaded((_event): void => {
    scheduleTimer(0, 25, tick);
    const label = new RichText([
      span("Draw ").color(rgba(235, 238, 245, 210)).italic(),
      span("here").fontSize(30.0).color(rgb(58, 197, 108)).fontFamily(activeTheme.value.fonts.monoFamily).bold().underline(),
      span(" on this canvas!").color(rgba(235, 238, 245, 210)).bold(),
    ])
      .fontFamily(activeTheme.value.fonts.bodyFamily)
      .fontSize(24)
      .width(268)
      .height(268) as RichText;
    label.build();
    Bitmap.onTextReadyWith<PaintCanvas>(demo.paintCanvas!, label, (canvas: PaintCanvas, event): void => {
      canvas.setHintLabel(changetype<Text>(event.node));
    });
  });
  return new FlexBox()
    .flexDirection(FlexDirection.Column)
    .fillSize()
    .bgColor(rgba(20, 20, 40, 255))
    .padding(24, 24, 24, 24)
    .child(
      new FlexBox()
        .flexDirection(FlexDirection.Row)
        .flexWrap(FlexWrap.Wrap)
        .fillSize()
        .child(demo.gauge!.margin(0, 0, 0, 16))
        .child(new FlexBox().width(16).height(1))
        .child(demo.chart!.margin(0, 0, 0, 16))
        .child(new FlexBox().width(16).height(1))
        .child(demo.wave!.margin(0, 0, 0, 16))
        .child(new FlexBox().width(16).height(1))
        .child(demo.spark!.margin(0, 0, 0, 16))
        .child(new FlexBox().width(16).height(1))
        .child(demo.pie!.margin(0, 0, 0, 16))
        .child(new FlexBox().width(16).height(1))
        .child(demo.scatter!.margin(0, 0, 0, 16))
        .child(new FlexBox().width(16).height(1))
        .child(demo.yarn!.margin(0, 0, 0, 16))
        .child(new FlexBox().width(16).height(1))
        .child(demo.paintCanvas!.margin(0, 0, 0, 16)),
    );
}

const app = createApplication(buildPage);
