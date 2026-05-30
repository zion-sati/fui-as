export class SettingsModel {
  saveCount: i32 = 0;
  readonly title: string = "Settings page";
  readonly subtitle: string = "This page is a separate MVC slice with its own model and controller.";
  readonly actionLabel: string = "Save settings";
}
