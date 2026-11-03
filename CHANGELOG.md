# Changelog

## 0.4.0 - 2026-11-03

- The FUI-AS quickstart and contributing guide link to the SDK guides in the FUI-AS repository, where they live.
- Context menus take application commands: MenuItem.command(label, invoke) and MenuItem.commandWith(label, owner, handler) run their callback and nothing else when chosen, under the new ContextMenuAction.Command.
- Sliders and progress bars can fill their container along their orientation (fill_length in FUI-RS, fillLength() in FUI-AS, FillLength()/FillsLength in FUI-CS) instead of a fixed length; a filling slider maps the pointer over the length layout gives it. Slider presenters lay out relative to their root, so the default slider renders as before at a fixed length.

## 0.3.0 - 2026-10-30

- A FlexBox no longer clips its content by default, as CSS's overflow: visible and WPF's ClipToBounds = false, so content and drop shadows can extend past it. Scroll views still clip.
- A built Grid applies new columns, rows and child placements, and building a Grid builds the children added with child() as well as placed ones.
- Clicking a Popup's own background no longer closes it; only clicks outside its panel do, as ContextMenu already behaves.
- Text inputs clip their text and placeholder, and dropdown values and option labels clip where their fade ends, so long text no longer draws outside the control.

## 0.2.6 - 2026-08-08

- Redesigned NavLink as an arbitrary-content navigation host in FUI-AS and FUI-RS.

## 0.2.4 - 2026-08-07

- Updated downstream SDKs, tooling, scaffolders, and demos for EffinDOM 0.2.12.
- Fixed default Slider and ProgressBar presenter geometry.

## 0.2.5 - 2026-08-07

- Updated verified upstream dependency pins.
