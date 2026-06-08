export function rgba(red: u32, green: u32, blue: u32, alpha: u32): u32 {
  return ((red & 0xff) << 24) | ((green & 0xff) << 16) | ((blue & 0xff) << 8) | (alpha & 0xff);
}

export function rgb(red: u32, green: u32, blue: u32): u32 {
  return rgba(red, green, blue, 0xff);
}

function clampUnit(value: f32): f32 {
  if (value < <f32>0.0) {
    return <f32>0.0;
  }
  if (value > <f32>1.0) {
    return <f32>1.0;
  }
  return value;
}

function hueToRgb(p: f32, q: f32, t: f32): f32 {
  if (t < 0.0) {
    t += 1.0;
  }
  if (t > 1.0) {
    t -= 1.0;
  }
  if (t < (1.0 / 6.0)) {
    return p + (q - p) * 6.0 * t;
  }
  if (t < (1.0 / 2.0)) {
    return q;
  }
  if (t < (2.0 / 3.0)) {
    return p + (q - p) * ((2.0 / 3.0) - t) * 6.0;
  }
  return p;
}

export function hslToColor(hue: f32, saturation: f32, lightness: f32): u32 {
  const normalizedHue = hue % 360.0;
  const h = normalizedHue < 0.0 ? normalizedHue + 360.0 : normalizedHue;
  const s = clampUnit(saturation);
  const l = clampUnit(lightness);
  const hueFraction: f32 = h / <f32>360.0;
  if (s <= 0.0) {
    const channel = <u32>(l * 255.0);
    return rgb(channel, channel, channel);
  }

  const q: f32 = l < <f32>0.5 ? l * (<f32>1.0 + s) : l + s - (l * s);
  const p: f32 = (<f32>2.0 * l) - q;
  const red = <u32>(clampUnit(hueToRgb(p, q, hueFraction + <f32>(1.0 / 3.0))) * 255.0);
  const green = <u32>(clampUnit(hueToRgb(p, q, hueFraction)) * 255.0);
  const blue = <u32>(clampUnit(hueToRgb(p, q, hueFraction - <f32>(1.0 / 3.0))) * 255.0);
  return rgb(red, green, blue);
}

function colorRed(color: u32): u32 {
  return (color >>> 24) & 0xff;
}

function colorGreen(color: u32): u32 {
  return (color >>> 16) & 0xff;
}

function colorBlue(color: u32): u32 {
  return (color >>> 8) & 0xff;
}

function colorAlpha(color: u32): u32 {
  return color & 0xff;
}

function mixChannel(from: u32, to: u32, amount: f32): u32 {
  const weight = clampUnit(amount);
  return <u32>Math.round(<f32>from + ((<f32>to - <f32>from) * weight));
}

export function mixColor(from: u32, to: u32, amount: f32): u32 {
  return rgba(
    mixChannel(colorRed(from), colorRed(to), amount),
    mixChannel(colorGreen(from), colorGreen(to), amount),
    mixChannel(colorBlue(from), colorBlue(to), amount),
    mixChannel(colorAlpha(from), colorAlpha(to), amount),
  );
}
