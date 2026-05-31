type ScrollHook = () => void;

const hooks: Array<ScrollHook> = new Array<ScrollHook>();

export function registerScrollHook(hook: ScrollHook): void {
  hooks.push(hook);
}

export function runScrollHooks(): void {
  for (let index = 0; index < hooks.length; ++index) {
    unchecked(hooks[index])();
  }
}
