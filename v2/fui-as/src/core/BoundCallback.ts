export abstract class Callback0 {
  abstract invoke(): void;
}

export type Handler0<Owner> = (owner: Owner) => void;

export class BoundCallback0<Owner> extends Callback0 {
  private readonly owner: Owner;
  private readonly handler: Handler0<Owner>;

  constructor(owner: Owner, handler: Handler0<Owner>) {
    super();
    this.owner = owner;
    this.handler = handler;
  }

  invoke(): void {
    this.handler(this.owner);
  }
}

export abstract class Callback1<T> {
  abstract invoke(value: T): void;
}

export type Handler1<Owner, T> = (owner: Owner, value: T) => void;

export class BoundCallback1<Owner, T> extends Callback1<T> {
  private readonly owner: Owner;
  private readonly handler: Handler1<Owner, T>;

  constructor(owner: Owner, handler: Handler1<Owner, T>) {
    super();
    this.owner = owner;
    this.handler = handler;
  }

  invoke(value: T): void {
    this.handler(this.owner, value);
  }
}

export abstract class Callback2<T1, T2> {
  abstract invoke(value1: T1, value2: T2): void;
}

export type Handler2<Owner, T1, T2> = (owner: Owner, value1: T1, value2: T2) => void;

export class BoundCallback2<Owner, T1, T2> extends Callback2<T1, T2> {
  private readonly owner: Owner;
  private readonly handler: Handler2<Owner, T1, T2>;

  constructor(owner: Owner, handler: Handler2<Owner, T1, T2>) {
    super();
    this.owner = owner;
    this.handler = handler;
  }

  invoke(value1: T1, value2: T2): void {
    this.handler(this.owner, value1, value2);
  }
}

export abstract class ResultCallback0<R> {
  abstract invoke(): R;
}

export type ResultHandler0<Owner, R> = (owner: Owner) => R;

export class BoundResultCallback0<Owner, R> extends ResultCallback0<R> {
  private readonly owner: Owner;
  private readonly handler: ResultHandler0<Owner, R>;

  constructor(owner: Owner, handler: ResultHandler0<Owner, R>) {
    super();
    this.owner = owner;
    this.handler = handler;
  }

  invoke(): R {
    return this.handler(this.owner);
  }
}

export abstract class ResultCallback1<T, R> {
  abstract invoke(value: T): R;
}

export type ResultHandler1<Owner, T, R> = (owner: Owner, value: T) => R;

export class BoundResultCallback1<Owner, T, R> extends ResultCallback1<T, R> {
  private readonly owner: Owner;
  private readonly handler: ResultHandler1<Owner, T, R>;

  constructor(owner: Owner, handler: ResultHandler1<Owner, T, R>) {
    super();
    this.owner = owner;
    this.handler = handler;
  }

  invoke(value: T): R {
    return this.handler(this.owner, value);
  }
}
