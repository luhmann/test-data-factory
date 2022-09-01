import { merge } from "./merge";
import { GeneratorFn, DeepPartial, BuildOptions, DataObject } from "./types";

const SEQUENCE_START_VALUE = 1;

const define = <T extends DataObject, I = any>(
  generator: GeneratorFn<T, I>
) => ({
  id: { value: SEQUENCE_START_VALUE },
  rewindSequence() {
    this.id.value = SEQUENCE_START_VALUE;
  },
  build(params?: DeepPartial<T>, options?: BuildOptions<T, I>): T {
    return merge(
      generator({
        params: params ?? ({} as DeepPartial<T>),
        sequence: this.id.value++,
        transientParams: options?.transient ?? {},
      }),
      params ?? ({} as DeepPartial<T>)
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
      this.build(merge(overrides, params ?? {}) as DeepPartial<T>, options);
    return clone;
  },
});

export const Factory = { define };
