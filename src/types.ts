// Adapted and modified from:
// https://github.com/sindresorhus/type-fest/blob/HEAD/source/partial-deep.d.ts
export type DeepPartial<T> = T extends Primitive
  ? Partial<T>
  : T extends Array<any>
  ? T
  : T extends Set<any>
  ? T
  : T extends ReadonlySet<any>
  ? T
  : T extends Map<any, any>
  ? T
  : T extends ReadonlyMap<any, any>
  ? T
  : T extends Date
  ? Date
  : T extends (...args: any[]) => unknown
  ? T | undefined
  : T extends object
  ? DeepPartialObject<T>
  : unknown;

type Primitive = null | undefined | string | number | boolean | symbol | bigint;

type DeepPartialObject<ObjectType extends object> = {
  [KeyType in keyof ObjectType]?: DeepPartial<ObjectType[KeyType]>;
};

export type GeneratorFnOptions<T, I> = {
  sequence: number;
  params: DeepPartial<T>;
  transientParams: Partial<I>;
};
export type GeneratorFn<T, I> = (opts: GeneratorFnOptions<T, I>) => T;

export type BuildOptions<T, I> = {
  transient?: Partial<I>;
};

export type DataObject = Record<string, unknown>;

export type ExpandDeep<T> = T extends Record<string | number | symbol, unknown>
  ? { [K in keyof T]: ExpandDeep<T[K]> }
  : T extends Array<infer E>
  ? Array<ExpandDeep<E>>
  : T;
