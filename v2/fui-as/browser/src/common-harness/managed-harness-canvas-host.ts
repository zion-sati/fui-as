import type { BridgeRuntime } from '@effindomv2/runtime';
import { normalizePointerForWasm, pointerToHeapOffset } from '@effindomv2/runtime';

interface ManagedHarnessCanvasHostDependencies {
  getRuntime(): BridgeRuntime;
  writeAppBytes(ptr: number, capacity: number, bytes: Uint8Array, context: string): number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any;

export function createManagedHarnessCanvasHost(deps: ManagedHarnessCanvasHostDependencies) {
  const surfaces = new Map<number, number>();
  const core = () => deps.getRuntime().core as unknown as Record<string, AnyFn>;
  const ptr = (p: number) => normalizePointerForWasm(deps.getRuntime().core, p);

  const I: Record<string, AnyFn> = {};

  I.fui_canvas_save = (p: number) => core()._ed_canvas_save(ptr(p));
  I.fui_canvas_restore = (p: number) => core()._ed_canvas_restore(ptr(p));
  I.fui_canvas_translate = (p: number, x: number, y: number) => core()._ed_canvas_translate(ptr(p), x, y);
  I.fui_canvas_scale = (p: number, sx: number, sy: number) => core()._ed_canvas_scale(ptr(p), sx, sy);
  I.fui_canvas_rotate = (p: number, d: number) => core()._ed_canvas_rotate(ptr(p), d);
  I.fui_canvas_clip_rect = (p: number, x: number, y: number, w: number, h: number) => core()._ed_canvas_clip_rect(ptr(p), x, y, w, h);
  I.fui_canvas_draw_rect = (p: number, x: number, y: number, w: number, h: number, fc: number, sc: number, sw: number) =>
    core()._ed_canvas_draw_rect(ptr(p), x, y, w, h, fc, sc, sw);
  I.fui_canvas_draw_circle = (p: number, cx: number, cy: number, r: number, fc: number, sc: number, sw: number) =>
    core()._ed_canvas_draw_circle(ptr(p), cx, cy, r, fc, sc, sw);
  I.fui_canvas_draw_line = (p: number, x1: number, y1: number, x2: number, y2: number, c: number, sw: number) =>
    core()._ed_canvas_draw_line(ptr(p), x1, y1, x2, y2, c, sw);
  I.fui_canvas_draw_round_rect = (p: number, x: number, y: number, w: number, h: number, rx: number, ry: number, fc: number, sc: number, sw: number) =>
    core()._ed_canvas_draw_round_rect(ptr(p), x, y, w, h, rx, ry, fc, sc, sw);
  I.fui_canvas_draw_path = (p: number, pid: number, fc: number, sc: number, sw: number) =>
    core()._ed_canvas_draw_path(ptr(p), pid, fc, sc, sw);
  I.fui_canvas_draw_text = (p: number, up: number, ul: number, x: number, y: number, fid: number, fs: number, c: number) =>
    core()._ed_canvas_draw_text(ptr(p), up, ul, x, y, fid, fs, c);
  I.fui_canvas_draw_image = (p: number, tid: number, x: number, y: number, w: number, h: number) =>
    core()._ed_canvas_draw_image(ptr(p), tid, x, y, w, h);
  I.fui_canvas_draw_svg = (p: number, sid: number, x: number, y: number, w: number, h: number) =>
    core()._ed_canvas_draw_svg(ptr(p), sid, x, y, w, h);

  I.fui_path_create = () => core()._ed_path_create();
  I.fui_path_destroy = (id: number) => core()._ed_path_destroy(id);
  I.fui_path_move_to = (id: number, x: number, y: number) => core()._ed_path_move_to(id, x, y);
  I.fui_path_line_to = (id: number, x: number, y: number) => core()._ed_path_line_to(id, x, y);
  I.fui_path_quad_to = (id: number, cx: number, cy: number, x: number, y: number) => core()._ed_path_quad_to(id, cx, cy, x, y);
  I.fui_path_cubic_to = (id: number, cx1: number, cy1: number, cx2: number, cy2: number, x: number, y: number) =>
    core()._ed_path_cubic_to(id, cx1, cy1, cx2, cy2, x, y);
  I.fui_path_close = (id: number) => core()._ed_path_close(id);
  I.fui_path_add_rect = (id: number, x: number, y: number, w: number, h: number) => core()._ed_path_add_rect(id, x, y, w, h);
  I.fui_path_add_circle = (id: number, cx: number, cy: number, r: number) => core()._ed_path_add_circle(id, cx, cy, r);

  I.fui_canvas_create_offscreen = (w: number, h: number) => {
    const id = core()._ed_canvas_create_offscreen(w, h) as number;
    if (id !== 0) surfaces.set(id, id);
    return id;
  };
  I.fui_canvas_get_offscreen_ptr = (id: number) => core()._ed_canvas_get_offscreen_canvas(id);
  I.fui_canvas_read_offscreen_pixels = (id: number, outPtr: number, w: number, h: number) => {
    const bytesLen = w * h * 4;
    const c = core();
    const bufPtr = c._malloc(bytesLen);
    try {
      c._ed_canvas_read_offscreen_pixels(id, pointerToHeapOffset(bufPtr));
      const off = pointerToHeapOffset(bufPtr);
      deps.writeAppBytes(outPtr, bytesLen, (c.HEAPU8 as unknown as Uint8Array).slice(off, off + bytesLen), 'canvas-read');
    } finally { c._free(bufPtr); }
  };
  I.fui_canvas_destroy_offscreen = (id: number) => { surfaces.delete(id); core()._ed_canvas_destroy_offscreen(id); };

  return { imports: I };
}
