export {
  fui_get_accent_color,
  fui_get_host_capabilities,
  fui_get_host_environment,
  fui_get_platform_family,
  fui_is_coarse_pointer,
  fui_is_dark_mode,
  fui_now_ms,
} from "./generated/FrameworkHostServices";
export * from "./generated/UiAbi";
export * from "./generated/HostAbi";
export * from "./generated/UiEnums";

@external("fui_host", "fui_register_text_input_metadata")
export declare function fui_register_text_input_metadata(handle: u64, isPassword: bool, hintPtr: usize, hintLen: u32): void;
