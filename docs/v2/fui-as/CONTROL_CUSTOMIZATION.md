# Control Customization

FUI-AS controls ship with sensible defaults, but every visual aspect can be
customized — from simple sizing and color overrides to full presenter/template
replacement.

## Per-instance sizing

Every control exposes `.sizing(width, height)` to override its default
dimensions at the instance level without subclassing:

```ts
const myButton = new Button("Save")
  .sizing(120, 44);  // explicit width × height in pixels
```

Available on `Button`, `Checkbox`, `RadioButton`, `Switch`, `Dropdown`,
`TextInput`, `TextArea`, and `Slider`.

## Per-instance colors

Use `.colors(customColors)` to override the theme-derived color palette for a
single control instance. The `LabeledControlColors` type provides the full set
of color slots:

```ts
const myCheckbox = new Checkbox("Accept terms")
  .colors(new LabeledControlColors()
    .setAccent(0xFF6B35FF)
    .setAccentHovered(0xFF8B55FF));
```

Available on all labeled controls (`Button`, `Checkbox`, `RadioButton`,
`Switch`, `Dropdown`, `TextInput`, `TextArea`).

## Control templating (presenters)

For deeper customization — replacing the entire visual chrome of a control —
FUI-AS uses a WPF-style presenter/template pattern. Each interactive control
family exposes typed presenter and template contracts:

| Control | Presenter | Template | Visual State |
|---|---|---|---|
| `Button` | `ButtonPresenter` | `ButtonTemplate` | `ButtonVisualState` |
| `Checkbox` | `CheckboxIndicatorPresenter` | `CheckboxIndicatorTemplate` | `CheckboxIndicatorVisualState` |
| `RadioButton` | `RadioIndicatorPresenter` | `RadioIndicatorTemplate` | `RadioIndicatorVisualState` |
| `Switch` | `SwitchIndicatorPresenter` | `SwitchIndicatorTemplate` | `SwitchIndicatorVisualState` |
| `Slider` | `SliderPresenter` | `SliderTemplate` | `SliderVisualState` |
| `Dropdown` | `DropdownFieldTemplate` | — | — |
| `TextInput` | `TextInputPresenter` | `TextInputTemplate` | `TextInputVisualState` |
| `TextArea` | `TextInputPresenter` | `TextInputTemplate` | `TextInputVisualState` |

### Per-instance template

```ts
import {
  Checkbox,
  CheckboxIndicatorPresenter,
  CheckboxIndicatorTemplate,
  CheckboxIndicatorVisualState,
  FlexBox,
  LabeledControlColors,
  PressableIndicatorMetrics,
  Theme,
  Unit,
} from "@effindomv2/fui-as";

class CapsuleCheckboxPresenter extends CheckboxIndicatorPresenter {
  private readonly fillNode: FlexBox;
  constructor() {
    const root = new FlexBox().width(24, Unit.Pixel).height(24, Unit.Pixel);
    super(root, new PressableIndicatorMetrics(24, 24));
    this.fillNode = new FlexBox().width(10, Unit.Pixel).height(10, Unit.Pixel);
    root.child(this.fillNode);
  }
  apply(theme: Theme, state: CheckboxIndicatorVisualState, _colors: LabeledControlColors | null = null): void {
    const accent = state.pressed ? theme.colors.accentPressed : theme.colors.accent;
    this.root.cornerRadius(12).border(2, accent).bgColor(theme.colors.surface);
    this.fillNode.bgColor(accent).opacity(state.checkedState == 0 ? 0 : 1);
  }
}

const myCheckbox = new Checkbox("Remember me")
  .template(new (class extends CheckboxIndicatorTemplate {
    create(): CheckboxIndicatorPresenter { return new CapsuleCheckboxPresenter(); }
  })());
```

### Design-system templates

```ts
function appCheckbox(label: string): Checkbox {
  return new Checkbox(label).template(new CapsuleCheckboxTemplate()) as Checkbox;
}

const rememberMe = appCheckbox("Remember me");
```

Use design-system constructors to share house templates. Template ownership
stays explicit and controls outside that design system continue using built-in
presenters.
