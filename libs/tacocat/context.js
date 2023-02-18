import { isFunction, isObject, isUndefined } from './utilities.js';

const { defineProperties, entries, fromEntries, getOwnPropertyDescriptors } = Object;

const contextKeys = new WeakMap();

/**
 * @param {object} context
 * @returns {string}
 */
function getContextKey(context) {
  if (!isObject(context)) return '';
  let key = contextKeys.get(context);
  if (isUndefined(key)) {
    key = JSON.stringify(context);
    contextKeys.set(context, key);
  }
  return key;
}

const compareContexts = (one, two) => getContextKey(one) === getContextKey(two);

/**
 * @template T, U
 * @param {U | object} target
 * @param {T | object} source
 * @returns {T & U}
 */
const projectObject = (target, source) => defineProperties(
  target,
  fromEntries(
    entries(getOwnPropertyDescriptors(source))
      .map(
        ([key, { configurable, enumerable, value, writable }]) => [
          key,
          !isFunction(value) && writable
            ? {
              configurable: false,
              enumerable,
              get() {
                return Reflect.get(source, key);
              },
              set(newValue) {
                return Reflect.set(source, key, newValue);
              },
            }
            : { configurable, enumerable, value, writable },
        ],
      ),
  ),
);

export { compareContexts, getContextKey, projectObject };
