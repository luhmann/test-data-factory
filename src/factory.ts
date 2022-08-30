import { merge, mergeCustomizer } from "./merge";
import { GeneratorFn, DeepPartial, BuildOptions } from "./types";

// TODO: consider starting at 0, is less confusing
const SEQUENCE_START_VALUE = 1;

const internalBuild = <T, I>(
  params: DeepPartial<T>,
  defaults: T,
  { sequence, transient }: BuildOptions<T, I> & { sequence: number }
): T => {
  const entity = params as T;

  const proxy = new Proxy(defaults as object, {
    get(target, key) {
      if (typeof key !== "string") {
        return undefined;
      }
      const attribute = target[key];

      if (params[key] === undefined) {
        return attribute;
      }

      if (key in entity) {
        return entity[key];
      }

      if (typeof attribute === "function") {
        entity[key] = attribute({
          sequence,
          entity: proxy,
          transientParams: transient,
        });
      } else {
        entity[key] = attribute;
      }

      return entity[key];
    },
  });

  for (const key in proxy) {
    proxy[key];
  }

  return entity;
};

const define = <T, I = any>(generator: GeneratorFn<T, I>) => ({
  id: { value: SEQUENCE_START_VALUE },
  rewindSequence() {
    this.id.value = SEQUENCE_START_VALUE;
  },
  build(params?: DeepPartial<T>, options?: BuildOptions<T, I>): T {
    const _params = params ?? ({} as DeepPartial<T>);
    return internalBuild(
      _params,
      generator({
        params: _params,
        sequence: this.id.value++,
        transientParams: options?.transient ?? {},
      }),
      { sequence: this.id.value, transient: options?.transient }
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
      // ! might be dry but makes `params`-object inside the generator function slightly less consistent
      // ! as it includes the params passed to `build` and the `overrides` might be confusing
      this.build(
        merge({}, overrides, params ?? {}, mergeCustomizer) as DeepPartial<T>,
        options
      );
    return clone;
  },
});

export const Factory = { define };
