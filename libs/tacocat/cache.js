import { isMap, isWeakMap } from './util.js';

const value$ = {};

/**
 * @template T
 * @returns {Tacocat.Engine.Cache<T>}
 */
export const Cache = () => {
  const cache = new Map();
  return {
    getOrSet(keys, factory) {
      const { length } = keys;
      let map = cache;
      for (let i = 0; i < length - 1; i += 1) {
        const key = keys[i];
        if (map.has(key)) {
          const value = map.get(key);
          if (!isMap(value)) map.set(key, new Map([[value$, value]]));
        } else {
          map.set(key, new Map());
        }
        map = map.get(key);
      }
      const key = keys[length - 1];
      if (map.has(key)) {
        const value = map.get(key);
        return isMap(value)
          ? value.get(value$)
          : value;
      }
      const value = factory();
      if (isMap(value)) {
        throw new Error('Map object cannot be cached');
      }
      map.set(key, value);
      return value;
    },
  };
};

/**
 * @template T
 * @returns {Tacocat.Engine.Cache<T>}
 */
export const WeakCache = () => {
  const cache = new Map();
  return {
    getOrSet(keys, factory) {
      // eslint-disable-next-line no-param-reassign
      keys = Array.isArray(keys) ? keys : [keys];
      const { length } = keys;
      let map = cache;
      for (let i = 0; i < length - 1; i += 1) {
        const key = keys[i];
        if (map.has(key)) {
          const value = map.get(key);
          if (!isWeakMap(value)) {
            map.set(key, new WeakMap([[value$, value]]));
          }
        } else {
          map.set(key, new WeakMap());
        }
        map = map.get(key);
      }
      const key = keys[length - 1];
      if (map.has(key)) {
        const value = map.get(key);
        return isWeakMap(value)
          ? value.get(value$)
          : value;
      }
      const value = factory();
      if (isWeakMap(value)) {
        throw new Error('WeakMap object cannot be cached');
      }
      map.set(key, value);
      return value;
    },
  };
};
