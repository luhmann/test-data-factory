import { merge, mergeCustomizer } from "./merge";

const SEQUENCE_START_VALUE = 1;

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

const define = <T, I = any>(generator: GeneratorFn<T, I>) => ({
  id: { value: SEQUENCE_START_VALUE },
  rewindSequence() {
    this.id.value = SEQUENCE_START_VALUE;
  },
  build(params?: DeepPartial<T>, options?: BuildOptions<T, I>) {
    return merge(
      generator({
        params: params ?? ({} as DeepPartial<T>),
        sequence: this.id.value++,
        transientParams: options?.transient ?? {},
      }),
      params,
      mergeCustomizer
    );
  },
  buildList(
    number: number,
    params?: DeepPartial<T>,
    options: BuildOptions<T, I> = {}
  ) {
    const list: T[] = [];
    for (let i = 0; i < number; i++) {
      list.push(this.build(params, options));
    }

    return list;
  },
  params(overrides: DeepPartial<T>) {
    const clone = Object.assign({}, this);
    clone.build = (params?: DeepPartial<T>, options?: BuildOptions<T, I>) =>
      // TODO: might be dry but makes params inside the generator function slightly less consistent, consider
      this.build(
        merge({}, overrides, params ?? {}, mergeCustomizer) as DeepPartial<T>,
        options
      );
    return clone;
  },
});

export const Factory = { define };
