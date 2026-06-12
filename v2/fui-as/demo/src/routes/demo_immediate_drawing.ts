export * from "../../../src/FuiExports";
export * from "../generated/HostEvents";

import { Node, createApplication, onLoaded } from "../../../src/Fui";
import { FlexBox } from "../../../src/nodes/FlexBox";
import { CustomDrawable } from "../../../src/nodes/CustomDrawable";
import { FlexDirection, FlexWrap } from "../../../src/core/ffi";
import { DrawContext } from "../../../src/drawing/DrawContext";
import { Paint } from "../../../src/drawing/Paint";
import { rgba } from "../../../src/color";
import { Signal } from "../../../src/core/Signal";
import { HandlerAction } from "../../../src/core/Action";
import { scheduleTimer } from "../../../src/core/Timers";


class DemoState {
  gaugeValue: f32 = 0;
  gaugeDir: f32 = 1;
  gauge: Gauge = new Gauge();
  chart: BarChart = new BarChart();
  wave: Waveform = new Waveform();
  spark: Sparkline = new Sparkline();
  pie: PieChart = new PieChart();
  scatter: ScatterPlot = new ScatterPlot();

  tick(): void {
    this.gaugeValue += this.gaugeDir * 2.0;
    if (this.gaugeValue >= 100) { this.gaugeValue = 100; this.gaugeDir = -1; }
    if (this.gaugeValue <= 0)   { this.gaugeValue = 0;   this.gaugeDir = 1;  }
    this.gauge.value.value = this.gaugeValue;
    this.chart.pushValues(
      this.gaugeValue,
      <f32>Math.abs(<f64>(this.gaugeValue - 50)) * 2.0,
      <f32>Math.sin(<f64>this.gaugeValue / 100.0 * Math.PI) * 80.0 + 20.0,
      <f32>Math.cos(<f64>this.gaugeValue / 100.0 * Math.PI * 0.7) * 60.0 + 40.0,
    );
    this.wave.pushValues(
      this.gaugeValue,
      <f32>Math.abs(<f64>(this.gaugeValue - 50)) * 2.0,
      <f32>Math.sin(<f64>this.gaugeValue / 100.0 * Math.PI) * 80.0 + 20.0,
      <f32>Math.cos(<f64>this.gaugeValue / 100.0 * Math.PI * 0.7) * 60.0 + 40.0,
    );
    this.spark.push(this.gaugeValue);
    this.pie.pushValues(
      this.gaugeValue,
      <f32>Math.abs(<f64>(this.gaugeValue - 50)) * 2.0,
      <f32>Math.sin(<f64>this.gaugeValue / 100.0 * Math.PI) * 40.0 + 30.0,
      <f32>Math.cos(<f64>this.gaugeValue / 100.0 * Math.PI * 0.7) * 30.0 + 20.0,
    );
    this.scatter.pushValues(
      <f32>Math.sin(<f64>this.gaugeValue / 100.0 * Math.PI * 2),
      <f32>Math.cos(<f64>this.gaugeValue / 100.0 * Math.PI * 2),
      <f32>Math.sin(<f64>this.gaugeValue / 100.0 * Math.PI * 3),
      <f32>Math.sin(<f64>this.gaugeValue / 100.0 * Math.PI * 1.5),
    );
    scheduleTimer(0, 25, tick);
  }
}

let demo = new DemoState();

function tick(): void { demo.tick(); }

const ACCENT = rgba(58, 108, 197, 255);
const GRAY   = rgba(200, 200, 200, 255);
const NEEDLE = rgba(220, 50, 50, 255);
const CARD   = rgba(35, 35, 50, 255);

class Gauge extends CustomDrawable {
  value: Signal<f32> = new Signal<f32>(0);

  constructor() {
    super();
    this.width(300).height(300);
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

  constructor() { super(); this.width(300).height(300); }

  pushValues(a: f32, b: f32, c: f32, d: f32): void {
    this.v0 = a; this.v1 = b; this.v2 = c; this.v3 = d; this.markDirty();
  }

  draw(ctx: DrawContext): void {
    const b = this.getBounds();
    const S: f32 = b[2]; const pad: f32 = 14; const barW: f32 = 48; const gap: f32 = 16;
    const baseY: f32 = S - pad;
    ctx.drawRoundRect(0, 0, S, S, 12, 12, Paint.fill(CARD));
    // Bars
    const x0: f32 = pad;
    const x1: f32 = pad + (barW + gap);
    const x2: f32 = pad + (barW + gap) * 2;
    const x3: f32 = pad + (barW + gap) * 3;
    ctx.drawRect(x0, baseY - (this.v0 / 100.0) * (S - pad * 2), barW, (this.v0 / 100.0) * (S - pad * 2), Paint.fill(BAR1));
    ctx.drawRect(x1, baseY - (this.v1 / 100.0) * (S - pad * 2), barW, (this.v1 / 100.0) * (S - pad * 2), Paint.fill(BAR2));
    ctx.drawRect(x2, baseY - (this.v2 / 100.0) * (S - pad * 2), barW, (this.v2 / 100.0) * (S - pad * 2), Paint.fill(BAR3));
    ctx.drawRect(x3, baseY - (this.v3 / 100.0) * (S - pad * 2), barW, (this.v3 / 100.0) * (S - pad * 2), Paint.fill(BAR4));
  }
}

const WAVE_LINE = rgba(58, 197, 158, 255);
const WAVE_DIM  = rgba(58, 197, 158, 60);

class Waveform extends CustomDrawable {
  private v0: f32 = 0; private v1: f32 = 0;
  private v2: f32 = 0; private v3: f32 = 0;

  constructor() { super(); this.width(300).height(300); }

  pushValues(a: f32, b: f32, c: f32, d: f32): void {
    this.v0 = a; this.v1 = b; this.v2 = c; this.v3 = d; this.markDirty();
  }

  draw(ctx: DrawContext): void {
    const b = this.getBounds();
    const S: f32 = b[2]; const pad: f32 = 14; const mid: f32 = S / 2.0; const amp: f32 = S * 0.33;
    const steps: i32 = 40;
    ctx.drawRoundRect(0, 0, S, S, 12, 12, Paint.fill(CARD));
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

  constructor() { super(); this.width(300).height(300); }

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

  constructor() { super(); this.width(300).height(300); }

  pushValues(a: f32, b: f32, c: f32, d: f32): void {
    this.v0 = a; this.v1 = b; this.v2 = c; this.v3 = d; this.markDirty();
  }

  draw(ctx: DrawContext): void {
    const b = this.getBounds();
    const S: f32 = b[2]; const cx: f32 = S / 2.0; const cy: f32 = S / 2.0;
    const R: f32 = S * 0.4;
    ctx.drawRoundRect(0, 0, S, S, 12, 12, Paint.fill(CARD));
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

  constructor() { super(); this.width(300).height(300); }

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
    this.markDirty();
  }

  draw(ctx: DrawContext): void {
    const b = this.getBounds();
    const S: f32 = b[2];
    ctx.drawRoundRect(0, 0, S, S, 12, 12, Paint.fill(CARD));
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
  }
}

function buildPage(): Node {
  onLoaded((): void => { scheduleTimer(0, 25, tick); });
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
        .child(demo.gauge.margin(0, 0, 0, 16))
        .child(new FlexBox().width(16).height(1))
        .child(demo.chart.margin(0, 0, 0, 16))
        .child(new FlexBox().width(16).height(1))
        .child(demo.wave.margin(0, 0, 0, 16))
        .child(new FlexBox().width(16).height(1))
        .child(demo.spark.margin(0, 0, 0, 16))
        .child(new FlexBox().width(16).height(1))
        .child(demo.pie.margin(0, 0, 0, 16))
        .child(new FlexBox().width(16).height(1))
        .child(demo.scatter.margin(0, 0, 0, 16)),
    );
}

const app = createApplication(buildPage);
