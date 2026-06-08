import { ManagedApplicationController, Node } from "../../../../src/Fui";
import { ScrollbarGutterBugModel } from "./ScrollbarGutterBugModel";
import { ScrollbarGutterBugView } from "./ScrollbarGutterBugView";

export class ScrollbarGutterBugController extends ManagedApplicationController {
  readonly model: ScrollbarGutterBugModel = new ScrollbarGutterBugModel();
  readonly view: ScrollbarGutterBugView = new ScrollbarGutterBugView(this.model);

  getRoot(): Node {
    return this.view.getRoot();
  }
}
