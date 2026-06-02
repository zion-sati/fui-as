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

## Application/runtime setup

- `Application`
- `ApplicationRegistration`
- `ApplicationRegistration.controlTemplates(templates)`
- `ContextMenuManager`
- `Worker`
- `WorkerRuntime`
- `createApplication`
- `createManagedApplication`
- `showKeyboardFocusForKeyEvent`

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
- `__fui_on_focus_changed`
- `__fui_on_key_event`
- `__fui_on_scroll`
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
  - `commit()`
  - `dispose()`
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

`Bitmap` is the custom-drawing surface: app code owns a live
AssemblyScript `Uint8Array` buffer, writes premultiplied RGBA8 pixels directly,
and calls `commit()` to upload/update the retained texture referenced by
`textureId`.

`Image.source(url)` and `Svg.source(url)` now use ref-counted URL asset ownership:
the same URL reuses one cached asset ID, and changing source/clearing/disposal
releases ownership for the previous URL-backed asset automatically.

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
- `SemanticCheckedState`
- `SemanticRole`
- `TextAlign`
- `TextVerticalAlign`
- `TextOverflow`
- `Unit`
- `Visibility`

## Typography and navigation

- `FontFace`
- `FontFamily`
  - `FontFamily.withRegular(fontId)`
  - `FontFamily.withRegularFace(face)`
  - `FontFamily.withRegularStack(stack)`
- `FontStack`
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
- `TextArea`
- `TextInput`

### Typed control templating

- `ControlTemplateSet`
- `getControlTemplates()`
- `useControlTemplates(templates)`
- `clearControlTemplates()`
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

App-level defaults now layer on top through:

- `ApplicationRegistration.controlTemplates(templateSet)`
- `Application.useControlTemplates(templateSet)`
- `Application.clearControlTemplates()`
- `Application.getControlTemplates()`

Template lookup order is:

1. per-instance template override
2. active `ControlTemplateSet` default
3. built-in default presenter/template

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
