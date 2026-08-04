# FUI AssemblyScript API Reference (v2)

This page documents the public SDK surface exported by:

- `v2/fui-as/src/Fui.ts`
- `v2/fui-as/src/FuiPrimitives.ts`
- `v2/fui-as/src/FuiExports.ts`
- `v2/fui-as/src/FuiWorkerExports.ts`
- `v2/fui-as/src/FuiWorker.ts` (compatibility worker re-export)

For control/node usage guidance, see [Controls and nodes](./CONTROLS_AND_NODES.md).
For the full SDK docs index, see [SDK docs index](./SDK_INDEX.md).

## Canonical app entry modules

- App SDK: `./Fui`
- Custom-control primitives: `./FuiPrimitives`
- Runtime bridge exports: `./FuiExports`
- Worker runtime bridge exports: `./FuiWorkerExports`
- Compatibility worker barrel: `./FuiWorker`

## Public barrel policy

- Use `./Fui` for standard application code (controls, nodes, theming, file/fetch/worker APIs, timers).
- Use `./FuiPrimitives` for low-level custom-control authoring helpers:
  - callback binders (`bind0`, `bind1`, `bind2`, `bindResult0`, `bindResult1`)
  - callback base types (`Callback0/1/2`, `ResultCallback0/1`)
  - retained helpers (`clearCurrentSelection`, `tryGetBounds`)
  - host-service string-buffer helpers (`hostServiceResultBufferPtr`, `hostServiceResultBufferSize`, `decodeHostServiceStringResult`)
- For node-local geometry math in custom controls, prefer `Node` methods from `./Fui`:
  - `getBounds()`
  - `absoluteToLocalPosition(x, y)`
  - `localToAbsolutePosition(x, y)`
- Use `./FuiWorker` inside worker modules.
- Avoid internal imports from `src/core/*`, `src/bindings/*`, and `src/host-services/*` in app/demo code.

## Node handle lifecycle contract (custom controls)

`Node` objects and retained UI handles intentionally have different lifetimes.

- A `Node` instance can exist and be mutated before it has a retained handle.
- `builtHandle` is valid only while that node is currently built into the retained tree.
- `dispose()` invalidates the handle for that instance until/unless it is built again.
- App/runtime reset paths (`ui.reset` / harness `_ui_reset`) invalidate retained handles while app object graphs may continue to exist.

Important implication: an invalid handle does **not** mean "the app is not running."

- Pre-build fluent setup is expected (`new FlexBox().width(...).child(...)`).
- Detached/pool/recycled nodes are expected during runtime flows (for example overlay/popup/virtualized surfaces).
- Route changes or theme/viewport events may continue while some nodes are unbuilt.
- Device-loss recovery is primarily a renderer/backend concern and does not itself define the Node-handle lifecycle contract.

### Bridge influence vs framework architecture

This behavior is influenced by the bridge layer, but it is also an intentional SDK architecture choice.

- The bridge makes handle creation/reset/disposal boundaries explicit (`build`, `ui.reset`, `_ui_reset`, `dispose`).
- Conventional frameworks like WPF/Avalonia/SwiftUI also have unrealized/detached phases, but they usually hide native-handle churn behind framework-managed object lifecycles.
- In FUI-AS we keep node objects mutable across those phases by design, and model retained handles as ephemeral runtime bindings.

**Bottom line:** this is not an accidental bridge leak; it is the chosen control-authoring model.

### Best practices for custom controls

1. Treat retained handles as ephemeral implementation detail; keep your source of truth in control fields.
2. Write mutators so they always update local state, then push to retained UI only when built.
3. For handle-dependent subclass logic, guard with `hasBuiltHandle()` and use no-op/default behavior when unbuilt.
4. Use `getBounds()`, `absoluteToLocalPosition(...)`, and `localToAbsolutePosition(...)` for geometry; they are safe before build and after invalidation.
5. Use `dispose()` for cleanup and ensure owned subscriptions/resources are disposed there; do not rely on a separate `destroy()` lifecycle.
6. Avoid direct imports of internal FFI/runtime modules for app-level custom controls; prefer public `./Fui` and `./FuiPrimitives` surfaces.
7. Do not cache raw handles across mount/unmount/reset cycles.

## Node Input Events

Wheel and pointer input are exposed through the public `./Fui` barrel:

- `WheelEventArgs`
- `WheelDeltaMode`
- `Node.onWheel(handler)`
- `Node.onWheelWith(owner, handler)`
- `PointerEventArgs`
- `PointerType`
- `PointerEventType`
- `Node.onPointerDownEvent(handler)` / `Node.onPointerDownEventWith(owner, handler)`
- `Node.onPointerMoveEvent(handler)` / `Node.onPointerMoveEventWith(owner, handler)`
- `Node.onPointerUpEvent(handler)` / `Node.onPointerUpEventWith(owner, handler)`
- `Node.onPointerEnterEvent(handler)` / `Node.onPointerEnterEventWith(owner, handler)`
- `Node.onPointerLeaveEvent(handler)` / `Node.onPointerLeaveEventWith(owner, handler)`
- `Node.onPointerCancelEvent(handler)` / `Node.onPointerCancelEventWith(owner, handler)`
- `GestureEventKind`
- `Node.panGesture(handler)` / `Node.panGestureWith(owner, handler)`
- `PanGestureEventArgs`
- `Node.pinchGesture(handler)` / `Node.pinchGestureWith(owner, handler)`
- `PinchGestureEventArgs`
- `LongPressGesture`
- `LongPressEventArgs`
- `Node.longPressGesture(handler)` / `Node.longPressGestureWith(owner, handler)`
- `Node.longPressRecognizer(gesture)`
- `GestureEventPhase`
- `GestureEventArgs`

Wheel events route to the deepest enabled target first, then bubble through
enabled ancestors. Coordinates are node-local for the current handler via
`event.x` and `event.y`; scene coordinates are available as `event.sceneX` and
`event.sceneY`.

```ts
node.onWheel((event: WheelEventArgs): void => {
  if (shouldOwnWheel(event)) {
    event.handled = true;
  }
});
```

Setting `event.handled = true` stops bubbling and prevents framework defaults
such as ScrollView wheel scrolling or zoomed-page viewport panning. If the event
is not handled, the existing framework defaults run: scrollable content moves
first when it can, then zoomed page viewport pan runs as fallback.

Pointer events use the same deepest-enabled-target-first bubbling model.
`PointerEventArgs` carries local coordinates (`x`, `y`), scene coordinates
(`sceneX`, `sceneY`), `pointerId`, `pointerType`, `button`, `buttons`,
`modifiers`, `pressure`, `width`, and `height`. `PointerEventType.Cancel` is
delivered for browser `pointercancel` and clears capture/pressed state.

```ts
node.onPointerDownEvent((event: PointerEventArgs): void => {
  if (event.pointerType === PointerType.Pen) {
    event.handled = true;
  }
});
```

Setting `event.handled = true` stops pointer bubbling and suppresses framework
pointer defaults such as secondary-button context-menu fallback. Disabled nodes
are skipped during hit testing, so events route to the nearest enabled ancestor.

Gesture recognizers are explicit opt-in events for custom controls that want to
own two-finger pan and/or pinch without blocking page zoom behavior they did not
claim. Prefer the typed recognizer helpers:

```ts
node
  .panGesture((event: PanGestureEventArgs): void => {
    if (event.phase === GestureEventPhase.Update) {
      panBy(event.deltaX, event.deltaY);
      event.handled = true;
    }
  })
  .pinchGesture((event: PinchGestureEventArgs): void => {
    if (event.phase === GestureEventPhase.Update) {
      zoomTo(event.scale);
      event.handled = true;
    }
  })
  .longPressGesture((event: LongPressEventArgs): void => {
    showContextAction(event.x, event.y);
    event.handled = true;
  });
```

`PanGestureEventArgs` and `PinchGestureEventArgs` carry local coordinates
(`x`, `y`), scene coordinates (`sceneX`, `sceneY`), centroid movement
(`deltaX`, `deltaY`), absolute gesture `scale`, `pointerCount`, `kind`
(`Pan` or `Pinch`), and `phase` (`Begin`, `Update`, `End`, `Cancel`). Calling
`panGesture(...)` or `pinchGesture(...)` automatically opts the node into that
recognizer. If a gesture starts on a candidate node but resolves to an
unclaimed intent, framework page zoom/pan continues from the original gesture
baseline.

Gesture recognizers follow the same ownership contract as pointer and wheel
events. The app receives the routed gesture first. If a handler sets
`event.handled = true`, bubbling stops and framework defaults such as page zoom
are suppressed. If no handler marks the gesture handled, framework defaults can
continue while routed gesture events keep flowing to the app.

`longPressGesture(...)` recognizes touch and pen pointer presses after the
default `500ms` delay with a default `10px` movement tolerance. Use
`longPressRecognizer(...)` with `LongPressGesture` when a control needs custom
recognition timing:

```ts
node.longPressRecognizer(
  LongPressGesture.create()
    .minimumDuration(650)
    .movementTolerance(14.0)
    .onRecognized((event: LongPressEventArgs): void => {
      showContextAction(event.x, event.y);
      event.handled = true;
    }),
);
```

The bridge cancels the pending recognizer when the pointer is released early,
cancelled, leaves the canvas, moves beyond tolerance, starts touch scrolling, or
a second pointer starts a pan/pinch gesture.
`LongPressEventArgs` carries local coordinates (`x`, `y`), scene coordinates
(`sceneX`, `sceneY`), `pointerId`, `pointerType`, `modifiers`, `durationMs`,
and `handled`.

Use recognizer helpers for public app code. The lower-level intent ABI remains
an internal bridge detail.

## Application/runtime setup

- `Application`
- `ApplicationRegistration`
- `PageZoomMode`
- `ContextMenuManager`
- `Worker`
- `WorkerRuntime`
- `createApplication`
- `createManagedApplication`
- `showKeyboardFocusForKeyEvent`

Use `Application.pageZoom(PageZoomMode.Enabled)` or
`Application.pageZoom(PageZoomMode.Disabled)` for application-owned page zoom.
The packaged default can be set with `application.pageZoom` in
`fui-config.json`; application code wins when both are present.
Page zoom is enabled by default on web and native. Disabling it resets the
application viewport to identity while preserving control-owned pinch gestures
and ordinary wheel/scroll input. Native hosts normalize platform magnification
into the same control-first fallback contract used by browser trackpads and
touchscreens.

Browser harness configuration also accepts debug/runtime options from
`@effindomv2/runtime`: `buildMode` (`"debug"` or `"release"`) and
`devToolsDomMirror` (`"disabled"`, `"enabled"`, or `"on-requested"`). Generated
templates emit only `buildMode`; debug defaults to on-requested and release
defaults to disabled for the DevTools DOM Mirror. See
[DevTools DOM Mirror](../browser-bridge/DEVTOOLS_DOM_MIRROR.md).

Runtime config helpers exported by `@effindomv2/runtime`:

- `BuildMode`
- `DevToolsDomMirrorMode`
- `createRuntimeConfig`
- `applyRuntimeConfig`
- `createRuntimeConfigScript`
- `normalizeBuildMode`
- `normalizeDevToolsDomMirrorMode`
- `normalizeRuntimeConfig`
- `resolveDevToolsDomMirrorConfig`

## Runtime bridge exports (`FuiExports`)

This section lists the production/runtime exports intended for app hosting. Internal debug-only harness exports are intentionally excluded.

- `__runApp`
- `__disposeApp`
- `__flushRenders`
- `__fui_on_external_drag_event`
- `__fui_key_buffer`
- `__fui_text_buffer`
- `__fui_text_buffer_size`

## Worker runtime bridge exports (`FuiWorkerExports`)

Worker entrypoint files should re-export `./FuiWorkerExports` so the browser
worker bootstrap can call back into the wasm module.

- `__fui_worker_text_buffer`
- `__fui_worker_text_buffer_size`
- `__fui_on_fetch_complete`
- `__fui_on_fetch_error`
- `__fui_on_file_pick_result`
- `__fui_on_file_read_result`
- `__fui_on_file_save_result`
- `__fui_on_file_writer_created`
- `__fui_on_file_write_result`
- `__fui_on_file_finish_result`
- `__fui_on_file_worker_process_progress`
- `__fui_on_file_worker_process_complete`
- `__fui_on_file_worker_process_error`
- `__fui_on_pointer_event`
- `__fui_on_pointer_event_with_metadata`
- `__fui_on_focus_changed`
- `__fui_on_key_event`
- `__fui_on_scroll`
- `__fui_on_wheel_event`
- `__fui_resolve_gesture_owner`
- `__fui_get_gesture_intent`
- `__fui_on_gesture_event`
- `__fui_on_text_changed`
- `__fui_on_text_replaced`
- `__fui_on_selection_changed`
- `__fui_on_cross_selection_changed`
- `__fui_on_context_menu`
- `__fui_hide_active_context_menu`
- `__fui_on_viewport_changed`
- `__fui_on_frame`
- `__fui_on_timer`
- `__fui_on_worker_progress`
- `__fui_on_worker_complete`
- `__fui_on_worker_error`
- `__fui_on_route_changed`
- `__fui_on_system_dark_mode_changed`
- `__fui_on_texture_loaded`
- `__fui_on_texture_failed`
- `__fui_on_svg_loaded`
- `__fui_on_svg_failed`

## Core types and actions

- `Action`
- `CallbackAction`
- `HandlerAction`
- `NodeAction`
- `SignalHandler`
- `SetBackgroundAction`
- `SetTextAction`
- `Disposable`
- `disposeAll`
- `scheduleTimer`
- `cancelTimer`
- `cancelAllTimers`
- `hasTimer`
- `PersistedStateAdapter`
- `PersistedNodeState`
- `PersistedStateCodec`
- `PersistedValueState`
- `PersistedStringCodec`
- `PersistedBoolCodec`
- `PersistedInt32Codec`
- `PersistedFloat32Codec`
- `Signal`
- `Node`
- `DragDropEffects`
- `DragDataObject`
- `DragSession`
- `DropProposal`
- `DragEventArgs`

## Drag and drop APIs

- `DragGesture`
- `DragStartedEvent`
- `DragDeltaEvent`
- `DragCompletedEvent`
- `DragDropEffects`
- `DragDataObject`
  - `setText(value)`
  - `setFormat(format, value)`
  - `hasFormat(format)`
  - `getText()`
  - `getFormat(format)`
- `DragSession`
  - `source`
  - `data`
  - `allowedEffects`
  - `currentEffect`
  - `isActive`
  - `onCompleted(callback)`
  - `onCompletedWith(owner, handler)`
  - `cancel()`
- `DropProposal`
- `DragEventArgs`
- `ExternalDropItemKind`
- `ExternalDropItemInfo`
- `ExternalDropEventArgs`
- `Node` drag/drop participation
  - `dragData(callback)`
  - `bindDragData(owner, handler)`
  - `dragAllowedEffects(effects)`
  - `onDragCompleted(callback)`
  - `onDragCompletedWith(owner, handler)`
  - `allowDrop(flag = true)`
  - `onDragEnter(callback)` / `onDragEnterWith(owner, handler)`
  - `onDragOver(callback)` / `onDragOverWith(owner, handler)`
  - `onDragLeave(callback)` / `onDragLeaveWith(owner, handler)`
  - `onDrop(callback)` / `onDropWith(owner, handler)`
  - `allowExternalDrop(flag = true)`
  - `onExternalDragEnter(callback)` / `onExternalDragEnterWith(owner, handler)`
  - `onExternalDragOver(callback)` / `onExternalDragOverWith(owner, handler)`
  - `onExternalDragLeave(callback)` / `onExternalDragLeaveWith(owner, handler)`
  - `onExternalDrop(callback)` / `onExternalDropWith(owner, handler)`
- `Node` cursor styling
  - `cursor(style)`
- `Node` coordinate helpers
  - `getBounds()`
  - `absoluteToLocalPosition(absoluteX, absoluteY)`
  - `localToAbsolutePosition(localX, localY)`
  - pre-build or invalid-handle calls return default zero-bounds/identity transforms

The drag/drop surface is intentionally in-app and AssemblyScript-friendly:

- source participation is declarative and data is created lazily only once the drag really starts
- target negotiation returns `DropProposal` instead of mutating shared event args
- the router keeps source capture while still resolving the nearest drop-enabled ancestor under the pointed handle
- external/browser-originated file drags stay on a separate metadata-first path (`allowExternalDrop(...)` plus `ExternalDropEventArgs`) rather than widening the in-app `DragSession`

## Browser file bridge

- `File`
  - `File.open()`
  - `File.save()`
  - `File.processFileInWorker(file)`
  - `File.capabilities()`
  - `File.tryGetFile(id)`
- `FileCapabilities`
  - `canPickOpen`
  - `canRead`
  - `canSave`
  - `canReadChunks`
  - `canWriteChunks`
  - `canUseNativeSavePicker`
  - `canProcessInWorkerToPickedFile`
- `BrowserFile`
  - `id`
  - `name`
  - `mimeType`
  - `sizeBytes`
  - `lastModifiedMs`
  - `readBytesChunkWith(owner, offsetBytes, maxBytes, handler, errorHandler?)`
- `FileReadChunk`
  - `offsetBytes`
  - `fileSizeBytes`
  - `bytes`
  - `nextOffsetBytes`
  - `reachedEof`
- `FileOpenRequest`
  - `accept(value)`
  - `multiple(flag = true)`
  - `pickWith(owner, handler, errorHandler?)`
- `FileSaveRequest`
  - `suggestedName(value)`
  - `mimeType(value)`
  - `fileExtension(value)`
  - `saveTextWith(owner, text, handler, errorHandler?)`
  - `saveBytesWith(owner, bytes, handler, errorHandler?)`
  - `createWriterWith(owner, handler, errorHandler?)`
- `BrowserFileWriter`
  - `writeTextChunkWith(owner, text, handler, errorHandler?)`
  - `writeBytesChunkWith(owner, bytes, handler, errorHandler?)`
  - `finishWith(owner, handler, errorHandler?)`
- `FileWriteProgress`
  - `writtenBytes`
  - `totalWrittenBytes`
- `FileSaveResult`
  - `fileName`
  - `mode`
  - `writtenBytes`
- `FileWorkerProcessRequest`
  - `suggestedName(value)`
  - `saveToPickedFile(value)`
  - `chunkBytes(value)`
  - `onChunk(owner, handler)` / `onChunkWith(owner, handler)`
  - `onProgress(owner, handler)` / `onProgressWith(owner, handler)`
  - `onComplete(owner, handler)` / `onCompleteWith(owner, handler)`
  - `onError(owner, handler)` / `onErrorWith(owner, handler)`
  - `start()`
  - `cancel()`
  - `dispose()`
- `FileWorkerProcessProgress`
  - `processedBytes`
  - `totalBytes`
  - `outputFileName`
- `FileWorkerProcessResult`
  - `processedBytes`
  - `outputFileName`

Supported behavior:

- dropped files and picker results resolve to the same `BrowserFile` abstraction
- chunked read/write support is first-class
- capability checks are explicit and queryable
- `File.processFileInWorker(file)` is the built-in worker-backed chunk-processing path
- `.saveToPickedFile(...)` opt-ins the main-thread native save-picker / writable-stream sink
- without `.saveToPickedFile(...)`, worker-read chunks are delivered back through `onChunk(...)`

Limitations:

- the built-in worker path is still a browser-harness convenience layer for worker-side chunked reads plus either app-owned chunk callbacks or the built-in picked-file sink
- arbitrary user-defined binary transforms inside the AssemblyScript `Worker` / `WorkerJob` runtime are not yet supported because that transport remains string-message oriented rather than byte/transferable oriented

## Browser fetch bridge

- `Fetch`
  - `Fetch.request(url)`
- `FetchRequest`
  - `method(value)`
  - `header(name, value)`
  - `bodyBytes(value)`
  - `bodyText(value)`
  - `onComplete(owner, handler)` / `onCompleteWith(owner, handler)`
  - `onError(owner, handler)` / `onErrorWith(owner, handler)`
  - `start()`
  - `cancel()`
  - `dispose()`
- `FetchResponse`
  - `ok`
  - `status`
  - `statusText`
  - `url`

Supported behavior:

- the same first-class fetch surface is available from both `./Fui` and `./FuiWorker`
- requests are owner-bound and callback-driven, matching the rest of the SDK
- the browser harness and the worker bootstrap each own their own in-flight request tables, so the main thread plus multiple workers can use fetch concurrently
- Worker support is a base runtime requirement for FUI-AS rather than a per-feature capability flag

Limitations:

- the fetch surface currently returns response metadata only (`ok`, `status`, `statusText`, `url`)
- request bodies can be supplied as text or bytes, but response body streaming / text decoding is not supported yet

## Host asset APIs

- `Bitmap`
  - `Bitmap(width, height)`
  - `width`
  - `height`
  - `textureId`
  - `pixels()`
  - `pixelPtr()`
  - `canvas()`
  - `render(node, x = 0, y = 0, scale = 1)`
  - `renderTextLayout(layout, x = 0, y = 0, scale = 1)`
  - `onTextReady(...)` / `onTextReadyWith(...)`
  - `Bitmap.onTextReady(...)` / `Bitmap.onTextReadyWith(...)`
  - `commit()`
  - `dispose()`
- `Image`
  - `Image(textureId = 0, objectFit = ObjectFit.Fill)`
  - `Image.load(url, objectFit = ObjectFit.Fill)`
  - `Image.from(props, textureId = 0, objectFit = ObjectFit.Fill)`
  - `Image.fromUrl(props, url, objectFit = ObjectFit.Fill)`
  - `texture(id)`
  - `source(url)`
  - `clearSource()`
  - `objectFit(...)`
  - `sampling(...)`
  - `altText(...)`
  - `imageNine(left, top, right, bottom)` / `clearImageNine()`
- `Svg`
  - `Svg(svgId = 0, tintColor = 0)`
  - `Svg.load(url, tintColor = 0)`
  - `Svg.from(props, svgId = 0, tintColor = 0)`
  - `Svg.fromUrl(props, url, tintColor = 0)`
  - `svg(id)`
  - `source(url)`
  - `clearSource()`
  - `tint(color)`
  - `sampling(...)`
  - `altText(...)`
- `ImageSampling`
  - `ImageSampling.linear()`
  - `ImageSampling.nearest()`
  - `ImageSampling.linearMipmapNearest()`
  - `ImageSampling.linearMipmapLinear()`
  - `ImageSampling.cubicMitchell()`
  - `ImageSampling.cubicCatmullRom()`
  - `ImageSampling.anisotropic(maxAniso = 8)`
- `AssetLoadState`
- `loadTexture`
- `loadSvg`
- `getTextureAssetState`
- `getTextureAssetWidth`
- `getTextureAssetHeight`
- `getTextureAssetError`
- `getSvgAssetState`
- `getSvgAssetWidth`
- `getSvgAssetHeight`
- `getSvgAssetError`

`Bitmap` is the retained custom-drawing surface: app code owns a live
AssemblyScript `Uint8Array` buffer, can draw into an off-screen `DrawContext`,
can render prepared `Text` / `RichText` / `TextLayout` content into the memory
bitmap, and calls `commit()` to upload/update the retained texture referenced by
`textureId`. `render(...)` accepts logical `x`, `y`, and `scale` values; pass
the device pixel ratio when rendering into DPR-sized bitmaps.

`Image.source(url)` and `Svg.source(url)` now use ref-counted URL asset ownership:
the same URL reuses one cached asset ID, and changing source/clearing/disposal
releases ownership for the previous URL-backed asset automatically.

`ImageSampling` controls texture sampling for retained `Image`, retained SVG
raster variants, and immediate `DrawContext.drawImage(...)`. `linear()` is the
default. Use `nearest()` for pixel art, `cubicMitchell()` for smoother
high-quality scaling, `cubicCatmullRom()` for a sharper cubic result that may
ring on hard edges, and mipmap/anisotropic modes only when the source data and
backend make those tradeoffs useful. Immediate `drawSvg(...)` replays vector SVG
content, so texture sampling does not apply to that path.

## Custom drawing APIs

- `DrawContext`
  - `flush()`
  - `save()` / `restore()`
  - `translate(x, y)`, `scale(sx, sy)`, `rotate(degrees)`
  - `clipRect(x, y, w, h)`
  - `clipRoundRect(x, y, w, h, radius)`
  - `clipRoundedRect(x, y, w, h, topLeft, topRight, bottomRight, bottomLeft)`
  - `drawRect(...)`, `drawCircle(...)`, `drawLine(...)`, `drawRoundRect(...)`
  - `drawPath(path, paint)`
  - `drawTextNode(node, x, y)`
  - `drawTextLayout(layout, x, y)`
  - `drawImage(textureId, x, y, w, h, sampling = ImageSampling.linear())`
  - `drawSvg(svgId, x, y, w, h)`
- `Paint`
  - `Paint.fill(color)`
  - `Paint.stroke(color, width)`
  - `Paint.filledStroke(fill, stroke, width)`
- `Path`
  - `moveTo(...)`, `lineTo(...)`, `quadTo(...)`, `cubicTo(...)`, `close()`
  - `addRect(...)`, `addCircle(...)`
  - `dispose()`

`DrawContext` is available in `CustomDrawable.draw(ctx)` and from
`Bitmap.canvas()`. Commands are batched; call `flush()` before relying on pending
draw commands, especially before `Bitmap.commit()` on an off-screen bitmap.

## Colors/utilities

- `rgb`
- `rgba`
- `mixColor`
- `hslToColor`
- `log`

## Animation APIs

- `Animation`
- `AnimationManager`
- `AnimationTiming`
- `NodeTransitions`
- `Easing`
- `LinearEasing`
- `CubicInEasing`
- `CubicOutEasing`
- `CubicInOutEasing`
- `QuadOutEasing`
- `Easings`
- `getAnimationManager()`
- `animateFloat(from, to, timing, handler)`
- `animateFloatWith(owner, from, to, timing, handler)`
- `animateColor(from, to, timing, handler)`
- `animateColorWith(owner, from, to, timing, handler)`

The animation surface includes:

- Imperative foundations:
  - shared frame-driven manager
  - typed easing/timing
  - float/color helpers
- Typed transitions through `NodeTransitions`:
  - `opacity(...)`
  - `bgColor(...)`
  - `scrollOffset(...)`
- Smooth scroll on retained scroll surfaces:
  - `ScrollView.scrollTo(x, y)`
  - `ScrollView.scrollToAnimated(x, y, timing)`
  - `ScrollView.scrollContentSize(width, height)`
  - `ScrollBox.scrollTo(x, y)`
  - `ScrollBox.scrollToAnimated(x, y, timing)`
  - `ScrollBox.scrollContentSize(width, height)`
  - later-wins arbitration between Ui momentum and programmatic scroll

Explicit scroll content sizing is intended for virtualized or pooled content. A
negative axis value falls back to the layout-derived content extent on that
axis.

The advanced-controls demo route now showcases both the typed transition and
smooth-scroll surfaces with browser smoke coverage.

## Background workers

- Main-thread `Worker`
  - `Worker.start(entryName)`
  - `onProgress(owner, handler)` / `onProgressWith(owner, handler)`
  - `onComplete(owner, handler)` / `onCompleteWith(owner, handler)`
  - `onError(owner, handler)` / `onErrorWith(owner, handler)`
  - `sendString(input)`
  - `cancel()`
- Worker-thread `WorkerRuntime` from `./Fui`
  - `WorkerRuntime.receiveMessage()`
  - `WorkerRuntime.reportProgress(text)`
  - `WorkerRuntime.complete(text)`
  - `WorkerRuntime.fail(text)`
  - `WorkerRuntime.isCancelled()`
  - `WorkerRuntime.yield(delayMs = 0)`
- `WorkerJob`
  - `WorkerJob.resume(job)`
  - `onStart()`
  - `run()`
  - protected helpers: `receiveMessage()`, `reportProgress(...)`, `complete(...)`, `fail(...)`, `isCancelled()`, `yield(delayMs = 0)`

## Layout/input/style enums

- `AlignItems`
- `AlignSelf`
- `BorderStyle`
- `CursorStyle`
- `FlexDirection`
- `GridUnit`
- `HandleValue`
- `JustifyContent`
- `KeyEventType`
- `KeyModifier`
- `NodeType`
- `ObjectFit`
- `Orientation`
- `PositionType`
- `PointerEventType`
- `PointerType`
- `GestureEventPhase`
- `PanGestureEventArgs`
- `PinchGestureEventArgs`
- `LongPressGesture`
- `LongPressEventArgs`
- `SemanticCheckedState`
- `SemanticRole`
- `TextAlign`
- `TextVerticalAlign`
- `TextOverflow`
- `Unit`
- `Visibility`

## Typography and navigation

- `FontFace`
  - `FontFace.load(url)`
  - Built-in faces are exposed through the active theme as `FontStack`/`FontFamily` values.
- `FontFamily`
  - `FontFamily.withRegular(stack)`
  - `FontFamily.withRegularFace(face)`
  - `FontFamily.withRegularStack(stack)`
  - `FontFamily.regularBold(regularStack, boldStack)`
- `FontStack`
  - `new FontStack(face)`
  - `FontStack.load(url)`
  - `fallback(face)`, `fallbackFace(face)`, `fallbackStack(stack)`, `fallbackLoaded(url)`
- `FontStyle`
- `FontWeight`
- `currentRoute`
- `navigateTo`
- `PlatformFamily`
- `getPlatformFamily`
- `resolvePrimaryShortcutModifier`
- `hasPrimaryShortcutModifier`

## Theme APIs

- `Theme`
- `Colors`
- `Spacing`
- `Fonts`
- `ContextMenuTheme`
- `ContextMenuItemTheme`
- `ToolTipTheme`
- `activeTheme`
- `bindTheme(owner, handler)`
- `defaultDarkTheme`
- `defaultLightTheme`
- `generateTheme`
- `useSystemTheme`
- `useCustomTheme`
- `setAccentColor`
- `isDarkMode`
- `isUsingSystemTheme`

Typography uses `FontStack` for one concrete face plus fallbacks and
`FontFamily` for weight/style resolution. Raw numeric font ids are internal
bridge details; public text APIs should use `fontFamily(...)`, `fontStack(...)`,
`fontSize(...)`, `fontWeight(...)`, and `fontStyle(...)`.

Immediate drawing uses `DrawContext` and batches commands until `flush()`.
`DrawContext.drawTextNode(textOrRichText, x, y)` can reuse a retained `Text` or
`RichText` node, while `TextLayout` provides the same readiness, measurement,
and drawing model without making app code manage a retained text node directly:

- `TextLayout.text(value)`
- `TextLayout.rich(spans)`
- `layout.onReady(callback)` / `layout.onReadyWith(owner, handler)`
- `layout.isReady`
- `layout.measure()`
- `layout.measuredWidth` / `layout.measuredHeight`
- `DrawContext.drawTextLayout(layout, x, y)`
- `Bitmap.renderTextLayout(layout, x, y, scale)`

For frequently changing short labels, `DynamicTextLayout` adds a fixed-charset
and numeric update contract on top of the same draw API:

- `DynamicTextLayout.fixedCharset(charset)`
- `DynamicTextLayout.numeric()`
- `layout.precision(digits)`
- `layout.prefix(value)`
- `layout.suffix(value)`
- `layout.setText(value)`
- `layout.setValue(number)`
- `layout.overflow(DynamicTextOverflow.FallbackShape | DynamicTextOverflow.Reject)`
- `layout.currentText`
- `layout.measure()`

`Fonts` exposes:

- `bodyStack`, `headingStack`, `monoStack`, `monoBoldStack`
- `bodyFamily`, `headingFamily`, `monoFamily`
- `sizeBody`, `sizeHeading`, `sizeMono`

`bindTheme(...)` is the custom-control convenience on top of `activeTheme`: it
subscribes with an owner-bound handler, immediately applies the current theme,
and returns the disposable `Action<Theme>` for the caller's normal cleanup path.
`Theme.colors` includes `textOnAccent` for readable foreground content on
accent-filled controls and custom surfaces.

## Continuous signals

- `viewportWidthSignal`
- `viewportHeightSignal`
- `frameTimeSignal`

## Controls

- `AntiSelectionArea`
- `Button`
- `Checkbox`
- `ContextMenu`
- `Dialog`
- `Dropdown`
- `DropdownItem`
- `Form`
- `MenuItem`
- `NavLink`
- `ProgressBar`
- `RadioButton`
- `RadioGroup`
- `SelectionArea`
- `Slider`
- `Switch`
- `TabView`
- `TabItem`
- `TextArea`
- `TextInput`

### TabView

`TabView` is the retained in-window page switcher for applications that do not
want URL routing, including native application shells. It owns no selector
chrome: applications compose buttons, links, text, or custom controls and call
`selectIndex(...)`. Each `TabItem` owns a lazy `RetainedView`: content is
created on first activation, retained while inactive, deactivated before
detachment, and disposed with the item or control.

- `new TabView(items?)`
- `new TabItem(label, contentFactory?)`
- `TabItem.content(...)` / `contentView(...)`
- `addItem(...)`, `removeItem(...)`, `removeItemAt(...)`, `clearItems()`
- `selectIndex(...)`, `selectedIndex`, `selectedItem`
- `onSelectionChanged(...)` / `onSelectionChangedWith(...)`

Disabled items are skipped during replacement selection. `TabView` projects
the selected content host as `TabPanel`; application-owned selector controls
own their visual layout, keyboard behavior, and selector semantics. This lets
selectors wrap, scroll, collapse, or use custom drawing without built-in chrome
constraining the application.

### Typed control templating

- `ButtonPresenter`
- `ButtonTemplate`
- `ButtonVisualState`
- `DropdownChevronPresenter`
- `DropdownChevronTemplate`
- `DropdownChevronVisualState`
- `DropdownFieldPresenter`
- `DropdownFieldTemplate`
- `DropdownFieldVisualState`
- `DropdownOptionRowMetrics`
- `DropdownOptionRowPresenter`
- `DropdownOptionRowTemplate`
- `DropdownOptionRowVisualState`
- `PressableIndicatorMetrics`
- `CheckboxIndicatorPresenter`
- `CheckboxIndicatorTemplate`
- `CheckboxIndicatorVisualState`
- `RadioIndicatorPresenter`
- `RadioIndicatorTemplate`
- `RadioIndicatorVisualState`
- `SwitchIndicatorPresenter`
- `SwitchIndicatorTemplate`
- `SwitchIndicatorVisualState`
- `SliderPresenter`
- `SliderPresenterMetrics`
- `SliderTemplate`
- `SliderVisualState`
- `TextInputPresenter`
- `TextInputTemplate`
- `TextInputVisualState`

The public per-instance templating surface currently covers:

- `Button.template(template)`
- `Checkbox.template(template)`
- `Dropdown.fieldTemplate(template)`
- `Dropdown.chevronTemplate(template)`
- `Dropdown.optionRowTemplate(template)`
- `RadioButton.template(template)`
- `Switch.template(template)`
- `Slider.template(template)`
- `TextInput.template(template)`
- `TextArea.template(template)`

Template lookup order is:

1. per-instance template override
2. built-in default presenter/template

Share house templates through design-system constructors rather than mutable
application-wide template state.

These typed presenter/template contracts let app code replace indicator visuals,
button chrome, slider/dropdown chrome, or text-entry shell chrome without
forking the control behavior classes, while keeping control behavior,
semantics, and persistence in the built-in controls.

## Nodes

- `FlexBox`
- `FlexBoxProps`
- `GradientStop`
- `Grid`
- `Image`
- `Portal`
- `RichText`
- `RichTextSpan`
- `ScrollBar`
- `ScrollBarVisibility`
- `ScrollBox`
- `ScrollState`
- `ScrollView`
- `Svg`
- `Text`
- `TextProps`
- `VirtualList`
- `span`

## Node helpers

- `Column`
- `Row`
- `px`
- `pct`

## Persisted state helpers

- `Node.nodeId(id)`
- `Node.persistState(adapter)`
- `Node.requestSemanticAnnouncement()`
- `ScrollView.persistScroll(flag = true)`
- `ScrollBox.persistScroll(flag = true)`
- `VirtualList.persistScroll(flag = true)`
- `ScrollView.scrollContentSize(width, height)`
- `ScrollBox.scrollContentSize(width, height)`
- built-in user-state persistence for `Checkbox`, `Switch`, `Slider`,
  `Dropdown`, `RadioGroup`, `TextInput`, and `TextArea` when the control owns a
  stable `nodeId(...)`

## See also

- [SDK docs index](./SDK_INDEX.md)
- [Accessibility and semantics](./ACCESSIBILITY_AND_SEMANTICS.md)
- [Controls and nodes](./CONTROLS_AND_NODES.md)
- [Per-type reference](./reference/README.md)
