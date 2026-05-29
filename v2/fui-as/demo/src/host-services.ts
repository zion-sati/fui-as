import { defineHostServices, hostService } from "../../browser/src/host-services";
import { readDemoShellState } from "./host-service-state";

function hueToHex(hue: number): string {
  const saturation = 0.72;
  const lightness = 0.45;
  const chroma = (1 - Math.abs((2 * lightness) - 1)) * saturation;
  const segment = hue / 60;
  const second = chroma * (1 - Math.abs((segment % 2) - 1));
  let red = 0;
  let green = 0;
  let blue = 0;
  if (segment < 1) {
    red = chroma;
    green = second;
  } else if (segment < 2) {
    red = second;
    green = chroma;
  } else if (segment < 3) {
    green = chroma;
    blue = second;
  } else if (segment < 4) {
    green = second;
    blue = chroma;
  } else if (segment < 5) {
    red = second;
    blue = chroma;
  } else {
    red = chroma;
    blue = second;
  }
  const match = lightness - (chroma / 2);
  const toHexByte = (value: number): string => {
    const byte = Math.max(0, Math.min(255, Math.round((value + match) * 255)));
    return byte.toString(16).padStart(2, "0");
  };
  return `#${toHexByte(red)}${toHexByte(green)}${toHexByte(blue)}`;
}

export const demoHostServices = defineHostServices({
  demoShell: {
    wallClockSinceEpochMs: hostService({
      args: [] as const,
      returns: "f64",
      implementation() {
        return Date.now();
      },
    }),
    clockTickSeconds: hostService({
      args: [] as const,
      returns: "i32",
      implementation() {
        return readDemoShellState().tick;
      },
    }),
    accentColorHex: hostService({
      args: [] as const,
      returns: "string",
      implementation() {
        return hueToHex(readDemoShellState().hue);
      },
    }),
    isDarkMode: hostService({
      args: [] as const,
      returns: "bool",
      implementation() {
        return readDemoShellState().darkMode;
      },
    }),
  },
});
