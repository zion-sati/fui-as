export interface Disposable {
  dispose(): void;
}

export function disposeAll(disposables: Array<Disposable>): void {
  for (let index = disposables.length - 1; index >= 0; --index) {
    unchecked(disposables[index]).dispose();
  }
  disposables.length = 0;
}
