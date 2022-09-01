import { O } from "ts-toolbelt";
import { DataObject, ExpandDeep } from "./types";

export function getType(payload: any): string {
  return Object.prototype.toString.call(payload).slice(8, -1);
}
export function isPlainObject(payload: any): payload is DataObject {
  if (getType(payload) !== "Object") return false;
  return (
    payload.constructor === Object &&
    Object.getPrototypeOf(payload) === Object.prototype
  );
}

export const getUniqueKeys = (...args: Array<DataObject>) =>
  Array.from(
    new Set(
      args.reduce((acc, item) => [...acc, ...Object.keys(item)], [] as string[])
    )
  );

export const isNonEmptyObject = (obj: unknown): obj is DataObject =>
  isPlainObject(obj) && Object.keys(obj).length > 0;

export const bannedKeys = Object.getOwnPropertyNames(Object.prototype);

const checkPreconditions = (...args: Array<DataObject>) => {
  if (args.length === 0) {
    throw new Error("`merge` called without any arguments.");
  }

  if (!args.some(isPlainObject)) {
    throw new Error(
      "Only object literals are allowed as params. No class instances, no arrays, no scalars."
    );
  }

  if (
    !args.every((obj) =>
      Object.getOwnPropertyNames(obj).every((key) =>
        obj.propertyIsEnumerable(key)
      )
    )
  ) {
    throw new Error(
      "Merge called with an object containing a non-enumerable property. Those will be lost."
    );
  }

  if (
    !args.every((obj) =>
      Object.keys(obj).every((key) => !bannedKeys.includes(key))
    )
  ) {
    throw new Error(
      "Objects must not include keys that try to override properties or method on `Object.prototype`"
    );
  }
};

type NewType<T extends Array<DataObject>> = ExpandDeep<O.Assign<{}, T, "deep">>;

export const merge = <T extends Array<DataObject>>(...args: T): NewType<T> => {
  checkPreconditions(...args);
  const params = args.filter(isNonEmptyObject);

  if (params.length === 0) {
    return {} as ExpandDeep<O.Assign<{}, T, "deep">>;
  }

  if (params.length === 1) {
    return params[0] as ExpandDeep<O.Assign<{}, T, "deep">>;
  }

  const merged = getUniqueKeys(...params).reduce((acc, key) => {
    const values = params
      .map((obj) => obj[key])
      .filter(
        (item, index, array) =>
          (item !== undefined || array.length === 1) && !Number.isNaN(item)
      ); // ? undefined values do not overwrite previous values, `null` however does

    if (values.length > 0 && values.every(isPlainObject)) {
      return { ...acc, [key]: merge(...values) };
    } else {
      if (process.env.NODE_ENV !== "test") {
        console.warn(
          `Values for key ${key} were mixed object- and non-object-values. The algorithm takes the last input in this case and performs no merging to avoid surprising results`
        );
      }
    }

    // * arrays, sets, maps etc. are not merged, last one overwrites
    return { ...acc, [key]: values.at(-1) };
  }, {}) as ExpandDeep<O.Assign<{}, T, "deep">>;

  return merged;
};
