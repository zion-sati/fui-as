import {
  BoundCallback0,
  BoundCallback1,
  BoundCallback2,
  BoundResultCallback0,
  BoundResultCallback1,
  Callback0,
  Callback1,
  Callback2,
  Handler0,
  Handler1,
  Handler2,
  ResultCallback0,
  ResultCallback1,
  ResultHandler0,
  ResultHandler1,
} from "./Callbacks";

export function bind0<Owner>(owner: Owner, handler: Handler0<Owner>): Callback0 {
  return new BoundCallback0<Owner>(owner, handler);
}

export function bind1<Owner, T>(owner: Owner, handler: Handler1<Owner, T>): Callback1<T> {
  return new BoundCallback1<Owner, T>(owner, handler);
}

export function bind2<Owner, T1, T2>(owner: Owner, handler: Handler2<Owner, T1, T2>): Callback2<T1, T2> {
  return new BoundCallback2<Owner, T1, T2>(owner, handler);
}

export function bindResult0<Owner, R>(owner: Owner, handler: ResultHandler0<Owner, R>): ResultCallback0<R> {
  return new BoundResultCallback0<Owner, R>(owner, handler);
}

export function bindResult1<Owner, T, R>(owner: Owner, handler: ResultHandler1<Owner, T, R>): ResultCallback1<T, R> {
  return new BoundResultCallback1<Owner, T, R>(owner, handler);
}
