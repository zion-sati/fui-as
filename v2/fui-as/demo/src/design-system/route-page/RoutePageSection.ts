import { Column, FlexBox, Node, SemanticRole, Text, Unit } from "../../../../src/Fui";
import { FONT_REGULAR } from "../tokens";
import { DemoSurface, DemoSurfaceRecipe } from "../surfaces";
import { DemoText, DemoTextRecipe } from "../text";

export class RoutePageSection {
  constructor(
    readonly card: FlexBox,
    readonly heading: Text,
    readonly description: Text,
  ) {}
}

function verticalSpacer(height: f32): FlexBox {
  return new FlexBox().width(100.0, Unit.Percent).height(height, Unit.Pixel);
}

export function createRoutePageSection(title: string, description: string, body: Node): RoutePageSection {
  const heading = new DemoText(title, DemoTextRecipe.SectionTitle)
    .font(FONT_REGULAR, 20.0)
    .semanticRole(SemanticRole.Heading) as Text;

  const descriptionText = new DemoText(description, DemoTextRecipe.Supporting)
    .font(FONT_REGULAR, 15.0)
    .maxLines(3) as Text;

  const card = new DemoSurface(DemoSurfaceRecipe.SectionPanel)
    .padding(18.0, 18.0, 18.0, 18.0)
    .child(
      Column(
        heading,
        verticalSpacer(8.0),
        descriptionText,
        verticalSpacer(14.0),
        body,
      ).width(100.0, Unit.Percent),
    );

  return new RoutePageSection(card, heading, descriptionText);
}
