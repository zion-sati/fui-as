# FUI-AS Forms, Password Managers, and Browser Autofill

This page documents the current public pattern for login forms and other
browser-autofill-friendly text input flows in FUI-AS.

## What problem this solves

Canvas UI does not give password managers or browser autofill a native DOM form
to inspect by default.

EffinDom solves that by keeping two layers separate:

- the retained semantic tree remains the accessibility/source-of-truth layer
- the browser bridge can project hidden DOM form fields for compatible host
  integrations such as password managers and browser autofill

Those projected DOM fields are host-integration plumbing, not the public UI
semantics.

## Recommended pattern for login screens

Use all of the following:

1. Wrap related credentials in a `Form`
2. Give each participating field a stable `nodeId(...)`
3. Set `hostAutofill(...)` explicitly
4. Mark password fields with `password()`

Example:

```ts
import {
  Button,
  Form,
  TextInput,
  Column,
  Unit,
} from "./Fui";

const username = new TextInput()
  .nodeId("username")
  .semanticLabel("Username")
  .placeholder("Username or email")
  .hostAutofill("username")
  .width(100.0, Unit.Percent) as TextInput;

const password = new TextInput()
  .nodeId("current-password")
  .semanticLabel("Password")
  .placeholder("Password")
  .password()
  .hostAutofill("current-password")
  .width(100.0, Unit.Percent) as TextInput;

const submit = new Button("Sign in");

const loginForm = (new Form())
  .child(Column(
    username,
    password,
    submit,
  )) as Form;
```

## Why `Form` matters

`Form` is not only about Enter/Escape default/cancel handling.

In the current bridge implementation, the browser host uses explicit retained
form membership to decide which editable fields belong together for projected
DOM form support. That is what lets password managers treat username/password
pairs as one form instead of unrelated canvas textboxes.

If the fields are not in a `Form`, you should not expect login-style host
integrations to behave reliably.

## Why `nodeId(...)` matters

`nodeId(...)` is the stable retained identity for the field.

In the current browser bridge:

- `nodeId(...)` becomes the projected DOM `name`
- `nodeId(...)` becomes the projected DOM `id`

That identity is what browser autofill and password managers key off when they
cache or re-match fields across open/close, rerender, and navigation cycles.

If you do not provide a stable `nodeId(...)`, the host integration surface is
much weaker.

## Current supported host autofill hints

Today the public API is `hostAutofill(hint: string | null)`.

Common browser-facing tokens include:

- `username`
- `current-password`
- `new-password`
- `email`
- `one-time-code`
- `tel`
- `name`
- `given-name`
- `family-name`
- `street-address`
- `address-line1`
- `address-line2`
- `postal-code`
- `country`

## What about name / phone / address / payment autofill?

Those are supported by passing the standard browser autocomplete token string to
`hostAutofill(...)`.

## Accessibility semantics vs projected autofill DOM

Projected autofill fields are intentionally not the accessibility tree.

The retained semantic tree remains the source of truth for accessibility.
Projected host-integration fields are hidden from AT with `aria-hidden="true"`
and exist only so browser-native helpers such as password managers and autofill
can interoperate with canvas UI.

That separation is intentional:

- accessibility should read the retained semantics
- password managers/autofill need real DOM form controls

## Should every `TextInput` be projected?

Current recommendation: no.

Projecting every text input by default would create avoidable problems:

- duplicate DOM fields for controls that do not need browser autofill
- higher risk of accessibility duplication if the projection layer drifts
- more browser heuristics firing on normal app text boxes
- more DOM churn and more IME/focus synchronization complexity

The current shape is the better default:

- keep one hidden active editor for general text editing
- project explicit form/member fields when host autofill compatibility matters

If we broaden the feature later, it should still be explicit. The likely
direction is either:

- more typed autofill hints, or
- a future opt-in projection policy

not blanket projection of every text input in the app.
