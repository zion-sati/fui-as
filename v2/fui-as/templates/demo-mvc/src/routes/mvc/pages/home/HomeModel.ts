export class HomeModel {
  actionCount: i32 = 0;
  hostServiceSeconds: i32 = 0;
  hostEventSeconds: i32 = 0;
  readonly title: string = "Home page";
  readonly subtitle: string = "Page-level MVC sample. Use the header pills to navigate.";
  readonly actionLabel: string = "Increment home counter";
}
