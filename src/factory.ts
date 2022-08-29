import { merge, mergeCustomizer } from "./merge";
import { GeneratorFn, DeepPartial, BuildOptions } from "./types";

const SEQUENCE_START_VALUE = 1;

const define = <T, I = any>(generator: GeneratorFn<T, I>) => ({
  id: { value: SEQUENCE_START_VALUE },
  rewindSequence() {
    this.id.value = SEQUENCE_START_VALUE;
  },
  build(params?: DeepPartial<T>, options?: BuildOptions<T, I>): T {
    return merge(
      {},
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
      this.build(
        merge({}, overrides, params ?? {}, mergeCustomizer) as DeepPartial<T>,
        options
      );
    return clone;
  },
});

export const Factory = { define };
