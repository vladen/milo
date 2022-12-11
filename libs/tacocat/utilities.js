/** @type {Tacocat.isFunction} */
export const isFunction = (value) => typeof value === 'function';
/** @type {Tacocat.isObject} */
export const isObject = (value) => value != null && typeof value === 'object';
/** @type {Tacocat.isPromise} */
export const isPromise = (value) => value != null && value instanceof Promise;
/** @type {Tacocat.isUndefined} */
export const isUndefined = (value) => value === undefined;

const { create, entries, fromEntries, getOwnPropertyDescriptors } = Object;

/**
 * @param {string} selector 
 * @returns {(element: Element) => boolean}
 */
export const createSelectorMatcher = (selector) => (
  selector
    ? (element) => element?.matches(selector)
    : (element) => !!element
);

/**
 * @template T
 * @param {T | object} object
 * @returns {T}
 */
export const projectObject = (object) => create(
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
              set(value) {
                return Reflect.set(object, key, value);
              },
            }
            : { ...descriptor, configurable, value }
        ]
      )
  ),
);

/**
 * @param {number} timeout
 * @returns {Promise<never>}
 */
export const rejectAfter = (timeout) => new Promise((_, reject) => setTimeout(reject, timeout));
