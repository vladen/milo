import { isFunction } from './utilities.js';

const { create, entries, fromEntries, getOwnPropertyDescriptors } = Object;

const getContextKey = (value) => (value == null ? '' : JSON.stringify(value));

/**
 * @template T
 * @param {T | object} object
 * @returns {T}
 */
const projectObject = (object) => create(
  {},
  fromEntries(
    entries(getOwnPropertyDescriptors(object))
      .map(
        ([key, { configurable, value, writable, ...descriptor }]) => [
          key,
          !isFunction(value) && writable
            ? {
              ...descriptor,
              configurable: false,
              get() {
                return Reflect.get(object, key);
              },
              set(newValue) {
                return Reflect.set(object, key, newValue);
              },
            }
            : { ...descriptor, configurable, value },
        ],
      ),
  ),
);

export { getContextKey, projectObject };
