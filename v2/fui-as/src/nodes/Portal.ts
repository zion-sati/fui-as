import { FlexBox, FlexBoxProps } from "./FlexBox";

export class Portal extends FlexBox {
  constructor() {
    super();
    this.clipToBounds(false);
    this.setPortalFlag(true);
  }

  static from(props: FlexBoxProps): Portal {
    const portal = new Portal();
    return portal.applyProps(props);
  }
}
